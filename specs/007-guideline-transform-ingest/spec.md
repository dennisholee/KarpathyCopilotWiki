# Feature Specification: Guideline Transform Ingest

**Feature Branch**: `008-model-guideline-ingest`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: User description: "when using \"@wiki /ingest\", for files that are in raw/guidelines, use llm chat to transform the data into and application domain model guideline document. use @file:wiki_format_guidelines.md as reference for the format structure. the resulting guideline should be a markdown format with backlinks for connecting document where neccessary."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Transform guideline sources during ingest (Priority: P1)

As a knowledge curator, I can place guideline-oriented source documents under `raw/guidelines` and ingest them directly into application domain model guideline pages, so the wiki captures reusable domain guidance instead of only producing generic summaries.

**Why this priority**: This is the core user outcome. Without special handling for guideline sources, the ingest workflow does not produce the intended guideline-style knowledge assets.

**Independent Test**: Can be fully tested by placing one or more source documents under `raw/guidelines`, running `@wiki /ingest`, and verifying that the resulting wiki page is a guideline-style markdown document rather than a generic ingest summary.

**Acceptance Scenarios**:

1. **Given** a supported source file exists under `raw/guidelines`, **When** the user runs `@wiki /ingest`, **Then** the system creates or updates a guideline-style markdown page derived from that source.
2. **Given** multiple supported source files exist under `raw/guidelines`, **When** the user runs `@wiki /ingest`, **Then** each file is transformed into its own guideline-oriented wiki output without requiring a separate workflow.

---

### User Story 2 - Preserve the standard guideline format (Priority: P1)

As a domain stakeholder, I receive guideline pages in a consistent DataBook-style markdown structure, so the generated guidance is readable, navigable, and compatible with the team’s documentation standard.

**Why this priority**: The value of the feature depends on the generated content following the agreed documentation format, not merely being converted to markdown.

**Independent Test**: Can be fully tested by ingesting a guideline source and verifying the resulting wiki page follows the reference documentation structure with the expected metadata, headings, and organized sections.

**Acceptance Scenarios**:

1. **Given** a guideline source is ingested, **When** the resulting wiki page is generated, **Then** the page follows the standardized guideline markdown structure used by the project’s wiki format reference.
2. **Given** the source supports related concepts, metadata, or rule content, **When** the guideline page is generated, **Then** the content is organized into the appropriate structured sections instead of being emitted as an unstructured block of text.

---

### User Story 3 - Connect generated guideline pages with backlinks (Priority: P2)

As a wiki reader, I can navigate from a generated guideline page to related concepts, rules, and documents through backlinks, so guideline documents form a connected knowledge graph rather than isolated pages.

**Why this priority**: Backlinks are required for the wiki to be practically useful as a semantic layer and were explicitly requested for generated guideline output.

**Independent Test**: Can be fully tested by ingesting a guideline source that references known concepts or related documents and verifying the generated page includes wiki-style links where those relationships are grounded.

**Acceptance Scenarios**:

1. **Given** the ingested guideline source references concepts or documents already represented in the wiki corpus, **When** the page is generated, **Then** the output includes wiki-style backlinks to those related documents where appropriate.
2. **Given** a relationship cannot be grounded to a known or derivable document target, **When** the page is generated, **Then** the system avoids inventing unsupported backlinks.

---

### User Story 4 - Keep special handling scoped to guideline sources (Priority: P3)

As a knowledge curator, I can continue ingesting non-guideline raw content without it being forced into the guideline template, so the new behavior applies only to the guideline subset of the raw corpus.

**Why this priority**: This bounds the feature and prevents regressions in the broader raw ingest workflow.

**Independent Test**: Can be fully tested by ingesting both a file under `raw/guidelines` and a supported file outside that path, then verifying only the guideline-path file receives guideline-style transformation.

**Acceptance Scenarios**:

1. **Given** a supported file is located under `raw/guidelines`, **When** ingest runs, **Then** the file is transformed using the guideline-oriented output behavior.
2. **Given** a supported file is located outside `raw/guidelines`, **When** ingest runs, **Then** the file continues through the existing non-guideline ingest behavior.

### Edge Cases

