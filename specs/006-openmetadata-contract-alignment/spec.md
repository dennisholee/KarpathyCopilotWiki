# Feature Specification: OpenMetadata Contract Alignment

**Feature Branch**: `[007-openmetadata-contract-alignment]`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: User description: "the `@wiki /model` proposed contract output should be aligned to OpenMetadata data contract specification. The following is a sample yaml contract: ..."

## Clarifications

### Session 2026-04-16

- Q: For OpenMetadata-aligned `/model` proposals, how should `targetEntity` behave when the evidence describes a logical model rather than a physical table? → A: Default to a logical modeled entity, and use `table` or another physical asset type only when the evidence clearly supports a physical asset.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate OpenMetadata-Aligned Contracts (Priority: P1)

When a user asks `@wiki /model` to generate a new model proposal, the returned proposal uses the OpenMetadata data contract structure so the result is reviewable and consistent with the organization’s target contract standard.

**Why this priority**: This is the primary user-facing behavior change. Without it, generated proposals remain structurally inconsistent with the required contract format.

**Independent Test**: Can be fully tested by issuing a derive-style `/model` request and verifying the returned proposal includes the required OpenMetadata-aligned sections and contract fields.

**Acceptance Scenarios**:

1. **Given** a user requests a new model proposal, **When** `@wiki /model` returns a generated contract, **Then** the proposal is structured as an OpenMetadata-aligned data contract rather than the previous custom proposal shape.
2. **Given** grounded evidence is available for the requested model, **When** the proposal is returned, **Then** the contract includes the governed target entity, schema definition, and evidence-backed operational sections in the aligned format.

---

### User Story 2 - Enhance Existing Models In The Same Contract Shape (Priority: P1)

When a user asks `@wiki /model` to enhance an existing model, the returned proposal uses the same OpenMetadata-aligned contract structure as derive requests so enhancement reviews follow one consistent format.

**Why this priority**: Enhancement is a core `/model` workflow, and misalignment between derive and enhance outputs would make the feature incomplete.

**Independent Test**: Can be fully tested by issuing an enhancement-style `/model` request and verifying the resulting proposal uses the same aligned contract structure while preserving the requested change summary and evidence.

**Acceptance Scenarios**:

1. **Given** a user requests an enhancement to an existing model, **When** `@wiki /model` returns the proposal, **Then** the response uses the OpenMetadata-aligned contract structure.
2. **Given** the enhancement identifies a baseline model and placement decision, **When** the aligned contract is returned, **Then** the proposal still preserves the baseline, rationale, and change intent in a reviewable form.

---

### User Story 3 - Preserve Grounding And Explicit Gaps (Priority: P2)

When evidence is incomplete, the proposal still follows the OpenMetadata contract shape while clearly separating grounded values from assumptions, gaps, or omitted sections.

**Why this priority**: Alignment to the target contract format is only useful if the system remains honest about what is known versus inferred.

**Independent Test**: Can be fully tested by issuing a `/model` request with incomplete evidence and verifying the returned contract keeps the aligned shape while marking missing or assumed content explicitly.

**Acceptance Scenarios**:

1. **Given** some contract sections cannot be grounded from the wiki, **When** the proposal is generated, **Then** the response omits unsupported concrete values or marks them as assumptions instead of fabricating them.
2. **Given** the proposal includes quality, SLA, or incident details, **When** supporting evidence is partial, **Then** the contract shows what is grounded and what remains unresolved.

---

### User Story 4 - Keep Informational Responses Out Of Scope (Priority: P3)

When a user asks a definition-style `/model` question, the system continues to return a grounded explanation instead of forcing the OpenMetadata contract structure onto non-proposal responses.

**Why this priority**: This bounds the feature so the new contract alignment changes proposal outputs only and does not regress informational behavior.

**Independent Test**: Can be fully tested by issuing a definition-style `/model` request and verifying the response remains a grounded summary rather than a contract.

**Acceptance Scenarios**:

1. **Given** a user asks what a model is, **When** `@wiki /model` responds, **Then** the system returns a grounded definition summary and does not emit the OpenMetadata contract structure.

### Edge Cases

