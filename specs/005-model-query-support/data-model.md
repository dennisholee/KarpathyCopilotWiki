# Data Model: Model Query Support

## Entity: ModelIntent

Represents the classified purpose of a `/model` request.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `kind` | enum | `derive`, `enhance`, `define`, or `needs-refinement` | Required |
| `confidence` | number | Confidence score for the intent classification | Must be between `0` and `1` |
| `reasoning` | string | Short explanation of why the request was classified this way | Required when surfaced in logs/tests |

## Entity: ModelingRequest

Represents the parsed user prompt after intent detection.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `rawPrompt` | string | Original `/model` prompt | Required, non-empty after trimming |
| `normalizedPrompt` | string | Normalized request text used for matching | Required |
| `intent` | ModelIntent | Classified request type | Required |
| `targetModelName` | string | Requested model or domain phrase | Required unless the request is too ambiguous to proceed |
| `requestedChanges` | string[] | Requested additions or refinements | Optional for `define`, required for `enhance` |
| `namedGuidelines` | string[] | User-specified modelling guidelines | Optional |

## Entity: GuidelineResolution

Represents how the system applies explicit user guidance and the default contract schema.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `requestedGuidelines` | string[] | Guideline names found in the request | Optional |
| `resolvedGuidelinePages` | string[] | Wiki pages used as governing guideline evidence | Optional |
| `defaultedToOpenMetadata` | boolean | Whether default OpenMetadata structure was applied | Required |
| `appliedSections` | string[] | Contract sections governed by the resolved guideline set | Required for generated contracts |
| `fallbackSections` | string[] | Contract sections filled by the default OpenMetadata pattern | Present when guidance is partial |

## Entity: EvidenceCandidate

Represents one retrieved wiki candidate considered for baseline selection or definition synthesis.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `pageId` | string | Wiki page identifier | Required |
| `title` | string | Wiki page title | Required |
| `sourceReferences` | string[] | Raw-source references backing the page | Optional but preferred |
| `matchScore` | number | Search + deterministic ranking score | Required |
| `evidenceRole` | enum | `baseline`, `supporting`, `guideline`, `summary-only` | Required |
| `isGenericAggregation` | boolean | Whether the page is an index/glossary/summary page | Required |

## Entity: BaselineSelection

Represents the chosen baseline for an enhancement workflow.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `selectedCandidate` | EvidenceCandidate | Winning baseline candidate | Required for `enhance` |
| `alternatives` | EvidenceCandidate[] | Other plausible candidates considered | Optional |
| `selectionRationale` | string | Why the selected baseline won | Required when a baseline is selected |
| `needsRefinement` | boolean | Whether no credible baseline could be resolved | Required |

## Entity: PlacementDecision

Represents where a requested enhancement should be added in an existing model.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `targetSection` | string | Proposed section/entity/attribute group for insertion | Required for `enhance` |
| `targetReason` | string | Why this location is the best fit | Required |
| `supportingEvidence` | string[] | Evidence ids or page ids supporting the placement | Required |
| `rejectedAlternatives` | string[] | Other plausible placement options that were not chosen | Optional |

## Entity: DerivedModelProposal

Represents a generated contract-style response for either `derive` or `enhance` intent.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `request` | ModelingRequest | Parsed modelling request | Required |
| `guidelineResolution` | GuidelineResolution | Applied guideline decisions | Required |
| `baselineSelection` | BaselineSelection | Selected baseline or derivation context | Optional for `derive`, required for `enhance` |
| `changeSummary` | string[] | Reviewable changes or derivation notes | Required |
| `contract` | OpenMetadataModelContract | Full resulting contract | Required |
| `assumptions` | string[] | Unsupported or inferred details | Present when evidence is incomplete |
| `conflicts` | string[] | Conflicting evidence statements | Present when evidence conflicts exist |
| `evidence` | EvidenceReference[] | Supporting wiki/raw evidence | Required |

## Entity: DefinitionSummaryResponse

Represents the response shape for informational `define` queries.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `request` | ModelingRequest | Parsed modelling request | Required |
| `summary` | string | Grounded explanation of the model or relationship | Required |
| `keyEntities` | string[] | Key entities or participating model components | Optional |
| `keyRelationships` | string[] | Key relationships described by the wiki evidence | Optional |
| `evidence` | EvidenceReference[] | Supporting wiki/raw evidence | Required |
| `assumptions` | string[] | Explicit evidence gaps or unresolved ambiguities | Optional |

## Entity: OpenMetadataModelContract

Represents the default contract output shape when generating or enhancing models.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `id` | string | Proposal identifier | Required |
| `name` | string | Proposed model name | Required |
| `entityName` | string | Canonical entity/model name | Required |
| `version` | string | Proposal version marker | Required |
| `domain` | string | Business domain or bounded context | Required |
| `sourceModel` | string | Baseline model name when one exists | Optional for `derive`, required for `enhance` |
| `attributes` | ContractAttribute[] | Full resulting attribute set | Required, non-empty |
| `tags` | string[] | Contract classification tags | Optional |

## Relationships

- One `ModelingRequest` produces exactly one `ModelIntent`.
- One `ModelingRequest` can resolve zero or more `EvidenceCandidate` entries.
- One `ModelingRequest` can produce either one `DerivedModelProposal` or one `DefinitionSummaryResponse`, but not both in the same response.
- One `GuidelineResolution` belongs to one `DerivedModelProposal`.
- One `BaselineSelection` is required for `enhance` and optional for `derive`.
- One `PlacementDecision` belongs to an enhancement-style `DerivedModelProposal`.
- One `DerivedModelProposal` contains one `OpenMetadataModelContract`.

## State Rules

- If `ModelIntent.kind` is `define`, the response must be `DefinitionSummaryResponse` and no contract is emitted.
- If `ModelIntent.kind` is `enhance`, a credible `BaselineSelection.selectedCandidate` and a `PlacementDecision` are required before a contract response can be emitted.
- If `ModelIntent.kind` is `derive`, the system may proceed without a baseline model only when evidence is sufficient to build a grounded derived proposal.
- If user-named guidance is absent, `GuidelineResolution.defaultedToOpenMetadata` must be `true`.
- If evidence conflicts exist, the chosen response must include at least one conflict statement and corresponding evidence references.