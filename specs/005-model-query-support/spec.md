# Feature Specification: Model Query Support

**Feature Branch**: `[005-model-query-support]`  
**Created**: 2026-04-15  
**Status**: Draft  
**Input**: User description: "as a user I want `@wiki /model` to support the following types of query: 1. `@wiki /model generate the cdms tax model based on the cdms architecture, open metadata guideline and the oecd guideline`. In this example the tax model does not exists and must be derived based on what is in the wiki e.g. cdms architecture, open metadata guideline and oecd guideline. 2. `@wiki /model enhance the party model by adding an account number`. In this case `@wiki` will check whether such model exists in the wiki and if so proceed to cross check wiki for information associated to the account number before proceeding identify a suitable location to add account number. 3. `@wiki /model what is the relationship model`. In this example `@wiki` should find information in the wiki that defines a relationship. For model generation, it should either follow the guideline provided by the user or default to openmetadata model contract schema."

## Clarifications

### Session 2026-04-15

- Q: For definition-style requests like `@wiki /model what is the relationship model`, what should the response format be? → A: Return a grounded definition summary with key entities/relationships and cited evidence, but no contract unless the user explicitly asks to generate or enhance one.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generate A New Derived Model (Priority: P1)

When a user asks `@wiki /model` to generate a model that does not already exist, the system derives that model from grounded wiki evidence and any named modelling guidelines instead of requiring the user to assemble the model manually.

**Why this priority**: This is the highest-value modelling workflow because it turns distributed wiki knowledge into a usable model proposal for a new domain concept.

**Independent Test**: Can be fully tested by requesting a new model that is not already present, citing known wiki sources and guidelines, and verifying that the response returns a derived model proposal grounded in those sources.

**Acceptance Scenarios**:

1. **Given** a user requests a model that does not already exist in the wiki, **When** the user names relevant source domains and guidelines, **Then** the system derives a new model proposal from the cited wiki evidence.
2. **Given** a user names multiple guidelines in the request, **When** the model proposal is generated, **Then** the response reflects those guidelines as governing references for the proposed structure and constraints.
3. **Given** the requested model is new, **When** the proposal is returned, **Then** the response clearly states that the model was derived rather than enhanced from an existing baseline.

---

### User Story 2 - Enhance An Existing Model (Priority: P1)

When a user asks to enhance an existing model, the system finds the correct baseline model, checks related wiki evidence for the requested addition, and proposes the most suitable place to apply the change.

**Why this priority**: Enhancing an existing model is the core day-to-day modelling workflow and must be precise enough to avoid adding fields to the wrong entity or location.

**Independent Test**: Can be fully tested by requesting a targeted enhancement to a known model and verifying that the response identifies the baseline model, finds supporting evidence for the requested field, and proposes a specific location for the change.

**Acceptance Scenarios**:

1. **Given** a user asks to enhance a model that exists in the wiki, **When** the request is processed, **Then** the system identifies that existing model as the baseline.
2. **Given** a user requests a new attribute for an existing model, **When** related wiki evidence exists for that attribute, **Then** the system cross-checks that evidence before proposing the change.
3. **Given** the baseline model contains multiple candidate sections or entities for the requested attribute, **When** the proposal is returned, **Then** the response identifies the chosen location and explains why it is the most suitable fit.

---

### User Story 3 - Retrieve A Model Definition (Priority: P2)

When a user asks what a model is rather than asking for a change, the system returns the relevant model definition from the wiki instead of forcing a change proposal.

**Why this priority**: Users also need `/model` to answer model-definition questions, not only generate contracts, so the command behaves like a modelling assistant rather than only a contract generator.

**Independent Test**: Can be fully tested by asking for a model definition and verifying that the response returns the grounded model description and evidence without inventing changes.

**Acceptance Scenarios**:

1. **Given** a user asks a definition-style question such as what a model is, **When** the request is processed, **Then** the system returns the grounded wiki definition for that model.
2. **Given** multiple wiki pages discuss the model, **When** the definition is returned, **Then** the response consolidates the most relevant grounded evidence into a coherent definition.
3. **Given** the request is informational rather than transformational, **When** the response is returned, **Then** it does not fabricate a change proposal or contract update.
4. **Given** the request is a definition-style `/model` query, **When** the response is returned, **Then** it includes a grounded summary of key entities or relationships with cited evidence and does not return a contract unless the user explicitly asks to generate or enhance one.

---

### User Story 4 - Apply The Correct Contract Guideline (Priority: P2)

When a user requests model generation or enhancement, the system follows user-named modelling guidelines when they are present and otherwise falls back to the default OpenMetadata model contract schema.

**Why this priority**: The same modelling command must be flexible enough to honor explicit guidance while still producing consistent output when no custom guideline is supplied.

**Independent Test**: Can be fully tested by comparing a request that names modelling guidelines with a request that names none, and verifying that the output uses the cited guideline in the first case and the default OpenMetadata contract in the second.

**Acceptance Scenarios**:

1. **Given** a modelling request explicitly names one or more guidelines, **When** the response is generated, **Then** the proposal follows those guidelines where relevant.
2. **Given** a modelling request does not name any guideline, **When** the response is generated, **Then** the proposal defaults to the OpenMetadata model contract schema.
3. **Given** a named guideline is only partially applicable to the request, **When** the response is generated, **Then** the system applies the relevant parts of the named guideline and fills remaining structure with the default contract pattern.

