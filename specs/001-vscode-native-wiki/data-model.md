# Data Model: VS Code-Native Wiki

Purpose: define canonical entities, validation rules, and linking behavior used by the ingestion, query, and linting pipelines.

## Conventions

- Filenames for wiki pages: `YYYYMMDDNN.md`.
- Every wiki file MUST include top-level fields: `Title`, `Summary`, `Tags`, `Links`, `Content`.

## Entities

### RawDocument
Represents a source artifact placed in `/raw`.

Fields:

- `id` (string): stable identifier (e.g., file path or generated UUID).  
- `path` (string): repository-relative path, e.g. `/raw/20260412-somepaper.pdf`.  
- `filename` (string): base filename.  
- `content_type` (string): `pdf` | `txt` | `md` | `html` | `other`.  
- `metadata` (object): extracted metadata (title, authors[], date, publisher, DOI).  
- `extracted_text` (string): raw extracted text (optional, may be stored separately if large).  
- `pages` (integer): page count where applicable.  
- `ocr_applied` (boolean): whether OCR was run.  
- `hash` (string): content hash (e.g., sha256) for deduplication.  
- `ingested_at` (timestamp): ingestion timestamp.  
- `status` (string): `new` | `processed` | `error`.

Example (JSON):

```json
{
	"id": "raw/20260412-somepaper.pdf",
	"path": "/raw/20260412-somepaper.pdf",
	"filename": "20260412-somepaper.pdf",
	"content_type": "pdf",
	"metadata": {"title": "Example Paper", "authors": ["A. Author"], "date": "2026-04-12"},
	"hash": "3a7bd3...",
	"ocr_applied": false,
	"ingested_at": "2026-04-13T12:34:56Z",
	"status": "processed"
}
```

---

### WikiPage
Canonical representation of an atomic concept page under `/wiki`.

Fields (page-level metadata):

- `filename` (string): `YYYYMMDDNN.md` (unique in `/wiki`).  
- `title` (string): human-friendly title (primary identifier for users).  
- `normalized_title` (string): normalized form used for matching (see Normalization).  
- `aliases` (array[string]): known alternate titles.  
- `summary` (string): one-paragraph summary.  
- `tags` (array[string]): discoverability tags.  
- `links` (array[string]): repository-relative paths to sources in `/raw` and to other `/wiki` pages. These satisfy the constitution's Traceability requirement.  
- `created_from` (array[string]): RawDocument `path` values used to create this page.  
- `content` (string): Markdown body (CommonMark-compatible).  
- `created_at` (timestamp)  
- `last_edited_at` (timestamp)  
- `needs_source` (boolean): true if assertions lack ground-truth `/raw` references.  
- `backlinks` (array[string]): list of wiki filenames that link to this page (managed by backlink reconciliation, may be stored or computed on demand).  

Example wiki-file template (rendered Markdown):

```
Title: Example Concept

Summary: One-line summary of this concept and its purpose.

Tags: concept,example

Links:
- /raw/20260412-somepaper.pdf

Content:

Detailed explanation, examples, and references. Use [[WikiLinks]] to point to related pages.
```

Notes:

- `links` must include at least one `/raw` path or the page must be flagged `needs_source`.
- The ingestion pipeline should prefer adding `[[WikiLinks]]` rather than plain paths for internal wiki references.

---

### Decision
Represents a recorded conversation or decision produced by the Query flow. Stored under `/wiki/decisions/` as `YYYYMMDDNN.md`.

Fields:

- `filename` (string): `decisions/YYYYMMDDNN.md`  
- `title` (string): e.g., `Decision: Use PyMuPDF for extraction`  
- `summary` (string): short summary of the decision/outcome  
- `participants` (array[string]) optional  
- `links` (array[string]): supporting wiki pages and `/raw` sources  
- `transcript` (string): conversation transcript or Q/A session content  
- `rationale` (string): brief justification and references  
- `outcome` (string): accepted|deferred|rejected  
- `created_at` (timestamp)

Example (Markdown structure):

```
Title: Decision: Use PyMuPDF for extraction

Summary: PyMuPDF chosen for born-digital PDFs; fallback to pdfplumber/Tesseract.

Tags: decision,ingest

Links:
- /specs/001-vscode-native-wiki/research.md
- /raw/20260412-somepaper.pdf

Content:

--- Transcript ---
User: What extractor performs best?
Agent: ...

Rationale: ...
```

---

### Index
`/wiki/index.md` is the curated top-level index. It lists categories and important pages.

Data model (for automated updates):

