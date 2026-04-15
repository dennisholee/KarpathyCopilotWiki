# Research: Grouped Raw Ingest

## Decision 1: Discover raw files recursively and normalize identity by raw relative path

- **Decision**: Use recursive traversal under `/raw` and treat each file's raw relative path as the canonical ingest identity.
- **Rationale**: Recursive traversal satisfies the core user story without requiring users to flatten folders. Path-based identity avoids collisions when two different folders contain the same base filename and preserves exact traceability back to `/raw`.
- **Alternatives considered**:
  - Flat-root discovery only: rejected because it does not satisfy the feature's primary behavior.
  - Filename-only identity: rejected because duplicate names across folders would overwrite or merge unrelated sources.
  - Folder manifest files: rejected because the spec explicitly derives grouping from directory structure instead of adding a separate authoring burden.

## Decision 2: Use folder membership as contextual enrichment, but keep groups isolated

- **Decision**: Build per-folder source groups and pass only same-folder source references into wiki generation for each file.
- **Rationale**: The user wants related documents in the same folder to reinforce one another during analysis, but unrelated folders must not contaminate output. Group isolation also makes behavior explainable and testable.
- **Alternatives considered**:
  - Global enrichment from all raw files: rejected because it leaks unrelated context and weakens determinism.
  - No enrichment beyond single-file content: rejected because it misses the main value of grouped folders.
  - Multi-level ancestor blending across nested folders: rejected for now because the spec only requires folder-derived grouping, not hierarchical inference rules.

## Decision 3: Expand the existing extraction service instead of adding a parallel importer

- **Decision**: Extend `ExtractionService` to support csv alongside existing markdown/plain-text/pdf extraction paths.
- **Rationale**: The repo already centralizes raw text extraction in one service. Adding csv there keeps format routing consistent, minimizes new surface area, and preserves the current ingest orchestration.
- **Alternatives considered**:
  - A new csv-only pipeline: rejected because it duplicates extraction responsibility and complicates testing.
  - External parser dependencies: rejected because the current need is simple row-to-text conversion and does not justify new packages.
  - Treat csv as opaque text without row parsing: rejected because structured key-value output improves concept extraction and traceability.

## Decision 4: Fail per file, continue per run

- **Decision**: Catch extraction/ingest failures at the file level, log/report them, and continue processing remaining supported files.
- **Rationale**: The spec explicitly requires one bad file not to block the rest of the ingest run. Per-file failure isolation is the least surprising operational behavior for a raw corpus.
- **Alternatives considered**:
  - Abort the entire ingest run on first failure: rejected because it violates FR-007 and harms batch usability.
  - Ignore failures silently: rejected because operators need traceable failure reporting.
  - Retry with alternate parsing backends for all failed files: deferred because it is outside the current scope.