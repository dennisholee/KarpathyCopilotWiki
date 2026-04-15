# Quickstart: Grouped Raw Ingest

## Prerequisites

- Open the repository in VS Code.
- Ensure the extension dependencies in `extension/package.json` are installed.
- Place sample source files under `/raw`, including at least one nested folder.

## Example raw tree

```text
raw/
├── overview.md
├── banking/
│   ├── risk/
│   │   └── customer.csv
│   └── operations/
│       └── controls.pdf
└── research/
    └── notes.txt
```

## Validate the feature locally

1. From the `extension` directory, run `npm run check-types`.
2. Run `npx jest test/integration/raw-ingest.test.ts --runInBand --coverage=false`.
3. Run `npx jest test/integration/services.test.ts --runInBand --coverage=false`.

## Exercise the chat workflow

1. Start the extension in a VS Code Extension Development Host.
2. Open Copilot Chat and run `@wiki /ingest` to process the full raw tree.
3. Verify that created or updated wiki pages preserve `/raw/...` source references and show folder grouping.
4. Run `@wiki /ingest banking/risk/customer.csv` and verify the response identifies the nested file and folder group.
5. Confirm that files with the same base filename in different folders remain separate sources after ingest.

## Expected outcomes

- Nested raw files are discovered without flattening the directory tree.
- Same-folder files enrich one another's wiki output, while unrelated folders stay isolated.
- Csv, markdown, pdf, and plain text files all flow through the same ingest entry point.
- A single bad file does not abort the full ingest run.