---
description: "Task list for VS Code-Native Wiki extension implementation"
---

# Task List: Personal LLM Wiki VS Code Extension

**Feature**: VS Code-Native Wiki Implementation  
**Branch**: `001-vscode-native-wiki`  
**Specification**: [spec.md](spec.md)  
**Plan**: [plan.md](plan.md)  
**Status**: Ready for implementation  

**Note**: Previous Python CLI implementation (Python tools/) is deprecated; all tasks now target TypeScript VS Code extension

---

## Phase 0: Research & Investigation

### Goal
Research extension architecture, PDF extraction, Copilot Chat integration patterns, and file watcher strategies to inform Sprint A design.

### Independent Test Criteria
- Research document created with 5+ decision entries
- All decisions justifying chosen libraries and patterns
- Alternatives evaluated for each major component

### Research Tasks

- [x] T001 [P] Investigate VS Code extension SDK: activation events, command registration, webview patterns, file watcher APIs
- [x] T002 [P] Research Copilot Chat API integration: available VS Code APIs for message passing, participant patterns, authentication context
- [x] T003 [P] Evaluate PDF extraction libraries: `pdfjs-dist` (client), backend Python service (PyMuPDF), hybrid approach—tradeoffs on latency/complexity
- [x] T004 [P] Research Markdown validation: `markdown-it` vs alternatives for CommonMark compatibility and Foam link detection
- [x] T004b [P] Evaluate NER libraries for concept extraction: spaCy (production-ready, heavier) vs NLTK (pure Python, lighter dependency) vs regex-based heuristics; document tradeoffs
- [x] T005 [P] Design file watcher strategy: debouncing patterns, conflict resolution for simultaneous `/raw` changes, performance implications
- [x] T006 Create `specs/001-vscode-native-wiki/research.md` documenting all decisions with rationale and alternatives

---

## Phase 1: Design & Data Model

### Goal
Define data models, extension commands, Copilot Chat integration patterns, and contracts for Phase 2 implementation.

### Independent Test Criteria
- TypeScript interfaces defined for all core entities
- Extension commands documented with examples
- Copilot Chat participant message flow diagrammed
- All acceptance criteria mapped to test cases

### Design Tasks

- [x] T007 Define TypeScript interfaces: `WikiPage`, `RawDocument`, `Decision`, `Index`, `GlossaryTerm` in `extension/src/models/`
- [x] T007b Specify NER library choice in Phase 1 design (select spaCy OR NLTK based on T004b research; document rationale)
- [x] T008 Document extension commands: `ingest`, `query`, `lint` (quick + deep modes), `indexRebuild` with signatures, inputs, outputs, error handling
- [x] T009 Design Copilot Chat participant integration: message format, context injection, response formatting, Decision archival, local embeddings fallback strategy
- [x] T010 Design page creation and reconciliation algorithm: idempotent merge strategy, backlink insertion rules, conflict resolution
- [x] T011 Design file watcher: debouncing strategy, duplicate prevention, error recovery
- [x] T012 Create acceptance test matrix mapping spec requirements (FR-001 through FR-008) and SC-001 (80%+ backlink metric) to test cases
- [x] T013 Create `specs/001-vscode-native-wiki/data-model.md` with entities, relationships, operations, and NER strategy

---

## Phase 2A: Extension Scaffold & File Operations

### Goal
Build extension foundation: activation, command registration, file operations, and unit tests.

### Independent Test Criteria (Phase 2A)
- Extension activates without errors on VS Code startup
- All command palette entries appear and are clickable
- File watcher detects changes in `/raw` and triggers callbacks
- WikiPage read/write operations preserve schema and formatting
- Unit tests cover: page parsing, filename validation, schema enforcement

### Sprint A Tasks

- [x] T014 Create TypeScript extension project: `extension/package.json`, `tsconfig.json`, `.vscode/launch.json`, test configuration with Jest
- [x] T015 Implement extension activation in `extension/src/extension.ts`: register commands, initialize file watcher, expose Copilot Chat participant
- [x] T016 [P] Implement command registration for: `personal-wiki.ingest`, `personal-wiki.query`, `personal-wiki.lint`, `personal-wiki.indexRebuild`
- [x] T017 Implement file watcher in `extension/src/utils/fileWatcher.ts`: monitor `/raw`, debounce, emit events on file add/change/delete
- [x] T018 Implement filesystem operations in `extension/src/utils/fileManager.ts`: readPage, writePage, listPages, validateSchema
- [x] T019 Implement page formatter in `extension/src/utils/formatter.ts`: enforce `YYYYMMDDNN` filenames, validate page schema (Title/Summary/Tags/Links/Content), normalize Markdown
- [x] T020 Implement `WikiPage` model in `extension/src/models/WikiPage.ts`: constructor, serialization, deserialization, schema validation
- [x] T021 Write unit tests for: page parsing, filename generation (`YYYYMMDDNN`), schema validation, file I/O
- [x] T022 Set up CI/CD: GitHub Actions to run tests on push, verify TypeScript compilation
- [x] T022b Validate Foam backlink syntax: create test Markdown files with `[[WikiLink]]` format, verify parser correctly identifies links (early detection of Foam compatibility)