- If a derive or enhance request has enough evidence for schema structure but not enough for ownership, quality assertions, or incident handling, the proposal keeps the aligned contract shape and explicitly marks those sections as unresolved or assumed.
- If a named guideline conflicts with the OpenMetadata-aligned contract structure, the response preserves the OpenMetadata output shape while explaining how the named guidance influenced the content.
- If the request cannot be resolved to a credible model scope, the system asks for refinement rather than emitting a partially aligned but unsupported contract.
- If a proposal has no grounded data-quality or SLA evidence, the aligned contract does not invent test cases or service levels.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST align all derive-style `@wiki /model` proposal outputs to the OpenMetadata data contract specification.
- **FR-002**: System MUST align all enhance-style `@wiki /model` proposal outputs to the same OpenMetadata data contract specification.
- **FR-003**: System MUST structure aligned proposal outputs around the OpenMetadata contract concepts of contract identity, owner, target entity, schema definition, resource definitions, and incident management.
- **FR-004**: System MUST preserve grounded evidence and rationale alongside the aligned contract output so reviewers can trace why the proposal was generated.
- **FR-005**: System MUST preserve explicit change intent for enhancement proposals, even when the contract output is reformatted to the OpenMetadata-aligned structure.
- **FR-006**: System MUST preserve explicit derivation context for newly generated models, even when the contract output is reformatted to the OpenMetadata-aligned structure.
- **FR-007**: System MUST default proposal output to the OpenMetadata-aligned contract shape when no other user-provided contract format is explicitly requested.
- **FR-008**: System MUST represent schema content in a way that is compatible with the OpenMetadata-style contract structure, including required fields, data types, and validation constraints when grounded evidence exists.
- **FR-008a**: System MUST default `targetEntity` to a logical modeled entity when the evidence describes a conceptual or logical model rather than a physical data asset.
- **FR-008b**: System MUST use `table` or another physical asset type in `targetEntity` only when the request or grounded evidence clearly supports a physical asset interpretation.
- **FR-009**: System MUST represent data quality expectations and service-level expectations in OpenMetadata-aligned resource sections when grounded evidence exists.
- **FR-010**: System MUST represent incident-management behavior in the aligned contract output when grounded evidence exists or mark that section as unresolved when it does not.
- **FR-011**: System MUST NOT fabricate owner, schema, quality, SLA, or incident details when the wiki evidence is insufficient.
- **FR-012**: System MUST surface assumptions, evidence gaps, and unresolved conflicts separately from grounded contract values.
- **FR-013**: System MUST continue returning non-contract definition summaries for informational `/model` requests.
- **FR-014**: System MUST keep raw-source traceability for grounded proposal content in the aligned output or its accompanying evidence section.
- **FR-015**: System MUST produce proposal output that can be compared directly against the organization’s sample OpenMetadata YAML contract shape during review.

### Key Entities *(include if feature involves data)*

- **OpenMetadata Proposal Contract**: The generated or enhanced contract returned by `/model`, aligned to the target OpenMetadata data contract structure.
- **Target Entity**: The governed business asset described by the proposal, such as a table or equivalent modeled entity.
- **Schema Definition**: The contract section that describes governed fields, required status, types, and validation constraints.
- **Contract Resources**: Quality and service-level definitions associated with the proposal when grounded evidence supports them.
- **Incident Management Definition**: The contract section that records monitoring and escalation behavior when supported by evidence.
- **Evidence Bundle**: The set of grounded wiki and raw-source references that justify the aligned proposal content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of measured derive-style `/model` proposal responses include the required OpenMetadata-aligned top-level contract sections.
- **SC-002**: 100% of measured enhance-style `/model` proposal responses use the same OpenMetadata-aligned contract structure as derive responses.
- **SC-003**: 100% of measured aligned proposals preserve grounded evidence references and explicit rationale for the returned contract.
- **SC-004**: 100% of measured proposals with incomplete evidence explicitly mark assumptions or omissions instead of inventing unsupported contract values.
- **SC-005**: 100% of measured definition-style `/model` responses remain non-contract summaries and are not reformatted into the OpenMetadata proposal structure.

## Assumptions

- The OpenMetadata sample YAML provided by the user is the target structural reference for proposal output alignment.
- This feature changes proposal-style `/model` responses only; informational definition responses remain outside the aligned contract format.
- Existing grounded evidence, baseline selection, and refinement behavior remain in place unless needed to support the aligned contract shape.
- When model evidence is conceptual or logical rather than physical, `targetEntity` defaults to a logical modeled entity instead of assuming a table.
- Reviewers need output that is structurally comparable to a real OpenMetadata data contract even when some sections are only partially grounded.
- Resource sections such as quality assertions and SLAs may be absent or incomplete for some models, and that absence should be represented explicitly rather than guessed.