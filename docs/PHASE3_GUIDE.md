# Phase 3 Implementation Guide: US1 Ingest Integration

## Overview

Phase 3 builds on the foundational modules created in Phase 2 by orchestrating them into a full end-to-end ingestion pipeline. The goal is to transform the CLI prototype into a robust, production-ready ingest system with state tracking, integration testing, and index management.

## Phase 3 Tasks (T014-T020)

### T014: Full Pipeline Orchestration (ingest_orchestrator.py)

**Objective**: Create a stateful orchestration layer that coordinates the Phase 2 modules into a complete ingestion workflow.

**Implementation Details**:

```python
# tools/ingest/orchestrator.py

class IngestionOrchestrator:
    """Coordinates extraction, concept identification, draft generation, and indexing."""
    
    def ingest_pdf(self, pdf_path: str, wiki_dir: str, config: IngestionConfig):
        """Core workflow:
        1. Extract text → extract.py
        2. Rank concepts → concepts.py + rank_concepts_by_similarity()
        3. For each top concept (5-10):
           a. Generate draft → draft.py
           b. Mark uncertain facts → draft.mark_uncertain_facts()
           c. Validate schema → validator.validate_wiki_page()
           d. Generate filename → filename.generate_filename()
           e. Reconcile backlinks → backlink.reconcile_backlinks()
           f. Write to disk
           g. Track in index
        4. Update wiki index and glossary
        5. Return IngestionResult with pages_written, errors, metrics
        """
```

**Config Structure**:
```python
class IngestionConfig:
    max_pages_per_ingestion: int = 10  # Spec: 5-10 pages
    preview_mode: bool = False
    auto_write: bool = False
    backlink_confidence_threshold: float = 0.84
    spacy_model: str = "en_core_web_sm"
    embedding_model: str = "all-MiniLM-L6-v2"
```

**Output**: `IngestionResult` with:
- `pages_written: List[PageInfo]`
- `errors: List[IngestionError]`
- `metrics: IngestionMetrics` (extraction_time_s, concept_count, backlink_count, etc.)
- `stats: Dict[str, int]` (total_pages, with_source, needs_source, etc.)

**Error Handling**:
- Graceful fallback if extraction fails (return no pages vs. crash)
- Track which concepts failed validation with reasons
- Preserve partial results (write N-1 pages if Nth fails)

---

### T015: Source Link Tracking (raw_document_index.py)

**Objective**: Create a bidirectional mapping between wiki pages and their raw source documents.

**Implementation**:

```python
# tools/ingest/raw_document_index.py

class RawDocumentIndex:
    """Tracks provenance - which pages were generated from which PDFs."""
    
    def add_page(self, page_filename: str, raw_source: str, concept_title: str):
        """Record that page_filename was created from raw_source."""
        # Stored in .wiki/raw_index.json:
        # {
        #   "20240101.md": {"source": "/raw/paper.pdf", "concept": "Title"},
        #   ...
        # }
    
    def get_pages_from_source(self, raw_source: str) -> List[str]:
        """List all wiki pages generated from a given PDF."""
    
    def rebuild_from_page_metadata(self, wiki_dir: str):
        """Scan all pages and rebuild index from their YAML frontmatter."""
```

**Storage**: `.wiki/raw_index.json` (JSON file indexed by page filename)

**Integration**: 
- Orchestrator updates index after each successful page write
- Used by lint.py (T025) to validate traceability
- Used by query.py (T021) to show source PDF for cited answers

---

### T016: Idempotent Updates & Deduplication (update_handler.py)

**Objective**: Ensure re-ingesting the same PDF doesn't create duplicate pages.

**Implementation**:

