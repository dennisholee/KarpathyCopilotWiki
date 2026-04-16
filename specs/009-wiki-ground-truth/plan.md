# Implementation Plan: Wiki Ground Truth Toggle

**Branch**: `009-wiki-ground-truth` | **Date**: 2026-04-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/009-wiki-ground-truth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Add a user-visible `@wiki` answer mode setting that toggles between strict wiki-only grounding and flexible wiki-first answering. Implement the control through extension configuration, enforce the mode inside the `WikiChatParticipant` query flow, preserve wiki evidence and citations in both modes, and make the active mode explicit in user-facing answers.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`)  
**Primary Dependencies**: `vscode` chat participant API, existing `WikiChatParticipant`, `QueryHandler`, `SearchEngine`, `WikiManager`, `answerPrompt` helpers, existing extension configuration in `extension/package.json`  
**Storage**: Workspace files in `wiki/`, extension configuration settings, existing in-memory query/evidence objects  
**Testing**: Jest unit and integration tests under `extension/test`  
**Target Platform**: VS Code extension runtime on developer machines / CI (macOS, Linux)
**Project Type**: VS Code extension  
**Performance Goals**: No material regression to existing `@wiki` query latency; mode evaluation should add negligible overhead beyond current query and optional remote synthesis flow  
**Constraints**: Must preserve constitution local-first policy, must not alter ingest/index behavior, must switch modes on the next request without restart, must preserve wiki citations in both modes  
**Scale/Scope**: Single setting affecting all `@wiki` requests within one workspace; expected wiki corpus size remains tens to low-thousands of pages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Markdown-First**: PASS. The feature changes answer behavior and settings only; no non-Markdown content is introduced.
- **Compounding Knowledge**: PASS. Strict mode strengthens reliance on the canonical wiki corpus; flexible mode still prioritizes wiki evidence.
- **Traceability**: PASS with constraint. Strict mode must answer only from wiki evidence, and flexible mode must continue surfacing wiki references whenever wiki evidence contributes.
- **Structural Integrity**: PASS. No new wiki file naming or storage changes are required for this feature.
- **Quality & Verifiability / Local-First**: PASS with design rule. Remote synthesis remains optional and must obey the selected mode; strict mode must not let remote synthesis introduce unsupported claims.

No constitutional violations identified.

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
extension/
├── package.json
├── src/
│   ├── copilot/
│   ├── query/
│   ├── search/
│   ├── wiki/
│   └── utils/
└── test/
  ├── integration/
  └── unit/

specs/009-wiki-ground-truth/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

**Structure Decision**: Extend the existing VS Code extension only.

- Update `extension/package.json` with the new `@wiki` ground-truth mode setting.
- Update `extension/src/copilot/wiki-participant.ts` to read the setting, announce the active mode, and route answer generation accordingly.
- Update `extension/src/query/queryCommand.ts` and prompt helpers as needed so strict mode stays wiki-only and flexible mode remains wiki-first.
- Add integration coverage in `extension/test/integration/copilot.test.ts` and supporting unit coverage in `extension/test/unit` if helper logic is extracted.

## Phase 0 Research

- Research decisions captured in [research.md](research.md).
- All identified technical unknowns for this feature are resolved without requiring additional clarification.

## Phase 1 Design

- Data model captured in [data-model.md](data-model.md).
- User-facing setting contract captured in [contracts/ground-truth-mode.md](contracts/ground-truth-mode.md).
- Verification flow captured in [quickstart.md](quickstart.md).

## Post-Design Constitution Check

- Re-checked after design: PASS.
- No additional constitutional issues introduced by the selected design.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
