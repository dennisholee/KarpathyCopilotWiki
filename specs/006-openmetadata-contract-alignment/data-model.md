# Data Model: OpenMetadata Contract Alignment

## Entity: AlignedModelProposal

Represents the full proposal response object for derive and enhance `/model` requests after alignment.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `request` | ModelingRequest | Parsed `/model` request and detected intent | Required |
| `contract` | OpenMetadataProposalContract | Canonical aligned contract payload | Required |
| `changeSummary` | string[] | Reviewable derivation or enhancement notes | Required, non-empty |
| `rationale` | string | Grounded explanation of why the proposal was generated | Required |
| `evidence` | ProposalEvidenceReference[] | Supporting wiki and raw-source references | Required, non-empty |
| `assumptions` | string[] | Explicit inferred or unresolved items | Optional |
| `conflicts` | string[] | Conflicting evidence statements | Optional |
| `compliance` | ContractValidationResult | Validation outcome for the aligned contract | Required |

## Entity: OpenMetadataProposalContract

Represents the OpenMetadata-aligned contract body emitted in proposal responses.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `name` | string | Contract identifier or slug-safe name | Required, non-empty |
| `displayName` | string | Human-readable contract name | Required, non-empty |
| `description` | string | Grounded summary of the governed model | Required |
| `status` | enum | Proposal lifecycle state such as `Draft` | Required |
| `owner` | ContractOwner \\| null | Owner section when grounded evidence exists | Optional but must not be fabricated |
| `targetEntity` | TargetEntityReference | Governed logical or physical asset reference | Required |
| `schemaText` | string | Serialized aligned schema definition | Required for grounded schema proposals |
| `resources` | ContractResource[] | Operational quality or SLA resources | Optional |
| `incidentManagement` | IncidentManagementDefinition \\| null | Incident-management section when grounded evidence exists | Optional |

## Entity: ContractOwner

Represents a grounded owner reference for the aligned contract.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | string | Owner identifier from grounded evidence | Required when owner exists |
| `type` | string | Owner type such as `team`, `user`, or `organization` | Required when owner exists |

## Entity: TargetEntityReference

Represents the governed asset targeted by the proposal.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `name` | string | Target entity name derived from the request and evidence | Required |
| `type` | string | Logical modeled entity by default, physical asset type only when grounded | Required |
| `sourceKind` | enum | `logical` or `physical` interpretation | Required for validation/explanation |

## Entity: SchemaEntry

Represents one structured field definition used before serialization into `schemaText`.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `name` | string | Field name | Required |
| `dataType` | string | Grounded or explicitly assumed data type | Required |
| `description` | string | Business meaning of the field | Optional |
| `required` | boolean | Whether the field is mandatory | Required |
| `validationRules` | string[] | Field-level constraints from evidence | Optional |
| `sourceReferences` | string[] | Traceability to wiki/raw evidence | Required when grounded |
| `isAssumed` | boolean | Whether the field exists because of explicit assumption rather than grounded evidence | Required |

## Entity: ContractResource

Represents an operational resource entry inside the aligned contract.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `type` | enum | `assertion`, `sla`, or another grounded operational resource type | Required |
| `name` | string | Resource name | Required |
| `description` | string | Grounded purpose of the resource | Required |
| `properties` | Record<string, string> | Resource-specific grounded settings | Optional |
| `sourceReferences` | string[] | Evidence for the resource entry | Required when grounded |
| `isResolved` | boolean | Whether the resource is fully grounded | Required |

## Entity: IncidentManagementDefinition

Represents operational incident-handling information for the aligned contract.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `type` | string | Incident-management mechanism or provider | Required when section exists |
| `severity` | string | Grounded severity or escalation class | Optional |
| `description` | string | Grounded incident-handling note | Optional |
| `sourceReferences` | string[] | Evidence supporting the section | Required when section exists |
| `isResolved` | boolean | Whether the section is fully grounded | Required |

## Entity: ProposalEvidenceReference

Represents evidence cited alongside the aligned proposal.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `wikiPage` | string | Source wiki page used in the proposal | Required |
| `rawSources` | string[] | Backing raw-source files | Optional but preferred |
| `usage` | string | How the evidence informed the proposal | Required |
| `contractSections` | string[] | Contract sections supported by this evidence | Required |
| `conflicted` | boolean | Whether the evidence conflicts with another source | Optional |

## Relationships

- One `AlignedModelProposal` contains exactly one `OpenMetadataProposalContract`.
- One `OpenMetadataProposalContract` contains exactly one `TargetEntityReference`.
- One `OpenMetadataProposalContract` can contain zero or one `ContractOwner`.
- One `OpenMetadataProposalContract` can contain zero or many `ContractResource` entries.
- One `OpenMetadataProposalContract` can contain zero or one `IncidentManagementDefinition`.
- One `OpenMetadataProposalContract` is backed by zero or many `SchemaEntry` items before `schemaText` serialization.
- One `AlignedModelProposal` contains one or more `ProposalEvidenceReference` entries.

## State Rules

- Derive and enhance intents must emit `AlignedModelProposal`; define intents must not.
- `targetEntity.type` defaults to a logical modeled entity unless the request or evidence clearly supports a physical asset type.
- `owner`, `resources`, and `incidentManagement` may be omitted or marked unresolved when evidence is insufficient, but they must not be fabricated.
- `schemaText` must be generated from the proposal’s structured schema entries so validation can inspect required fields before formatting.
- Any assumed field or operational section must also surface in `assumptions` or as unresolved content outside the grounded contract values.
