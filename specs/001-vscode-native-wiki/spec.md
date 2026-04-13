# Feature Specification: Personal LLM Wiki — VS Code-Native Wiki Implementation

**Feature Branch**: `[###-vscode-native-wiki]`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: VS Code-Native Wiki Implementation — Editor: VS Code; Linking: Foam ([[backlinks]]); AI Agent: GitHub Copilot; Workflows: Ingest (Copilot → `/raw` → `/wiki`), Graphing (Foam Graph), Linting (Foam/VS Code search)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ingest (Priority: P1)

When I drop a new research paper or note into `/raw`, the system extracts concepts and generates 5–10 atomic wiki pages in `/wiki`, each page linking to the original `/raw` file.

Why this priority: Ingest is the core source-of-truth pipeline that populates the wiki.  
Independent Test: Place a representative PDF in `/raw` and run the ingestion command. Verify that 5–10 new Markdown files appear under `/wiki` and each contains a `Links` entry referencing the `/raw` file.

Acceptance Scenarios:
1. Given a new file in `/raw`, when ingestion runs, then 5–10 wiki pages are created with filenames following `YYYYMMDDNN` and each page contains `Title`, `Summary`, `Tags`, `Links`, and `Content` fields.
2. Given extracted concepts that relate to existing pages, when pages are created/updated, then backlinks are inserted using `[[WikiLinks]]` and the Foam graph reflects the relationships.
3. Given no sourceable assertions for a claim, when ingestion would otherwise invent content, then a `Needs Source` research note is created instead (no hallucinations).

---

### User Story 2 - Query (Priority: P1)

I ask a question in VS Code; the agent answers using the wiki and saves the conversation as a `Decision` page for traceability.

Why this priority: Captures human decisions and creates persistent knowledge artifacts.  
Independent Test: Ask a question whose answer is derivable from the wiki, verify the agent's reply cites `Links` from `/raw`, and confirm a new `Decision` page is created under `/wiki/decisions/` with the conversation transcript and links to source pages.

Acceptance Scenarios:
1. The agent must prefer assertions present in `/wiki` (which themselves must trace to `/raw`) when answering.
2. The agent writes a `Decision` page with `Title`, `Summary`, `Tags`, `Links` (pointing to supporting wiki pages and `/raw`), and `Content` (transcript + rationale).

---

### User Story 3 - Lint (Priority: P2)

The system periodically scans the wiki for orphan pages, contradictory claims, or missing sources and produces a remediation report (or PR suggestion) for the maintainer.

Independent Test: Run linting against `/wiki` and confirm output lists orphans, conflicting statements (by simple claim-diff heuristics), and recommended actions (merge/split/add-source).

Acceptance Scenarios:
1. Orphan pages (no inbound links) are listed in a report grouped by tag and age.
2. Conflicting claims that cite different `/raw` sources are flagged for human review with supporting links.

## Acceptance Criteria

- [ ] Automated generation of backlinks between related concepts.
- [ ] Maintenance of a central `index.md` and `glossary.md` under `/wiki`.
- [ ] Support for Obsidian-style `[[WikiLinks]]` in generated pages.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ingest pipeline MUST extract text, metadata, and candidate concept spans from common formats (PDF, TXT, Markdown) in `/raw`.
- **FR-002**: Generated pages MUST follow the constitution's page schema: `Title`, `Summary`, `Tags`, `Links`, `Content`.
- **FR-003**: Filenames MUST follow the `YYYYMMDDNN` convention and be unique per day.
- **FR-004**: Backlinks MUST be created automatically when an extracted concept maps to an existing wiki page.
- **FR-005**: Query responses MUST cite supporting wiki pages and `/raw` sources; conversations MUST be archived as `Decision` pages.
- **FR-006**: Linting must produce actionable reports identifying orphans and contradictory claims.
- **FR-007**: Generated Markdown must remain CommonMark-compatible and Foam-friendly for graph visualization.

### Non-functional Requirements

- Processing latency: single-file ingestion should complete within a reasonable time (configurable); default target: < 2 minutes for typical research PDFs.
- Local-only operation: all content and transformations occur locally unless explicit publish/remote step is approved.

## Key Entities

- **RawDocument**: path, filename, extracted_text, metadata (title, authors, date), hash
- **WikiPage**: filename (YYYYMMDDNN.md), Title, Summary, Tags, Links (paths under `/raw` and `/wiki`), Content (Markdown body)
- **Decision**: archived conversation with references to WikiPages and RawDocuments
- **Index**: `index.md` listing top-level categories and pointers to important pages
- **GlossaryTerm**: canonical name, definition, primary page link, aliases

## Success Criteria *(measurable)*

- SC-001: For 10 representative `/raw` papers, ingestion produces between 5–10 valid wiki pages each, and at least 80% of generated pages include at least one inbound backlink within 24 hours of ingestion.
- SC-002: `index.md` and `glossary.md` are updated after ingestion or by an explicit `index` command and validate against the schema.
- SC-003: Query pipeline archives decisions for 100% of agent-triggered answers and associates them with source links.

## Assumptions

- Foam (or Foam-like linking) is available as a VS Code extension to visualize the graph and resolve `[[WikiLinks]]`.
- GitHub Copilot (or the local Copilot integration) can be invoked programmatically or via a user-assisted command to help extract candidate concepts and draft pages.
- The repository contains `/raw` and `/wiki` directories at the repository root.

## Implementation Notes

1. Pipeline overview:
   - Watcher detects new file in `/raw` → run ingestion CLI command.
   - Extraction: run a local text-extractor (pdf->text) + simple NLP to find candidate concepts (titles, sections, named entities).
    - Draft pages: Copilot assists to synthesize `Summary` + `Content` sections; generated pages must include `Links` back to `/raw` file(s).
       - Pages will be created as entity/concept-level atomic pages (one concept per file) in accordance with the wiki constitution's "Atomic Notes" rule. Filenames follow `YYYYMMDDNN` and each page must include `Title`, `Summary`, `Tags`, `Links`, and `Content` fields.
   - Backlinks: match candidate concepts against existing `WikiPage` titles/aliases and insert `[[WikiLinks]]` and update both pages.
   - Index/Glossary update: append or reconcile entries in `index.md` and `glossary.md`.

2. Safety: If an assertion cannot be grounded in `/raw`, create a `Needs Source` note rather than asserting it as fact.

3. Linting: Implement two modes—`quick` (orphan discovery) and `deep` (claim-diff + source-contrast).

## Clarifications

### Session 2026-04-13

- Q: Preferred page granularity for generated wiki pages (Section-level / Entity-level / Hybrid / Document-per-source)? → A: B — Entity/concept-level atomic pages (one concept per file). 


## Next Steps

- Create `specs/vscode-native-wiki/plan.md` using `.specify/templates/plan-template.md` (Phase 0 → Phase 2).
- Add a minimal ingestion CLI wrapper that can be invoked from VS Code tasks or the command palette.
- Run `.specify/scripts/bash/update-agent-context.sh copilot` to include this feature in agent context (optional, requires environment script execution).

---

**Notes**: All generated pages MUST comply with the wiki constitution: Markdown-first, atomic notes, traceability to `/raw`, and `YYYYMMDDNN` filenames.
