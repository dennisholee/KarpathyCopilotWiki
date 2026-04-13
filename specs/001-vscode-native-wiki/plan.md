# Implementation Plan: VS Code-Native Wiki (Personal LLM Wiki)

**Branch**: `001-vscode-native-wiki` | **Date**: 2026-04-13 | **Spec**: [specs/001-vscode-native-wiki/spec.md](specs/001-vscode-native-wiki/spec.md#L1)

## Summary

Build an ingestion → synthesis → maintenance pipeline that converts source artifacts dropped into `/raw` into Foam-compatible, atomic Markdown pages in `/wiki`. The pipeline will be driven by a CLI and helper modules (extraction, concept discovery, drafting, backlink reconciliation) and integrated into VS Code workflows (Foam graph, command palette) so Copilot can be used as a drafting assistant while all outputs remain traceable to `/raw`.

## Technical Context

**Language/Version**: NEEDS CLARIFICATION (suggested: Python 3.11)  
**Primary Dependencies**: NEEDS CLARIFICATION (suggested: `PyMuPDF` or `pdfminer.six` for PDF extraction; `spaCy` for NLP; `python-markdown` or `markdown-it` for validation; Foam VS Code extension; optional Copilot integration tooling)  
**Storage**: Filesystem (`/raw`, `/wiki`), optional SQLite index for fast lookups (NEEDS CLARIFICATION)  
**Testing**: `pytest` (unit + integration) or NEEDS CLARIFICATION  
**Target Platform**: Local developer environment (macOS/Linux) with VS Code  
**Project Type**: CLI + VS Code workflows + small service utilities  
**Performance Goals**: Ingest typical research PDF in < 2 minutes (configurable)  
**Constraints**: Local-only operation; atomic pages; no hallucinations; strict `YYYYMMDDNN` filenames  
**Scale/Scope**: Initial target: tens–hundreds of `/raw` artifacts, scale to thousands later with indexing

## Constitution Check

GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.

- All generated pages MUST include the fields: `Title`, `Summary`, `Tags`, `Links`, `Content`.  
- Every asserted fact in a page MUST cite at least one `/raw` source in the `Links` field; otherwise the page must be marked `Needs Source`.  
- Filenames MUST follow `YYYYMMDDNN` and be atomic (one concept per file).  
- No remote uploads or publishing without explicit approval.

If any gate fails, document the violation and justify it in the plan before proceeding.

## Project Structure (feature-level)

specs/001-vscode-native-wiki/
- plan.md                # This file
- research.md            # Phase 0 output (create)
- data-model.md          # Phase 1 output (create)
- quickstart.md          # Phase 1 output (create)
- tasks.md               # Phase 2 output (create)

tools/ingest/
- ingest.py              # CLI entrypoint for ingestion
- extract.py             # PDF/text extraction utilities
- concepts.py            # Candidate concept extraction
- draft.py               # Draft page generation (Copilot integration)
- backlink.py            # Backlink insertion & reconciliation

tools/lint/
- orphan_check.py        # Orphan discovery
- claim_diff.py          # Claim-diff heuristics

scripts/
- watch-raw.sh           # File watcher that triggers ingestion

wiki/
- decisions/             # Archived decision transcripts
- index.md
- glossary.md

## Complexity Tracking

If any of the following are required, provide a short justification in the plan and add a Complexity Tracking table:

- Running a remote LLM service for extraction/drafting (violates Local-Only constraint)  
- Non-atomic pages or complex multi-concept merges  
- External publishing or sharing of raw content

## Phase 0: Outline & Research (deliver: `research.md`)

1. Research and choose PDF text extraction library: evaluate `PyMuPDF`, `pdfminer.six`, `pdftotext`.  
2. Research concept extraction approach: headings+section heuristics, NER, topic model or sentence-level keyphrase extraction.  
3. Determine Copilot integration strategy: manual assisted editing vs. scripted prompts (NEEDS CLARIFICATION: do you have Copilot CLI/automation access?).  
4. Define page schema validator and `YYYYMMDDNN` sequence generator.  
5. Produce `research.md` with Decision: chosen libraries, rationale, alternatives.

## Phase 1: Design & Contracts (deliver: `data-model.md`, `/contracts`)

1. Define canonical data model: `RawDocument`, `WikiPage`, `Decision`, `Index`, `GlossaryTerm`.  
2. Define CLI contracts: `ingest add <raw-file>`, `ingest run`, `index rebuild`, `query`, `lint --mode quick|deep`.  
3. Design page creation flow and reconciliation algorithm (idempotent, safe merges, backlink insertion).  
4. Define tests and acceptance criteria for each contract.  
5. Run `.specify/scripts/bash/update-agent-context.sh copilot` (optional; documents this feature to the Copilot agent-scoped context).  

## Phase 2: Implementation (deliver: code + `quickstart.md` + `tasks.md`)

Sprint A — Minimal Viable Ingest

1. Implement `ingest.py` CLI skeleton and `extract.py` with chosen library.  
2. Implement `concepts.py` to extract candidate page titles and summaries.  
3. Implement `draft.py` to generate Markdown page drafts (metadata fields + body), marking unknown assertions as `Needs Source`.  
4. Implement `backlink.py` to insert `[[WikiLinks]]` and update existing pages idempotently.  
5. Add unit tests for extraction and page-schema validation.

Sprint B — Index, Query, Lint

1. Implement `index rebuild` command to update `index.md` and `glossary.md`.  
2. Implement `query` handler that answers using the wiki and archives conversations as `Decision` pages.  
3. Implement `lint` `quick` mode (orphan detection) and `deep` mode (claim-diff + source-contrast).  
4. Add integration tests: place a sample PDF in `/raw` and assert N pages created, backlinks inserted, `index.md` updated, and `Decision` creation for a sample query.

Sprint C — Polish & VS Code Integration

1. Provide `quickstart.md` showing how to run ingestion, view Foam graph, and run linting.  
2. Add VS Code tasks/commands for `ingest run` and `index rebuild`.  
3. Add small UX improvements (interactive prompts when ambiguous, preview drafts before commit).  

## Acceptance Tests & Criteria Mapping

- Automated backlinks: integration test that creates related pages and verifies inbound links.  
- Central `index.md` and `glossary.md`: validate against schema in `data-model.md`.  
- `[[WikiLinks]]` support: generated pages must include explicit `[[Page Title]]` links where applicable and Foam graph should show edges (manual verification).  
- No hallucinations: unit tests verifying that every generated assertion is traceable to `/raw` or is labelled `Needs Source`.

## Deliverables

- `specs/001-vscode-native-wiki/plan.md` (this file)  
- `specs/001-vscode-native-wiki/research.md`  
- `specs/001-vscode-native-wiki/data-model.md`  
- `specs/001-vscode-native-wiki/quickstart.md`  
- `specs/001-vscode-native-wiki/tasks.md`  
- `tools/ingest/*`, `tools/lint/*`, `scripts/watch-raw.sh`, tests/

## Timeline (rough)

- Phase 0 (Research): 1–3 days  
- Phase 1 (Design & Contracts): 2–4 days  
- Phase 2 (Implementation MVP): 1–2 weeks  

## Next Steps (immediate)

1. Confirm language/runtime and Copilot integration approach (manual or automated).  
2. Run Phase 0 research tasks and create `research.md`.  
3. After research, produce `data-model.md` and update the plan if any constitution gates require changes.

---

**Notes**: This plan intentionally marks unknowns as `NEEDS CLARIFICATION`. Provide your preferred language/runtime and whether Copilot automation is available; I will update the plan and generate `research.md` and `data-model.md` next.
