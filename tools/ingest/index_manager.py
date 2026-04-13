"""
Index Manager: Auto-rebuild wiki index and glossary after ingestion.

Responsibilities:
- Load/parse existing wiki index from .wiki/index.json
- Auto-rebuild index (reverse mapping: pages→concepts, concepts→pages)
- Generate/update glossary (concept descriptions)
- Validate index consistency (no dangling references)
- Persist index and glossary to .wiki/

Architecture:
- IndexManager: Main coordinator class
- IndexValidator: Consistency checking
- GlossaryBuilder: Extract and format glossary entries
"""

import json
import logging
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Dict, List, Set, Optional, Tuple
from collections import defaultdict
import os

logger = logging.getLogger(__name__)


@dataclass
class IndexEntry:
    """Single entry in the wiki index."""
    concept_name: str
    concept_id: str
    description: Optional[str] = None
    pages: List[str] = field(default_factory=list)
    related_concepts: List[str] = field(default_factory=list)
    last_updated: str = ""
    extraction_method: str = "ai"  # 'ai', 'ocr', 'hybrid'

    def to_dict(self) -> dict:
        return asdict(self)

    @staticmethod
    def from_dict(data: dict) -> 'IndexEntry':
        """Reconstruct IndexEntry from dict."""
        return IndexEntry(**{k: v for k, v in data.items() if k in 
                            ['concept_name', 'concept_id', 'description', 
                             'pages', 'related_concepts', 'last_updated', 
                             'extraction_method']})


@dataclass
class GlossaryEntry:
    """Single glossary entry with metadata."""
    term: str
    definition: str
    term_id: str
    pages: List[str] = field(default_factory=list)
    confidence: float = 1.0  # 0.0-1.0
    last_updated: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class IndexMetadata:
    """Metadata about the wiki index itself."""
    total_concepts: int = 0
    total_pages: int = 0
    last_rebuild: str = ""
    consistency_valid: bool = True
    dangling_references: List[str] = field(default_factory=list)
    orphaned_concepts: List[str] = field(default_factory=list)


class GlossaryBuilder:
    """Extract and format glossary from index."""

    @staticmethod
    def build_glossary(entries: Dict[str, IndexEntry]) -> List[GlossaryEntry]:
        """
        Build glossary from index entries.
        
        Args:
            entries: Dict of concept_id -> IndexEntry
            
        Returns:
            List of GlossaryEntry sorted alphabetically by term
        """
        glossary = []
        
        for concept_id, entry in entries.items():
            if not entry.description:
                continue
            
            glossary_entry = GlossaryEntry(
                term=entry.concept_name,
                definition=entry.description,
                term_id=concept_id,
                pages=entry.pages.copy(),
                confidence=1.0 if entry.extraction_method == 'ai' else 0.8,
                last_updated=entry.last_updated
            )
            glossary.append(glossary_entry)
        
        # Sort alphabetically
        glossary.sort(key=lambda x: x.term.lower())
        return glossary

    @staticmethod
    def format_glossary_markdown(entries: List[GlossaryEntry]) -> str:
        """
        Format glossary as markdown for human review.
        
        Args:
            entries: List of GlossaryEntry
            
        Returns:
            Markdown-formatted glossary
        """
        lines = ["# Glossary\n"]
        lines.append(f"**Total entries**: {len(entries)}\n")
        lines.append("---\n")
        
        for entry in entries:
            lines.append(f"## {entry.term}\n")
            lines.append(f"**ID**: `{entry.term_id}`\n")
            lines.append(f"**Definition**: {entry.definition}\n")
            
            if entry.pages:
                pages_str = ", ".join(f"`{p}`" for p in entry.pages[:5])
                if len(entry.pages) > 5:
                    pages_str += f", ... (+{len(entry.pages) - 5} more)"
                lines.append(f"**Pages**: {pages_str}\n")
            
            confidence_pct = int(entry.confidence * 100)
            lines.append(f"**Confidence**: {confidence_pct}%\n")
            lines.append("\n")
        
        return "".join(lines)


