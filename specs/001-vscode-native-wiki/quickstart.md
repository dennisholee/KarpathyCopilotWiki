# Quickstart: VS Code-Native Wiki Extension

Welcome to the Personal LLM Wiki quickstart. This guide walks you through the three core workflows using the **VS Code extension**: **Ingest**, **Query**, and **Lint**.

## Prerequisites

1. **VS Code** 1.85+
2. **GitHub Copilot** extension (optional, for semantic search)
3. **Foam** extension (optional, for wiki graph visualization)
4. Workspace directory with `/raw` and `/wiki` folders

## Installation (one-time)

### 1. Build the extension

From the repository root:

```bash
cd extension
npm install
npm run compile
```

### 2. Launch in VS Code

Press `F5` to debug the extension, or package it:

```bash
npx vsce package  # Creates .vsix file
```

Then in VS Code: Extensions → Install from VSIX

### 3. Verify installation

In VS Code, open Command Palette (`Cmd+Shift+P`):
- Search for `Wiki: Ingest`
- You should see command suggestions
- Create test directories: `mkdir -p raw wiki/decisions`

---

## Workflow 1: Ingest (Extract & Synthesize)

Convert research papers, notes, or articles in `/raw` into atomic wiki pages in `/wiki`.

### Step 1: Add a source document

Copy a PDF or text file into `/raw`:

```bash
cp ~/Documents/my-research.pdf raw/
```

### Step 2: Run ingestion via VS Code

1. Open Command Palette: `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Run: **Wiki: Ingest Document**
3. Select a PDF from `/raw`
4. Watch the progress bar:
   - 📄 Extracting text...
   - 🔍 Analyzing concepts...
   - 📝 Generating wiki pages...
   - ✅ Ingest complete

### Step 3: Review generated pages

Pages are created in `/wiki/` with names like `20240414001.md`:

```bash
ls wiki/ | grep "2024"
```

Content includes:
- Title, Summary, Tags, Links (auto-generated)
- `[[WikiLink]]` references to related pages
- Source attribution back to `/raw`

### Step 4: Verify in Foam

1. Open `/wiki` folder in VS Code
2. Install **Foam** extension (optional)
3. Command Palette → **Foam: Show Graph**
4. Explore the interactive knowledge graph!

---

## Workflow 2: Query (Ask & Archive Decisions)

Ask questions about your wiki content; the system searches, answers, and archives the conversation.

### Step 1: Start Copilot Chat

1. Open VS Code
2. Click the **Copilot** icon in the Activity Bar (or `Ctrl+Shift+I` / `Cmd+Shift+I`)
3. Type a question about your wiki topics:

```
What are the main concepts in my papers?
Explain how transformers work
Compare different optimization algorithms
```

### Step 2: Review the answer

The extension:
- 📚 Searches `/wiki` for relevant pages
- 💡 Injects matched pages as context for Copilot
- 📊 Shows relevance scores (% match)
- 🔗 Cites supporting pages

### Step 3: Archive the decision

Click **📌 Archive this conversation** to:
- Save Q&A as a Decision page in `/wiki/decisions/`
- Preserve conversation transcript
- Link supporting wiki pages
- Include source references

Example archived decision:
```
/wiki/decisions/20240414101353_transformers_explanation_a1b2.md

---
title: Decision - How transformers work
created: 2024-04-14T10:13:53Z
tags: ["decision", "copilot-chat", "archived"]
---

## Question
Explain how transformers work

## Conversation  
User: Explain how transformers work
Assistant: Transformers are based on self-attention mechanisms...

## Supporting Pages
- [[Attention Mechanisms]]
- [[Self-Attention]]
- [[Transformer Architecture]]
```

---

## Workflow 3: Lint (Audit & Maintain)

Scan your wiki for orphan pages, contradictions, and quality issues.

### Step 1: Run lint analysis

1. Command Palette: `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Run: **Wiki: Lint**
3. Choose mode:
   - **Quick**: Fast orphan detection (pages with no inbound links)
   - **Deep**: Thorough analysis including contradictions & quality checks

### Step 2: Review results

Output appears in the Output Panel:

