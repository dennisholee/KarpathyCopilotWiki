# Research: Wiki Ground Truth Toggle

## Decision 1: Represent the user control as an explicit answer-mode setting

- **Decision**: Add a configuration setting such as `wiki.groundTruthMode` with values `strict` and `flexible`.
- **Rationale**: The feature is a user-visible toggle, but an explicit mode string is clearer than a loosely named boolean and is extensible if a third mode is needed later.
- **Alternatives considered**:
  - Boolean setting like `wiki.useGroundTruthOnly`: simpler today, but less self-descriptive and harder to extend cleanly.
  - Per-request slash command argument: rejected because the spec asks for a setting, not a command-only override.

## Decision 2: Enforce the mode in the chat participant answer path

- **Decision**: Apply the setting in `WikiChatParticipant.handleQuery` and the downstream answer-synthesis path rather than altering indexing or ingest.
- **Rationale**: The spec explicitly scopes the feature to `@wiki` answering behavior. The participant already owns request routing, remote synthesis gating, and response streaming.
- **Alternatives considered**:
  - Modify `SearchEngine` only: rejected because retrieval alone does not control whether remote synthesis may add broader information.
  - Modify ingest/index behavior: rejected because it violates the scoped requirement and would change unrelated workflows.

## Decision 3: Keep strict mode wiki-only even when remote synthesis is enabled

- **Decision**: In strict mode, remote synthesis may still be used only if the prompt is constrained to the wiki evidence bundle and explicitly forbids non-wiki supplementation.
- **Rationale**: This preserves the local-first / optional-remote constitution rule while allowing the current response formatting pipeline to stay consistent.
- **Alternatives considered**:
  - Disable remote synthesis entirely in strict mode: simpler, but unnecessarily removes formatting/summarization value from the existing path.
  - Allow remote synthesis to use general model knowledge in strict mode: rejected because it breaks the core feature promise.

## Decision 4: Flexible mode remains wiki-first, not wiki-optional

- **Decision**: Flexible mode should still prioritize and cite wiki evidence whenever it exists, but it may supplement beyond the wiki when coverage is incomplete.
- **Rationale**: The request states that `@wiki` should still use the wiki directory when the toggle is off. This mode is not a free replacement for the wiki corpus.
- **Alternatives considered**:
  - Make flexible mode ignore wiki evidence if broader answers are available: rejected because it dilutes the purpose of `@wiki`.

## Decision 5: Communicate the active mode in the answer output

- **Decision**: Add a small, user-visible mode indicator in the response stream or formatted answer output.
- **Rationale**: The user must be able to distinguish strict wiki-only answers from flexible answers to assess trust boundaries.
- **Alternatives considered**:
  - Hide the mode in logs or settings only: rejected because it does not satisfy the visibility requirement.