```python
# tools/ingest/update_handler.py

class UpdateHandler:
    """Detects if a page was already ingested and updates vs. creates."""
    
    def check_existing_page(self, concept_title: str, wiki_dir: str) -> Optional[str]:
        """
        If a page with matching title exists, return its filename.
        Uses three-tier matching: exact → normalized → embedding similarity.
        """
        # Delegates to backlink.find_backlink_candidates()
    
    def update_existing_page(self, existing_filename: str, new_content: str):
        """Merge new content into existing page (e.g., add new source links)."""
        # Read existing page
        # Extract existing fields (title, tags, links, etc.)
        # Merge new content snippets (append to bottom with date marker)
        # Add new source link to Links field
        # Write back atomically
    
    def should_replace_vs_merge(self, existing_page: str, new_draft: str) -> str:
        """Heuristic: if same source, merge; if different source, replace."""
```

**Deduplication Logic**:
- If exact page title exists: merge new source links, append new content
- If normalized page title exists: user preview before merge
- If embedding similarity > 0.84: user preview before merge
- Otherwise: create new page

---

### T017: "Needs Source" Marking (needs_source_handler.py)

**Objective**: Track facts that lack direct source attribution and flag for review.

**Implementation**:

```python
# tools/ingest/needs_source_handler.py

def mark_unsourced_facts(page_content: str, extracted_snippets: List[str]):
    """
    Mark content that doesn't have direct evidence in extracted text.
    
    - Content directly from extracted text: OK
    - Content inferred/added by AI: [[Needs Source]] or needs_source: true
    """

def identify_unsourced_sections(page_content: str) -> List[str]:
    """Find all [[Needs Source]] markers and extract sections."""

def backfill_sources(page_filename: str, user_sources: List[str], wiki_dir: str):
    """User provides source links → update page, clear needs_source flag."""
```

**Flag Format**:
- Inline: `Some statement [[Needs Source]]` (for individual facts)
- Page-level: `needs_source: true` in YAML (if ≥50% of page lacks source)

---

### T018: Index Rebuild (index_manager.py)

**Objective**: Generate canonical wiki index and glossary.

**Implementation**:

```python
# tools/ingest/index_manager.py

class IndexManager:
    """Manages /wiki/index.md (content index) and /wiki/glossary.md."""
    
    def rebuild_index(self, wiki_dir: str):
        """Scan all .md files and generate /wiki/index.md."""
        # For each page:
        #   - Extract title, summary, tags
        #   - Group by tag
        #   - Build hierarchical TOC
        # Sort by most-linked, most-recent
        # Template:
        # # Wiki Index
        # Last rebuilt: 2024-01-01 10:30:00
        # ## By Category
        # - concept1: [[page]]
        # - concept2: [[page]]
        # ## Most Linked
        # -backlink_count: title
    
    def rebuild_glossary(self, wiki_dir: str):
        """Generate /wiki/glossary.md from GlossaryTerm entities."""
        # Extract all definitions, aliases
        # Sort alphabetically
        # Template: term → definition → aliases → page link
    
    def validate_index_consistency(self, wiki_dir: str) -> List[str]:
        """Check for orphan pages, missing definitions, broken links."""
```

---

### T019: Integration Tests (test_integration.py)

**Objective**: Full end-to-end tests for the ingestion pipeline.

**Test Scenarios**:

```python
# tests/integration/test_ingest_pipeline.py

def test_end_to_end_ingest():
    """Ingest sample PDF → verify N pages created → verify backlinks."""
    # 1. Copy sample PDF to temp /raw
    # 2. Run IngestionOrchestrator
    # 3. Verify ≥1 pages created
    # 4. Verify each page has:
    #    - YYYYMMDDNN filename
    #    - title, summary, tags, links, content
    #    - At least one /raw link
    #    - No duplicate backlinks

def test_idempotent_ingestion():
    """Ingest same PDF twice → should merge, not duplicate."""
    # 1. Ingest PDF v1
    # 2. Ingest PDF v1 again
    # 3. Verify page count unchanged
    # 4. Verify source links merged

def test_backlink_proposal_workflow():
    """Verify fuzzy backlink candidates are proposed without auto-insert."""
    # 1. Create page "Concept A"
    # 2. Ingest PDF that mentions "Concept" (fuzzy match)
    # 3. Verify new page does NOT auto-link to Concept A
    # 4. Verify fuzzy candidate is returned in reconcile_backlinks result
    # 5. User manually adds [[Concept A]] to new page

def test_needs_source_marking():
    """Verify uncertain facts are marked for review."""
    # 1. Extract text with "allegedly" phrase
    # 2. Generate draft
    # 3. Verify [[Needs Source]] marked in appropriate position

def test_index_rebuild_on_ingest():
    """Verify /wiki/index.md updates after ingestion."""
    # 1. Ingest N pages
    # 2. Call index_manager.rebuild_index()
    # 3. Verify index.md contains entries for all N pages
    # 4. Verify grouping by tags is correct
```

