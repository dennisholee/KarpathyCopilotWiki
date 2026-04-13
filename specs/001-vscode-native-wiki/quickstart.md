# Quickstart: VS Code-Native Wiki

Welcome to the Personal LLM Wiki quickstart. This guide walks you through the three core workflows: **Ingest**, **Query**, and **Lint**.

## Prerequisites

1. Python 3.11+ installed.
2. VS Code with the Foam extension installed.
3. GitHub Copilot extension (optional, for editor-assist drafting).
4. Repository checked out with `/raw` and `/wiki` directories at the root.

## Setup (one-time)

### 1. Install dependencies

From the repository root:

```bash
python -m pip install -r requirements.txt
```

Or manually install the recommended stack:

```bash
python -m pip install pymupdf pdfplumber pytesseract spacy sentence-transformers jinja2 pytest
python -m spacy download en_core_web_sm
```

For OCR support (optional), install Tesseract:

**macOS:**
```bash
brew install tesseract
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr
```

### 2. Create directories (if they don't exist)

```bash
mkdir -p raw wiki wiki/decisions reports
```

### 3. Verify installation

```bash
python -m pytest tests/unit/ -v
```

If all tests pass, you're ready to ingest.

---

## Workflow 1: Ingest (Extract & Synthesize)

Convert research papers, notes, or articles in `/raw` into atomic wiki pages in `/wiki`.

### Step 1: Add a source document

Copy a PDF, TXT, or Markdown file into `/raw`:

```bash
cp ~/Documents/my-research.pdf raw/
```

### Step 2: Run ingestion

```bash
python tools/ingest/ingest.py run
```

This command:
- Scans `/raw` for new files.
- Extracts text (PDF → text, with OCR fallback for scanned docs).
- Generates candidate concepts (titles, entities, sections).
- Creates draft wiki pages in `/wiki/` with filenames like `20260413XX.md`.
- Inserts backlinks using `[[WikiLinks]]` to existing pages.
- Updates `wiki/index.md` and `wiki/glossary.md`.

### Step 3: Review drafts (optional)

To preview drafts before committing:

```bash
python tools/ingest/ingest.py run --preview
```

This opens a local preview of each draft. Approve or edit before writing to disk.

### Step 4: Verify in Foam

Open VS Code and:

1. Open the `/wiki` folder.
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) and select "Foam: Show Graph".
3. Explore the graph — you'll see your new pages and their backlinks.

---

## Workflow 2: Query (Ask & Archive)

Ask questions about your wiki content; the system answers and archives the conversation as a **Decision** page.

### Step 1: Trigger query

```bash
python tools/query/query.py "What is the main topic of my recent papers?"
```

Or use the VS Code command palette:
- Press `Ctrl+Shift+P` and search for `"Wiki: Query"`.
- Type your question.

### Step 2: Review the answer

The system:
- Searches `/wiki` for relevant pages.
- Formulates an answer with citations.
- Optionally invokes GitHub Copilot (if in Editor-Assist mode) for polish.

### Step 3: Archive the decision

The conversation is automatically saved to `/wiki/decisions/YYYYMMDDNN.md` with:
- The question and answer transcript.
- Links to supporting wiki pages.
- Links to `/raw` sources.

Example output:

```
Title: Decision: Main topic of recent papers

Summary: Papers explore knowledge graphs and semantic modeling.

Tags: decision,research-summary

Links:
- /wiki/20260413XX.md (Knowledge Graphs)
- /raw/my-research.pdf

Content:

--- Transcript ---

User: What is the main topic of my recent papers?
Agent: Your recent papers (sourced from `my-research.pdf`) focus on...

Rationale: Grounded in page [[Knowledge Graphs]] and [[Semantic Modeling]].
```

---

## Workflow 3: Lint (Audit & Maintain)

Scan your wiki for orphan pages, contradictions, and missing sources.

### Step 1: Run quicklint (orphan detection)

```bash
python tools/lint/orphan_check.py
```

Output: `reports/orphans-YYYYMMDD.md` listing pages with no inbound links, grouped by age and tag.

### Step 2: Run deeplint (claim-diff)

```bash
python tools/lint/claim_diff.py
```

Output: `reports/conflicts-YYYYMMDD.md` listing contradictory claims that cite different `/raw` sources (requires human review).

### Step 3: Review remediation suggestions

```bash
python tools/lint/remediation_report.py
```

Output: `reports/remediation-YYYYMMDD.md` with suggested actions:
- **Merge**: combine similar pages.
- **Split**: break overly broad pages.
- **Add Source**: ground orphan assertions in `/raw`.

### Step 4: Apply fixes

Remediation suggestions can be exported as a patch or PR draft:

```bash
python tools/lint/remediation_report.py --output-patch > wiki.patch
git apply wiki.patch
```

---

## Advanced: Automate Ingestion with File Watcher

To automatically ingest new files as they arrive in `/raw`:

```bash
bash scripts/watch-raw.sh
```

This script monitors `/raw` and triggers `ingest.py run` when new files are detected.

---

## Common Tasks

### Task: Re-generate index and glossary

```bash
python tools/ingest/ingest.py index rebuild
```

### Task: Check for "Needs Source" pages

```bash
grep -r "needs_source: true" wiki/
```

Or use the linting tool:

```bash
python tools/lint/orphan_check.py --include-needs-source
```

### Task: Export wiki as static site (future)

Once the wiki stabilizes, export to static HTML:

```bash
python tools/export/export-static.py --output docs/
```

(This task is not yet implemented; see [#XXX](issue-placeholder).)

---

## Troubleshooting

### "PDF extraction failed"

- Verify the PDF is not corrupted: `pdfinfo <file.pdf>` (install `poppler-utils` if needed).
- Check if the PDF is scanned (image-based). If so, OCR will be attempted automatically.
- Try alternate extractor: use `pdfplumber` CLI directly to debug.

### "Backlink not inserted"

- Check that the target page exists under `/wiki` with a matching title or alias.
- Run with verbose logging: `python tools/ingest/ingest.py run --verbose`.
- Ensure the Foam extension recognizes the `[[WikiLink]]` syntax (should be automatic).

### "Query returns no results"

- Verify that wiki pages exist and have `links` fields pointing to `/raw`.
- Check that your query question matches page content (try broader terms).
- Run linting to check for orphan pages: `python tools/lint/orphan_check.py`.

---

## Next Steps

- Add your first research paper to `/raw` and run ingestion.
- Explore the Foam graph to see emerging concept clusters.
- Ask queries to discover knowledge relationships.
- Set up the file watcher for hands-off automation.
- Join the community discussions for feature requests.

---

**For more details, see:**
- [specs/001-vscode-native-wiki/spec.md](spec.md) — feature requirements and acceptance criteria.
- [specs/001-vscode-native-wiki/plan.md](plan.md) — implementation phases and architecture.
- [specs/001-vscode-native-wiki/data-model.md](data-model.md) — entity definitions and schemas.
