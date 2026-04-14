# Phase 0 Research Findings: VS Code-Native Wiki Extension

**Date**: April 14, 2026  
**Updated**: Refactored from Python CLI to TypeScript/VS Code Extension Architecture  
**Status**: ✅ All 6 research tasks complete (T001–T006)  

## Summary

This research document captures findings from Phase 0 investigation of VS Code extension SDK, Copilot Chat integration, PDF extraction, and file watcher strategies. Architectural pivot from Python 3.11 CLI to TypeScript/Node.js VS Code extension (April 14, 22:30 UTC, per user decision: Copilot-Preferred, VS Code Chat, Extension-First, Local Development).

## Phase 0 Goals

- ✅ **T001-Complete**: Investigate VS Code extension SDK (activation events, command registration, webview patterns, file watcher APIs)
- ✅ **T002-Complete**: Research Copilot Chat API integration patterns and participant registration
- ✅ **T003-Complete**: Evaluate PDF extraction libraries (pdfjs-dist client-side vs PyMuPDF backend vs hybrid)
- ✅ **T004-Complete**: Research markdown parsing (`markdown-it` vs alternatives; Foam link detection)
- ✅ **T005-Complete**: Design file watcher strategy (debouncing, conflict resolution, performance)
- ✅ **T006-Complete**: Research Jest testing framework for VS Code extensions

## Architecture Decision (April 14)

**Previous**: Python 3.11 CLI with optional Copilot API integration  
**Current**: TypeScript/Node.js VS Code Extension with direct Copilot Chat participant  
**Rationale**:
- Eliminates separate API key management
- Single integrated UI (Copilot Chat)
- Leverages VS Code native services (file watching, URI handling)
- Reduces complexity for users

---

## T001: VS Code Extension SDK Architecture ✅

### Activation Events

**Finding**: VS Code extensions activate via `activationEvents` in `package.json`.

**Available Events**:
- `onCommand:extension.command` — Activate when command invoked
- `onLanguage:language` — Activate when file of given language opened
- `workspaceContains:pattern` — Activate when workspace contains matching files
- `onStartupFinished` — Late activation after VS Code startup (non-blocking)
- `*` — Activate on startup (NOT recommended)

**Recommended Decision**:
```json
{
  "activationEvents": [
    "workspaceContains:**/wiki/**",
    "onCommand:wiki.search",
    "onCommand:wiki.index",
    "onStartupFinished"
  ]
}
```

**Rationale**:
- `workspaceContains` ensures fast startup if wiki folder exists (lazy activation)
- `onCommand` allows explicit manual trigger
- `onStartupFinished` enables background indexing without blocking VS Code startup

**Alternative Considered**: `onLanguage:markdown` too broad; activates on ANY markdown file, not just wiki files.

---

### Command Registration

**Pattern**:
```typescript
export function activate(context: vscode.ExtensionContext) {
  const searchCmd = vscode.commands.registerCommand('wiki.search', async () => {
    // Command handler
  });
  context.subscriptions.push(searchCmd);
}
```

**Recommended Commands**:
| Command | Purpose | Activation Event |
|---------|---------|------------------|
| `wiki.search` | Query wiki content | `onCommand:wiki.search` |
| `wiki.openRaw` | Open raw document editor | `onCommand:wiki.openRaw` |
| `wiki.rebuildIndex` | Manual index rebuild | `onCommand:wiki.rebuildIndex` |
| `wiki.copilotChat` | Copilot Chat participant hook | `onChatParticipant:wiki` |

**Benefits**:
- Scoped namespace prevents collisions with other extensions
- Command palette autocomplete integration  
- Clear traceability of extension capabilities

---

### Webview Patterns

**Two Webview Types**:

1. **WebviewPanel** (standalone editor panel)
   - Lifecycle: Created by command, disposed manually
   - Use case: Search results viewer, document editor
   - Activation event: `onWebviewPanel:wikiPanel`
   - Memory: Persistent while open; disposed on close