```
🔍 Lint Report (Deep Mode)

✗ Orphans (2 pages):
  - 20240414005.md (Neural Network Basics - no backlinks)
  - 20240414007.md (Data Structures - no backlinks)

⚠ Quality Issues (1 page):
  - 20240414003.md (Optimization - missing related links)

✗ Potential Contradictions (1):
  - "SGD convergence" vs "Adam convergence" 
    Sources: /raw/paper1.pdf vs /raw/paper2.pdf
```

### Step 3: Fix issues

**For orphaned pages:**
1. Add them to index or other pages as backlinks
2. Or delete if truly unneeded: `rm /wiki/20240414005.md`

**For contradictions:**
1. Read both source documents
2. Reconcile or add context to one/both pages
3. Add note: `Ref: /raw/paper1.pdf vs /raw/paper2.pdf`

**For quality issues:**
1. Open the page in VS Code
2. Add missing `[[WikiLink]]` references
3. Save: `Cmd+S` / `Ctrl+S`

### Step 4: Re-run lint

After fixes, re-run **Wiki: Lint** to verify improvements.

---

## Troubleshooting

### PDF Extraction Failed

**Error**: `Failed to extract text from PDF. The file may be corrupted...`

**Solutions**:
1. Try converting PDF to text: `pdftotext file.pdf file.txt`
2. Verify PDF is not password-protected
3. Use OCR if scanned: https://www.onlineocr.net/

### No Concepts Found

**Error**: `⚠️ No concepts found in document`

**Cause**: PDF is too short or lacks text

**Solution**: Provide at least 500 words of searchable text

### Copilot Unavailable

**Error**: `Copilot Chat unavailable. Using local search fallback...`

**Solution**:
1. Install GitHub Copilot extension
2. Sign in: Command Palette → `GitHub Copilot: Sign In`
3. Extension will automatically use keyword search fallback

### File Permission Denied

**Error**: `Permission denied. Check file/folder permissions...`

**Solution**:
```bash
chmod -R u+w ~/path/to/wiki
```

---

## Common Tasks

### See all wiki pages

```bash
ls /wiki/ | wc -l
```

Or open VS Code File Explorer and browse `/wiki`

### Search within the wiki

**In VS Code**: `Ctrl+Shift+F` / `Cmd+Shift+F` to search all `.md` files

**Via Copilot Chat**: Ask any question; extension searches and provides results

### Re-generate index and glossary

1. Command Palette: `Cmd+Shift+P` / `Ctrl+Shift+P`
2. Run: **Wiki: Rebuild Index**
3. Creates/updates `/wiki/index.md` (by category) and `/wiki/glossary.md` (term definitions)

### Batch ingest multiple PDFs

1. Drop 3+ PDFs in `/raw/`
2. Run **Wiki: Ingest Document** for each, or
3. Use File Watcher (auto-detects changes):
   - VS Code will automatically trigger ingest when files appear in `/raw/`

### Export wiki as static site (future)

Not yet implemented. This is a Phase 3 enhancement.

---

## Settings & Configuration

Edit `.vscode/settings.json` to customize:

```json
{
  "wiki.pdfBackend": "pdfjs",
  "wiki.maxConceptsPerPage": 15,
  "wiki.backlinkMinConfidence": 0.75,
  "wiki.enableDebugLogging": true
}
```

---

## Next Steps

- ✅ Ingest your first research paper
- ✅ Query via Copilot Chat
- ✅ Archive decisions to `/wiki/decisions/`
- ✅ Install Foam to visualize the knowledge graph
- 📖 Read [research.md](research.md) for architecture details
- 🔧 Read [data-model.md](data-model.md) for page schema
- 🧪 Run tests: `cd extension && npm test`
- Ask queries to discover knowledge relationships.
- Set up the file watcher for hands-off automation.
- Join the community discussions for feature requests.

---

**For more details, see:**
- [specs/001-vscode-native-wiki/spec.md](spec.md) — feature requirements and acceptance criteria.
- [specs/001-vscode-native-wiki/plan.md](plan.md) — implementation phases and architecture.
- [specs/001-vscode-native-wiki/data-model.md](data-model.md) — entity definitions and schemas.