---

### T020: Index Rebuild on Ingestion (T020)

**Objective**: Automatically rebuild index and glossary after successful ingestion.

**Integration Point** (in orchestrator.py):
```python
def ingest_pdf(...) -> IngestionResult:
    # ... existing code ...
    
    # After all pages written successfully
    index_mgr = IndexManager()
    index_mgr.rebuild_index(wiki_dir)
    index_mgr.rebuild_glossary(wiki_dir)
    raw_doc_index.persist_to_disk(wiki_dir)
    
    return result
```

---

## Implementation Sequence

1. **T014** (highest priority): Orchestrator is the hub; required by all others
2. **T015, T016, T017**: Can be implemented in parallel (independent)
3. **T018**: Depends on orchestrator; called from T020
4. **T019**: Parallelizable; use mocks of T014+ until complete
5. **T020**: Simple integration; finalize after T018/T014

## Success Criteria

- ✅ Ingest sample PDF → 5-10 pages created
- ✅ Pages follow data model (filename, title, summary, tags, links, content)
- ✅ Backlinks idempotently reconciled (no duplicates)
- ✅ Re-ingesting same PDF merges, doesn't duplicate
- ✅ /wiki/index.md auto-updates
- ✅ "Needs Source" marked where confidence low
- ✅ 100% traceability: every page links to /raw or marked needs_source=true
- ✅ All integration tests pass

## Dependency Notes

- Phase 2 modules (T006-T013) are complete and validated ✓
- pyproject.toml ready with all dependencies ✓
- No external APIs required (all local) ✓
- Spacy model must be installed: `python -m spacy download en_core_web_sm`
- Sentence-transformers downloads model on first use (~400MB)

## Architecture Diagram (ASCII)

```
┌─────────────────────────────────────────────────────────┐
│                    ingest.py (T013 CLI)                 │
│  run <raw_dir> | add <file> | index rebuild             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────┐
    │  IngestionOrchestrator (T014)      │
    │  Stateful coordination layer       │
    └────────────────────────────────────┘
         │       │       │       │
    ┌────▼─┐ ┌──▼──┐ ┌──▼──┐ ┌─▼────┐
    │Extract│ │Conc │ │Draft│ │Valid │
    │ .py   │ │ept  │ │ .py │ │ .py  │
    │(T006) │ │.py  │ │     │ │(T008)│
    └────┬──┘ │(T07)│ └──┬──┘ └──┬───┘
         │    └──┬──┘    │       │
         └───────┼────────▼───────┘
                 │
        ┌────────┴───────┐
        │  Filename.py   │ ← Collision detection
        │  (T009)        │
        └────────┬───────┘
                 │
        ┌────────▼──────────┐
        │ Backlink.py (T011)│ ← 3-tier matching
        └────────┬──────────┘
                 │
        ┌────────▼───────────────────┐
        │ UpdateHandler (T016)       │← Deduplication
        │ RawDocIndex (T015)         │← Provenance
        │ NeedsSourceHandler (T017)  │← Uncertainty
        └────────┬───────────────────┘
                 │
        ┌────────▼──────────┐
        │ IndexManager (T018)│ ← Rebuild index
        └────────────────────┘
                 │
        ┌────────▼──────────────┐
        │ Write to /wiki       │
        │ Update /wiki/index.md│
        │ Log to raw_index.json│
        └──────────────────────┘
```

