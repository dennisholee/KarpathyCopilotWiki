# Implementation Plan: Add Model Participant

**Branch**: `[003-add-model-participant]` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-add-model-participant/spec.md`

## Summary

Add a `/model` command to the existing `@wiki` chat participant so users can submit modelling requirements and receive a grounded proposal based on the best matching existing model in the workspace wiki. The feature will reuse the current search/wiki infrastructure to retrieve model evidence, add a dedicated modeling pipeline to select a baseline model, synthesize an enhanced OpenMetadata-style contract, validate required business fields, and return a full resulting contract with a concise change summary, rationale, and cited wiki evidence.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`)  
**Primary Dependencies**: `vscode` chat participant API, existing `SearchEngine`, `WikiManager`, `QueryHandler`-style evidence assembly patterns, `markdown-it`, `markdown-it-wikilinks`, `@tensorflow-models/universal-sentence-encoder`, `@tensorflow/tfjs`, `pdfjs-dist`  
**Storage**: Local workspace files under `/wiki`, `/raw`, and `.vscode/wiki-cache`  
**Testing**: Jest with `ts-jest`, existing integration tests in `extension/test/integration`, TypeScript `check-types`  
**Target Platform**: VS Code desktop extension runtime on macOS/Linux/Windows  
**Project Type**: VS Code extension  
**Performance Goals**: Interactive Copilot Chat workflow; stream acknowledgement immediately and complete typical proposal generation for the current wiki corpus within one chat turn without blocking the UI  
**Constraints**: Local-first evidence retrieval, explicit conflict disclosure, no proposal generation when no credible baseline model exists, required compliance validation for contract structure plus business fields, no automatic model application  
**Scale/Scope**: Single workspace corpus with hundreds of wiki/raw documents, one proposal per `/model` request, one participant command added to the current extension

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Markdown-First**: PASS. Planning artifacts are Markdown/YAML only; proposal output will be markdown with a standards-compliant contract payload.
- **Compounding Knowledge**: PASS. The feature derives proposals from canonical wiki knowledge instead of producing ungrounded ad hoc content.
- **Traceability**: PASS. The spec requires cited wiki evidence and conflict disclosure; implementation will preserve source references from supporting wiki pages.
- **Structural Integrity**: PASS. The feature extends the existing chat participant and does not require new canonical wiki file naming behavior during proposal generation.
- **Quality & Verifiability**: PASS. The proposal contract will include deterministic compliance checks for required fields and explicit handling of unsupported assumptions.

**Post-Design Re-check**: PASS. Research, data model, quickstart, and contracts keep the feature local-first, traceable, markdown/yaml-based, and grounded in existing `/wiki` and `/raw` content.

## Project Structure

### Documentation (this feature)

```text
specs/003-add-model-participant/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── model-participant.md
│   └── openmetadata-model-proposal.yaml
└── tasks.md
```

### Source Code (repository root)

```text
extension/
├── src/
│   ├── copilot/
│   │   └── wiki-participant.ts
│   ├── models/
│   │   └── types.ts
│   ├── modeling/
│   │   ├── modelMatcher.ts
│   │   ├── proposalBuilder.ts
│   │   ├── contractValidator.ts
│   │   └── proposalFormatter.ts
│   ├── query/
│   ├── search/
│   ├── wiki/
│   └── utils/
└── test/
    ├── integration/
    └── unit/
```

**Structure Decision**: Extend the existing `extension` package rather than creating a separate service. Route `/model` through `extension/src/copilot/wiki-participant.ts`, add a dedicated `extension/src/modeling/` slice for matching/proposal/validation logic, reuse `search`, `wiki`, and shared `models` infrastructure, and cover the feature with integration tests plus focused unit tests for deterministic proposal validation.

## Complexity Tracking

No constitution violations or exceptional complexity allowances are required for this plan.