- If a source under `raw/guidelines` lacks enough structure to populate every recommended section, the generated page still follows the guideline format and leaves unsupported sections out rather than fabricating content.
- If a guideline source mentions related documents that do not yet exist in the wiki, the generated page does not create broken or speculative backlinks.
- If a source under `raw/guidelines` is re-ingested after content changes, the guideline page updates while preserving its identity and traceability to the same source.
- If a non-guideline source is moved into `raw/guidelines`, the next ingest treats it as guideline-oriented content based on its location.
- If ingest encounters a parsing failure for one guideline source, remaining guideline and non-guideline files continue processing and the failed source is reported.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST detect when an ingested source file is located under `raw/guidelines`.
- **FR-002**: The system MUST apply a guideline-oriented transformation flow to supported sources under `raw/guidelines` during `@wiki /ingest`.
- **FR-003**: The system MUST generate guideline-oriented output as markdown.
- **FR-004**: The system MUST structure generated guideline pages according to the project’s standardized wiki guideline format, including machine-readable metadata and organized section headings when supported by the source material.
- **FR-004a**: Every generated guideline page MUST include YAML frontmatter with the core metadata fields required by the project guideline format, even when some field values are unresolved and must be explicitly marked as such.
- **FR-005**: The system MUST transform guideline sources into application domain model guideline documents rather than generic summary pages.
- **FR-006**: The system MUST preserve traceability from each generated guideline page back to the originating raw source document.
- **FR-007**: The system MUST create wiki-style backlinks in generated guideline pages when related concepts, rules, or documents can be grounded from the source material or existing wiki corpus.
- **FR-008**: The system MUST NOT invent unsupported backlinks, relationships, or document references.
- **FR-009**: The system MUST keep guideline-specific transformation behavior scoped to files under `raw/guidelines`.
- **FR-010**: The system MUST preserve the existing ingest behavior for supported files outside `raw/guidelines`.
- **FR-011**: The system MUST allow repeated ingest of the same guideline source to update the corresponding guideline page instead of creating ambiguous duplicate outputs.
- **FR-011a**: The system MUST treat generated guideline pages as fully managed ingest artifacts and fully regenerate their derived content on re-ingest rather than preserving manual edits within the generated page.
- **FR-012**: The system MUST continue processing remaining sources when one guideline source fails to parse or transform, and it MUST report the failed source.
- **FR-013**: The system MUST omit unsupported sections from generated guideline pages when the source material does not justify them, rather than fabricating content.
- **FR-014**: The system MUST organize generated content so stakeholders can distinguish concepts, metadata, rules, and lineage-oriented information when those elements are present in the source.
- **FR-015**: The system MUST generate one structured guideline page per source document under `raw/guidelines`, using sections within that page rather than splitting a single source into multiple wiki pages by default.

### Key Entities *(include if feature involves data)*

- **Guideline Source Document**: A raw document stored under `raw/guidelines` that should be transformed into a domain model guideline page during ingest.
- **Derived Guideline Page**: The generated markdown wiki document produced from a guideline source, including standardized structure, traceability, and navigational links.
- **Guideline Backlink**: A wiki-style reference from a derived guideline page to another relevant concept, rule, or document that is grounded in the source material or existing corpus.
- **Guideline Format Reference**: The project-standard documentation structure that defines how generated guideline pages are organized and presented.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of supported files ingested from `raw/guidelines` produce markdown guideline pages rather than generic summary output.
- **SC-002**: 100% of measured generated guideline pages from `raw/guidelines` follow the standard guideline document structure closely enough to pass manual review against the project reference format.
- **SC-003**: 100% of measured generated guideline pages include source traceability back to the originating raw guideline file.
- **SC-004**: 100% of measured non-guideline files outside `raw/guidelines` continue to use the pre-existing ingest behavior.
- **SC-005**: For guideline sources that reference existing related documents, generated pages include grounded backlinks that allow a reviewer to navigate to those related documents without manual editing.

## Assumptions

- The `raw/guidelines` directory is the authoritative signal that an ingested source should be treated as guideline-oriented content.
- The existing ingest workflow already supports the source file formats that will be used under `raw/guidelines`.
- The project’s wiki format guideline is the governing reference for output structure, and generated pages should align to it without reproducing unsupported sections.
- Existing wiki pages and ingest metadata provide enough context to resolve at least some backlink targets for related concepts and documents.
- The feature extends the current ingest flow rather than introducing a separate manual command for guideline transformation.

## Clarifications

### Session 2026-04-16

- Q: Backlink policy for generated guideline pages → A: Option A - Only create backlinks to existing wiki pages (recommended).
- Q: How should guideline page granularity work for files under `raw/guidelines`? → A: Option B - Generate one structured guideline page per source document, with sections and backlinks inside that page.
- Q: How should re-ingest handle an existing generated guideline page? → A: Option A - Re-ingest fully regenerates and replaces the derived guideline page content.
- Q: Should generated guideline pages always include YAML frontmatter? → A: Option A - Every generated guideline page must include YAML frontmatter with core metadata fields.