2. **WebviewView** (sidebar view)
   - Lifecycle: Created on panel activation, managed by VS Code
   - Use case: Wiki index sidebar, decision tree navigator
   - Memory: Lower overhead than panel; hidden when tab inactive
   - Visibility event: `onDidChangeVisibility`

**MVP Decision (Phase 2D)**:
- **Defer webviews**: MVP uses Copilot Chat (no custom UI needed)
- **Future enhancement** (Phase 3): Add WebviewView for wiki index browser
- **Rationale**: Copilot Chat handles primary interaction; sidebar viewer is nice-to-have

---

### File Watcher APIs

**Core Capability**:
```typescript
const watcher = vscode.workspace.createFileSystemWatcher(
  new vscode.RelativePattern(folder, '**/*.md')
);

watcher.onDidCreate(uri => { /* handle */ });
watcher.onDidChange(uri => { /* handle */ });
watcher.onDidDelete(uri => { /* handle */ });

watcher.dispose(); // on deactivation
```

**Key Characteristics**:
- **Debouncing**: NOT automatic; must implement manually
- **Recursive watching**: `**` glob required for subdirectories (resource-intensive)
- **Case sensitivity**: Depends on OS (case-insensitive on macOS/Windows; case-sensitive on Linux)
- **Performance**: Respects user's `files.watcherExclude` setting (`.git/`, `node_modules/`, etc.)
- **Error handling**: Must log and gracefully handle watcher errors

**Recommended Strategy for Phase 2B**:

**Pattern**:
1. **Watch target**: `/raw/**/*.md` via `RelativePattern`
2. **Debouncing**: Queue changes with 500ms delay before processing
   - Rationale: Prevents thrashing during paste/bulk import of 50+ files
   - Implementation: `setTimeout()` with cancellation token
3. **Conflict resolution**:
   - Simultaneous creates → Let first complete; queue others
   - Change + Delete → Treat as delete (file was replaced)
   - Multiple changes to same file → Coalesce into single index update
4. **Error handling**:
   - Log watcher errors; do not crash extension
   - Retry failed updates with exponential backoff (100ms → 200ms → 400ms)
   - Provide manual `wiki.rebuildIndex` command as fallback

**Alternatives Rejected**:
- **Polling**: Too slow; wastes resources
- **No debouncing**: Causes thrashing during bulk ops
- **Worker thread**: Unnecessary; file watcher is native to VS Code

---

## T002: Copilot Chat API Integration ✅

### ChatParticipant Registration

**Finding**: VS Code provides `vscode.chat.createChatParticipant()` API for registering custom participants.

**Two-Step Process**:

1. **Declarative** (package.json):
```json
{
  "contributes": {
    "chatParticipants": [
      {
        "id": "karpathy-wiki.wiki",
        "name": "wiki",
        "fullName": "Wiki",
        "description": "Search and navigate your personal wiki",
        "isSticky": true,
        "commands": [
          {
            "name": "search",  
            "description": "Full-text search in wiki"
          },
          {
            "name": "index",
            "description": "View indexing status"
          }
        ]
      }
    ]
  }
}
```

2. **Imperative** (extension.ts):
```typescript
const handleWikiRequest: vscode.ChatRequestHandler = async (
  request: vscode.ChatRequest,
  context: vscode.ChatContext,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<vscode.ChatResult> => {
  // request.prompt: user input (e.g., "search for machine learning")
  // request.command: slash command (e.g., "search")
  // No separate API key needed
  
  stream.progress('Searching wiki...');
  const results = await wikiEngine.search(request.prompt);
  stream.markdown(`# Found ${results.length} results`);
  return { metadata: { command: request.command } };
};

const wiki = vscode.chat.createChatParticipant(
  'karpathy-wiki.wiki',
  handleWikiRequest
);
```

### Key Findings

- **No separate API key**: Uses VS Code's native Copilot session (user must have GitHub Copilot enabled)
- **Message history**: Accessible via `context.history` (only mentions of `@wiki`)
- **Language model access**: Optional via `request.model` (can query wiki without LLM; LLM used for synthesis)
- **Response streaming**: Multiple output types (markdown, progress, references, buttons, file trees)

### MVP Response Pattern (Phase 2C)

```
User: "@wiki search for decision tree concepts"
  ↓
