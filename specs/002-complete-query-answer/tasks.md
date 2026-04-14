# Tasks: Complete Query Answer

**Input**: Design documents from `/specs/002-complete-query-answer/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/chat-answer-contract.md`, `quickstart.md`

**Tests**: Integration and validation tasks are included where needed to support the plan commitments and measurable success criteria. They are not required to be written first.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated as an independently useful increment.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the existing extension entry points for the answer-first query flow

- [x] T001 Update chat participant command wording for answer-first behavior in `extension/package.json`
- [x] T002 [P] Create grounded prompt assembly helper in `extension/src/query/answerPrompt.ts`
- [x] T003 [P] Add explicit remote-synthesis enablement setting and user-facing description in `extension/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared answer and evidence plumbing required by all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create structured answer and evidence interfaces in `extension/src/models/types.ts`
- [x] T005 [P] Extend query result plumbing to carry evidence bundles and coverage assessments in `extension/src/query/queryCommand.ts`
- [x] T006 [P] Add supporting page and source extraction helpers in `extension/src/wiki/wiki-manager.ts`
- [x] T007 Add remote-synthesis opt-in checks and disclosure logging hooks in `extension/src/extension.ts` and `extension/src/copilot/wiki-participant.ts`
- [x] T008 Create a representative query validation matrix in `specs/002-complete-query-answer/quickstart.md`

**Checkpoint**: Shared answer model, retrieval evidence plumbing, and participant wiring are ready

---

## Phase 3: User Story 1 - Direct Answer Delivery (Priority: P1) 🎯 MVP

**Goal**: Return a direct, complete answer instead of a ranked snippet list

**Independent Test**: Ask a question with known wiki coverage and verify the chat response contains a direct answer, key details, and supporting references without requiring the user to open additional pages.

### Implementation for User Story 1

- [x] T009 [US1] Refactor evidence selection into answer-ready grounded facts in `extension/src/query/queryCommand.ts`
- [x] T010 [P] [US1] Implement structured markdown answer rendering in `extension/src/query/answerFormatter.ts`
- [x] T011 [US1] Invoke the VS Code chat model and stream `Direct Answer`, `Key Details`, and `Supporting References` in `extension/src/copilot/wiki-participant.ts`
- [x] T012 [US1] Remove the legacy snippet-list response path from `extension/src/query/queryCommand.ts` and `extension/src/copilot/wiki-participant.ts`
- [x] T013 [US1] Add integration coverage for direct-answer and multi-page synthesis behavior in `extension/test/integration/copilot.test.ts`

**Checkpoint**: User Story 1 produces answer-first responses for supported questions

---

## Phase 4: User Story 2 - Evidence-Based Response (Priority: P1)

**Goal**: Surface supporting pages, source references, and conflicts in a trustworthy answer package

**Independent Test**: Ask a question with traceable support and another with conflicting evidence; verify the response shows supporting pages, source references when available, and a visible conflict summary when sources disagree.

### Implementation for User Story 2

- [x] T014 [US2] Extend evidence packaging to collect supporting source references and conflict candidates in `extension/src/query/queryCommand.ts`
- [x] T015 [P] [US2] Add conflict and reference section rendering in `extension/src/query/answerFormatter.ts`
- [x] T016 [US2] Render `Supporting References` and `Conflicts` sections from structured answer packages in `extension/src/copilot/wiki-participant.ts`
- [x] T017 [US2] Archive structured answer bodies and the same visible references in `extension/src/query/decisionArchiver.ts`
- [x] T018 [US2] Add integration coverage for references, conflict disclosure, and archival parity in `extension/test/integration/copilot.test.ts`

**Checkpoint**: User Story 2 adds grounded traceability and explicit conflict handling without breaking direct answers

---

## Phase 5: User Story 3 - Graceful Handling Of Gaps (Priority: P2)

**Goal**: Return best-available answers with explicit gaps and one-turn follow-up behavior when evidence is partial or missing

**Independent Test**: Ask a partially covered question and a follow-up question; verify the first response marks missing coverage and suggests a next step, and the follow-up uses only the immediately previous wiki turn.

### Implementation for User Story 3

- [x] T019 [US3] Implement partial, conflicted, and insufficient coverage assessments in `extension/src/query/queryCommand.ts`
- [x] T020 [US3] Render `Coverage Gaps` and useful follow-up suggestions in `extension/src/copilot/wiki-participant.ts`
- [x] T021 [US3] Limit follow-up interpretation to the immediately previous wiki query/answer pair in `extension/src/copilot/wiki-participant.ts`
- [x] T022 [US3] Add integration coverage for partial answers, insufficient evidence, and one-turn follow-up behavior in `extension/test/integration/copilot.test.ts`

**Checkpoint**: User Story 3 handles partial coverage and follow-up scope deterministically

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final alignment, documentation, and end-to-end validation across all stories

- [x] T023 [P] Refresh implementation-facing guidance in `specs/002-complete-query-answer/quickstart.md` and `specs/002-complete-query-answer/contracts/chat-answer-contract.md`
- [x] T024 Add a reviewer checklist for SC-005 first-pass understanding evaluation in `specs/002-complete-query-answer/quickstart.md`
- [x] T025 Run the representative validation flow from `specs/002-complete-query-answer/quickstart.md` and capture final command, disclosure, or messaging adjustments in `extension/package.json` and `extension/src/copilot/wiki-participant.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1: Setup**: Can start immediately
- **Phase 2: Foundational**: Depends on Phase 1 and blocks all user story work
- **Phase 3: User Story 1**: Depends on Phase 2
- **Phase 4: User Story 2**: Depends on Phase 2 and builds cleanly on the structured answer flow established in User Story 1
- **Phase 5: User Story 3**: Depends on Phase 2 and should follow the answer package behavior from User Stories 1 and 2
- **Phase 6: Polish**: Depends on completion of the desired user stories