---

## Phase 2B: Core Workflows—Ingest, Lint, Index

### Goal
Implement extraction → concepts → drafting → backlinks pipeline; add linting and index rebuild.

### Independent Test Criteria (Phase 2B)
- Ingest command creates 5–10 wiki pages from sample PDF
- Each generated page includes Title, Summary, Tags, Links (traced to `/raw`), Content
- Backlinks bidirectionally updated on related pages
- Orphan detection identifies pages with no inbound links
- `index.md` and `glossary.md` updated after ingest
- Unit and integration tests cover all major paths

### Sprint B Tasks

- [x] T023 Implement PDF/text extraction in `extension/src/ingest/extractor.ts`: use chosen library (pdfjs-dist or Python backend), extract text + metadata
- [x] T024 Implement concept extraction in `extension/src/ingest/conceptExtractor.ts`: heading heuristics, section detection, NER (using library chosen in T007b), candidate page titles with confidence scores
- [x] T025 Implement draft generator in `extension/src/ingest/draftGenerator.ts`: create page with Title/Summary/Tags/Links/Content; mark unknown assertions with `Needs Source`
- [x] T026 Implement backlink manager in `extension/src/ingest/backlinkManager.ts`: find related pages by title/alias, insert `[[WikiLinks]]`, bidirectionally update pages (idempotent)
- [x] T027 [US1] Implement ingest orchestrator in `extension/src/ingest/ingestCommand.ts`: extraction → concepts → drafts → backlinks → write pages
- [x] T028 Implement orphan detector in `extension/src/lint/orphanDetector.ts`: find pages with zero inbound `[[WikiLinks]]`, group by tag/age
- [ ] T029 Implement claim analyzer in `extension/src/lint/claimAnalyzer.ts`: simple heuristics for contradictory assertions citing different `/raw` sources
- [x] T030 Implement lint orchestrator in `extension/src/lint/lintCommand.ts`: run orphan detection (quick mode) and claim analysis (deep mode), generate remediation report
- [x] T031 Implement index rebuild in `extension/src/commands/indexRebuild.ts`: traverse all pages, update `index.md` (by category) and `glossary.md` (terms + definitions)
- [x] T032 Write integration tests: ingest sample PDF, verify pages created, backlinks inserted, index updated, lint output correct
- [x] T033 Create sample PDFs in `/raw` for testing; verify 5–10 pages generated with correct schema

---

## Phase 2C: Query & Copilot Chat Integration

### Goal
Integrate with Copilot Chat to answer questions using wiki and archive decisions.

### Independent Test Criteria (Phase 2C)
- Query command receives question via Copilot Chat participant
- Extension searches wiki, retrieves relevant pages, injects context for Copilot
- Response cites supporting pages and `/raw` sources
- Decision page created and archived with conversation transcript
- Unit and integration tests validate message flow and Decision format

### Sprint C Tasks

- [ ] T034 Implement Copilot Chat participant in `extension/src/copilot/participant.ts`: register participant, handle incoming messages, inject wiki context
- [ ] T034b Implement local embeddings fallback in `extension/src/search/localEmbeddings.ts`: use `sentence-transformers/all-MiniLM-L6-v2` for semantic search if Copilot API unavailable or `GITHUB_COPILOT_API_KEY` not configured; test graceful activation
- [ ] T035 [US2] Implement query handler in `extension/src/query/queryCommand.ts`: search wiki for relevant pages (Copilot-Primary→Local-Fallback), format results for context injection
- [ ] T036 Implement Decision archiver in `extension/src/query/decisionArchiver.ts`: create pages under `/wiki/decisions/` with conversation transcript, supporting page links, `/raw` source links
- [ ] T037 Implement webview for Decision preview (optional): show Decision before archival, allow user confirmation/edits
- [ ] T038 Write integration tests: ask question via Copilot Chat, verify wiki search (Copilot + fallback paths), context injection, Decision creation with correct schema
- [ ] T039 Test Decision pages created under `/wiki/decisions/` with correct format (Title, Summary, conversation transcript, Links)

