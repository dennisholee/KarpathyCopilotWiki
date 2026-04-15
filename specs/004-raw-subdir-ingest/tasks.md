# Tasks: Grouped Raw Ingest

**Input**: Design documents from `/specs/004-raw-subdir-ingest/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/grouped-ingest.md, quickstart.md

**Tests**: No standalone test-first tasks are included because the specification does not require a TDD workflow. Validation is covered in polish tasks using the documented integration commands.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align implementation entry points and feature documentation before code changes begin.

- [ ] T001 Review grouped-ingest behavior and command expectations in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/004-raw-subdir-ingest/plan.md and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/004-raw-subdir-ingest/contracts/grouped-ingest.md
- [ ] T002 [P] Confirm local validation steps and sample raw tree coverage in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/004-raw-subdir-ingest/quickstart.md and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/004-raw-subdir-ingest/data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared path, metadata, and orchestration primitives required by all stories.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [ ] T003 Implement raw-relative-path normalization, safe nested-path resolution, and ambiguity detection primitives in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/wiki/wiki-manager.ts
- [ ] T004 [P] Thread grouped-ingest source and group metadata through orchestrator options in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/ingest/ingestCommand.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/models/types.ts
- [ ] T005 [P] Preserve grouped source metadata and constitution-required wiki page fields (`Title`, `Summary`, `Tags`, `Links`, `Content`) when reading and writing markdown frontmatter in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/utils/markdown-parser.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/wiki/wiki-manager.ts

**Checkpoint**: Foundation ready. User stories can now proceed in priority order or in parallel if staffed.

---

## Phase 3: User Story 1 - Ingest grouped raw content (Priority: P1) 🎯 MVP

**Goal**: Allow one ingest run to recursively process nested raw folders while preserving raw-relative-path identity and targeted nested-file ingest.

**Independent Test**: Place supported files in multiple nested raw subdirectories, run `@wiki /ingest`, and verify the resulting wiki pages preserve source path and grouping metadata. Then run `@wiki /ingest banking/risk/customer.csv` and verify the targeted nested file resolves safely. Finally, create two nested files with the same basename in different folders and verify a basename-only target is rejected as ambiguous.

- [ ] T006 [US1] Implement recursive raw file discovery with per-file group metadata in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/wiki/wiki-manager.ts
- [ ] T007 [US1] Preserve raw-relative-path identity when creating or updating wiki pages in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/wiki/wiki-manager.ts
- [ ] T008 [P] [US1] Update nested-file ingest command handling and user help text in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts
- [ ] T008a [US1] Reject ambiguous basename-only nested-file targets and return guidance to use the raw-relative path in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/wiki/wiki-manager.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts

**Checkpoint**: User Story 1 should support recursive ingest and safe targeted nested-file ingest without flattening `/raw`.

---

## Phase 4: User Story 2 - Analyze within folder context (Priority: P2)

**Goal**: Enrich generated wiki content with same-folder context while keeping unrelated folders isolated.

**Independent Test**: Put related files in one folder and unrelated files in another, run ingest, and verify wiki output includes only same-folder context and sibling source references.

- [ ] T009 [US2] Build folder-group source maps and same-group context assembly in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/wiki/wiki-manager.ts
- [ ] T010 [P] [US2] Render folder grouping and related raw sources in generated content in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/ingest/draftGenerator.ts
- [ ] T011 [US2] Preserve group-aware source references across draft generation and page updates in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/ingest/ingestCommand.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/wiki/wiki-manager.ts

**Checkpoint**: User Story 2 should produce group-aware wiki content without leaking unrelated folder context.

---

## Phase 5: User Story 3 - Support common source formats (Priority: P3)

**Goal**: Support csv, markdown, pdf, and plain text sources through the same grouped-ingest workflow.

**Independent Test**: Place at least one `.csv`, `.md`, `.pdf`, and `.txt` file in nested raw folders, run ingest, and confirm each file is discovered and processed while one unreadable file does not stop the run.

- [ ] T012 [US3] Extend supported-format routing and csv extraction in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/ingest/extractor.ts
- [ ] T013 [P] [US3] Update grouped-ingest command messaging for supported nested formats in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts
- [ ] T014 [US3] Implement per-file failure handling for mixed-format ingest runs in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/wiki/wiki-manager.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/ingest/extractor.ts
- [ ] T014a [US3] Surface per-file ingest failures with raw-relative paths and concise reasons in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/wiki/wiki-manager.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts

**Checkpoint**: All supported file formats should ingest through the same workflow, and a single file failure should not halt the run.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize regression coverage, operator guidance, and end-to-end validation.

- [ ] T015 [P] Document final grouped-ingest usage and validation guidance in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/004-raw-subdir-ingest/quickstart.md and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/004-raw-subdir-ingest/contracts/grouped-ingest.md
- [ ] T016 Run grouped-ingest validation scenarios from /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/004-raw-subdir-ingest/quickstart.md against /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/raw-ingest.test.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/services.test.ts
- [ ] T016a Validate ambiguous basename targeting and empty or unsupported-only folders in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/raw-ingest.test.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; establishes the implementation and validation baseline.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories because path normalization and metadata plumbing are shared primitives.
- **User Story 1 (Phase 3)**: Depends on Foundational; delivers the MVP recursive-ingest behavior.
- **User Story 2 (Phase 4)**: Depends on Foundational and builds on the recursive discovery primitives from User Story 1.
- **User Story 3 (Phase 5)**: Depends on Foundational and can proceed after or alongside User Story 2 once core discovery/path handling is stable.
- **Polish (Phase 6)**: Depends on completion of the desired user stories.

### User Story Dependencies

- **US1**: No dependency on other user stories; this is the MVP.
- **US2**: Depends on US1 path and discovery behavior being in place, but remains independently testable once implemented.
- **US3**: Depends on foundational ingest plumbing and benefits from US1 discovery behavior; it remains independently testable with mixed-format fixtures.

### Within Each User Story

- Shared data/path helpers before content generation.
- Content generation before command/reporting polish.
- Story validation after implementation tasks complete.

### Parallel Opportunities

- T002 can run with T001.
- T004 and T005 can run in parallel once T003 establishes the shared path-safety and ambiguity contract.
- T008 can run in parallel with T006/T007 after foundational helpers exist.
- T010 can run in parallel with T009 once group metadata is available.
- T013 can run in parallel with T012 after supported-format decisions are fixed.
- T015 can run in parallel with final validation preparation.

---

## Parallel Example: User Story 1

```bash
Task: "Implement recursive raw file discovery with per-file group metadata in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/wiki/wiki-manager.ts"
Task: "Update nested-file ingest command handling and user help text in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Build folder-group source maps and same-group context assembly in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/wiki/wiki-manager.ts"
Task: "Render folder grouping and related raw sources in generated content in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/ingest/draftGenerator.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Extend supported-format routing and csv extraction in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/ingest/extractor.ts"
Task: "Update grouped-ingest command messaging for supported nested formats in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate recursive full-tree ingest and targeted nested-file ingest.
5. Stop for review before adding context enrichment and extra format hardening.

### Incremental Delivery

1. Deliver Setup + Foundational as the shared ingest substrate.
2. Deliver US1 to unlock recursive grouped ingest.
3. Deliver US2 to enrich wiki output with same-folder context.
4. Deliver US3 to finish supported-format breadth and failure isolation.
5. Finish with polish and regression validation.

### Suggested MVP Scope

- Phase 1
- Phase 2
- Phase 3

---

## Notes

- All tasks use the required checklist format with task ID, optional parallel marker, optional story label, and exact file paths.
- No dedicated test-first tasks are included because the spec does not request TDD.
- Validation is still required through the integration commands documented in quickstart.