class IndexValidator:
    """Consistency validation for wiki index."""

    @staticmethod
    def validate(entries: Dict[str, IndexEntry], 
                 page_dir: Path) -> Tuple[bool, IndexMetadata]:
        """
        Validate index consistency.
        
        Args:
            entries: Dict of concept_id -> IndexEntry
            page_dir: Path to pages directory (for existence check)
            
        Returns:
            Tuple of (is_valid, metadata)
        """
        metadata = IndexMetadata()
        issues = []
        
        # Count entries
        metadata.total_concepts = len(entries)
        all_pages = set()
        for entry in entries.values():
            all_pages.update(entry.pages)
        metadata.total_pages = len(all_pages)
        
        # Check for dangling page references
        for entry in entries.values():
            for page_file in entry.pages:
                page_path = page_dir / page_file
                if not page_path.exists():
                    issues.append(f"Dangling reference: {page_file} (from {entry.concept_id})")
                    metadata.dangling_references.append(page_file)
        
        # Check for orphaned concepts (no pages)
        for concept_id, entry in entries.items():
            if not entry.pages:
                issues.append(f"Orphaned concept: {concept_id}")
                metadata.orphaned_concepts.append(concept_id)
        
        # Check for circular/invalid related_concepts refs
        valid_ids = set(entries.keys())
        for concept_id, entry in entries.items():
            for related_id in entry.related_concepts:
                if related_id not in valid_ids:
                    issues.append(f"Invalid related concept: {related_id} (from {concept_id})")
        
        metadata.consistency_valid = len(issues) == 0
        
        if issues:
            logger.warning(f"Index validation found {len(issues)} issues:")
            for issue in issues[:10]:  # Log first 10
                logger.warning(f"  - {issue}")
            if len(issues) > 10:
                logger.warning(f"  ... and {len(issues) - 10} more")
        
        return metadata.consistency_valid, metadata