Extension:
  1. Parse user query
  2. Query wiki index (no LLM needed for search)
  3. Format results as markdown
  4. Stream via stream.markdown()
  ↓
Copilot Chat: Display results
```

**Output Types Available**:
- **Markdown** (primary for wiki)
- **Progress** ("Searching 247 documents...")
- **Reference** (link to wiki file)
- **Command button** ("Open in Editor")
- **File tree** (wiki hierarchy preview)

### Recommended Activation

```json
"activationEvents": [
  "onChatParticipant:karpathy-wiki.wiki",
  "workspaceContains:**/wiki/**"
]
```

### Advantages Over Python + Copilot API

| Feature | Python CLI | TypeScript Extension |
|---------|---------|---------|
| **API Key** | Separate `GITHUB_COPILOT_API_KEY` | None (VS Code native) |
| **UI** | External API calls | Native Copilot Chat |
| **File Watcher** | Manual polling | VS Code native |
| **Deployment** | Separate service | Bundled extension |
| **UX** | Context switch | Seamless |

---

## T003: PDF Extraction Libraries ✅

### Evaluation Results

**Option A: Client-Side (`pdfjs-dist`)**
- **Advantages**: No backend service; works in browser/extension context; no external dependencies
- **Disadvantages**: Slower; memory overhead; no OCR support
- **Use case**: MVP (small PDFs <10MB); embedded extraction in extension

**Option B: Backend Service (`PyMuPDF`)**
- **Advantages**: Fast; handles large PDFs; OCR support via Tesseract
- **Disadvantages**: Requires separate Python service; deployment complexity; API management
- **Use case**: Production PDF handling; scanned documents; bulk extraction

**Option C: Hybrid (Recommended)**
- ExtensionTries client-side extraction first (for born-digital PDFs)
- Falls back to backend service if client-side fails or is too slow
- Minimal latency for common case; robustness for edge cases

### Recommended Decision (Phase 2)

**MVP Approach**: Use `pdfjs-dist` client-side only
- Rationale: Simplifies deployment (no backend service); sufficient for phase 1-2
- File size limit: PDFs up to 10MB handled efficiently
- Quality tradeoff: Scanned/OCR documents will show extraction errors (acceptable for MVP)

**Installation**:
```bash
npm install pdfjs-dist
```

**Usage in TypeScript**:
```typescript
import * as pdfjsLib from 'pdfjs-dist';

export async function extractPdfText(pdfPath: string): Promise<string> {
  const pdfDocument = await pdfjsLib.getDocument(pdfPath).promise;
  let text = '';
  
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
  }
  
  return text;
}
```

**Future Enhancement (Phase 3)**: Add backend `PyMuPDF` service for production OCR support

---

## T004: Markdown Validation ✅

### Library Evaluation

**Option A: `markdown-it` (Recommended)**
- **Pros**: CommonMark compliant; lightweight; plugin ecosystem; no dependencies
- **Cons**: No built-in Foam link support (but easy to add via plugin)
- **Size**: ~50KB minified
- **Plugins needed**: Custom `[[WikiLink]]` support

**Option B: `remark` + `unified` ecosystem**
- **Pros**: Highly modular; excellent plugin system; AST-based
- **Cons**: Larger bundle size (~100KB+); more complex setup
- **Use case**: advanced parsing scenarios (Phase 3+)

### MVP Recommendation

**Use `markdown-it` with custom plugin for Foam links**

**Installation**:
```bash
npm install markdown-it markdown-it-wikilinks
```

**Setup**:
```typescript
import MarkdownIt from 'markdown-it';
import wiki from 'markdown-it-wikilinks';

const md = new MarkdownIt();
md.use(wiki(), {
  baseuri: '/wiki/',
  uriSuffix: '',
  makeAllLinksAbsolute: true,
  postProcessPageName: (pageName: string) => pageName.toLowerCase()
});

