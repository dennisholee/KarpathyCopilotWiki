# Tasks: Wiki Ground Truth Toggle

**Input**: Design documents from `/specs/009-wiki-ground-truth/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/ground-truth-mode.md`

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup

**Purpose**: Add the new configuration surface and shared feature scaffolding.

- [X] T001 Add the `wiki.groundTruthMode` setting with `strict` and `flexible` enum values and a default of `strict` in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/package.json`
- [X] T002 Create the `GroundTruthModeSetting`, `AnsweringPolicy`, and `WikiAnswerEnvelope` runtime types in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/models/types.ts`

---

## Phase 2: Foundational

**Purpose**: Establish the shared policy-resolution and prompt infrastructure that all stories depend on.

**⚠️ CRITICAL**: No user story work should start until these tasks are complete.

- [X] T003 Create a ground-truth mode resolver and policy builder in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/query/groundTruthMode.ts`
- [X] T004 [P] Update answer prompt builders to accept strict and flexible policy inputs in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/query/answerPrompt.ts`
- [X] T005 [P] Update structured answer formatting primitives to carry mode metadata in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/query/answerFormatter.ts`

**Checkpoint**: Shared mode infrastructure is ready and user story implementation can begin.

---

## Phase 3: User Story 1 - Restrict Answers To Wiki Ground Truth (Priority: P1) 🎯 MVP

**Goal**: Enable strict wiki-only answering for `@wiki`.

**Independent Test**: Set `wiki.groundTruthMode` to `strict`, ask `@wiki` a wiki-covered question, and verify the response stays grounded in wiki evidence only; then ask an uncovered question and verify it returns an insufficient-support or coverage-gap answer.

- [X] T006 [US1] Read `wiki.groundTruthMode` on each `@wiki` request and derive the strict answering policy in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts`
- [X] T007 [US1] Enforce wiki-only answer assembly and insufficient-support fallback in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/query/queryCommand.ts`
- [X] T008 [US1] Constrain strict-mode remote synthesis to the wiki evidence bundle in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts` and `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/query/answerPrompt.ts`
- [X] T009 [US1] Preserve grounded wiki references and coverage-gap reporting for strict mode in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/query/answerFormatter.ts`
- [X] T010 [US1] Add integration coverage for strict-mode wiki-only answers and insufficient-support fallbacks in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts`

**Checkpoint**: User Story 1 is functional and can be demonstrated as the MVP.

---

## Phase 4: User Story 2 - Allow Flexible Answers In Flexible Mode (Priority: P1)

**Goal**: Keep wiki-first answering while allowing broader supplementation when strict grounding is disabled.

**Independent Test**: Set `wiki.groundTruthMode` to `flexible`, ask `@wiki` a question with partial wiki support, and verify the response still uses wiki evidence while allowing a broader synthesized answer.

- [X] T011 [US2] Apply the flexible answering policy and preserve wiki-first routing in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts`
- [X] T012 [US2] Track when supplemental knowledge is permitted and reflected in the answer envelope in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/query/queryCommand.ts` and `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/models/types.ts`
- [X] T013 [US2] Adjust prompt construction so flexible mode may supplement beyond the wiki while retaining wiki citations in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/query/answerPrompt.ts`
- [X] T014 [US2] Add integration coverage for flexible-mode supplementation while preserving wiki references in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts`

**Checkpoint**: User Stories 1 and 2 both work independently and the mode toggle changes answer scope correctly.

---

## Phase 5: User Story 3 - Show Which Answering Mode Is Active (Priority: P2)

**Goal**: Make the active trust mode explicit in user-visible `@wiki` responses.

**Independent Test**: Toggle `wiki.groundTruthMode` between `strict` and `flexible`, ask `@wiki` a question after each change, and verify the active mode is clearly communicated without restarting the extension.

- [X] T015 [US3] Add a visible strict-versus-flexible mode indicator to streamed `@wiki` answers in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/query/answerFormatter.ts` and `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts`
- [X] T016 [US3] Ensure the active mode is resolved fresh on each new request so setting changes apply immediately in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts` and `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/query/groundTruthMode.ts`
- [X] T017 [US3] Add integration coverage for mode-indicator visibility and next-request toggle behavior in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts`
- [X] T018 [US3] Add unit coverage for ground-truth mode resolution if helper logic is extracted to `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/query/groundTruthMode.test.ts`

**Checkpoint**: All user stories are independently functional and the active answer mode is visible.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final documentation, validation, and regression-proofing across the feature.

- [X] T019 [P] Update the setting descriptions and user-facing help text for ground-truth mode in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/package.json` and `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/009-wiki-ground-truth/contracts/ground-truth-mode.md`
- [X] T020 [P] Validate the strict and flexible flows against `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/009-wiki-ground-truth/quickstart.md` and record any necessary clarifications in `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/009-wiki-ground-truth/quickstart.md`
- [X] T021 Run the extension regression suite and confirm unrelated ingest/index workflows are unaffected using `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts` and `/Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/raw-ingest.test.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories.
- **User Story 1 (Phase 3)**: Starts after Foundational and delivers the MVP.
- **User Story 2 (Phase 4)**: Starts after Foundational; should remain independently testable from User Story 1.
- **User Story 3 (Phase 5)**: Starts after Foundational; depends on the shared mode infrastructure and benefits from completed response-shaping behavior.
- **Polish (Phase 6)**: Starts after the desired user stories are complete.

### User Story Dependencies

- **US1**: No dependency on other user stories.
- **US2**: Depends on foundational policy plumbing only; it should not require US1 implementation to be complete to begin work.
- **US3**: Depends on the existence of the strict/flexible mode behavior but must stay independently verifiable once implemented.

### Within Each User Story

- Resolve mode policy before changing answer generation.
- Update prompt/response shaping before final user-visible messaging.
- Complete the story-specific behavior before running quickstart or regression validation.

### Parallel Opportunities

- T004 and T005 can run in parallel after T003.
- T019 and T020 can run in parallel after all story work is complete.

---

## Parallel Example: Foundational Work

```bash
# After T003 is complete, these can proceed in parallel:
Task: "Update answer prompt builders to accept strict and flexible policy inputs in extension/src/query/answerPrompt.ts"
Task: "Update structured answer formatting primitives to carry mode metadata in extension/src/query/answerFormatter.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate strict wiki-only behavior using the quickstart flow.

### Incremental Delivery

1. Deliver strict mode first as the MVP.
2. Add flexible mode without weakening strict-mode guarantees.
3. Add the user-visible mode indicator and immediate-toggle behavior.
4. Finish with documentation and regression validation.

### Parallel Team Strategy

1. One developer completes Phase 1 and T003.
2. Prompt and formatter work (T004, T005) can proceed in parallel.
3. After foundational completion, separate developers can take US1 and US2 if needed, with US3 following once response behavior is stable.

---

## Notes

- All tasks use exact repository file paths for direct execution.
- The MVP scope is User Story 1 only.
- The feature must remain limited to `@wiki` answering behavior and must not alter ingest or indexing flows.