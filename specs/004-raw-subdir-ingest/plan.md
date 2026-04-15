# Implementation Plan: Grouped Raw Ingest

**Branch**: `[004-add-raw-subdirs]` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-raw-subdir-ingest/spec.md`

## Summary

Extend the existing VS Code wiki extension so raw ingestion works over nested folder trees, keeps each raw relative path as the source identity, and uses folder membership as local context when generating or updating wiki pages. The implementation will stay inside the current `extension` package by enhancing raw file discovery in `WikiManager`, broadening extraction support for csv alongside markdown/pdf/plain text, passing group metadata through the ingest pipeline, and validating behavior with focused integration tests for recursive discovery, path-safe single-file ingest, and group-isolated wiki output.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`)  
**Primary Dependencies**: `vscode`, existing `WikiManager`, `IngestOrchestrator`, `ExtractionService`, `markdown-it`, `markdown-it-wikilinks`, `pdfjs-dist`, existing markdown/frontmatter utilities  
**Storage**: Local workspace files under `/raw`, `/wiki`, and `.vscode/wiki-cache`  
**Testing**: Jest with `ts-jest`, focused integration tests under `extension/test/integration`, TypeScript `check-types`  
**Target Platform**: VS Code desktop extension runtime on macOS/Linux/Windows  
**Project Type**: VS Code extension  
**Performance Goals**: Complete recursive ingest for the current workspace corpus in one user-triggered operation while streaming progress promptly and without blocking the chat interaction model longer than an ordinary ingest run  
**Constraints**: Local-first filesystem processing only, preserve `/raw` traceability, isolate folder context between groups, keep nested single-file ingest path-safe, do not regress existing flat-root ingest flows  
**Scale/Scope**: Single workspace with tens to hundreds of raw documents across nested folders, one ingest run at a time, one wiki output lineage per raw relative path

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Markdown-First**: PASS. Planning artifacts and contracts remain Markdown-only; wiki outputs continue to be markdown pages with frontmatter.
- **Compounding Knowledge**: PASS. The feature improves how canonical wiki knowledge is created from `/raw` rather than adding ephemeral-only behavior.
- **Traceability**: PASS with explicit implementation constraint. Grouped ingest must preserve `/raw/...` provenance in the constitution-required `Links` field, not only in internal source metadata.
- **Structural Integrity**: PASS. Existing wiki naming rules remain intact; the feature changes ingest metadata and discovery, not wiki filename policy.
- **Quality & Verifiability**: PASS with page-shape preservation. Grouped ingest must not remove or degrade required wiki fields: `Title`, `Summary`, `Tags`, `Links`, and `Content`.

**Post-Design Re-check**: PASS. Research, data model, quickstart, and the ingest contract keep the feature markdown-based, traceable to `/raw`, and aligned with atomic wiki generation through the existing extension architecture.

## Project Structure

### Documentation (this feature)

```text
specs/004-raw-subdir-ingest/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── grouped-ingest.md
└── tasks.md
```

### Source Code (repository root)

```text
extension/
├── src/
│   ├── copilot/
│   │   └── wiki-participant.ts
│   ├── ingest/
│   │   ├── draftGenerator.ts
│   │   ├── extractor.ts
│   │   └── ingestCommand.ts
│   ├── models/
│   │   └── types.ts
│   ├── utils/
│   │   └── markdown-parser.ts
│   └── wiki/
│       └── wiki-manager.ts
└── test/
    └── integration/
        ├── raw-ingest.test.ts
        └── services.test.ts
```

**Structure Decision**: Extend the existing `extension` package in place. `extension/src/wiki/wiki-manager.ts` owns path normalization, safe raw-relative-path resolution, ambiguity detection, recursive discovery, and grouped source assembly. `extension/src/ingest/extractor.ts` owns supported-format extraction. `extension/src/ingest/ingestCommand.ts` and `extension/src/ingest/draftGenerator.ts` own propagation of group context into wiki output. `extension/src/copilot/wiki-participant.ts` owns user-facing ambiguity and failure reporting for targeted and full-tree ingest flows.

## Complexity Tracking

No constitution violations or exceptional complexity allowances are required for this plan.
