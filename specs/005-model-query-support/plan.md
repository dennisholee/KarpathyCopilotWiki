# Implementation Plan: Model Query Support

**Branch**: `[005-model-query-support]` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-model-query-support/spec.md`

## Summary

Extend the existing `@wiki /model` workflow from a baseline-enhancement-only path into a three-intent modelling assistant that can derive a new model from grounded wiki evidence, enhance an existing model with evidence-backed placement decisions, or return a grounded model-definition summary without generating a contract. The implementation will reuse the current search and evidence pipeline, add intent classification and guideline resolution ahead of baseline selection, improve candidate ranking to prefer domain-specific model pages over generic glossary/index pages, and introduce separate response paths for derived contracts, enhancement contracts, and informational model summaries while defaulting contract generation to the OpenMetadata schema when no explicit guideline governs the request. The implementation will also define a representative evaluation corpus so the percentage-based success criteria can be measured consistently across derive, enhance, define, and guideline-fallback behaviors.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`)  
**Primary Dependencies**: `vscode` chat participant API, existing `WikiChatParticipant`, `QueryHandler`, `SearchEngine`, `WikiManager`, current modeling helpers in `extension/src/modeling/`, local markdown/wiki corpus, OpenMetadata guideline content already ingested into `/wiki`  
**Storage**: Local workspace files under `/wiki`, `/raw`, and `.vscode/wiki-cache`  
**Testing**: Jest with `ts-jest`, TypeScript `check-types`, integration coverage in `extension/test/integration`, deterministic unit tests for modeling helpers, and a representative `/model` evaluation corpus with expected outcomes for derive/enhance/define/refinement scenarios plus scored pass/fail results against SC-001 through SC-005  
**Target Platform**: VS Code desktop extension runtime on macOS/Linux/Windows  
**Project Type**: VS Code extension  
**Performance Goals**: Keep `/model` interactive in one chat turn; stream acknowledgement immediately and complete intent classification plus proposal or definition rendering against the current wiki corpus without blocking the VS Code UI  
**Constraints**: Local-first evidence retrieval, markdown/yaml-only outputs, explicit traceability to `/raw`, no fabricated schema details when evidence is incomplete, no contract output for informational definition requests, guideline precedence must be explainable  
**Scale/Scope**: Single extension package, hundreds of wiki/raw documents, one `/model` response per request, three supported `/model` intents (`derive`, `enhance`, `define`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Markdown-First**: PASS. Planning artifacts, participant response contracts, and default proposal payloads remain markdown/yaml only.
- **Compounding Knowledge**: PASS. The feature derives and explains models from canonical wiki knowledge rather than inventing standalone content outside the workspace corpus.
- **Traceability**: PASS. The plan requires evidence bundles and raw-source citations for derived, enhancement, and definition responses so every `/model` output can be traced back through wiki evidence to `/raw` sources.
- **Structural Integrity**: PASS. The feature extends the existing `extension` package and existing `/model` command flow; it does not introduce new wiki storage formats.
- **Quality & Verifiability**: PASS. Intent classification, guideline precedence, baseline ranking, evidence usage, and response shape are all designed for deterministic validation and focused tests.

**Post-Design Re-check**: PASS. The design artifacts preserve local-first modeling behavior, markdown/yaml outputs, raw-source traceability, and explicit handling of assumptions/conflicts without constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-model-query-support/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── model-query-participant.md
│   ├── model-definition-summary.yaml
│   └── openmetadata-model-proposal.yaml
└── tasks.md
```

### Source Code (repository root)

```text
extension/
├── src/
│   ├── copilot/
│   │   └── wiki-participant.ts
│   ├── modeling/
│   │   ├── contractValidator.ts
│   │   ├── modelMatcher.ts
│   │   ├── proposalBuilder.ts
│   │   ├── proposalFormatter.ts
│   │   └── [new intent/guideline helpers if needed]
│   ├── models/
│   │   └── types.ts
│   ├── query/
│   ├── search/
│   ├── wiki/
│   └── utils/
└── test/
    ├── integration/
    └── unit/
```

**Structure Decision**: Extend the existing `extension` package and current `/model` participant route. Keep command handling in `extension/src/copilot/wiki-participant.ts`, evolve the `extension/src/modeling/` slice to cover intent classification, evidence-aware baseline selection, derived-model synthesis, informational definition formatting, and guideline resolution, and validate the feature through integration tests plus targeted unit tests for deterministic modeling logic. The ranking layer must be shared across enhancement baseline selection and definition-summary evidence selection so glossary and index pages do not dominate either workflow.

## Complexity Tracking

No constitution violations or exceptional complexity allowances are required for this plan.
