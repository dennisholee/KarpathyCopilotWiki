# Implementation Plan: Complete Query Answer

**Branch**: `002-complete-query-answer` | **Date**: 2026-04-14 | **Spec**: [specs/002-complete-query-answer/spec.md](specs/002-complete-query-answer/spec.md)
**Input**: Feature specification from `/specs/002-complete-query-answer/spec.md`

## Summary

Upgrade the existing `@wiki` query experience from a compact search-result list into a grounded answering flow that returns a structured answer with direct answer, key details, and supporting references. The implementation will stay inside the current VS Code extension, using the existing local search and wiki management services for retrieval, the VS Code chat participant APIs for answer synthesis and streaming, and explicit handling for conflicts, gaps, and one-turn follow-up context.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js via VS Code extension runtime (`ES2020`, VS Code `^1.80.0`)  
**Primary Dependencies**: `vscode`, `pdfjs-dist`, `markdown-it`, `markdown-it-wikilinks`, `@tensorflow-models/universal-sentence-encoder`, `@tensorflow/tfjs`, Jest, esbuild  
**Storage**: Filesystem-backed wiki and raw source directories (`/wiki`, `/raw`), existing extension cache, in-memory chat turn context  
**Testing**: Jest unit/integration tests under `extension/test`, plus extension-level validation of chat participant behavior  
**Target Platform**: VS Code desktop extension on macOS/Linux/Windows with Copilot Chat available  
**Project Type**: Single VS Code extension feature enhancement  
**Performance Goals**: Return grounded answer responses fast enough for interactive chat use; target retrieval and response start within 5 seconds for typical workspace queries, while preserving visible references in the same response  
**Constraints**: No unsupported claims; answer format must be structured; use only the immediately previous wiki query/answer pair for follow-up context; conflicts must be surfaced, not hidden; remote synthesis must be explicit opt-in with disclosure; preserve local retrieval fallback when higher-quality semantic handling is unavailable  
**Scale/Scope**: Existing extension codebase with tens to hundreds of wiki pages and growing raw-source corpus; feature scope is query answering, evidence packaging, and decision archival behavior only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Gate Review

- **Markdown-First**: Pass. All new artifacts are Markdown under `specs/002-complete-query-answer/`, and the feature output remains Markdown streamed through the chat participant.
- **Compounding Knowledge**: Pass with constraint. Query answers are transient chat output, but any archived decision records must remain durable knowledge artifacts linked back to supporting wiki pages and source material.
- **Traceability**: Pass with explicit design requirement. The answer flow must surface supporting wiki pages and source references; archived decision pages must retain those links.
- **Structural Integrity**: Pass. The feature does not introduce new wiki page naming rules; any persisted decision artifacts continue to use the existing decision archive flow.
- **Quality & Verifiability**: Pass with explicit design requirement. The system must distinguish supported, partially supported, and conflicting claims instead of presenting speculative answers.
- **Local-First with Optional Remote**: Pass with required implementation controls. Retrieval remains local to the workspace; any remote answer synthesis must be explicitly enabled by user configuration, disclosed through visible logging or status messaging, and must degrade gracefully to grounded partial/no-answer behavior when unavailable or disabled.

### Post-Design Gate Review

- Research and design artifacts preserve markdown-only outputs.
- Data model and contract definitions require grounded references, conflict disclosure, and gap disclosure.
- No constitution violations remain that require a complexity waiver.

## Project Structure

### Documentation (this feature)

```text
specs/002-complete-query-answer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── chat-answer-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
extension/
├── src/
│   ├── copilot/
│   │   └── wiki-participant.ts
│   ├── query/
│   │   ├── decisionArchiver.ts
│   │   └── queryCommand.ts
│   ├── search/
│   │   ├── localEmbeddings.ts
│   │   └── search-engine.ts
│   ├── wiki/
│   │   └── wiki-manager.ts
│   ├── models/
│   ├── utils/
│   └── extension.ts
├── test/
│   └── integration/
└── package.json

wiki/
raw/
```

**Structure Decision**: Use the existing single-extension project layout. The feature is a focused enhancement to the current query and chat-participant pipeline, so the work should stay inside `extension/src/copilot`, `extension/src/query`, `extension/src/search`, and integration tests under `extension/test/integration`.

## Phase 0: Outline & Research

1. Confirm the current gap between the spec and implementation: the participant renders ranked snippets rather than synthesized answers.
2. Validate the intended VS Code chat participant pattern for grounding local workspace content and streaming a synthesized answer.
3. Define the retrieval-and-synthesis strategy that preserves local evidence selection while improving answer completeness.
4. Define how conflicts, partial coverage, and no-answer cases must appear in the structured response.
5. Define the follow-up context boundary so the participant reuses only the immediately previous wiki turn.
6. Define explicit opt-in and disclosure controls for any remote answer synthesis path.

**Phase 0 Output**: `research.md` with explicit decisions, rationale, and rejected alternatives.

## Phase 1: Design & Contracts

1. Define the answering data model: query input, evidence bundle, structured answer sections, conflicts, gaps, and archived decision metadata.
2. Define the chat contract for free-form and explicit search requests, including response sections, conditional sections, and fallback behavior.
3. Design the internal flow from retrieval candidate selection to evidence packaging to answer streaming.
4. Define test slices for direct answers, multi-page synthesis, conflicting evidence, partial coverage, one-turn follow-up behavior, and remote-synthesis disclosure behavior.
5. Define a representative query validation set and a lightweight review rubric for the measurable outcomes.
6. Produce a quickstart focused on validating the feature in the existing extension workspace.

**Phase 1 Output**: `data-model.md`, `contracts/chat-answer-contract.md`, `quickstart.md`

## Phase 2 Preview

1. Refactor `QueryHandler` from “search result list” output into evidence selection and answer-package preparation.
2. Refactor `WikiChatParticipant` to build grounded prompts, invoke the VS Code chat model appropriately, and stream structured sections.
3. Add explicit opt-in configuration and disclosure logging for remote answer synthesis.
4. Preserve deterministic fallback behavior when synthesis is unavailable or evidence is insufficient.
5. Extend decision archival to include the structured answer body and supporting references actually used.
6. Add regression coverage in integration tests for answer completeness, traceability, conflicts, follow-up context, and remote-synthesis disclosure behavior.
7. Add a representative query validation set and reviewer checklist for success-criteria measurement.

## Complexity Tracking

No constitution exceptions are required at planning time.

