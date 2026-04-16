# Implementation Plan: [FEATURE]

**Branch**: `008-model-guideline-ingest` | **Date**: 2026-04-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Transform files under `raw/guidelines` into structured guideline-style markdown during `@wiki /ingest`. Use an LLM-guided transform module that follows `docs/guidelines/wiki_format_guidelines.md` for structure and creates backlinks only to existing wiki pages (Option A). Preserve source traceability and support idempotent updates on re-ingest.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Node.js 18+ / TypeScript 5.x (aligns with existing extension code)
**Primary Dependencies**: `vscode` extension runtime (existing), `openai` or LLM client (configurable), `markdown-it` for post-processing
**Storage**: Files in `wiki/` directory (markdown files), ingestion metadata in `.vscode/wiki-cache` or project-specific metadata files
**Testing**: Jest (matches repo), integration tests under `test/integration`
**Target Platform**: Developer machine / CI (macOS, Linux)
**Project Type**: VS Code extension + CLI helper (extension/ + scripts/)
**Performance Goals**: N/A for initial implementation — correctness prioritized
**Constraints**: Must not create backlinks to non-existent pages (Option A). LLM calls may be rate-limited; implement retries.
**Scale/Scope**: Expect tens-to-hundreds of guideline documents during bulk ingest; design for incremental processing.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: Extend the existing VS Code extension and CLI utilities under `extension/` and `src/`:

- Add `extension/src/ingest/guidelineRouter.ts` to detect `raw/guidelines` files and route them.
- Add `src/ingest/guidelineTransformer.ts` orchestrating LLM prompts and output formatting.
- Use `wiki/` as output target directory for generated guideline pages.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
