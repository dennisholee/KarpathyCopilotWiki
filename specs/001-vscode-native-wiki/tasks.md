---
description: "Task list for VS Code-Native Wiki implementation"
---

# Tasks: VS Code-Native Wiki (Personal LLM Wiki)

**Input**: Design documents from `specs/001-vscode-native-wiki/` (spec.md, plan.md)

## Phase 1: Setup (Shared Infrastructure) ✓ COMPLETE

- [X] T001 Create repository directories: `/raw`, `/wiki`, `tools/ingest`, `tools/lint`, `scripts/` at repo root
- [X] T002 [P] Create `specs/001-vscode-native-wiki/research.md` with checklist for library evaluation and Copilot integration options
- [X] T003 [P] Create language-agnostic scaffolding files: `tools/ingest/README.md`, `tools/lint/README.md`, `scripts/watch-raw.sh`, `tests/` directory
- [X] T004 Create `specs/001-vscode-native-wiki/data-model.md` draft containing `RawDocument`, `WikiPage`, `Decision`, `Index`, `GlossaryTerm` entities
- [X] T005 [P] Add a project manifest placeholder (`pyproject.toml` or `package.json`) and document language choice in `research.md` (NEEDS_CLARIFICATION stored in `research.md`)

---

## Phase 2: Foundational (Blocking Prerequisites) ✓ COMPLETE

- [X] T006 Implement PDF/text extraction utilities in `tools/ingest/extract.py` (choose library in `research.md`)
- [X] T007 Implement candidate concept extraction in `tools/ingest/concepts.py` (headings, keyphrase, NER)
- [X] T008 Implement page schema validator in `tools/ingest/validator.py` validating `Title`, `Summary`, `Tags`, `Links`, `Content`
- [X] T009 Implement filename generator `tools/ingest/filename.py` that produces unique `YYYYMMDDNN.md` names in `/wiki`
- [X] T010 Implement draft scaffolding in `tools/ingest/draft.py` (Copilot prompt templates + local draft formatting)
- [X] T011 Implement backlink reconciliation in `tools/ingest/backlink.py` (idempotent insert/update of `[[WikiLinks]]`)
- [X] T012 [P] Add unit tests for extraction, concept extraction, and schema validation in `tests/unit/test_extract.py`, `tests/unit/test_concepts.py`, `tests/unit/test_validator.py`
- [X] T013 Create CLI skeleton `tools/ingest/ingest.py` with commands: `add <raw>`, `run`, `index rebuild`

---

## Phase 3: User Story 1 - Ingest (Priority: P1) 🎯 MVP ✓ COMPLETE

**Goal**: Convert `/raw` artifacts into atomic `/wiki` pages with backlinks and links to source files.

- [X] T014 [US1] Implement ingestion pipeline orchestration in `tools/ingest/ingest.py` (invoke `extract.py` → `concepts.py` → `draft.py` → write pages)
- [X] T015 [P] [US1] Implement writing pages to `/wiki` using `tools/ingest/filename.py` (files: `/wiki/YYYYMMDDNN.md`)
- [X] T016 [US1] Implement idempotent update behavior: if a concept already has a page, update it instead of duplicating (use `tools/ingest/backlink.py` and `tools/ingest/validator.py`)
- [X] T017 [US1] Ensure each generated page includes `Links` entry referencing the original `/raw/<filename>` (add check in `tools/ingest/draft.py` and `validator.py`)
- [X] T018 [US1] Implement `Needs Source` note creation for assertions that cannot be grounded in `/raw` (create `wiki/needs-source/` or `wiki/2026XXXXXX_needs-source.md` behavior)
- [ ] T019 [US1] Integration test: place `specs/001-vscode-native-wiki/testdata/sample.pdf` in `/raw`, run `tools/ingest/ingest.py run`, assert 5–10 pages created under `/wiki` and each page's `Links` includes `/raw/sample.pdf` (tests/integration/test_ingest.py)
- [X] T020 [US1] Wire `index rebuild` to update `/wiki/index.md` and `/wiki/glossary.md` after a successful ingest (implement in `tools/ingest/indexer.py`)

---

## Phase 4: User Story 2 - Query (Priority: P1) ✓ COMPLETE

**Goal**: Answer questions using wiki content and archive conversations as `Decision` pages.

- [X] T021 [US2] Implement query handler `tools/query/query.py` that loads relevant `/wiki` pages, forms context, and produces an answer with `Links` to supporting pages
- [X] T022 [US2] Implement decision archive writer `tools/query/archive_decision.py` that writes `/wiki/decisions/YYYYMMDDNN.md` containing the transcript, `Links`, and a `Summary`
- [ ] T023 [US2] Add integration tests: simulate a query, assert returned answer references supporting `/wiki` pages and that a decision page is created (tests/integration/test_query.py)
- [ ] T024 [US2] Add a VS Code task or command configuration (`.vscode/tasks.json` or extension snippet) to run a query and open the generated decision page

---

## Phase 5: User Story 3 - Lint (Priority: P2) ✓ COMPLETE

**Goal**: Periodically lint the wiki and surface orphans and conflicting claims.

- [X] T025 [US3] Implement orphan discovery `tools/lint/orphan_check.py` that lists pages with zero inbound `[[WikiLinks]]` and outputs `reports/orphans-YYYYMMDD.md`
- [X] T026 [US3] Implement claim-diff heuristics in `tools/lint/claim_diff.py` to detect contradictory assertions that cite different `/raw` sources
- [X] T027 [US3] Implement remediation report generator `tools/lint/remediation_report.py` that suggests actions (merge/split/add-source) and can output a patch or PR template
- [ ] T028 [US3] Integration tests for linting: create synthetic pages that trigger orphan and conflict rules and assert detection (tests/integration/test_lint.py)

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T029 [P] Documentation: Write `specs/001-vscode-native-wiki/quickstart.md` with step-by-step ingestion, query, and lint examples
- [ ] T030 [P] VS Code integration: add `.vscode/tasks.json` entries and recommended extensions list in `.vscode/extensions.json` for Foam + Copilot
- [ ] T031 [P] CI: Add `.github/workflows/test.yml` to run unit and integration tests on push/PR
- [ ] T032 [P] UX: Add interactive preview CLI option `ingest.py --preview` to inspect drafts before writing to `/wiki`
- [ ] T033 [ ] Create `specs/001-vscode-native-wiki/tasks.md` acceptance check: validate that each task path exists or has a follow-up task to create it

---

## Dependencies & Execution Order

- Setup tasks (T001–T005) must complete before Foundational tasks (T006–T013).
- Foundational tasks must complete before User Story implementation (T014–T028).
- Polish tasks (T029–T033) can run in parallel after a working MVP.

## Parallel Execution Examples

- While `tools/ingest/extract.py` is implemented (T006), another developer can implement `tools/ingest/concepts.py` (T007) in parallel.
- Linting tasks (T025–T028) can be developed in parallel with Query (T021–T024) after the schema validator (T008) is in place.

## Implementation Strategy

- MVP-first: Complete Setup → Foundational → US1 (Ingest) → validate with integration test → then add Query and Lint.