class IndexManager:
    """
    Manages wiki index: loading, rebuilding, and persisting.
    
    API:
    - load_index(): Load .wiki/index.json
    - rebuild_from_pages(): Scan pages and rebuild index
    - add_or_update_concept(): Add/update single concept entry
    - generate_glossary(): Extract glossary from index
    - persist(): Write index and glossary to disk
    - validate(): Check consistency
    """

    def __init__(self, wiki_dir: Path):
        """
        Initialize IndexManager.
        
        Args:
            wiki_dir: Path to .wiki directory
        """
        self.wiki_dir = Path(wiki_dir)
        self.pages_dir = self.wiki_dir / "pages"
        self.index_file = self.wiki_dir / "index.json"
        self.glossary_file = self.wiki_dir / "glossary.json"
        self.glossary_md_file = self.wiki_dir / "GLOSSARY.md"
        
        self.entries: Dict[str, IndexEntry] = {}
        self.metadata: Optional[IndexMetadata] = None

    def load_index(self) -> bool:
        """
        Load index from .wiki/index.json if it exists.
        
        Returns:
            True if loaded, False if file doesn't exist
        """
        if not self.index_file.exists():
            logger.info(f"No existing index at {self.index_file}, starting fresh")
            self.entries = {}
            return False
        
        try:
            with open(self.index_file, 'r') as f:
                data = json.load(f)
            
            self.entries = {}
            for concept_id, entry_dict in data.items():
                self.entries[concept_id] = IndexEntry.from_dict(entry_dict)
            
            logger.info(f"Loaded index with {len(self.entries)} concepts")
            return True
        except Exception as e:
            logger.error(f"Failed to load index: {e}")
            self.entries = {}
            return False

    def rebuild_from_pages(self) -> int:
        """
        Rebuild index by scanning existing pages.
        
        Parses each page's YAML frontmatter to extract:
        - concepts (list)
        - description (string)
        - related_concepts (list)
        
        Returns:
            Number of concepts added/updated
        """
        if not self.pages_dir.exists():
            logger.warning(f"Pages directory {self.pages_dir} does not exist")
            return 0
        
        count = 0
        pages = list(self.pages_dir.glob("*.md"))
        logger.info(f"Scanning {len(pages)} pages for index rebuild")
        
        # Build reverse mapping: concept_id -> pages
        concept_pages: Dict[str, Set[str]] = defaultdict(set)
        page_metadata: Dict[str, dict] = {}
        
        for page_file in pages:
            try:
                with open(page_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Parse YAML frontmatter (simple extraction)
                if content.startswith("---"):
                    _, yaml_block, _ = content.split("---", 2)
                    metadata = self._parse_yaml_frontmatter(yaml_block)
                    page_metadata[page_file.name] = metadata
                    
                    # Extract concept IDs from metadata
                    concepts = metadata.get('concepts', [])
                    if isinstance(concepts, str):
                        concepts = [c.strip() for c in concepts.split(',')]
                    
                    for concept_id in concepts:
                        concept_pages[concept_id].add(page_file.name)
            except Exception as e:
                logger.warning(f"Failed to parse {page_file.name}: {e}")
        
        # Build/update index entries
        for concept_id, pages in concept_pages.items():
            if concept_id in self.entries:
                # Update existing entry
                self.entries[concept_id].pages = sorted(list(pages))
            else:
                # Create new entry
                entry = IndexEntry(
                    concept_name=concept_id,
                    concept_id=concept_id,
                    pages=sorted(list(pages)),
                    description=None
                )
                self.entries[concept_id] = entry
            count += 1
        
        logger.info(f"Rebuild: {count} concepts found")
        return count

    def add_or_update_concept(self, concept_id: str, concept_name: str,
                            description: Optional[str] = None,
                            pages: Optional[List[str]] = None,
                            related_concepts: Optional[List[str]] = None,
                            extraction_method: str = "ai") -> IndexEntry:
        """
        Add or update a single concept entry.
        
        Args:
            concept_id: Unique ID for concept
            concept_name: Human-readable name
            description: Optional definition
            pages: List of page filenames containing this concept
            related_concepts: List of related concept IDs
            extraction_method: How concept was extracted ('ai', 'ocr', 'hybrid')
            
        Returns:
            Updated IndexEntry
        """
        if concept_id in self.entries:
            entry = self.entries[concept_id]
            entry.concept_name = concept_name
            if description:
                entry.description = description
            if pages is not None:
                entry.pages = pages
            if related_concepts is not None:
                entry.related_concepts = related_concepts
            entry.extraction_method = extraction_method
        else:
            entry = IndexEntry(
                concept_name=concept_name,
                concept_id=concept_id,
                description=description,
                pages=pages or [],
                related_concepts=related_concepts or [],
                extraction_method=extraction_method
            )
            self.entries[concept_id] = entry
        
        return entry

    def generate_glossary(self) -> List[GlossaryEntry]:
        """
        Generate glossary from current index.
        
        Returns:
            List of GlossaryEntry sorted by term
        """
        return GlossaryBuilder.build_glossary(self.entries)

    def validate(self) -> Tuple[bool, IndexMetadata]:
        """
        Validate index consistency.
        
        Returns:
            Tuple of (is_valid, metadata)
        """
        is_valid, metadata = IndexValidator.validate(self.entries, self.pages_dir)
        self.metadata = metadata
        return is_valid, metadata

    def persist(self) -> Tuple[bool, bool]:
        """
        Persist index and glossary to disk.
        
        Returns:
            Tuple of (index_saved, glossary_saved)
        """
        # Ensure wiki directory exists
        self.wiki_dir.mkdir(parents=True, exist_ok=True)
        
        # Save index
        try:
            index_data = {cid: entry.to_dict() for cid, entry in self.entries.items()}
            with open(self.index_file, 'w') as f:
                json.dump(index_data, f, indent=2)
            logger.info(f"Index persisted: {len(self.entries)} concepts → {self.index_file}")
            index_saved = True
        except Exception as e:
            logger.error(f"Failed to save index: {e}")
            index_saved = False
        
        # Save glossary (JSON + Markdown)
        try:
            glossary = self.generate_glossary()
            glossary_data = [entry.to_dict() for entry in glossary]
            
            with open(self.glossary_file, 'w') as f:
                json.dump(glossary_data, f, indent=2)
            
            glossary_md = GlossaryBuilder.format_glossary_markdown(glossary)
            with open(self.glossary_md_file, 'w') as f:
                f.write(glossary_md)
            
            logger.info(f"Glossary persisted: {len(glossary)} entries → {self.glossary_file}")
            glossary_saved = True
        except Exception as e:
            logger.error(f"Failed to save glossary: {e}")
            glossary_saved = False
        
        return index_saved, glossary_saved

    def _parse_yaml_frontmatter(self, yaml_block: str) -> dict:
        """
        Simple YAML frontmatter parser.
        Extracts key: value pairs; minimal parsing for robustness.
        
        Args:
            yaml_block: YAML text block
            
        Returns:
            Dict of key-value pairs
        """
        metadata = {}
        for line in yaml_block.strip().split('\n'):
            if not line.strip() or ':' not in line:
                continue
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip()
            
            # Remove quotes if present
            if value.startswith('"') and value.endswith('"'):
                value = value[1:-1]
            elif value.startswith("'") and value.endswith("'"):
                value = value[1:-1]
            
            metadata[key] = value
        
        return metadata

    def get_concept_pages(self, concept_id: str) -> List[str]:
        """Get list of pages for a concept."""
        if concept_id in self.entries:
            return self.entries[concept_id].pages
        return []

    def get_page_concepts(self, page_name: str) -> List[str]:
        """Get list of concepts on a page."""
        concepts = []
        for concept_id, entry in self.entries.items():
            if page_name in entry.pages:
                concepts.append(concept_id)
        return concepts

    def stats(self) -> dict:
        """Return index statistics."""
        total_pages = set()
        for entry in self.entries.values():
            total_pages.update(entry.pages)
        
        num_with_desc = sum(1 for e in self.entries.values() if e.description)
        
        return {
            'total_concepts': len(self.entries),
            'total_pages': len(total_pages),
            'concepts_with_description': num_with_desc,
            'index_file': str(self.index_file),
            'glossary_file': str(self.glossary_file)
        }
