# Data Model: Wiki Ground Truth Toggle

## Entity: GroundTruthModeSetting

- **Purpose**: Stores the user-selected `@wiki` answer policy for the current workspace.
- **Fields**:
  - `key`: configuration key name used by the extension.
  - `mode`: `strict` or `flexible`.
  - `defaultMode`: default selected mode for newly opened workspaces.
  - `scope`: workspace-level extension setting.
- **Validation Rules**:
  - `mode` must be one of `strict` or `flexible`.
  - Setting changes must take effect on the next `@wiki` request without restart.

## Entity: AnsweringPolicy

- **Purpose**: Runtime interpretation of the selected mode for one `@wiki` request.
- **Fields**:
  - `mode`: effective mode resolved from configuration.
  - `wikiOnly`: boolean indicating whether non-wiki supplementation is forbidden.
  - `allowSupplementalSources`: boolean indicating whether broader answer synthesis is permitted.
  - `showModeIndicator`: boolean indicating whether the response should announce the active mode.
- **Validation Rules**:
  - `wikiOnly` and `allowSupplementalSources` must never both be true.
  - Strict mode must set `wikiOnly = true`.
  - Flexible mode must preserve wiki evidence even when supplemental sources are allowed.

## Entity: WikiAnswerEnvelope

- **Purpose**: User-visible `@wiki` response package after applying the selected answering policy.
- **Fields**:
  - `query`: original user request.
  - `effectiveQuery`: query after prior-turn refinement.
  - `mode`: strict or flexible.
  - `directAnswer`: rendered answer text.
  - `supportingReferences`: wiki references used in the answer.
  - `coverageGaps`: missing topics or unsupported areas.
  - `usedSupplementalKnowledge`: boolean indicating whether non-wiki supplementation was permitted and used.
- **Validation Rules**:
  - Strict mode responses must not set `usedSupplementalKnowledge = true`.
  - If strict mode lacks sufficient evidence, `coverageGaps` must be populated or the confidence label must indicate insufficient support.
  - Flexible mode responses must keep wiki references whenever the wiki contributed evidence.

## Relationships

- `GroundTruthModeSetting` determines the `AnsweringPolicy` for each new `@wiki` request.
- `AnsweringPolicy` shapes how `WikiAnswerEnvelope` is produced from the current wiki evidence bundle and optional remote synthesis path.