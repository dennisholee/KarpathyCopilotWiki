# Feature Specification: Add Model Participant

**Feature Branch**: `[003-add-model-participant]`  
**Created**: 2026-04-15  
**Status**: Draft  
**Input**: User description: "as a user I want to engage in data modelling. User will input the modelling requirement via the `@wiki /model` participant command. The data modeller will find an existing matching model and enhance with the new requirements and make a proposal. The proposal should include the new model schema in openmetadata model contract, rationale for the proposal, which wiki data was used. The openmetadata model contract should include attribute name, business rules, validation logic and must be compliant to the industry format."

## Clarifications

### Session 2026-04-15

- Q: How should `/model` behave when no existing model is a sufficiently credible match? → A: Ask the user to refine the requirement before generating any proposal.
- Q: What should the proposal return when enhancing an existing model? → A: Return the full resulting contract plus a concise change summary.
- Q: How should the proposal handle conflicting wiki evidence? → A: Return one preferred proposal, but explicitly describe the conflict and cite the conflicting wiki evidence.
- Q: What should count as compliance for the generated proposal? → A: Validate OpenMetadata contract structure plus required business fields: attribute name, business rules, validation logic, rationale, and cited wiki evidence.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Request A Model Proposal (Priority: P1)

When a user submits a modelling requirement through `@wiki /model`, the system returns a proposal built from the best matching existing model instead of making the user locate and combine prior models manually.

**Why this priority**: The primary value of the feature is shortening the path from modelling intent to a usable proposal grounded in existing project knowledge.

**Independent Test**: Can be fully tested by submitting a modelling requirement through `@wiki /model` and verifying that the response identifies a matching existing model and returns a concrete enhancement proposal.

**Acceptance Scenarios**:

1. **Given** a user provides a modelling requirement that aligns with an existing model, **When** the user submits it through `@wiki /model`, **Then** the system returns a proposal derived from that existing model.
2. **Given** multiple existing models partially match the requirement, **When** the user submits the requirement, **Then** the system chooses the best-fit model and explains that basis in the proposal.
3. **Given** the requirement extends an existing model, **When** the proposal is generated, **Then** the response clearly shows the enhanced model rather than only restating the original one.
4. **Given** the proposal enhances an existing model, **When** the response is returned, **Then** it includes the full resulting contract and a concise summary of what changed.

---

### User Story 2 - Review A Standards-Compliant Contract (Priority: P1)

When a user receives a modelling proposal, the proposal includes the updated schema as an OpenMetadata-compliant model contract with enough business detail to support review.

**Why this priority**: A modelling proposal is only useful if it is structured in the target contract format and can be reviewed for business correctness and industry compliance.

**Independent Test**: Can be fully tested by submitting a requirement and verifying that the returned proposal includes a model contract with attribute names, business rules, validation logic, and a standards-compliant structure.

**Acceptance Scenarios**:

1. **Given** a proposal is generated, **When** the user reviews it, **Then** the proposal includes the new or updated schema in an OpenMetadata-compliant model contract.
2. **Given** the proposed model contains attributes, **When** the contract is returned, **Then** each proposed attribute includes its name, business rules, and validation logic.
3. **Given** the proposal changes an existing model, **When** the contract is returned, **Then** the proposal makes the modified scope reviewable without requiring the user to reconstruct it from source material.
4. **Given** the proposal is based on an existing model, **When** the user reviews it, **Then** the response includes a concise change summary alongside the full resulting contract.

---

### User Story 3 - Understand Why The Proposal Was Made (Priority: P2)

When a user reviews a proposal, they can see the reasoning behind the recommendation and the wiki evidence that supports it.

**Why this priority**: Data modelling decisions need traceability. Users must be able to challenge, refine, or approve the proposal based on grounded project knowledge.

**Independent Test**: Can be fully tested by generating a proposal and verifying that it includes rationale and a list of the wiki material used to support the recommendation.

**Acceptance Scenarios**:

1. **Given** a proposal is generated from project knowledge, **When** the user reviews it, **Then** the response includes rationale explaining why the matched model and enhancements were chosen.
2. **Given** wiki content was used to build the proposal, **When** the proposal is returned, **Then** the response identifies the wiki data used.
3. **Given** some requested details are not fully supported by the available wiki knowledge, **When** the proposal is returned, **Then** the response identifies the unsupported or assumed portions clearly.

### Edge Cases