### User Story Dependencies

- **US1**: First delivery slice and MVP
- **US2**: Extends the answer package with trust and traceability behavior after US1 establishes the answer-first response
- **US3**: Extends the same answer package with gap handling and one-turn follow-up behavior

### Within Each User Story

- Shared query/evidence plumbing before participant rendering
- Query packaging before archival updates
- Response rendering before quickstart validation

### Parallel Opportunities

- `T002` and `T003` can run in parallel with `T001`
- `T005` and `T006` can run in parallel after `T004`
- `T010` can run in parallel with `T009`
- `T015` and `T017` can run in parallel after `T014`
- `T023` and `T024` can run in parallel with final validation preparation

---

## Parallel Example: User Story 1

```bash
Task: "Refactor evidence selection into answer-ready grounded facts in extension/src/query/queryCommand.ts"
Task: "Implement structured markdown answer rendering in extension/src/query/answerFormatter.ts"
Task: "Add integration coverage for direct-answer and multi-page synthesis behavior in extension/test/integration/copilot.test.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Add conflict and reference section rendering in extension/src/query/answerFormatter.ts"
Task: "Archive structured answer bodies and the same visible references in extension/src/query/decisionArchiver.ts"
Task: "Add integration coverage for references, conflict disclosure, and archival parity in extension/test/integration/copilot.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate the direct-answer flow from `specs/002-complete-query-answer/quickstart.md`

### Incremental Delivery

1. Deliver US1 to replace snippet-list output with answer-first responses
2. Add US2 to make answers trustworthy with references and conflict disclosure
3. Add US3 to handle partial coverage and one-turn follow-ups without regressing grounded answers

### Parallel Team Strategy

1. One developer completes Phase 1 and Phase 2 shared plumbing
2. After foundation is stable:
   - Developer A: US1 answer delivery
   - Developer B: US2 references and archival
   - Developer C: US3 gaps and follow-up scope

---

## Notes

- `[P]` tasks target different files and can be worked concurrently
- `[US1]`, `[US2]`, and `[US3]` map directly to the clarified feature spec
- The suggested MVP scope is **User Story 1**
- Final validation is driven by `specs/002-complete-query-answer/quickstart.md`