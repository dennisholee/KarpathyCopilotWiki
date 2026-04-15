# Tasks: OpenMetadata Contract Alignment

**Input**: Design documents from `/specs/006-openmetadata-contract-alignment/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/model-query-participant.md, contracts/openmetadata-model-proposal.yaml, quickstart.md

**Note**: The feature directory is `006-openmetadata-contract-alignment` while the active branch is `007-openmetadata-contract-alignment`; branch numbering reflects creation sequence, and directory numbering reflects the existing feature id.

**Tests**: Focused unit and integration coverage is included because the specification defines measurable success criteria and independent test scenarios for each user story.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Lock the implementation scope and validation targets before changing runtime code.

- [x] T001 Review the aligned contract requirements and story boundaries in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/006-openmetadata-contract-alignment/spec.md
- [x] T002 [P] Review the implementation approach, affected code paths, and validation constraints in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/006-openmetadata-contract-alignment/plan.md
- [x] T003 [P] Review the aligned entities, contract sections, and review corpus in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/006-openmetadata-contract-alignment/data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared aligned contract types, serialization primitives, and validation behavior required by all proposal workflows.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T004 Extend shared modeling types for the aligned proposal contract, target entity, schema entries, resources, incident management, and evidence sections in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/models/types.ts
- [x] T005 [P] Add proposal-builder helpers that transform structured schema entries and operational sections into the aligned contract shape in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts
- [x] T006 [P] Add formatter helpers that render the aligned contract YAML and preserve review sections outside the contract body in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalFormatter.ts
- [x] T007 [P] Replace the current contract validation rules with aligned required-section validation and gap-safe handling in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/contractValidator.ts
- [x] T008 Thread the aligned proposal shape through `/model` orchestration without changing define-intent routing in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts
- [x] T008a [P] Add orchestration and builder fallback handling so derive and enhance requests default to the OpenMetadata-aligned contract shape when no other contract format is explicitly requested in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts
- [x] T008b [P] Add regression coverage confirming ambiguous or non-credible model requests still ask for refinement instead of emitting an aligned contract in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/modelMatcher.test.ts

**Checkpoint**: Foundation ready. Derive and enhance stories can now build on one aligned contract model.

---

## Phase 3: User Story 1 - Generate OpenMetadata-Aligned Contracts (Priority: P1) 🎯 MVP

**Goal**: Return derive-style `/model` proposals in the OpenMetadata-aligned contract shape.

**Independent Test**: Run `@wiki /model generate CDMS's tax model based on the OECD tax model using the OpenMetadata guideline` and verify the response includes the aligned top-level contract sections and grounded schema output.

### Tests for User Story 1

- [x] T009 [P] [US1] Add integration coverage for derive-style aligned proposal responses in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts
- [x] T010 [P] [US1] Add unit coverage for aligned derive proposal construction and schema serialization in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/proposalBuilder.test.ts
- [x] T010a [P] [US1] Add integration coverage for derive-style requests that name no alternate contract format and verify the response still defaults to the OpenMetadata-aligned contract shape in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts
- [x] T010b [P] [US1] Add unit and integration coverage for logical `targetEntity` defaulting and physical asset override behavior in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/proposalBuilder.test.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts

### Implementation for User Story 1

- [x] T011 [US1] Build derive-intent aligned contract payloads with `name`, `displayName`, `description`, `status`, `targetEntity`, `schemaText`, and raw-source-backed proposal evidence references in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts
- [x] T011a [US1] Implement `targetEntity` classification so conceptual or logical evidence defaults to a logical modeled entity and clearly grounded physical evidence switches to a physical asset type in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts
- [x] T012 [US1] Format derive responses so the aligned YAML contract replaces the previous custom proposal shape in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalFormatter.ts
- [x] T013 [US1] Wire derive-intent `/model` requests to the aligned contract flow in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts

**Checkpoint**: User Story 1 should return a reviewable aligned derive contract instead of the legacy proposal shape.

---

## Phase 4: User Story 2 - Enhance Existing Models In The Same Contract Shape (Priority: P1)

**Goal**: Return enhance-style `/model` proposals in the same aligned contract structure while preserving enhancement intent and baseline context.

**Independent Test**: Run `@wiki /model enhance the party model by adding an account number using the OpenMetadata guideline` and verify the response uses the aligned contract shape while preserving the change summary and baseline rationale.

### Tests for User Story 2

- [x] T014 [P] [US2] Add integration coverage for enhance-style aligned proposal responses in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts
- [x] T015 [P] [US2] Add unit coverage for enhancement change-summary and baseline-context preservation in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/proposalFormatter.test.ts

### Implementation for User Story 2

- [x] T016 [US2] Build enhance-intent aligned contract payloads that preserve placement intent, resulting schema output, and raw-source-backed proposal evidence references in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts
- [x] T017 [US2] Format enhancement responses so baseline context and change intent remain reviewable around the aligned contract in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalFormatter.ts
- [x] T018 [US2] Wire enhance-intent `/model` requests to the aligned proposal flow in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts

**Checkpoint**: User Story 2 should return the same aligned contract shape for enhancements without losing enhancement context.

---

## Phase 5: User Story 3 - Preserve Grounding And Explicit Gaps (Priority: P2)

**Goal**: Keep aligned proposals honest about unsupported owner, resource, SLA, and incident details.

**Independent Test**: Run `@wiki /model generate party model` and verify the response leaves unsupported operational sections unresolved or omitted rather than inventing values.

### Tests for User Story 3

- [x] T019 [P] [US3] Add integration coverage for incomplete-evidence aligned proposals in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts
- [x] T019a [P] [US3] Add integration coverage confirming aligned derive and enhance proposal outputs include raw-source traceability for grounded proposal evidence in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts
- [x] T020 [P] [US3] Add unit coverage for unresolved owner, resource, and incident-management handling in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/contractValidator.test.ts