- When no existing model is a sufficiently credible match, the system asks the user to refine the requirement before generating a proposal.
- When wiki evidence supports conflicting modelling interpretations, the system returns one preferred proposal, explicitly describes the conflict, and cites the conflicting evidence.
- When a requested enhancement would duplicate or rename an existing attribute with overlapping meaning, the system preserves the canonical baseline attribute, explains the overlap in the change summary, and proposes the rename or alias explicitly rather than silently creating a duplicate field.
- When a requested attribute lacks sufficient business-rule or validation evidence in the wiki, the system may include the attribute only if the structural intent is clear, but it must mark missing rule details as assumptions or gaps and must not invent unsupported business rules or validation logic.
- When a single requirement spans more than one candidate model boundary, the system proceeds only if one baseline model is still credibly dominant; otherwise it asks the user to refine the request into a narrower scope before generating a proposal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a user to submit a data modelling requirement through the `@wiki /model` participant command.
- **FR-002**: System MUST identify existing model candidates relevant to the submitted modelling requirement.
- **FR-003**: System MUST select the best matching existing model as the baseline for the proposal when a credible match exists.
- **FR-004**: System MUST generate a proposal that enhances the matched model to address the new requirement.
- **FR-005**: System MUST return the proposed schema in an OpenMetadata-compliant model contract format.
- **FR-005a**: System MUST return the full resulting contract when enhancing an existing model.
- **FR-005b**: System MUST validate proposal compliance against the OpenMetadata contract structure plus required business fields: attribute name, business rules, validation logic, rationale, and cited wiki evidence.
- **FR-006**: System MUST include proposed attributes in the contract with attribute name, business rules, and validation logic.
- **FR-007**: System MUST include rationale explaining why the baseline model and proposed enhancements were chosen.
- **FR-007a**: System MUST include a concise change summary describing how the proposal differs from the baseline model.
- **FR-008**: System MUST identify the wiki data used to support the proposal.
- **FR-009**: System MUST distinguish between supported proposal content and assumptions or unresolved gaps when the wiki evidence is incomplete.
- **FR-009a**: System MUST return one preferred proposal when supporting wiki evidence conflicts, and MUST explicitly describe the conflict and cite the conflicting evidence.
- **FR-010**: System MUST preserve traceability between the proposal and the supporting wiki knowledge used to produce it.
- **FR-011**: System MUST make the proposal reviewable as a single response without requiring the user to manually reconstruct the enhanced schema from multiple prior models.
- **FR-012**: System MUST ask the user to refine the requirement before generating any proposal when no sufficiently matching existing model is available.

### Key Entities *(include if feature involves data)*

- **Modeling Requirement**: A user-submitted description of the desired model change, addition, or refinement entered through `@wiki /model`.
- **Existing Model Candidate**: A previously defined model that may partially or fully match the user’s requirement and can serve as the baseline for enhancement.
- **Model Proposal**: The generated recommendation that describes the enhanced model, its rationale, and its supporting evidence.
- **Contract Attribute**: A proposed or modified schema field within the returned model contract, including its name, business rules, and validation logic.
- **Evidence Reference**: A cited wiki source used to justify the selected model, proposed changes, or unresolved gaps.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In representative modelling requests with a credible prior match, at least 90% of responses identify a baseline model and return an enhancement proposal in a single response.
- **SC-002**: 100% of generated proposals include an OpenMetadata-compliant model contract, rationale, and cited wiki evidence.
- **SC-002a**: 100% of generated proposals in representative validation samples satisfy the required compliance checks for OpenMetadata contract structure plus required business fields.
- **SC-003**: At least 95% of proposed attributes in representative validation samples include attribute name, business rules, and validation logic.
- **SC-004**: In reviewer validation sessions, at least 85% of users can determine what changed from the baseline model within 5 minutes without consulting additional material.
- **SC-005**: For modelling requests with incomplete evidence, at least 90% of responses explicitly identify assumptions or gaps instead of presenting unsupported details as final fact.

## Assumptions

- Users are submitting modelling requests through `@wiki /model` against project knowledge that already exists in the workspace wiki or related model artifacts.
- The proposal is advisory and review-oriented; automatic application of the proposed model is out of scope.
- OpenMetadata model contract format is the required target representation for proposal output.
- A single best-fit baseline model can usually be identified even when multiple sources contribute supporting evidence.
- Industry compliance in this feature means the returned contract follows the expected business-facing contract structure and includes the required attribute-level rule metadata.
- Compliance for this feature is satisfied by validating the OpenMetadata contract structure together with required business-facing fields: attribute name, business rules, validation logic, rationale, and cited wiki evidence.