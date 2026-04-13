"""Stateful orchestration of the ingestion pipeline."""

import json
import logging
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from tools.ingest.extract import extract_from_pdf, extract_metadata
from tools.ingest.concepts import extract_concepts, rank_concepts_by_similarity
from tools.ingest.draft import generate_draft_page, mark_uncertain_facts
from tools.ingest.validator import validate_wiki_page, extract_page_metadata_from_markdown
from tools.ingest.filename import generate_filename, ensure_unique_filename
from tools.ingest.backlink import reconcile_backlinks
from tools.ingest.raw_document_index import RawDocumentIndex
from tools.ingest.update_handler import UpdateHandler
from tools.ingest.needs_source_handler import NeedsSourceHandler

logger = logging.getLogger(__name__)


@dataclass
class IngestionConfig:
    """Configuration for ingestion pipeline."""
    max_pages_per_ingestion: int = 10  # Spec: 5-10 pages per ingest
    preview_mode: bool = False
    auto_write: bool = False
    backlink_confidence_threshold: float = 0.84
    spacy_model: str = "en_core_web_sm"
    embedding_model: str = "all-MiniLM-L6-v2"
    auto_insert_exact_backlinks: bool = True
    merge_duplicate_concepts: bool = True


@dataclass
class IngestionMetrics:
    """Metrics from ingestion run."""
    start_time: float = 0.0
    end_time: float = 0.0
    extraction_time_s: float = 0.0
    concept_extraction_time_s: float = 0.0
    draft_generation_time_s: float = 0.0
    validation_time_s: float = 0.0
    write_time_s: float = 0.0
    total_concepts_extracted: int = 0
    concepts_used: int = 0
    pages_attempted: int = 0
    pages_written: int = 0
    backlinks_inserted: int = 0
    fuzzy_backlink_proposals: int = 0
    pages_with_uncertain_facts: int = 0
    
    @property
    def total_time_s(self) -> float:
        """Total elapsed time."""
        return self.end_time - self.start_time if self.end_time > 0 else 0.0


@dataclass
class IngestionError:
    """Error from ingestion."""
    concept_title: str
    error_type: str  # 'extraction', 'validation', 'write', etc.
    message: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class PageInfo:
    """Information about a written page."""
    filename: str
    title: str
    source_pdf: str
    extraction_method: str
    has_uncertain_facts: bool
    backlinks_count: int = 0
    fuzzy_suggestions_count: int = 0
    needs_source: bool = False


