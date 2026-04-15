# Tasks: Model Query Support

**Input**: Design documents from `/specs/005-model-query-support/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/model-query-participant.md, contracts/openmetadata-model-proposal.yaml, contracts/model-definition-summary.yaml, quickstart.md

**Tests**: Story-level unit and integration coverage is authored alongside implementation tasks. Final validation in Phase 7 executes the focused commands and evaluation corpus documented in quickstart.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align the implementation with the clarified `/model` intents, contracts, and validation flow before code changes begin.

- [x] T001 Review derive, enhance, define, and guideline-selection behavior in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/005-model-query-support/spec.md, /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/005-model-query-support/plan.md, and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/005-model-query-support/contracts/model-query-participant.md
- [x] T002 [P] Confirm the response payload requirements for generated contracts and definition summaries in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/005-model-query-support/contracts/openmetadata-model-proposal.yaml and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/005-model-query-support/contracts/model-definition-summary.yaml
- [x] T003 [P] Review the new entity/state expectations and validation scenarios in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/005-model-query-support/data-model.md and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/005-model-query-support/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared types, intent routing, evidence ranking, and guideline plumbing required by all `/model` workflows.

**⚠️ CRITICAL**: No user story work should begin until this phase is complete.

- [x] T004 Extend shared modeling types for intent classification, guideline resolution, baseline selection, placement decisions, derived proposals, and definition summaries in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/models/types.ts
- [x] T005 [P] Implement deterministic `/model` intent classification and target extraction primitives in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/modelMatcher.ts
- [x] T006 [P] Add domain-specific candidate scoring that demotes glossary/index pages and favors concrete model pages in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/modelMatcher.ts
- [x] T007 [P] Add guideline detection and OpenMetadata fallback resolution helpers in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/models/types.ts
- [x] T008 Thread the new intent and guideline branches through `/model` command handling in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts
- [x] T008a Implement unresolved-target and ambiguous-scope handling so `/model` rejects or asks for refinement when no credible model or relationship scope can be resolved in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/modelMatcher.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts
- [x] T008b [P] Add unit and integration coverage for refinement-required `/model` requests in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/modelMatcher.test.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts

**Checkpoint**: Foundation ready. User stories can now proceed in priority order or in parallel if staffed.

---

## Phase 3: User Story 1 - Generate A New Derived Model (Priority: P1) 🎯 MVP

**Goal**: Derive a new model from grounded wiki evidence and named guidelines when no existing baseline model already exists.

**Independent Test**: Run `@wiki /model generate the cdms tax model based on the cdms architecture, open metadata guideline and the oecd guideline` and verify the response produces a derived model contract, cites the architecture and guideline evidence, and does not fall back to `Wiki Index` or `Glossary` as the primary baseline.

- [x] T009 [US1] Implement derived-model evidence synthesis for requests that have no credible baseline model in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts
- [x] T009a [P] [US1] Add integration coverage for derived-model requests in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts
- [x] T009b [P] [US1] Add unit coverage for derived-model synthesis and no-baseline proposal behavior in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/proposalBuilder.test.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/contractValidator.test.ts
- [x] T010 [P] [US1] Extend proposal formatting to render `Derived Model Context`, guideline application details, and derived-model change summaries in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalFormatter.ts
- [x] T011 [US1] Update contract validation rules to accept derived-model proposals without a baseline source model while preserving evidence and field-level compliance checks in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/contractValidator.ts
- [x] T012 [US1] Route derive-intent `/model` requests through the participant orchestration and derived-proposal builder in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts

**Checkpoint**: User Story 1 should derive a new grounded contract without forcing a pre-existing baseline model.

---

## Phase 4: User Story 2 - Enhance An Existing Model (Priority: P1)

**Goal**: Find an existing model, cross-check evidence for the requested addition, and identify the best insertion point for the enhancement.

**Independent Test**: Run `@wiki /model enhance the party model by adding an account number` and verify the response finds the party model baseline, cites evidence for account number, identifies the most suitable placement, and returns a full resulting contract plus change summary.

- [x] T013 [US2] Refine baseline selection to resolve enhancement requests to the strongest model page and preserve alternative candidates for explanation in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/modelMatcher.ts
- [x] T013a [P] [US2] Add unit coverage for enhancement baseline selection and placement decisions in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/modelMatcher.test.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/proposalBuilder.test.ts
- [x] T013b [P] [US2] Add integration coverage for enhancement requests in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts
- [x] T014 [P] [US2] Implement evidence-backed placement decision generation for enhancement attributes and sections in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts
- [x] T015 [P] [US2] Render placement decisions and enhancement-specific rationale in the markdown response format in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalFormatter.ts
- [x] T016 [US2] Route enhance-intent `/model` requests through the updated baseline-selection and placement workflow in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts

**Checkpoint**: User Story 2 should enhance a grounded baseline model with a specific, evidence-backed insertion point.

---

## Phase 5: User Story 3 - Retrieve A Model Definition (Priority: P2)

**Goal**: Return grounded model-definition summaries for informational `/model` questions without generating a contract.

**Independent Test**: Run `@wiki /model what is the relationship model` and verify the response returns a grounded summary with key entities or relationships and cited evidence, with no contract payload in the output.

- [x] T017 [US3] Implement definition-summary synthesis from grounded evidence bundles, reusing domain-specific evidence ranking and glossary/index demotion rules and preserving raw-source traceability for cited evidence, in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/models/types.ts
- [x] T017a [P] [US3] Add unit coverage for definition-summary synthesis and contract suppression in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/proposalBuilder.test.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/proposalFormatter.test.ts
- [x] T017b [P] [US3] Add integration coverage for definition-style `/model` requests in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts
- [x] T017c [P] [US3] Add glossary/index regression coverage for definition-style requests so domain-specific pages win over aggregation pages in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/modelMatcher.test.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts
- [x] T018 [P] [US3] Extend response formatting to support `Model Definition`, `Key Entities / Relationships`, and explicit raw-source traceability for definition evidence without contract rendering in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalFormatter.ts
- [x] T019 [US3] Route define-intent `/model` requests through the definition-summary path and suppress contract generation in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts

**Checkpoint**: User Story 3 should answer informational model questions with grounded summaries only.

---

## Phase 6: User Story 4 - Apply The Correct Contract Guideline (Priority: P2)

**Goal**: Follow user-named guidelines when present and otherwise default the contract shape to OpenMetadata.

**Independent Test**: Compare a `/model` request that names the OpenMetadata and OECD guidelines with one that names none, and verify the response explains guideline usage in the first case and uses the default OpenMetadata contract structure in the second.

- [x] T020 [US4] Resolve named guideline pages from grounded wiki evidence and map them to applied contract sections in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/modelMatcher.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts
- [x] T020a [P] [US4] Add unit coverage for guideline resolution and OpenMetadata fallback behavior in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/modelMatcher.test.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/proposalBuilder.test.ts
- [x] T020b [P] [US4] Add integration coverage for named-guideline and fallback requests in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts
- [x] T021 [P] [US4] Populate guideline sources and fallback sections in generated contract payloads in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/models/types.ts
- [x] T022 [P] [US4] Render guideline precedence and fallback explanations in the chat response format in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalFormatter.ts
- [x] T023 [US4] Enforce guideline-default behavior in participant orchestration for derive and enhance requests in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/copilot/wiki-participant.ts

**Checkpoint**: User Story 4 should make guideline precedence explicit and default cleanly to OpenMetadata when needed.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finalize regression coverage, documentation alignment, and end-to-end validation.

- [x] T024 [P] Update modeling helper documentation and response contracts for final behavior, including raw-source traceability expectations for definition responses, in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/005-model-query-support/quickstart.md and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/005-model-query-support/contracts/model-query-participant.md
- [x] T024a Define a representative `/model` evaluation corpus with expected outcomes for derive, enhance, define, and guideline-fallback scenarios in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/005-model-query-support/quickstart.md
- [x] T024b Record measurable pass/fail criteria for SC-001 through SC-005 against the evaluation corpus in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/005-model-query-support/quickstart.md and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/005-model-query-support/tasks.md
- [x] T025 Execute derive, enhance, define, guideline-fallback, and refinement-required integration scenarios using /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/integration/copilot.test.ts and the commands documented in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/005-model-query-support/quickstart.md
- [x] T026 Execute focused unit validation for matcher, builder, formatter, and validator behavior via /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/modelMatcher.test.ts, /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/proposalBuilder.test.ts, /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/proposalFormatter.test.ts, /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/test/unit/modeling/contractValidator.test.ts, and `npm run check-types`
- [x] T027 Execute the representative `/model` evaluation corpus, score outcomes against SC-001 through SC-005, and record the measured pass/fail results in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/specs/005-model-query-support/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; establishes the implementation and validation baseline.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories because intent routing, evidence ranking, and guideline plumbing are shared primitives.
- **User Story 1 (Phase 3)**: Depends on Foundational; delivers the MVP derived-model workflow.
- **User Story 2 (Phase 4)**: Depends on Foundational and benefits from the candidate-ranking work completed for User Story 1.
- **User Story 3 (Phase 5)**: Depends on Foundational and can proceed once intent routing supports a non-contract response path.
- **User Story 4 (Phase 6)**: Depends on Foundational and integrates with the derive/enhance proposal flows.
- **Polish (Phase 7)**: Depends on completion of the desired user stories.

### User Story Dependencies

- **US1**: No dependency on other user stories; this is the MVP.
- **US2**: Depends on the same ranking and proposal plumbing as US1 but remains independently testable once implemented.
- **US3**: Depends on intent classification and response formatting primitives from Phase 2, but not on contract-generation success.
- **US4**: Depends on derive/enhance contract generation paths being present so guideline resolution can influence them.

### Within Each User Story

- Matching/routing primitives before builder changes.
- Builder changes before formatter changes.
- Formatter changes before participant wiring and end-to-end validation.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T005, T006, and T007 can run in parallel once T004 defines the shared types.
- T008b can run after T008a defines the refinement-required behavior.
- T010 can run in parallel with T011 after T009 establishes the derived-proposal shape.
- T014 and T015 can run in parallel once T013 locks the enhancement baseline behavior.
- T018 can run in parallel with T017 after the definition response entity shape is defined.
- T021 and T022 can run in parallel once T020 resolves guideline sources and fallback sections.
- T024 can run in parallel with final validation preparation.
- T027 runs after T024a, T024b, T025, and T026.

---

## Parallel Example: User Story 1

```bash
Task: "Implement derived-model evidence synthesis for requests that have no credible baseline model in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts"
Task: "Extend proposal formatting to render Derived Model Context, guideline application details, and derived-model change summaries in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalFormatter.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Implement evidence-backed placement decision generation for enhancement attributes and sections in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts"
Task: "Render placement decisions and enhancement-specific rationale in the markdown response format in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalFormatter.ts"
```

## Parallel Example: User Story 4

```bash
Task: "Populate guideline sources and fallback sections in generated contract payloads in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalBuilder.ts and /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/models/types.ts"
Task: "Render guideline precedence and fallback explanations in the chat response format in /Users/dennislee/Devs/HSBC/KarpathyCopilotWiki/extension/src/modeling/proposalFormatter.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate the derived-model workflow using the CDMS tax model example.
5. Stop for review before layering enhancement, definition, and guideline refinements.

### Incremental Delivery

1. Deliver Setup + Foundational as the shared `/model` substrate.
2. Deliver US1 to unlock grounded derived-model generation.
3. Deliver US2 to support evidence-backed enhancement placement.
4. Deliver US3 to support informational definition queries without contract generation.
5. Deliver US4 to finalize guideline precedence and OpenMetadata fallback.
6. Finish with polish and focused validation.

### Suggested MVP Scope

- Phase 1
- Phase 2
- Phase 3

---

## Notes

- All tasks use the required checklist format with task ID, optional parallel marker, optional story label, and exact file paths.
- Story-level test-authoring tasks are included where deterministic unit or integration coverage is required.
- Final validation still runs through the focused commands and evaluation corpus documented in quickstart.