---

## Phase 2D: Polish & Documentation

### Goal
Refine UX, add error handling, create documentation, verify Foam compatibility.

### Independent Test Criteria (Phase 2D)
- Extension handles errors gracefully with user-friendly messages
- `quickstart.md` provides end-to-end workflow (install, ingest, query, view graph)
- Foam graph visualization works with generated backlinks
- All keyboard shortcuts and command palette entries documented

### Sprint D Tasks

- [ ] T040 Add error handling: PDF parsing failures, file permission issues, Copilot Chat unavailability (activate local embeddings fallback), graceful user messaging; test all fallback paths
- [ ] T041 Add status messages and progress indicators: ingestion progress, query processing, lint report generation
- [ ] T042 Add settings UI (extension `contributes.configuration`): PDF extraction backend, performance tuning (batch size, debounce delay)
- [ ] T043 Create `specs/001-vscode-native-wiki/quickstart.md`: installation, basic workflow (ingest, query, view in Foam), troubleshooting
- [ ] T044 Verify Foam graph rendering: create test wiki with known backlinks, confirm graph layout and navigation work
- [ ] T045 Test end-to-end: ingest 2–3 sample PDFs, ask queries via Copilot Chat, verify Decisions archived, confirm graph visualization

---

## Phase 3: Enhancements & Scale (Future)

*Optional future sprints (post-MVP):*

- [ ] T046 Add wiki indexing: SQLite index for faster search on large wikis
- [ ] T047 Add collaborative features: shared wiki repository, conflict resolution for multi-user edits
- [ ] T048 Add export features: export wiki as PDF, HTML, Notion, Obsidian vault
- [ ] T049 Publish extension to VS Code Marketplace (if privacy requirements allow)

---

## Dependencies & Parallel Opportunities

### Dependency Order
1. **Phase 0 → Phase 1**: Research informs architecture decisions
2. **Phase 1 → Phase 2A**: Design defines contracts for implementation
3. **Phase 2A → Phase 2B**: Scaffold enables core logic implementation
4. **Phase 2B ↔ Phase 2C**: Parallel: Ingest and Query can be implemented in parallel (both read/write to wiki)
5. **Phase 2C → Phase 2D**: Query tests validate before polish
6. **Phase 2D → Completion**: Polish & documentation finalize MVP

### Parallel Execution Examples

**Week 1–2** (Phase 0–1):
- Dev A: Research extension architecture + Copilot Chat (T001–T002)
- Dev B: Research PDF extraction + file watchers (T003–T005)
- Dev C: Design data model + commands (T007–T013)

**Week 3–4** (Phase 2A):
- Dev A + B: Extension scaffold (T014–T022) — sequential, blocking for other sprints

**Week 5–7** (Phase 2B + 2C in parallel):
- Dev A: Sprint B (ingest, lint, index) — T023–T033
- Dev B: Sprint C (query, Copilot Chat) — T034–T039

**Week 8** (Phase 2D):
- Dev A + B: Polish, documentation, end-to-end testing (T040–T045)

---

## Success Criteria & Acceptance Tests

**MVP Completion**: All Phase 0–2 tasks complete and passing tests

- ✅ Extension activates in VS Code without errors
- ✅ Ingest command processes sample PDF and creates 5–10 wiki pages with correct schema
- ✅ Backlinks bidirectionally established and render in Foam graph
- ✅ Query command answers questions using wiki context via Copilot Chat
- ✅ Decision pages archived with conversation transcript and source links
- ✅ Lint command identifies orphans and reports contradictions
- ✅ Unit + integration test suite at 80%+ coverage
- ✅ `quickstart.md` provides reproducible end-to-end workflow
- ✅ All pages comply with constitution (Markdown-first, atomic, traceable to `/raw`)

---

## Deliverables Checklist

- [ ] `extension/` directory with TypeScript sources
- [ ] `specs/001-vscode-native-wiki/research.md` (Phase 0)
- [ ] `specs/001-vscode-native-wiki/data-model.md` (Phase 1)
- [ ] `specs/001-vscode-native-wiki/quickstart.md` (Phase 2D)
- [ ] Full test suite (Jest) with 80%+ coverage
- [ ] README with installation and usage instructions
- [ ] GitHub Actions CI/CD workflow