@dataclass
class IngestionResult:
    """Overall result of ingestion run."""
    pdf_path: str
    success: bool
    pages_written: List[PageInfo] = field(default_factory=list)
    errors: List[IngestionError] = field(default_factory=list)
    metrics: IngestionMetrics = field(default_factory=IngestionMetrics)
    warnings: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for serialization."""
        return {
            "pdf_path": self.pdf_path,
            "success": self.success,
            "pages_written": [asdict(p) for p in self.pages_written],
            "errors": [asdict(e) for e in self.errors],
            "metrics": asdict(self.metrics),
            "warnings": self.warnings,
        }


class IngestionOrchestrator:
    """Coordinates extraction, concept identification, draft generation, and indexing."""
    
    def __init__(self, config: Optional[IngestionConfig] = None):
        """Initialize orchestrator.
        
        Args:
            config: IngestionConfig with pipeline settings.
        """
        self.config = config or IngestionConfig()
        self.logger = logging.getLogger(self.__class__.__name__)
        self.raw_index = None  # Lazy-init
        self.update_handler = None  # Lazy-init
        self.needs_source_handler = NeedsSourceHandler()
    
    def ingest_pdf(
        self,
        pdf_path: str,
        wiki_dir: str = "wiki",
    ) -> IngestionResult:
        """
        Orchestrate full ingestion workflow for a PDF.
        
        Workflow:
        1. Extract text → extract.py
        2. Extract concepts → concepts.py
        3. For each top concept (5-10):
           a. Generate draft → draft.py
           b. Validate schema → validator.py
           c. Generate filename → filename.py
           d. Reconcile backlinks → backlink.py
           e. Write to disk
           f. Track metrics
        4. Update raw document index
        5. Return IngestionResult
        
        Args:
            pdf_path: Path to PDF file.
            wiki_dir: Output wiki directory.
        
        Returns:
            IngestionResult with pages_written, errors, metrics.
        """
        result = IngestionResult(
            pdf_path=pdf_path,
            success=False,
            metrics=IngestionMetrics(start_time=time.time()),
        )
        
        wiki_path = Path(wiki_dir)
        wiki_path.mkdir(parents=True, exist_ok=True)
        
        # Initialize handlers
        self.raw_index = RawDocumentIndex(str(wiki_path))
        self.update_handler = UpdateHandler(str(wiki_path))
        
        try:
            # Stage 1: Extract text from PDF
            self.logger.info(f"Stage 1: Extracting text from {Path(pdf_path).name}")
            extract_start = time.time()
            extracted_text, extract_metadata_dict = extract_from_pdf(pdf_path)
            result.metrics.extraction_time_s = time.time() - extract_start
            
            if not extracted_text.strip():
                raise ValueError(f"No text extracted from {pdf_path}")
            
            self.logger.info(f"  ✓ Extracted {len(extracted_text)} characters")
            
            # Stage 2: Extract concepts
            self.logger.info("Stage 2: Extracting concepts")
            concept_start = time.time()
            concepts = extract_concepts(
                extracted_text,
                spacy_model=self.config.spacy_model,
                max_candidates=self.config.max_pages_per_ingestion * 2,  # Get more to rank
            )
            concepts = rank_concepts_by_similarity(concepts)
            result.metrics.concept_extraction_time_s = time.time() - concept_start
            result.metrics.total_concepts_extracted = len(concepts)
            
            self.logger.info(f"  ✓ Extracted {len(concepts)} concept(s)")
            
            # Stage 3: Generate drafts for top concepts
            self.logger.info(f"Stage 3: Generating drafts (max {self.config.max_pages_per_ingestion} pages)")
            draft_start = time.time()
            
            concepts_to_use = concepts[:self.config.max_pages_per_ingestion]
            result.metrics.concepts_used = len(concepts_to_use)
            
            for concept_idx, concept in enumerate(concepts_to_use, 1):
                try:
                    self.logger.info(f"  Concept {concept_idx}/{len(concepts_to_use)}: {concept['title']}")
                    result.metrics.pages_attempted += 1
                    
                    # Generate draft
                    summary = concept.get("context", "")[:100]
                    tags = ["from-ingestion", concept.get("source", "uncategorized")]
                    
                    # Extract content snippets related to this concept
                    content_snippets = [extracted_text[:500]]  # Simplified; production would chunk better
                    
                    draft_content = generate_draft_page(
                        title=concept["title"],
                        summary=summary,
                        tags=tags,
                        content_snippets=content_snippets,
                        raw_source_path=f"/raw/{Path(pdf_path).name}",
                        concepts=concepts_to_use[concept_idx:concept_idx + 3],
                        has_uncertain_facts=False,
                    )
                    
                    # Mark uncertain facts based on extraction method
                    extraction_method = extract_metadata_dict.get("extraction_method", "pymupdf")
                    draft_content, has_uncertain = self.needs_source_handler.filter_confidence_by_extraction_method(
                        draft_content,
                        extraction_method,
                    )
                    
                    # Extract metadata from draft
                    page_metadata = extract_page_metadata_from_markdown(draft_content)
                    
                    # Check for existing page (deduplication)
                    existing_filename = self.update_handler.check_existing_page(
                        concept["title"],
                        str(wiki_path),
                    )
                    
                    if existing_filename:
                        self.logger.info(f"    Found existing page: {existing_filename}")
                        
                        # Decide: merge or replace
                        decision = self.update_handler.should_replace_vs_merge(
                            existing_filename,
                            concept["title"],
                            f"/raw/{Path(pdf_path).name}",
                        )
                        
                        if decision == "merge":
                            # Merge new content into existing page
                            merged_content, merge_notes = self.update_handler.update_existing_page(
                                existing_filename,
                                draft_content,
                                f"/raw/{Path(pdf_path).name}",
                            )
                            
                            output_file = wiki_path / existing_filename
                            output_file.write_text(merged_content, encoding="utf-8")
                            
                            # Record as update, not new page
                            page_info = PageInfo(
                                filename=existing_filename,
                                title=concept["title"],
                                source_pdf=pdf_path,
                                extraction_method=extraction_method,
                                has_uncertain_facts=has_uncertain,
                                backlinks_count=0,
                                fuzzy_suggestions_count=0,
                                needs_source=page_metadata.get("needs_source", False),
                            )
                            result.pages_written.append(page_info)
                            result.metrics.pages_written += 1
                            self.logger.info(f"    ✓ Merged into: {existing_filename}")
                            continue
                    
                    # No existing page: validate and write new
                    # Validate schema
                    validation_start = time.time()
                    is_valid, errors = validate_wiki_page(page_metadata)
                    result.metrics.validation_time_s += time.time() - validation_start
                    
                    if not is_valid:
                        self.logger.warning(f"    Validation failed: {errors[0]}")
                        result.errors.append(IngestionError(
                            concept_title=concept["title"],
                            error_type="validation",
                            message="; ".join(errors),
                        ))
                        continue
                    
                    # Generate filename
                    base_filename = generate_filename(str(wiki_path))
                    filename = ensure_unique_filename(str(wiki_path), base_filename)
                    
                    # Reconcile backlinks
                    draft_content, fuzzy_suggestions = reconcile_backlinks(
                        draft_content,
                        page_title=concept["title"],
                        page_filename=filename,
                        wiki_dir=str(wiki_path),
                        auto_insert_exact=self.config.auto_insert_exact_backlinks,
                        preview_fuzzy=True,
                    )
                    
                    # Write to disk
                    write_start = time.time()
                    output_file = wiki_path / filename
                    output_file.write_text(draft_content, encoding="utf-8")
                    result.metrics.write_time_s += time.time() - write_start
                    
                    # Track in raw document index
                    self.raw_index.add_page(
                        filename,
                        f"/raw/{Path(pdf_path).name}",
                        concept["title"],
                    )
                    
                    # Record success
                    page_info = PageInfo(
                        filename=filename,
                        title=concept["title"],
                        source_pdf=pdf_path,
                        extraction_method=extract_metadata_dict.get("extraction_method", "unknown"),
                        has_uncertain_facts=has_uncertain,
                        backlinks_count=len([c for c in fuzzy_suggestions if c["match_type"] == "exact"]),
                        fuzzy_suggestions_count=len(fuzzy_suggestions),
                        needs_source=page_metadata.get("needs_source", False),
                    )
                    result.pages_written.append(page_info)
                    result.metrics.pages_written += 1
                    result.metrics.backlinks_inserted += page_info.backlinks_count
                    result.metrics.fuzzy_backlink_proposals += page_info.fuzzy_suggestions_count
                    
                    if has_uncertain:
                        result.metrics.pages_with_uncertain_facts += 1
                    
                    self.logger.info(f"    ✓ Wrote: {filename}")
                    
                except Exception as e:
                    self.logger.error(f"    ✗ Failed: {e}", exc_info=False)
                    result.errors.append(IngestionError(
                        concept_title=concept["title"],
                        error_type="write",
                        message=str(e),
                    ))
                    continue
            
            result.metrics.draft_generation_time_s = time.time() - draft_start
            
            # Persist indexes
            self.raw_index.persist_to_disk()
            
            # Finalize result
            result.success = result.metrics.pages_written > 0
            result.metrics.end_time = time.time()
            
            # Summary logging
            self.logger.info(f"\nSummary:")
            self.logger.info(f"  Pages written: {result.metrics.pages_written}/{result.metrics.pages_attempted}")
            self.logger.info(f"  Total time: {result.metrics.total_time_s:.2f}s")
            self.logger.info(f"  Backlinks inserted: {result.metrics.backlinks_inserted}")
            
            if result.errors:
                self.logger.warning(f"  Errors: {len(result.errors)}")
            
            return result
            
        except Exception as e:
            self.logger.error(f"Fatal error during ingestion: {e}", exc_info=True)
            result.errors.append(IngestionError(
                concept_title="(pipeline)",
                error_type="fatal",
                message=str(e),
            ))
            result.metrics.end_time = time.time()
            return result
    
    def ingest_batch(
        self,
        pdf_dir: str,
        wiki_dir: str = "wiki",
    ) -> List[IngestionResult]:
        """
        Ingest all PDFs from a directory.
        
        Args:
            pdf_dir: Directory containing PDF files.
            wiki_dir: Output wiki directory.
        
        Returns:
            List of IngestionResult for each PDF.
        """
        pdf_path = Path(pdf_dir)
        
        if not pdf_path.exists():
            self.logger.error(f"Directory not found: {pdf_dir}")
            return []
        
        pdf_files = list(pdf_path.glob("*.pdf"))
        
        if not pdf_files:
            self.logger.warning(f"No PDFs found in {pdf_dir}")
            return []
        
        self.logger.info(f"Found {len(pdf_files)} PDF(s) to ingest")
        
        results = []
        for pdf_file in pdf_files:
            try:
                result = self.ingest_pdf(str(pdf_file), wiki_dir)
                results.append(result)
            except Exception as e:
                self.logger.error(f"Failed to ingest {pdf_file.name}: {e}")
                # Create failed result
                result = IngestionResult(
                    pdf_path=str(pdf_file),
                    success=False,
                    metrics=IngestionMetrics(),
                )
                result.errors.append(IngestionError(
                    concept_title="(batch)",
                    error_type="fatal",
                    message=str(e),
                ))
                results.append(result)
        
        return results
    
    def save_results(self, result: IngestionResult, output_dir: str = ".") -> str:
        """
        Save ingestion result to JSON file.
        
        Args:
            result: IngestionResult to save.
            output_dir: Directory to save result file.
        
        Returns:
            Path to saved result file.
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        pdf_name = Path(result.pdf_path).stem
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        result_file = output_path / f"ingest_{pdf_name}_{timestamp}.json"
        
        with open(result_file, "w") as f:
            json.dump(result.to_dict(), f, indent=2)
        
        self.logger.info(f"Result saved to: {result_file}")
        return str(result_file)