### Implementation for User Story 3

- [x] T021 [US3] Build evidence-gated owner, resource, and incident-management sections with explicit unresolved handling in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts
- [x] T022 [US3] Render assumptions, unresolved gaps, grounded evidence, and raw-source traceability separately from contract values in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalFormatter.ts
- [x] T023 [US3] Enforce no-fabrication validation for aligned operational sections in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/contractValidator.ts

**Checkpoint**: User Story 3 should keep aligned contracts structurally complete without inventing unsupported grounded content.

---

## Phase 6: User Story 4 - Keep Informational Responses Out Of Scope (Priority: P3)

**Goal**: Preserve non-contract definition behavior while derive and enhance flows move to the aligned contract shape.

**Independent Test**: Run `@wiki /model what is cdms` and verify the response remains a grounded summary with no aligned proposal contract.

### Tests for User Story 4

- [x] T024 [P] [US4] Add integration coverage confirming define-intent `/model` responses remain non-contract summaries in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts
- [x] T025 [P] [US4] Add unit coverage confirming aligned proposal formatting is not used for definition responses in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/proposalFormatter.test.ts

### Implementation for User Story 4

- [x] T026 [US4] Preserve define-intent summary routing while aligned proposal changes land for derive and enhance in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts
- [x] T027 [US4] Verify definition-summary builder output remains contract-free and traceable in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts

**Checkpoint**: User Story 4 should confirm definition-only `/model` behavior has not regressed.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finalize docs, focused validation, and review-corpus measurement.

- [x] T028 [P] Update the contract interaction and review expectations documentation in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/006-openmetadata-contract-alignment/contracts/model-query-participant.md
- [x] T029 [P] Update the aligned contract schema reference and behavioral constraints in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/006-openmetadata-contract-alignment/contracts/openmetadata-model-proposal.yaml
- [x] T030 Update the validation commands and representative review checks with final execution notes in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/006-openmetadata-contract-alignment/quickstart.md
- [x] T031 Execute focused `/model` validation with `npm run check-types` and the modeling test suite from /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/006-openmetadata-contract-alignment/quickstart.md, including default-format, raw-source traceability, targetEntity switching, and refinement-regression coverage
- [x] T032 Record the measured outcome for EC-001 through EC-006 and SC-001 through SC-005 in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/006-openmetadata-contract-alignment/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; confirms scope and artifacts.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories because all proposal workflows share the aligned contract types, serialization, formatting, and validation rules.
- **User Story 1 (Phase 3)**: Depends on Foundational; delivers the MVP aligned derive flow.
- **User Story 2 (Phase 4)**: Depends on Foundational and reuses the aligned proposal primitives from US1.
- **User Story 3 (Phase 5)**: Depends on Foundational and strengthens the aligned proposal behavior for incomplete evidence.
- **User Story 4 (Phase 6)**: Depends on Foundational and verifies definition-only behavior remains outside the aligned contract path.
- **Polish (Phase 7)**: Depends on the desired user stories being complete.

### User Story Dependencies

- **US1**: No dependency on other user stories; this is the MVP.
- **US2**: Depends on the aligned proposal foundation but should remain independently testable once implemented.
- **US3**: Depends on the aligned proposal foundation but can be delivered independently of US2.
- **US4**: Depends on the aligned proposal routing changes being in place so non-contract behavior can be regression-tested.

### Within Each User Story

- Tests should be authored before or alongside implementation and fail against the legacy behavior.
- Builder changes should land before formatter and orchestration changes when they share the same response path.
- Validation changes should be in place before final story-level verification.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T005, T006, T007, T008a, and T008b can run in parallel after T004.
- T009, T010, T010a, and T010b can run in parallel for US1.
- T014 and T015 can run in parallel for US2.
- T019, T019a, and T020 can run in parallel for US3.
- T024 and T025 can run in parallel for US4.
- T028 and T029 can run in parallel during polish.

---

## Parallel Example: User Story 1

```bash
Task: "Add integration coverage for derive-style aligned proposal responses in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts"
Task: "Add unit coverage for aligned derive proposal construction and schema serialization in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/proposalBuilder.test.ts"
Task: "Add integration coverage for derive-style requests that name no alternate contract format and verify the response still defaults to the OpenMetadata-aligned contract shape in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Add integration coverage for enhance-style aligned proposal responses in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts"
Task: "Add unit coverage for enhancement change-summary and baseline-context preservation in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/proposalFormatter.test.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Add integration coverage for incomplete-evidence aligned proposals in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts"
Task: "Add unit coverage for unresolved owner, resource, and incident-management handling in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/contractValidator.test.ts"
Task: "Add integration coverage confirming aligned derive and enhance proposal outputs include raw-source traceability for grounded proposal evidence in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate the derive-style aligned contract flow using EC-001.
5. Stop for review before layering enhancement and gap-handling behavior.

### Incremental Delivery

1. Complete Setup + Foundational to establish the aligned contract substrate.
2. Deliver US1 and validate derive output.
3. Deliver US2 and validate enhancement output.
4. Deliver US3 and validate unresolved-gap handling.
5. Deliver US4 and confirm definition behavior remains unchanged.
6. Finish with polish and review-corpus measurement.

### Suggested MVP Scope

- Phase 1
- Phase 2
- Phase 3

---

## Notes

- Every task follows the required checklist format with task ID, optional parallel marker, optional story label, and exact file paths.
- Story phases are independently testable and map directly to the priorities in the specification.
- Final validation is concentrated in the quickstart-defined commands and review corpus.