- `generated_at` (timestamp)  
- `categories` (object): map of category-name -> ordered list of wiki filenames and short summaries  
- `popular` (array[string]): hand-picked or algorithm-selected important pages

Index updates should be idempotent and append new pages into categories based on tags and heuristics.

---

### GlossaryTerm
Represents a single glossary entry used to seed `glossary.md`.

Fields:

- `term` (string)  
- `definition` (string)  
- `canonical_page` (string): wiki filename for the canonical article  
- `aliases` (array[string])  
- `first_appearance` (string): RawDocument path or wiki page where the term was first defined

---

## Normalization & Title Matching

Normalization rules (applied when generating `normalized_title`):

1. Convert to Unicode NFKC and lowercase.  
2. Remove punctuation except internal hyphens.  
3. Collapse whitespace to single spaces.  
4. Trim stopwords for matching only (retain original title for display).  

Matching procedure:

1. Try exact match on `title` or any `aliases`.  
2. If not matched, compare `normalized_title` equality.  
3. If still unmatched, compute embedding similarity (sentence-transformers). If cosine similarity > 0.84 (configurable), propose as a candidate backlink — require manual review in preview mode before auto-insert.  

## Filename Generation (YYYYMMDDNN)

Algorithm (idempotent):

1. Use today's date (UTC or repo timezone) to compute prefix `YYYYMMDD`.
2. List existing `/wiki/YYYYMMDD*.md` files and parse sequence numbers.  
3. If none exist, use `01` as sequence; otherwise choose max(existing)+1, zero-padded to two digits.  
4. Produce `YYYYMMDDNN.md`.  

Note: To avoid race conditions in parallel runs, create files in a staging directory and then `mv` to `/wiki` under a write lock or use an atomic rename with a retry loop.

## Backlink Reconciliation (Idempotent)

Procedure for inserting a backlink from page A to page B:

1. Read page A and page B into memory (or index).  
2. If `[[B title]]` is already present in A's content, skip insertion.  
3. Otherwise, insert `[[B title]]` into A at a sensible location (e.g., first relevant occurrence or `See also` section).  
4. Update B's stored `backlinks` list (if kept) to include A; do not duplicate entries.  
5. Save pages using atomic write (tmp file + rename).  

Backlink insertion should default to `propose` mode for fuzzy matches; only auto-insert for exact title matches.

## Index & SQLite lookup schema (optional)

Suggested small index to accelerate matching and deduplication:

Table `pages`:

- `id` INTEGER PRIMARY KEY
- `filename` TEXT UNIQUE
- `normalized_title` TEXT
- `aliases` TEXT (JSON array)
- `links` TEXT (JSON array)
- `embedding` BLOB (optional)

Queries:

- Find exact by normalized_title: `SELECT filename FROM pages WHERE normalized_title = ?`  
- Fuzzy candidate by cosine similarity: compute via embedding store and nearest-neighbor lookup (approximate search recommended for large datasets).

## Schema Validation (outline)

Minimal JSON Schema for `WikiPage` (used by validator in `tools/ingest/validator.py`):

```json
{
	"type":"object",
	"required":["title","summary","tags","links","content","filename"],
	"properties":{
		"title":{"type":"string"},
		"summary":{"type":"string"},
		"tags":{"type":"array","items":{"type":"string"}},
		"links":{"type":"array","items":{"type":"string"}},
		"content":{"type":"string"},
		"filename":{"type":"string","pattern":"^[0-9]{8}[0-9]{2}\.md$"}
	}
}
```

Validator responsibilities:

- Ensure `links` contains at least one `/raw` path or set `needs_source=true`.  
- Enforce filename pattern.  
- Verify CommonMark parseability (optional) and Foam-friendly heuristics (e.g., `[[WikiLinks]]` parse).

## Tests & Examples

Unit tests to implement:

- `test_filename_generator`: create fake `/wiki` files and assert next sequence chosen correctly. (maps to task T009)  
- `test_schema_validator`: run validator against example good/bad pages. (T008, T012)  
- `test_backlink_idempotency`: insert backlink twice, assert single link. (T011)  

Integration test examples:

- Place `specs/001-vscode-native-wiki/testdata/sample.pdf` in `/raw`, run the extraction + concept pipeline, assert produced pages have `links` back to the sample raw file and filenames use `YYYYMMDDNN` scheme. (T019)

## Operational Notes

- Audit logs: record `ingest` actions (RawDocument id, generated page filenames, timestamps, user who confirmed drafts).  
- Rollback: preserve previous version as `.bak` or use git commits for all generated pages so changes can be reverted.  

## Change Log

- Version: 1.0 — Initial data model (2026-04-13)

