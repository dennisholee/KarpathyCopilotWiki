# Implementation Plan: OpenMetadata Contract Alignment

**Branch**: `[007-openmetadata-contract-alignment]` | **Date**: 2026-04-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-openmetadata-contract-alignment/spec.md`

**Note**: The feature directory remains `006-openmetadata-contract-alignment` while the active branch is `007-openmetadata-contract-alignment`; branch numbering reflects creation sequence, and directory numbering reflects the existing feature id.

## Summary

Align proposal-style `@wiki /model` responses to the organization’s OpenMetadata-style data contract shape without changing definition-only responses. The implementation will replace the current custom proposal contract structure with an OpenMetadata-aligned contract object, keep evidence and rationale outside the contract as review sections, serialize grounded schema fields into `schemaText`, represent operational quality and SLA evidence through `resources`, and preserve unresolved ownership, incident, or operational details as explicit gaps rather than fabricated values. The work will update the shared modeling types, proposal builder, formatter, and validator together, then refresh focused integration and unit coverage so derive and enhance flows produce the new contract shape consistently.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`)  
**Primary Dependencies**: `vscode` chat participant API, existing `WikiChatParticipant`, `SearchEngine`, `QueryHandler`, `markdown-it`, current modeling helpers in `extension/src/modeling/`, local wiki corpus including OpenMetadata guideline content  
**Storage**: Local workspace files under `/wiki`, `/raw`, and `.vscode/wiki-cache`  
**Testing**: Jest with `ts-jest`, `npm run check-types`, focused `/model` integration coverage in `extension/test/integration/copilot.test.ts`, and deterministic modeling unit tests for matcher, builder, formatter, and validator  
**Target Platform**: VS Code desktop extension runtime on macOS/Linux/Windows  
**Project Type**: VS Code extension  
**Performance Goals**: Keep `/model` interactive within a single chat turn and avoid materially increasing formatting or validation overhead relative to the current proposal path  
**Constraints**: Local-first evidence retrieval, markdown plus YAML response output only, raw-source traceability for grounded proposal content, no fabricated owner/schema/operational values, definition-style `/model` responses remain non-contract summaries  
**Scale/Scope**: Single extension package, hundreds of wiki/raw documents, derive and enhance proposal flows only, one aligned contract proposal per `/model` request

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Markdown-First**: PASS. The feature continues to emit markdown responses with embedded YAML contracts and does not introduce non-markdown storage or review formats.
- **Compounding Knowledge**: PASS. All aligned contract fields remain derived from the existing wiki corpus and ingested guideline material.
- **Traceability**: PASS. The design preserves explicit evidence sections and raw-source references for grounded contract content, including schema and operational sections.
- **Structural Integrity**: PASS. The work stays inside the existing `extension` package and reuses the current `/model` participant path rather than introducing a parallel modeling subsystem.
- **Quality & Verifiability**: PASS. The contract shape, evidence mapping, unresolved-gap handling, and definition-response exclusion are all testable with deterministic unit and integration coverage.

**Post-Design Re-check**: PASS. The resulting design artifacts preserve grounded markdown-first outputs, keep operational gaps explicit, and avoid constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/006-openmetadata-contract-alignment/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── model-query-participant.md
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
│   │   └── [new serialization helpers if needed]
│   ├── models/
│   │   └── types.ts
│   ├── query/
│   ├── search/
│   └── wiki/
└── test/
    ├── integration/
    │   └── copilot.test.ts
    └── unit/
        └── modeling/
```

**Structure Decision**: Extend the existing `extension` package and current `/model` command flow. Keep request routing and intent handling in `extension/src/copilot/wiki-participant.ts`, evolve `extension/src/models/types.ts` to define the new OpenMetadata-aligned proposal contract, update `proposalBuilder.ts` to map grounded evidence into the new contract sections, update `proposalFormatter.ts` to render the aligned YAML and surrounding evidence sections, and tighten `contractValidator.ts` so aligned proposals fail fast when required grounded sections are absent. Reuse the current matcher and evidence pipeline unless targeted ranking adjustments are needed to keep generic pages out of the aligned operational sections.

## Complexity Tracking

No constitution violations or exceptional complexity allowances are required for this plan.

