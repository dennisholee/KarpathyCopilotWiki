# Data Model: Grouped Raw Ingest

## Raw Folder Group

- **Purpose**: Represents the relative directory under `/raw` that defines a shared local context for ingest.
- **Fields**:
  - `groupPath`: normalized relative folder path using `/` separators; empty string means raw root.
  - `displayName`: human-readable label derived from `groupPath` or `raw-root` for the top level.
  - `documentPaths`: ordered set of raw relative paths belonging to the group.
- **Relationships**:
  - One raw folder group contains many raw source documents.
  - One grouped wiki page references exactly one source document and may cite many documents from the same folder group as contextual peers.
- **Validation Rules**:
  - `groupPath` must remain relative to `/raw`.
  - `groupPath` must not escape the raw root.
  - Root-level files map to the default top-level group.

## Raw Source Document

- **Purpose**: Represents one ingestible file discovered in the raw tree.
- **Fields**:
  - `absolutePath`: filesystem path used for reading the file.
  - `relativePath`: canonical source identity under `/raw`.
  - `groupPath`: owning raw folder group.
  - `extension`: detected file type such as `.csv`, `.md`, `.markdown`, `.pdf`, or `.txt`.
  - `extractedText`: normalized text output used by the ingest pipeline.
  - `sourceReference`: normalized wiki-facing source reference, e.g. `/raw/banking/risk/customer.csv`.
  - `extractionMethod`: `text`, `pdfjs`, or fallback result.
  - `confidence`: extraction confidence used by downstream quality checks.
- **Relationships**:
  - Belongs to one raw folder group.
  - Produces or updates one grouped wiki page per ingest target.
- **Validation Rules**:
  - `relativePath` must be unique within an ingest run.
  - Duplicate base filenames are allowed if `relativePath` differs.
  - Unsupported or unreadable files must surface a per-file failure without invalidating other documents.

## Grouped Wiki Page

- **Purpose**: Represents wiki output generated or updated from one raw source document while preserving folder context.
- **Fields**:
  - `pageId`: existing wiki page slug or generated slug.
  - `title`: derived from extracted metadata, headings, or filename.
  - `content`: markdown body enriched with group context.
  - `tags`: includes source-format tags plus optional group-derived tags.
  - `sourceReferences`: includes the canonical raw source reference for the document.
  - `groupPath`: folder-derived grouping marker stored in metadata or content.
  - `relatedGroupSources`: same-folder source references used to explain context.
- **Relationships**:
  - Originates from one raw source document.
  - May mention sibling raw source documents from the same raw folder group.
- **Validation Rules**:
  - Must preserve at least one raw source reference.
  - Must not cite unrelated folder groups as contextual siblings.
  - Must remain distinguishable when different source documents share the same base filename.

## State Transitions

1. A filesystem entry under `/raw` is discovered.
2. If the entry is a supported file, it becomes a `Raw Source Document` with a canonical `relativePath` and `groupPath`.
3. Extraction produces `extractedText` and metadata.
4. The ingest pipeline combines extracted text with same-group context.
5. The system creates or updates a `Grouped Wiki Page` while preserving `sourceReferences`, grouping metadata, and path-based identity.
6. If extraction or ingest fails for a file, that document transitions to a reported failure state while the run continues for other documents.