// Parse: "See [[Decision Trees]] for details"
// Output HTML: '<p>See <a href="/wiki/decision-trees">Decision Trees</a> for details</p>'
```

### Foam Link Detection Pattern

**Goal**: Extract wiki links like `[[Page Title]]` for backlink detection

**Regex Pattern**:
```typescript
const wikiLinkPattern = /\[\[([^\]]+)\]\]/g;

export function extractWikiLinks(markdown: string): string[] {
  const links: string[] = [];
  let match;
  while ((match = wikiLinkPattern.exec(markdown)) !== null) {
    links.push(match[1]);
  }
  return links;
}
```

**Validation**:
```typescript
// Supported formats
"[[Decision Tree]]"
"[[Decision Tree|alias]]"
"[[Decision Tree#section]]"

// Custom markdown-it-wikilinks handles all formats
```

---

## T005: File Watcher & Embedding Strategies ✅

### File System Change Coalescing (Debouncing)

**Pattern**: Debounce file watcher events to prevent thrashing during bulk operations.

**Implementation**:
```typescript
class DebounceWatcher {
  private pendingChanges = new Map<string, NodeJS.Timeout>();
  private debounceMs = 500;
  
  onFileChange(uri: vscode.Uri, handler: (uri: vscode.Uri) => Promise<void>) {
    const key = uri.fsPath;
    
    // Cancel previous timeout for this file
    if (this.pendingChanges.has(key)) {
      clearTimeout(this.pendingChanges.get(key)!);
    }
    
    // Queue new handler
    const timeout = setTimeout(async () => {
      await handler(uri);
      this.pendingChanges.delete(key);
    }, this.debounceMs);
    
    this.pendingChanges.set(key, timeout);
  }
}
```

**Conflict Resolution**:
- **Multiple changes to same file**: Only last wins
- **Change + delete**: Treat as delete (file was replaced)
- **Bulk creates**: Let debounce coalesce into single batch update

---

### Embedding Strategy (MVP)

**MVP Approach**: Local-only embeddings (Phase 2)

**Library**: `universal-sentence-encoder` via TensorFlow.js
- Size: ~100MB (large but necessary for quality embeddings)
- Performance: ~50-100ms per page on average machine
- Quality: Good for semantic search without training

**Installation**:
```bash
npm install @tensorflow/tfjs @tensorflow-models/universal-sentence-encoder
```

**Usage**:
```typescript
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

let model: use.UniversalSentenceEncoder;

export async function loadEmbeddingModel() {
  model = await use.load();
}

export async function embedText(text: string): Promise<number[]> {
  const embeddings = await model.embed(text);
  return Array.from(await embeddings.data());
}
```

**Caching Strategy**:
- Store embeddings in `.vscode/wiki-cache/embeddings.json` (local)
- Cache invalidated when `/raw` files change (via watcher)
- Rebuild on startup if cache stale

**Future Enhancement (Phase 3)**: Copilot-based embeddings (remote; user opt-in)

---

## T006: Testing Frameworks ✅

### Recommended Stack

**Framework**: Jest + `@vscode/test-cli`

**Installation**:
```bash
npm install --save-dev jest @vscode/test-cli @types/jest ts-jest
```

**Jest Configuration** (`jest.config.js`):
```typescript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
```

### Extension Testing Patterns

**Unit Test** (query engine):
```typescript
import { WikiQueryEngine } from '../src/query';

describe('WikiQueryEngine', () => {
  let engine: WikiQueryEngine;
  
  beforeEach(() => {
    engine = new WikiQueryEngine();
  });
  
  it('should search by title', async () => {
    const results = await engine.search('test query');
    expect(results.length).toBeGreaterThan(0);
  });
});
```

**Integration Test** (file watcher):
```typescript
import * as vscode from 'vscode';
import { FileWatcherHandler } from '../src/ingest';

