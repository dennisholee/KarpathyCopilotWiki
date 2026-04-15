# Data Model: Add Model Participant

## Entity: ModelingRequirement

Represents the user’s submitted modelling prompt from `/model`.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `prompt` | string | Raw modelling requirement entered by the user | Required, non-empty after trimming |
| `normalizedIntent` | string | Simplified representation used for candidate matching | Derived from prompt; must not remove domain-significant terms |
| `requestedChanges` | string[] | Parsed change intents such as add, rename, constrain, or extend | May be empty if request remains too vague |
| `status` | enum | `ready`, `needs-refinement` | `needs-refinement` when no credible baseline model exists |

## Entity: ExistingModelCandidate

Represents a candidate baseline model retrieved from the workspace wiki.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `pageId` | string | Backing wiki page identifier | Required |
| `title` | string | Human-readable model title | Required |
| `evidenceReferences` | string[] | Supporting wiki/raw references backing the candidate | At least one supporting wiki reference |
| `matchScore` | number | Deterministic ranking score for the request | Must be within configured scoring bounds |
| `matchRationale` | string | Short explanation of why the candidate matched | Required when candidate is surfaced |
| `isSelected` | boolean | Whether the candidate became the proposal baseline | Exactly one selected candidate when proposal proceeds |

## Entity: ModelProposal

Represents the generated recommendation returned to the user.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `baselineModelId` | string | Selected model candidate identifier | Required when proposal proceeds |
| `changeSummary` | string[] | Concise explanation of what changed from the baseline | Required, at least one entry |
| `rationale` | string | Why this proposal was chosen | Required |
| `conflictSummary` | string[] | Explicitly disclosed evidence conflicts | Present when evidence conflicts exist |
| `assumptions` | string[] | Unsupported or inferred parts of the proposal | Present when evidence is incomplete |
| `wikiEvidence` | EvidenceReference[] | Wiki pages and raw sources used for support | Required |
| `contract` | OpenMetadataModelContract | Full resulting contract payload | Required |

## Entity: OpenMetadataModelContract

Represents the full resulting contract returned in the proposal.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | string | Stable proposal contract identifier | Required |
| `name` | string | Proposed model name | Required |
| `version` | string | Contract version marker | Required |
| `domain` | string | Business/domain context of the model | Required |
| `sourceModel` | string | Name or identifier of the baseline model | Required when proposal proceeds |
| `attributes` | ContractAttribute[] | Full resulting attribute set | Required, non-empty |
| `rationale` | string | Embedded contract rationale | Required |
| `evidence` | EvidenceReference[] | Evidence used to support the contract | Required |

## Entity: ContractAttribute

Represents one attribute in the proposed contract.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `name` | string | Attribute name | Required, unique within contract |
| `description` | string | Business-facing attribute meaning | Recommended, required for final proposal output |
| `dataType` | string | Proposed logical type | Required |
| `required` | boolean | Whether the attribute is mandatory | Required |
| `businessRules` | string[] | Rules governing valid business use | Required by compliance checks |
| `validationLogic` | string[] | Deterministic validation statements or conditions | Required by compliance checks |
| `sourceMappings` | string[] | Optional links to wiki/source field lineage | Optional but required when traceability exists |
| `renameOf` | string | Source attribute name when the proposal represents a rename | Optional |

## Entity: EvidenceReference

Represents grounded support used in the proposal.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `wikiPage` | string | Supporting wiki page title or identifier | Required |
| `rawSources` | string[] | Raw source paths backing the wiki page | Required when available |
| `usage` | string | What part of the proposal this evidence supports | Required |
| `conflicted` | boolean | Whether this evidence participates in a conflict | Defaults to `false` |

## Relationships

- One `ModelingRequirement` can produce zero or more `ExistingModelCandidate` entries.
- One `ModelingRequirement` produces exactly one `ModelProposal` only when a credible baseline model is selected.
- One selected `ExistingModelCandidate` becomes the baseline for one `ModelProposal`.
- One `ModelProposal` contains one full `OpenMetadataModelContract`.
- One `OpenMetadataModelContract` contains many `ContractAttribute` entries.
- One `ModelProposal` cites many `EvidenceReference` entries.

## State Rules

- If no candidate passes the credibility threshold, `ModelingRequirement.status` becomes `needs-refinement` and no `ModelProposal` is emitted.
- If evidence conflicts exist, `ModelProposal.conflictSummary` must be populated and the cited `EvidenceReference.conflicted` entries must be marked.
- A proposal fails compliance validation if any returned attribute lacks `name`, `businessRules`, or `validationLogic`.