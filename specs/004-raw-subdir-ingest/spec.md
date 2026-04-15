# Feature Specification: Grouped Raw Ingest

**Feature Branch**: `004-add-raw-subdirs`  
**Created**: 2026-04-15  
**Status**: Draft  
**Input**: User description: "when ingesting raw data, allow subdirectories in raw folder to group related data. When analyzing raw, use the folders to group the context and therefore the wiki. Ingest should support csv, markdown, pdf and files."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ingest grouped raw content (Priority: P1)

As a knowledge curator, I can place source material into subdirectories under the raw folder and ingest everything in one run, so related documents stay grouped when wiki content is produced.

**Why this priority**: Folder-based grouping is the core behavior change and is required before the raw library can scale beyond a flat folder.

**Independent Test**: Can be fully tested by placing supported source files in multiple nested raw subdirectories, running ingest once, and verifying the resulting wiki pages preserve their source grouping metadata.

**Acceptance Scenarios**:

1. **Given** raw documents exist in multiple nested subdirectories, **When** the user runs ingest for all raw content, **Then** the system processes files recursively instead of only reading the raw root.
2. **Given** a raw document is stored in a named subdirectory, **When** ingest creates or updates wiki content from that document, **Then** the resulting wiki content records the folder-derived grouping context so related documents can be associated together.

---

### User Story 2 - Analyze within folder context (Priority: P2)

As a knowledge curator, I want documents from the same raw folder group to reinforce one another during ingest analysis, so wiki output reflects the context of a document set instead of each file in isolation.

**Why this priority**: Group-aware analysis improves the quality of the wiki output and is the main reason for supporting subdirectories rather than only recursive file discovery.

**Independent Test**: Can be tested by placing several related files in one folder and unrelated files in another, running ingest, and verifying generated wiki pages include context from the correct folder group without leaking unrelated folder context.

**Acceptance Scenarios**:

1. **Given** multiple related files share a folder, **When** ingest analyzes one of those files, **Then** it uses the folder group as part of the analysis context.
2. **Given** unrelated files exist in different folders, **When** ingest analyzes a source file, **Then** only the current folder group is used to enrich context for that file’s wiki output.

---

### User Story 3 - Support common source formats (Priority: P3)

As a knowledge curator, I can ingest csv, markdown, pdf, and plain text files through the same raw workflow, so I do not need separate processes for common document types.

**Why this priority**: Format coverage determines whether the grouped ingest workflow is practical for the existing raw corpus.

**Independent Test**: Can be tested by placing at least one supported file of each type into raw folders and confirming each file is discovered, extracted, and included in ingest results.

**Acceptance Scenarios**:

1. **Given** supported files of different types exist in raw folders, **When** ingest runs, **Then** csv, markdown, pdf, and plain text files are all accepted and processed.
2. **Given** an unsupported or unreadable file exists in a raw folder, **When** ingest runs, **Then** the failure is reported without stopping ingestion of other supported files.

### Edge Cases

- Raw subdirectories with no supported files are skipped and do not fail the ingest run; they may be summarized as having no ingestible content.
- Files with the same base name in different raw subdirectories are treated as distinct sources because their raw relative paths are different.
- When a folder contains a mix of supported files and files that cannot be parsed, supported files continue processing and failed files are reported individually.
- If a basename-only nested-file target matches more than one raw file, the request is rejected as ambiguous and the user must supply the raw-relative path.
- A user may target a specific file inside a nested raw subdirectory by providing its raw-relative path.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST discover ingestible raw files recursively under the raw directory, including files inside nested subdirectories.
- **FR-002**: The system MUST preserve each raw file’s relative folder path as grouping context during ingestion.
- **FR-003**: The system MUST use the grouping context of a raw folder to enrich analysis for files in that folder.
- **FR-004**: The system MUST keep grouping context isolated so analysis for one folder does not automatically blend in content from unrelated folders.
- **FR-005**: The system MUST support ingesting csv, markdown, pdf, and plain text files through the raw ingestion workflow.
- **FR-006**: The system MUST allow users to ingest either the entire raw tree or a specific supported file located in a nested raw subdirectory.
- **FR-006a**: If a targeted ingest request matches multiple raw files by basename, the system MUST not resolve the target arbitrarily; it MUST reject the request and require a raw-relative path.
- **FR-007**: The system MUST continue processing remaining supported files when one file fails to parse or ingest.
- **FR-007a**: The system MUST report per-file ingest failures using the raw-relative path and a concise failure reason.
- **FR-008**: The system MUST create or update wiki output in a way that preserves traceability back to the original raw file path, including subdirectory location, in the constitution-required `Links` field.
- **FR-008a**: The system MUST preserve required wiki page fields during grouped ingest updates: `Title`, `Summary`, `Tags`, `Links`, and `Content`.
- **FR-009**: The system MUST make folder grouping visible in generated wiki metadata or content so grouped wiki pages can be understood and navigated together.
- **FR-010**: The system MUST identify raw source documents by their raw relative paths, so files with the same base name in different subdirectories remain separate sources and do not overwrite or merge implicitly.

### Key Entities *(include if feature involves data)*

- **Raw Folder Group**: A relative raw subdirectory that defines a related set of source documents and the shared context used during ingest analysis.
- **Raw Source Document**: A supported file in the raw tree, including its relative path, file type, extracted content, and grouping membership.
- **Grouped Wiki Page**: Wiki output created or updated from a raw source document, including source traceability, folder-derived grouping metadata, and path-based identity when filenames repeat across groups.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can run a single ingest operation over a nested raw directory tree without manually flattening folders first.
- **SC-002**: 100% of supported files placed in nested raw subdirectories are discovered and considered during ingest.
- **SC-003**: Wiki output for a file in a grouped folder includes source traceability and grouping information that lets a user identify the file’s raw folder without opening the raw tree.
- **SC-004**: A parsing failure in one supported file does not prevent the remaining supported files in the same ingest run from being processed.
- **SC-005**: Files sharing the same base name in different raw subdirectories remain distinguishable after ingest and do not overwrite one another's wiki output.

## Assumptions

- Plain text files include common text-based formats such as `.txt`.
- Folder grouping is derived from the file’s relative path under the raw directory rather than from a separate manifest.
- Existing wiki generation and indexing flows remain in place; this feature extends ingest discovery, extraction, and contextual grouping.
- When a file lives directly under the raw root, it is treated as part of the default top-level raw group.

## Clarifications

### Session 2026-04-15

- Q: Which identity rule should govern files with the same base name in different raw subdirectories? → A: Treat each raw relative path as a distinct source and keep separate wiki pages even if filenames match.