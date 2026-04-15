# Phase 0 Research: Model Query Support

## Decision 1: Keep `/model` on the existing `@wiki` participant and branch internally by intent

**Decision**: Extend the existing `@wiki /model` handler rather than introducing a separate participant or command per modelling workflow.

**Rationale**: The extension already routes structured chat commands through `extension/src/copilot/wiki-participant.ts` and holds the existing `/model` logic there. Supporting derive, enhance, and define flows inside the current participant preserves chat context, shared logging, and reuse of `QueryHandler`, `SearchEngine`, and `WikiManager`.

**Alternatives considered**:

- Split derivation and definition into separate slash commands: rejected because the spec explicitly keeps these workflows behind `/model`.
- Create a second modelling participant: rejected because it duplicates registration and fragments wiki-specific context.

## Decision 2: Add explicit intent classification before baseline selection

**Decision**: Classify each `/model` request as `derive`, `enhance`, or `define` before model matching and response generation.

**Rationale**: The current implementation assumes an enhancement workflow and immediately looks for a baseline. That is insufficient for informational queries like `what is the relationship model` and for derive-from-guidelines requests where no baseline exists yet. Intent classification keeps downstream logic deterministic and testable.

**Alternatives considered**:

- Infer behavior solely from baseline match quality: rejected because a low-quality baseline could incorrectly force derivation or refinement without understanding user intent.
- Handle all requests as proposal generation and suppress the contract later: rejected because definition-style responses must not enter the contract generation path at all.

## Decision 3: Rank domain-specific model evidence above generic glossary and index pages

**Decision**: Use the existing search stack for retrieval, then apply deterministic ranking rules that penalize generic aggregation pages and reward pages that look like model definitions, architecture sections, or entity descriptions.

**Rationale**: Recent `/model` outputs selected `Wiki Index` or `Glossary` as baselines because they match many terms but are structurally poor model sources. The feature requires model-specific grounding, so ranking must explicitly favor domain pages that define the target model or relationship.

**Alternatives considered**:

- Rely on current relevance scores only: rejected because it is already producing incorrect baselines in the observed examples.
- Hand-maintain an allowlist of model pages: rejected because it does not scale with new ingested material.

## Decision 4: Resolve modelling guidelines in precedence order and fall back to OpenMetadata

**Decision**: Extract user-named guidelines from the request, map them to grounded wiki evidence when available, apply those rules first, and use the default OpenMetadata contract structure for any remaining unspecified contract sections.

**Rationale**: The spec requires explicit user-provided guidance to take precedence while preserving a consistent default contract shape. The ingested OpenMetadata guideline already defines the contract hierarchy, so it can act as the default governing schema when the request does not provide a different governing standard.

**Alternatives considered**:

- Ignore named guidelines unless they are full schema definitions: rejected because the user explicitly expects named guidelines to influence output.
- Replace OpenMetadata entirely whenever any other guideline is mentioned: rejected because partial guidelines may not define the full contract shape.

## Decision 5: Support two response families: proposal contracts and definition summaries

**Decision**: Return full markdown + YAML contract responses for `derive` and `enhance` intents, and return grounded markdown summaries with key entities/relationships and evidence for `define` intents.

**Rationale**: The clarification established that informational `/model` questions must not emit a contract unless the user explicitly asks for generation or enhancement. Keeping the response families separate prevents accidental contract output and makes acceptance tests precise.

**Alternatives considered**:

- Always emit a contract when any model evidence exists: rejected by clarification.
- Return only prose for all modelling responses: rejected because generation and enhancement requests need a reviewable contract payload.

## Decision 6: Derive new models from a synthesized evidence bundle when no credible baseline exists

**Decision**: For `derive` intent, allow proposal generation without a baseline candidate by synthesizing entities, attributes, and constraints from the top grounded evidence bundle instead of forcing refinement.

**Rationale**: The CDMS tax model example explicitly requires building a model that does not already exist. The current baseline-only proposal path cannot satisfy that scenario. Derivation must use grounded architecture pages, guideline pages, and standards pages as source material and mark unsupported details as assumptions.

**Alternatives considered**:

- Require every generated model to have an existing baseline model: rejected because it blocks the primary new scenario.
- Generate a freeform model from raw text without evidence packaging: rejected because it breaks traceability and explainability.