# Implementation Plan: VS Code-Native Wiki (Personal LLM Wiki)

**Branch**: `001-vscode-native-wiki` | **Date**: 2026-04-13 | **Spec**: [specs/001-vscode-native-wiki/spec.md](specs/001-vscode-native-wiki/spec.md#L1)

## Summary

Build a VS Code extension that provides an ingestion → synthesis → maintenance pipeline converting source artifacts dropped into `/raw` into Foam-compatible, atomic Markdown pages in `/wiki`. The extension integrates directly with VS Code's Copilot Chat for semantic operations (embeddings, content generation) and provides command palette commands for ingest, query, and lint workflows. All outputs remain traceable to `/raw` and compatible with Foam graph visualization.

## Technical Context

**Language/Version**: TypeScript + Node.js (VS Code extension SDK)  
**Extension Dependencies**: 
  - `vscode` - VS Code extension API
  - `@vscode/test-electron` - Extension testing
  - `@types/vscode` - Type definitions
  - `pdfjs-dist` - PDF extraction (client-side)
  - `markdown-it` - Markdown validation
  - Copilot Chat API integration (via VS Code extension communication)
**Optional Backend**: Python runtime for advanced PDF extraction (PyMuPDF/pdfplumber) callable from extension  
**Storage**: Filesystem (`/raw`, `/wiki`); no database needed initially  
**Testing**: Jest + VS Code Test Runner (extension tests)  
**Target Platform**: VS Code (macOS/Linux/Windows) with GitHub Copilot extension installed  
**Project Type**: VS Code extension (single integrated environment)  
**Copilot Integration**: Direct Copilot Chat API via VS Code extension communication (no separate API key management)  
**Performance Goals**: Ingest typical research PDF in < 2 minutes (background task)  
**Constraints**: Local-first; atomic pages; no hallucinations; strict `YYYYMMDDNN` filenames; no Python CLI tools (deprecated)  
**Scale/Scope**: Initial target: tens–hundreds of `/raw` artifacts; extension architecture scales to thousands with file indexing

## Constitution Check

GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.

- All generated pages MUST include the fields: `Title`, `Summary`, `Tags`, `Links`, `Content`.  
- Every asserted fact in a page MUST cite at least one `/raw` source in the `Links` field; otherwise the page must be marked `Needs Source`.  
- Filenames MUST follow `YYYYMMDDNN` and be atomic (one concept per file).  
- No remote uploads or publishing without explicit approval.

If any gate fails, document the violation and justify it in the plan before proceeding.

## Project Structure (feature-level)

specs/001-vscode-native-wiki/
- plan.md                # This file
- research.md            # Phase 0 output (create)
- data-model.md          # Phase 1 output (create)
- quickstart.md          # Phase 2D output (create)
- tasks.md               # Phase 0–2 output (create)

extension/  (NEW)
- src/
  - extension.ts         # Extension activation & command registration
  - ingest/
    - ingestCommand.ts   # Ingestion orchestrator
    - extractor.ts       # PDF/text extraction
    - conceptExtractor.ts # Concept candidate discovery
    - draftGenerator.ts   # Draft generation (Copilot Chat integration)
    - backlinkManager.ts  # Backlink insertion & reconciliation
  - query/
    - queryCommand.ts    # Query handler + Decision archiver
  - lint/
    - orphanDetector.ts   # Orphan page discovery
    - claimAnalyzer.ts    # Claim-diff analysis
    - lintCommand.ts      # Lint orchestrator
  - models/
    - WikiPage.ts        # WikiPage type definitions
    - RawDocument.ts     # RawDocument type definitions
  - utils/
    - fileWatcher.ts     # File watcher for /raw changes
    - formatter.ts       # Page formatting & validation
- package.json
- tsconfig.json
- test/  (Jest)

wiki/
- decisions/             # Archived decision transcripts
- index.md
- glossary.md

(Deprecated) tools/ — Python CLI tools marked as deprecated; maintained for backward compatibility only

## Complexity Tracking

If any of the following are required, provide a short justification in the plan and add a Complexity Tracking table:

- Running a remote LLM service for extraction/drafting (violates Local-Only constraint)  
- Non-atomic pages or complex multi-concept merges  
- External publishing or sharing of raw content

## Phase 0: Outline & Research (deliver: `research.md`)

Investigate extension architecture, Copilot Chat integration, PDF extraction strategies, and file watcher patterns to inform Phase 1 design.

1. Research VS Code extension architecture: extension activation, command registration, webview integration, file watcher patterns.  
2. Research Copilot Chat API integration: available VS Code extension APIs for interacting with Copilot Chat (e.g., `vscode.chat.createChatParticipant`, message passing patterns).  
3. Evaluate client-side PDF extraction: `pdfjs-dist` vs. backend Python service vs. hybrid approach.  
4. Research NER library options (spaCy, NLTK) for concept extraction candidate generation.  
5. Define page schema validator and `YYYYMMDDNN` sequence generator for TypeScript context.  
6. Research file watcher patterns for `/raw` directory change detection.  
7. Produce `research.md` with Decisions: chosen libraries, NER strategy, Copilot Chat patterns, rationale, alternatives.

## Phase 1: Design & Contracts (deliver: `data-model.md`, `/contracts`)

Define data models, extension commands, Copilot Chat integration patterns, and contracts for Phase 2A–2D implementation.

1. Define canonical data model: `RawDocument`, `WikiPage`, `Decision`, `Index`, `GlossaryTerm` (TypeScript interfaces).  
2. Specify NER library choice and concept extraction strategy (library name, thresholds, candidate ranking).  
3. Define extension commands: 
   - `personal-wiki.ingest` - Ingest files from `/raw`
   - `personal-wiki.query` - Query wiki via Copilot Chat
   - `personal-wiki.lint` - Run linting checks (quick and deep modes)
   - `personal-wiki.indexRebuild` - Rebuild index/glossary
4. Design Copilot Chat participant integration: message handling, response formatting, Decision page archival, local embeddings fallback strategy.  
5. Design page creation flow and reconciliation algorithm (idempotent, safe merges, backlink insertion).  
6. Design file watcher strategy: debouncing, conflict resolution for simultaneous changes.  
7. Define tests and acceptance criteria for each command.  
8. Run `.specify/scripts/bash/update-agent-context.sh copilot` (optional; documents extension to Copilot agent context).  

## Phase 2A–2D: Implementation (deliver: code + `quickstart.md`)

**Sprint A — Extension Scaffold & File Operations**

1. Create TypeScript extension project with `package.json`, build configuration, test setup.  
2. Implement extension activation and command registration (`ingest`, `query`, `lint`, `indexRebuild`).  
3. Implement file watcher for `/raw` directory changes.  
4. Implement PDF/text extraction (client-side via `pdfjs-dist` or backend Python service).  
5. Implement `WikiPage` data model and filesystem operations (read/write pages).  
6. Add unit tests for file operations and page schema validation.

**Sprint B — Core Workflows (Ingest, Lint, Index)**

1. Implement `ingestCommand`: orchestrate extraction → concepts → draft → backlinks.  
2. Implement concept extraction and candidate page discovery.  
3. Implement page draft generation with `Needs Source` handling.  
4. Implement backlink insertion and reconciliation (bidirectional updates).  
5. Implement `lintCommand` with orphan detection and claim-diff analysis.  
6. Implement `indexRebuild` command to update `index.md` and `glossary.md`.  
7. Add integration tests: ingest sample PDF, verify pages, backlinks, index updates.

**Sprint C — Query & Copilot Chat Integration**

1. Implement Copilot Chat participant integration (message handling, context injection).  
2. Implement `queryCommand` handler that answers using wiki pages.  
3. Implement Decision page archival for query conversations.  
4. Add webview for Decision preview and confirmation UI.  
5. Add integration tests for query flow and Decision creation.

**Sprint D — Polish & Documentation**

1. Provide `quickstart.md` showing extension installation, usage via command palette, Foam graph visualization.  
2. Add error handling and user-friendly status messages.  
3. Add settings UI (optional: PDF extraction backend, performance tuning).  
4. Verify Foam graph rendering and backlink navigation work correctly.  

## Acceptance Tests & Criteria Mapping

- Automated backlinks: integration test that creates related pages and verifies inbound links.  
- Central `index.md` and `glossary.md`: validate against schema in `data-model.md`.  
- `[[WikiLinks]]` support: generated pages must include explicit `[[Page Title]]` links where applicable and Foam graph should show edges (manual verification).  
- No hallucinations: unit tests verifying that every generated assertion is traceable to `/raw` or is labelled `Needs Source`.

## Deliverables

- `specs/001-vscode-native-wiki/plan.md` (this file)  
- `specs/001-vscode-native-wiki/research.md`  
- `specs/001-vscode-native-wiki/data-model.md`  
- `specs/001-vscode-native-wiki/quickstart.md`  
- `specs/001-vscode-native-wiki/tasks.md`  
- `tools/ingest/*`, `tools/lint/*`, `scripts/watch-raw.sh`, tests/

## Timeline (rough)

- Phase 0 (Research): 1–2 days  
- Phase 1 (Design & Contracts): 2–3 days  
- Phase 2 (Implementation MVP): 2–3 weeks  
  - Sprint A (Extension scaffold + file ops): 4–5 days  
  - Sprint B (Core workflows): 5–7 days  
  - Sprint C (Query + Copilot Chat): 3–5 days  
  - Sprint D (Polish): 2–3 days  

## Next Steps (immediate)

1. Generate `tasks.md` from this plan using speckit.tasks workflow.  
2. Run Phase 0 research and produce `research.md`.  
3. After research, produce `data-model.md`.  
4. Begin Phase 2 implementation (Sprint A).  

---

**Status**: Architecture clarified (2026-04-14). Specification finalized. Ready for task generation and implementation planning.
