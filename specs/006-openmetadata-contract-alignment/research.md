# Phase 0 Research: OpenMetadata Contract Alignment

## Decision 1: Keep the current `/model` response envelope and replace only the proposal contract payload

**Decision**: Preserve the current markdown review structure around `/model` responses and change the embedded proposal payload from the custom contract object to an OpenMetadata-aligned contract.

**Rationale**: The current response already separates contract content from rationale, evidence, assumptions, and compliance validation. Reusing that outer envelope limits user-facing churn and keeps the work scoped to proposal alignment rather than a full response redesign.

**Alternatives considered**:

- Return raw YAML only: rejected because reviewers still need human-readable rationale, evidence, and gap disclosure around the contract.
- Replace the whole response with a new OpenMetadata-specific layout: rejected because it would mix formatting churn with contract-alignment work and create avoidable regression risk.

## Decision 2: Model the aligned proposal around explicit OpenMetadata sections instead of retrofitting the old attribute-centric type

**Decision**: Introduce an explicit aligned contract model with top-level sections for identity, owner, target entity, schema text, resources, and incident management.

**Rationale**: The current `OpenMetadataModelContract` type is still a custom proposal structure centered on attributes, source model, and guideline fallback fields. Retrofitting that shape would leave the code full of translation exceptions and make validation harder. A new aligned contract type gives builder, formatter, and validator a shared source of truth.

**Alternatives considered**:

- Keep the old type and translate only in the formatter: rejected because validation and tests would still reason about the wrong canonical shape.
- Represent the aligned contract as an untyped record: rejected because the feature needs deterministic validation and test coverage.

## Decision 3: Serialize grounded schema details into `schemaText` while retaining structured field evidence internally

**Decision**: Preserve structured field-level modeling data in the proposal-building path, then serialize the reviewed field set into the OpenMetadata-style `schemaText` block for the rendered contract.

**Rationale**: The existing modeling pipeline already reasons about fields, data types, rules, and traceability as structured data. `schemaText` is the aligned output format, but building directly as an opaque string would make validation and testing brittle. Keeping structured schema entries internally allows deterministic validation and evidence mapping before final serialization.

**Alternatives considered**:

- Build `schemaText` as freeform text from the start: rejected because it weakens field-level validation and traceability.
- Emit both `attributes` and `schemaText`: rejected because the spec requires alignment to the target contract shape, not a hybrid format.

## Decision 4: Represent quality and SLA content through `resources` only when evidence is grounded

**Decision**: Map quality assertions, validation checks, and service-level expectations into the aligned `resources` section only when the wiki evidence clearly supports them; otherwise leave the section partial or explicitly unresolved.

**Rationale**: The feature requires OpenMetadata-aligned operational sections without inventing unsupported commitments. Treating `resources` as evidence-gated avoids hallucinated data quality or SLA claims while still allowing grounded operational metadata to appear when available.

**Alternatives considered**:

- Always populate example resource entries: rejected because it violates the no-fabrication requirement.
- Omit `resources` entirely from all proposals: rejected because the spec explicitly requires aligned representation when grounded evidence exists.

## Decision 5: Keep informational `define` responses on the existing summary path

**Decision**: Leave `define` intent responses on the current non-contract summary path and scope the alignment work to derive and enhance proposal flows.

**Rationale**: The clarification and requirements explicitly keep informational responses out of scope. Preserving the summary path avoids unnecessary regressions and keeps the plan focused on the proposal contract pipeline.

**Alternatives considered**:

- Convert definition responses to lightweight aligned contracts: rejected by specification.
- Duplicate summary logic in a new formatter: rejected because the existing summary behavior already satisfies the clarified scope.

## Decision 6: Update builder, validator, and formatter together and measure alignment through focused tests

**Decision**: Treat the aligned contract type, proposal construction, validation rules, and markdown/YAML formatting as one coordinated change set and validate it with focused integration and unit tests.

**Rationale**: The existing tests assert the old YAML shape, and `contractValidator.ts` currently requires fields such as `sourceModel` that will no longer apply to all derive flows. Updating only one layer would leave the pipeline internally inconsistent. The safest approach is a single migration across types, builder, validator, formatter, and tests.

**Alternatives considered**:

- Update formatter first and adapt internals later: rejected because validator and tests would immediately drift from the runtime payload.
- Rely on integration coverage only: rejected because the aligned schema serialization and gap-handling rules need deterministic unit tests.