describe('FileWatcherHandler', () => {
  it('should rebuild index on /raw file change', async () => {
    // Create temp file in workspace
    const uri = vscode.Uri.file('/tmp/test.md');
    const handler = new FileWatcherHandler();
    
    const spy = jest.spyOn(handler, 'rebuildIndex');
    handler.onFileChange(uri);
    
    await new Promise(r => setTimeout(r, 600)); // wait for debounce
    expect(spy).toHaveBeenCalled();
  });
});
```

### Testing Strategy (Phase 2)

- **Unit tests**: Query engine, index logic, markdown parsing (~80% coverage)
- **Integration tests**: File watcher, Copilot Chat handler (20%)
- **Manual testing**: Chat participant UI interaction (recorded in tasks.md)

---

## Summary of Phase 0 Decisions

| Task | Decision | Rationale |
|------|----------|-----------|
| **T001** | VS Code SDK | `workspaceContains` + `onCommand` activation; 500ms debounce file watcher |
| **T002** | Copilot Chat Participant | `@wiki` participant (no separate API key); streaming markdown responses |
| **T003** | PDF Extraction | `pdfjs-dist` client-side (MVP); fallback to PyMuPDF backend (Phase 3) |
| **T004** | Markdown Parsing | `markdown-it` + `markdown-it-wikilinks` for `[[WikiLink]]` support |
| **T005** | Embeddings | `universal-sentence-encoder` local model; cache invalidation on file changes |
| **T006** | Testing | Jest + `@vscode/test-cli`; 80% coverage target for Phase 2 |

---

## Phase 0 Outcome: Ready for Phase 1

✅ All 6 research tasks complete and documented  
✅ All major architectural decisions finalized  
✅ Technology stack selected (TypeScript, vscode SDK, pdfjs-dist, markdown-it, universal-sentence-encoder, Jest)  
✅ Design constraints identified for Phase 1  

**Next Phase**: Phase 1 Design (T007–T013) can proceed with:
- TypeScript interfaces definition (models/, types/)
- Extension command contracts
- Copilot Chat participant message flows
- Data model finalization

---

## Obsolete Content (Legacy Python Research - Archived)

The following section documents Phase 0 learnings from the previous Python CLI approach. Kept for historical reference; not used in current TypeScript extension.

### Extraction Libraries (evaluation & recommendation)

Candidate approaches and tradeoffs:

- PyMuPDF (fitz): robust, fast extraction of text and layout; good for born-digital PDFs. Recommended as primary extractor for text-first docs.
- pdfplumber / pdfminer.six: fine-grained control over layout and text boxes; useful when PyMuPDF yields noisy segmentation. Use when layout preservation matters.
- Tesseract via `pytesseract`: required for scanned/OCR inputs. Add an OCR step when a PDF has no extractable text.
- `pypdf` (PyPDF2) or `pikepdf`: useful for metadata and basic page handling (merging/splitting) but not a replacement for text extraction.

Plan: implement a lightweight extractor wrapper that attempts (in order): 1) direct text extraction (PyMuPDF), 2) fallback to pdfplumber, 3) fallback to OCR with Tesseract when no text found.

## Concept Extraction & Linking

Approaches:

- Heuristic rules: headings, section titles, and phrase frequency (fast, deterministic). Good for initial pass.
- Statistical keyphrase extractors: YAKE, RAKE (fast, no external models). Good for quick candidate lists.
- Embedding-based similarity: `sentence-transformers` (local models like `all-MiniLM-*`) to deduplicate candidates and find near-matches for backlinking. Useful for fuzzy match of existing `WikiPage` titles/aliases.
- NER / syntactic cues: `spaCy` for named entities and chunking to surface concept candidates.

Recommendation: combine heuristics + spaCy NER for candidate generation, then use lightweight embeddings (sentence-transformers) for alias matching and backlink suggestions.

## Draft Generation Options (Copilot policy)

Modes:

- Editor-Assist (Default, Recommended): pipeline writes a draft stub (metadata + extracted snippets + suggested summary) and opens it in the user's VS Code editor. The user may then invoke Copilot interactively to polish content. This preserves traceability and human review and does not automatically send source material to remote services.

- Local-LLM Automation (Opt-in): if you can host a local LLM (e.g., Llama-family via `llama.cpp`, `ggml`, or a local HF model), programmatic summarization/drafting can run without sending data off-host. This requires hardware and licensing checks. Use only if you accept the operational cost and verify model licenses.

- Remote LLM / Copilot Automation (Require explicit approval): automating drafts using GitHub Copilot or other cloud LLMs may transmit wiki or raw content to third-party services. Per the constitution, this is disallowed by default. If you want automated remote drafting, you must explicitly approve the exception, document the privacy/risk tradeoffs, and add this exception to the constitution governance logs.

Copilot Integration Policy (short):

1. Default: Editor-Assist Mode. Drafts are generated locally; human reviews and triggers Copilot ad-hoc inside VS Code. No pipeline data is sent automatically to Copilot.
2. Local LLMs: Allowed with documented hardware/ops plan and license review.
3. Remote Copilot/LLM automation: Disallowed unless explicitly approved. Approval requires: explicit user consent, documented data classification (no sensitive/PII), and a PR updating the constitution’s exceptions with reviewer approval.

## Backlinking & Indexing

Design notes:

- Maintain a small SQLite index mapping normalized titles and aliases → file paths for quick resolution.
- Use exact title matches first; if none, use embedding similarity (cosine) with a conservative threshold to propose backlinks rather than auto-insert them (let user confirm proposed backlinks during preview).
- Keep backlink insertion idempotent: update both source and target pages without duplicating links.

## Performance & Test Harness

Test methodology:

- Select representative PDFs: (A) born-digital research paper (10–20 pages); (B) scanned paper (10–20 pages); (C) long report (100+ pages).
- Measure: extraction time, concept candidate count, draft generation time. Goal: typical 10–20 page research PDF processed end-to-end (extraction + candidate generation + draft stub) under 120 seconds on a modern dev machine (8 cores, 16GB RAM). Adjust goals after empirical runs.

Add integration tests that run the pipeline on the three representative inputs and assert: correct number of candidate stubs, `Links` field present in each stub, and no unattended remote calls are made.

## Privacy, Licensing, and Risk Notes

- Do NOT send sensitive or private raw documents to remote services (Copilot, cloud LLMs) unless the data is scrubbed and explicit approval is recorded.
- Verify third-party library licenses for compatibility with your project's distribution and company policy before wide adoption.
- Keep an audit log (local) of all automated drafting operations and decisions to maintain traceability.

## Recommended Minimal Stack (starter)

Python 3.11 + the following (local-first):

```bash
python -m pip install pymupdf pdfplumber pytesseract spacy sentence-transformers jinja2 pytest
# optional (OCR runtime): install tesseract-ocr via system package manager
```

Suggested models/tools to download during Phase 0 tests:

- `spaCy` English model (small) for NER and sentence segmentation
- `sentence-transformers/all-MiniLM-L6-v2` for compact embeddings (local)

## Decision / Recommendation (Phase 0 outcome)

- Default implementation: Python 3.11, PyMuPDF primary extractor, fallback to pdfplumber and Tesseract OCR; spaCy + YAKE/spaCy heuristics for candidate extraction; sentence-transformers for alias/backlink matching; Jinja2 for Markdown page templating.
- Copilot: Use Editor-Assist Mode by default. Do not enable automated remote Copilot drafting without explicit approval and documented exception.

## Next Steps (deliverables for Phase 0)

1. Prototype extractor wrapper that runs the three-stage extract (PyMuPDF → pdfplumber → Tesseract) and produce a raw-text output for a sample PDF. (Task: `T006`)
2. Prototype concept extractor combining spaCy NER + YAKE and produce candidate titles for the same PDF. (Task: `T007`)
3. Measure end-to-end processing time on sample PDFs and record results in `specs/001-vscode-native-wiki/research.md` and `specs/001-vscode-native-wiki/research-results.md`.
4. If you confirm Python 3.11 and the above stack, I will generate `data-model.md` and a `quickstart.md` next.

---

If you approve this recommended stack and the Copilot Editor-Assist policy, I will (a) finalize `research.md` (this file), (b) add a test harness and sample input, and (c) produce `data-model.md` next. Otherwise tell me any constraints or an alternate runtime and I will adapt.
