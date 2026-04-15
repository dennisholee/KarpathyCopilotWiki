# Tasks: Add Model Participant

**Input**: Design documents from `/specs/003-add-model-participant/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Add focused integration and unit tests because the implementation plan commits to integration coverage in `extension/test/integration` and deterministic validation coverage for the modeling pipeline.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated as an increment once its dependencies are complete.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend the existing chat participant surface for the new feature and establish the feature file layout.

- [x] T001 Add the `/model` chat participant command contribution and description in extension/package.json
- [x] T002 Create the modeling module scaffolding and shared exports in extension/src/models/types.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the reusable modeling pipeline primitives required by all user stories.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T003 Define ModelingRequirement, ExistingModelCandidate, ModelProposal, OpenMetadataModelContract, ContractAttribute, and EvidenceReference types in extension/src/models/types.ts
- [x] T004 [P] Implement baseline model candidate retrieval and deterministic ranking in extension/src/modeling/modelMatcher.ts
- [x] T005 [P] Implement proposal compliance validation for OpenMetadata structure and required business fields in extension/src/modeling/contractValidator.ts
- [x] T006 [P] Implement shared proposal section rendering primitives in extension/src/modeling/proposalFormatter.ts
- [x] T007 Wire `/model` command routing and handler scaffolding into extension/src/copilot/wiki-participant.ts

**Checkpoint**: Foundational modeling pipeline is ready; user story work can begin.

---

## Phase 3: User Story 1 - Request A Model Proposal (Priority: P1) 🎯 MVP

**Goal**: Let a user submit a modelling requirement through `/model` and receive a proposal based on the best matching existing model, or a refinement request when no credible match exists.

**Independent Test**: Start the extension, submit `@wiki /model` with a requirement that matches an existing model, and confirm the response identifies a preferred baseline model and returns a grounded proposal. Submit a no-match request and confirm the response asks for refinement without generating a proposal.

### Tests for User Story 1

- [x] T008 [P] [US1] Add integration coverage for baseline selection and no-match refinement in extension/test/integration/copilot.test.ts
- [x] T009 [P] [US1] Add unit coverage for requirement normalization and candidate ranking in extension/test/unit/modeling/modelMatcher.test.ts

- [x] T010 [US1] Implement requirement normalization, requested-change parsing, and no-match refinement gating in extension/src/modeling/modelMatcher.ts
- [x] T011 [US1] Implement baseline model selection rationale and candidate selection output in extension/src/modeling/modelMatcher.ts
- [x] T012 [US1] Integrate `/model` request orchestration and refinement responses in extension/src/copilot/wiki-participant.ts

**Checkpoint**: User Story 1 should now return a grounded baseline proposal or refinement guidance through `/model`.

---

## Phase 4: User Story 2 - Review A Standards-Compliant Contract (Priority: P1)

**Goal**: Return a full resulting OpenMetadata-style contract with a concise change summary and required attribute-level business metadata.

**Independent Test**: Using a selected baseline-model fixture, generate a proposal and confirm the output includes a full resulting contract, a concise change summary, and per-attribute business rules plus validation logic.

### Tests for User Story 2

- [x] T013 [P] [US2] Add unit coverage for contract synthesis in extension/test/unit/modeling/proposalBuilder.test.ts
- [x] T014 [P] [US2] Add unit coverage for compliance validation in extension/test/unit/modeling/contractValidator.test.ts

- [x] T015 [US2] Implement full resulting contract synthesis from the selected baseline model in extension/src/modeling/proposalBuilder.ts
- [x] T016 [P] [US2] Implement field-level compliance checks for attribute name, business rules, and validation logic in extension/src/modeling/contractValidator.ts
- [x] T017 [US2] Implement full contract and concise change-summary rendering in extension/src/modeling/proposalFormatter.ts
- [x] T018 [US2] Integrate contract generation and compliance validation into `/model` responses in extension/src/copilot/wiki-participant.ts

**Checkpoint**: User Story 2 should now return a reviewable full contract payload with explicit change summary and compliance enforcement.

---

## Phase 5: User Story 3 - Understand Why The Proposal Was Made (Priority: P2)

**Goal**: Make the proposal traceable by exposing rationale, supporting wiki evidence, assumptions, and evidence conflicts.

**Independent Test**: Using evidence-rich and conflict-heavy fixtures, generate a proposal and confirm the output includes rationale, cited wiki evidence, assumptions, and explicit conflict disclosure.

### Tests for User Story 3

- [x] T019 [P] [US3] Add unit coverage for evidence, assumptions, and conflict assembly in extension/test/unit/modeling/proposalBuilder.test.ts
- [x] T020 [P] [US3] Add unit coverage for rationale and evidence rendering in extension/test/unit/modeling/proposalFormatter.test.ts

- [x] T021 [US3] Extend proposal assembly with rationale, evidence mapping, and assumption capture in extension/src/modeling/proposalBuilder.ts
- [x] T022 [US3] Render rationale, conflicts, assumptions, and cited wiki evidence sections in extension/src/modeling/proposalFormatter.ts
- [x] T023 [US3] Integrate evidence-backed rationale and conflict disclosure into `/model` handler responses in extension/src/copilot/wiki-participant.ts

**Checkpoint**: User Story 3 should now produce a traceable proposal with explicit evidence and conflict handling.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full feature flow and align documentation with the implemented behavior.

- [x] T024 [P] Update `/model` usage and verification steps in specs/003-add-model-participant/quickstart.md
- [x] T025 Run the documented validation commands for `/model` from specs/003-add-model-participant/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational completion.
- **User Story 2 (Phase 4)**: Depends on Foundational completion and can be developed with baseline-model fixtures while sharing the same modeling pipeline.
- **User Story 3 (Phase 5)**: Depends on Foundational completion and can be developed with evidence fixtures while sharing the same modeling pipeline.
- **Polish (Phase 6)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **US1** is the MVP and establishes the `/model` proposal flow.
- **US2** is independently testable with baseline-model fixtures after the foundational phase, even though it integrates with the same participant response path.
- **US3** is independently testable with evidence fixtures after the foundational phase, even though it integrates with the same participant response path.

### Within Each User Story

- Matching and proposal assembly logic must exist before participant response integration.
- Compliance validation must run before the final proposal is streamed back to the user.
- Rendering changes should be completed before end-to-end validation.

## Parallel Opportunities

- **Phase 2**: T004, T005, and T006 can run in parallel after T003 because they target separate files.
- **Phase 4**: T013, T014, and T016 can run in parallel because test fixtures and validator work are isolated from contract synthesis.
- **Phase 5**: T019, T020, and T022 can run in parallel because fixture-based unit coverage and rendering are isolated from handler integration.
- **Phase 6**: T024 can run in parallel with any final validation prep that does not change quickstart behavior.

## Parallel Example: Foundational Work

```bash
Task: "Implement baseline model candidate retrieval and deterministic ranking in extension/src/modeling/modelMatcher.ts"
Task: "Implement proposal compliance validation for OpenMetadata structure and required business fields in extension/src/modeling/contractValidator.ts"
Task: "Implement shared proposal section rendering primitives in extension/src/modeling/proposalFormatter.ts"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate `/model` baseline matching and refinement behavior
5. Demo the MVP chat flow

### Incremental Delivery

1. Deliver US1 to establish proposal generation.
2. Deliver US2 or US3 next based on team capacity; both are independently implementable after the foundational phase.
3. Complete the remaining story and integrate the shared participant response path.
4. Finish with quickstart validation and documentation alignment.

### Parallel Team Strategy

With multiple contributors:

1. One contributor completes T003 while others prepare for Phase 2 files.
2. After T003, contributors split across T004, T005, and T006 in parallel.
3. After the foundational phase, contributors can split across US1, US2, and US3 using fixtures and shared primitives.

## Notes

- `[P]` tasks touch different files and do not depend on unfinished work in the same phase.
- User story labels preserve traceability from spec to implementation.
- Test tasks are included because the implementation plan commits the feature to integration and deterministic unit coverage.
- `T025` should run the commands documented in quickstart, currently `npm run check-types` and the targeted integration test command from the `extension/` directory.