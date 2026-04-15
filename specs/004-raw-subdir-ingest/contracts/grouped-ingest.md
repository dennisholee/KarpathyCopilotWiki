# Contract: Grouped Raw Ingest

## Purpose

Define the expected command-level behavior for recursive raw ingest and targeted nested-file ingest in the `@wiki` chat participant.

## Inputs

### Full-tree ingest

- **Invocation**: `@wiki /ingest`
- **Behavior**:
  - Recursively discover supported files under `/raw`.
  - Process csv, markdown, pdf, and plain text sources.
  - Preserve raw-relative-path identity for each source.
  - Continue when individual files fail.

### Targeted nested-file ingest

- **Invocation**: `@wiki /ingest banking/risk/customer.csv`
- **Behavior**:
  - Resolve the target safely within `/raw`.
  - Reject paths that escape `/raw`.
  - If the supplied basename matches more than one file, return an ambiguity response that instructs the user to provide the raw-relative path.
  - Use the file's folder as the only group-context source set.
  - Report success using the normalized raw-relative path.

## Outputs

### Success response requirements

- Must state whether pages were created or updated.
- Must include the source raw file path or indicate all-file ingest.
- Must indicate folder grouping when a nested file is targeted.
- Must keep wiki output traceable to `/raw/...` paths.

### Failure response requirements

- Unsupported or unreadable files must produce per-file failure reporting.
- Per-file failure reporting must include the raw-relative path and a concise failure reason.
- One failed file must not stop the rest of a full-tree ingest run.
- Ambiguous nested-file targets must not resolve arbitrarily.

## Supported Formats

- `.csv`
- `.md`
- `.markdown`
- `.pdf`
- `.txt`

Unknown extensions may be attempted through existing fallback extraction logic, but the feature only guarantees the formats above.