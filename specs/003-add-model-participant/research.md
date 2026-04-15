# Phase 0 Research: Add Model Participant

## Decision 1: Extend the existing `@wiki` participant with a new `/model` command

**Decision**: Add `/model` as a new command on the existing `karpathy-wiki.wiki` chat participant instead of creating a separate participant.

**Rationale**: The extension already routes structured participant commands through `extension/src/copilot/wiki-participant.ts` and exposes `query`, `search`, `rebuild`, and `ingest` from one participant. Reusing that entry point preserves the current command model, existing conversation context handling, and shared access to `SearchEngine`, `WikiManager`, and logging.

**Alternatives considered**:

- Create a separate `@model` participant: rejected because it duplicates participant registration, command routing, and shared workspace context.
- Implement `/model` as a standalone VS Code command only: rejected because the feature is explicitly chat-driven and needs conversational response formatting.

## Decision 2: Select the baseline model using grounded wiki retrieval plus deterministic ranking

**Decision**: Use the existing wiki search stack to retrieve candidate model pages, then apply a deterministic ranking layer tuned for modelling relevance to choose the baseline model.

**Rationale**: The workspace already stores semantic-model, glossary, ontology, and business-rule knowledge in `/wiki`, and the extension already has local search and evidence plumbing. A deterministic ranking pass on top of retrieved candidates is enough to choose the best-fit model while keeping the process explainable and testable.

**Alternatives considered**:

- Freeform LLM-only model matching: rejected because it weakens traceability and makes selection logic harder to validate.
- Manual user selection from search results: rejected because it breaks the core requirement of returning a proposal directly from `/model`.

## Decision 3: Return proposal output as markdown plus a YAML OpenMetadata-style contract payload

**Decision**: Format the proposal response in markdown sections and embed the resulting contract as a YAML payload aligned to an OpenMetadata-style schema.

**Rationale**: YAML is readable in chat, easy to include in markdown responses, and suitable for deterministic validation. The spec requires a full resulting contract, a concise change summary, rationale, and cited wiki evidence; markdown sections plus YAML satisfy all of these without introducing binary or proprietary output formats.

**Alternatives considered**:

- JSON-only contract payload: rejected because it is harder to review inline in chat and less consistent with the repo’s markdown-first workflow.
- Plain narrative output only: rejected because it cannot satisfy the required contract compliance checks.

## Decision 4: Validate compliance locally using required field checks rather than external schema services

**Decision**: Implement a local validator that checks proposal compliance against the required OpenMetadata contract structure and required business fields.

**Rationale**: The constitution requires local-first behavior and explicit disclosure for remote usage. A local validator is deterministic, easy to unit test, and directly supports the spec’s compliance definition: attribute name, business rules, validation logic, rationale, and cited wiki evidence.

**Alternatives considered**:

- Remote validation service: rejected because it adds an avoidable dependency and conflicts with local-first constraints.
- Best-effort generation without validation: rejected because the spec explicitly requires compliance validation.

## Decision 5: Reuse the existing evidence/conflict patterns from query responses for modelling proposals

**Decision**: Model proposal generation will reuse the extension’s existing approach to evidence packaging, source references, and conflict disclosure.

**Rationale**: The current query flow already distinguishes grounded evidence, conflicts, and coverage gaps. The new feature needs similar behavior when wiki evidence conflicts or is incomplete, so reusing those patterns reduces implementation risk and keeps user-facing grounded behavior consistent.

**Alternatives considered**:

- Build an unrelated proposal explanation stack: rejected because it duplicates proven traceability logic.
- Hide evidence details unless errors occur: rejected because the spec requires rationale and wiki evidence in normal responses.