### Edge Cases

- When the user names a target model that cannot be found in the wiki, the system distinguishes between deriving a new model and asking the user to refine an ambiguous target name.
- When generic aggregation pages such as indexes or glossaries mention the requested model, the system prefers domain-specific model evidence over summary pages as the primary baseline.
- When multiple existing models are plausible baselines for an enhancement request, the system identifies the preferred baseline and explains the disambiguation.
- When the wiki defines the requested attribute or relationship differently across sources, the system returns one preferred interpretation and explicitly surfaces the conflict.
- When a user names a guideline that conflicts with the default contract structure, the response states which parts were governed by the named guideline and which parts remained under the default contract pattern.
- When the wiki does not provide enough evidence to derive a structurally credible new model or enhancement, the system identifies the missing evidence instead of inventing unsupported fields or rules.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept `@wiki /model` requests that ask to generate a new model, enhance an existing model, or define an existing model.
- **FR-002**: System MUST classify each `/model` request by user intent before deciding whether to derive, enhance, or define a model.
- **FR-003**: System MUST identify and prioritize domain-specific wiki evidence relevant to the requested model over generic aggregation pages when selecting a baseline or definition.
- **FR-004**: System MUST derive a new model proposal when the requested model does not already exist and sufficient grounded evidence is available in the wiki.
- **FR-005**: System MUST clearly distinguish derived-model responses from enhancement responses.
- **FR-006**: System MUST find an existing baseline model when the user requests enhancement of a model that exists in the wiki.
- **FR-007**: System MUST cross-check wiki evidence relevant to a requested new attribute or relationship before proposing where it belongs in an existing model.
- **FR-008**: System MUST identify the proposed insertion or modification point within the baseline model when recommending an enhancement.
- **FR-009**: System MUST return a definition-style response when the user asks what a model is, rather than forcing a generated contract change.
- **FR-009a**: System MUST return definition-style `/model` responses as grounded summaries with key entities or relationships and cited evidence.
- **FR-009b**: System MUST NOT return a contract for a definition-style `/model` request unless the user explicitly asks to generate or enhance one.
- **FR-010**: System MUST follow user-named modelling guidelines when they are present in the request and relevant evidence is available.
- **FR-011**: System MUST default to the OpenMetadata model contract schema when the user does not provide a guideline.
- **FR-012**: System MUST combine user-named guideline rules with the default OpenMetadata contract pattern when a named guideline does not fully define the required contract shape.
- **FR-013**: System MUST include rationale explaining how the baseline, derivation path, or definition evidence was selected.
- **FR-014**: System MUST cite the wiki evidence used to support the response and preserve raw-source traceability for that evidence, including the sources that justify a new model, a proposed enhancement location, or a returned definition.
- **FR-015**: System MUST identify assumptions, evidence gaps, and unresolved conflicts instead of presenting unsupported modelling details as certain facts.
- **FR-016**: System MUST reject or ask for refinement when the requested target model or relationship cannot be resolved to a credible scope.

### Key Entities *(include if feature involves data)*

- **Model Intent**: The detected purpose of a `/model` request, such as derive, enhance, or define.
- **Model Baseline**: The best matching existing model used as the starting point for an enhancement request.
- **Derived Model Proposal**: A newly assembled model produced from grounded wiki evidence because no suitable baseline model already exists.
- **Model Definition Response**: A grounded explanation of an existing model or relationship returned for informational requests.
- **Guideline Source**: A user-named or default modelling standard that governs the shape and required content of the response.
- **Evidence Bundle**: The set of wiki pages and raw-source references used to justify a selected baseline, derived structure, enhancement placement, or returned definition.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In representative derive-model requests, at least 90% of responses return a grounded derived model when sufficient supporting evidence exists.
- **SC-002**: In representative enhancement requests, at least 90% of responses identify an existing baseline model and a specific proposed location for the requested change.
- **SC-003**: In representative definition-style requests, at least 95% of responses return a grounded model definition without introducing unsupported model changes.
- **SC-003a**: In representative definition-style requests, 100% of responses omit contract generation unless the user explicitly asks to generate or enhance one.
- **SC-004**: 100% of model generation and enhancement responses follow a user-named guideline when one is provided, or the default OpenMetadata contract structure when no explicit guideline is provided.
- **SC-005**: 100% of responses include rationale, grounded evidence references, and explicit assumptions or conflicts when evidence is incomplete or contradictory.

## Assumptions

- Users will express model requests in natural language and may mix target model names, desired changes, and named guidelines in the same prompt.
- Relevant wiki evidence may span architecture pages, modelling guidance pages, glossary pages, and external-standard summaries already ingested into the wiki.
- The default contract representation remains the OpenMetadata-style model contract unless the user explicitly asks for a different modelling guideline.
- Informational model questions and model-generation questions should share the `/model` entry point rather than requiring separate commands.
- Generic index or glossary pages can be used as supporting evidence, but they are not sufficient on their own to serve as the primary model baseline when more specific model evidence exists.