# Tasks: Guideline Transform Ingest

All tasks strictly follow the checklist format required by the project. File paths indicate where changes should be implemented.

## Phase 1 — Setup

- [ ] T001 Detect files under `raw/guidelines` in `extension/src/ingest/extractor.ts`
- [ ] T002 Add path-based router to ingest pipeline; create `extension/src/ingest/guidelineRouter.ts` and update `extension/src/ingest/extractor.ts`
- [ ] T003 Add command wiring for `@wiki /ingest` in `extension/src/commands/ingest.ts` (or existing commands index)

## Phase 2 — Foundational Implementation

- [ ] T004 Create guideline transform module (LLM orchestrator) in `src/ingest/guidelineTransformer.ts`
- [ ] T005 Implement prompt templates using `docs/guidelines/wiki_format_guidelines.md` at `extension/src/ingest/prompts/wikiFormatPrompts.ts`
- [ ] T006 Implement metadata/traceability writer for derived pages in `extension/src/ingest/traceability.ts`
- [ ] T007 Add update/overwrite semantics and idempotency in `src/ingest/guidelineTransformer.ts` and `extension/src/ingest/ingestStore.ts`
- [ ] T008 Add error handling and partial-failure reporting in `extension/src/ingest/extractor.ts` and `src/ingest/guidelineTransformer.ts`

## Phase 3 — User Stories (priority order)

- [ ] T009 [US1] Implement end-to-end transform for single guideline file: wire transform module into router to produce `wiki/<derived>.md` (`src/ingest/guidelineTransformer.ts`, `extension/src/ingest/guidelineRouter.ts`)
- [ ] T010 [US1] Support bulk processing for multiple files under `raw/guidelines` (`extension/src/ingest/extractor.ts`, `src/ingest/guidelineTransformer.ts`)
- [ ] T011 [US2] Validate generated output follows guideline format; add verifier in `src/ingest/validator.ts`
- [ ] T012 [US3] Implement backlink grounding (Option A) — only link to existing pages via wiki index search in `src/search/wikiIndex.ts` and apply in transformer
- [ ] T013 [US4] Ensure non-guideline files continue existing ingest behavior; add regression tests in `test/integration/ingest-non-guideline.test.ts`

## Phase 4 — Tests & Docs

- [ ] T014 [P] Write unit tests for routing and transform module (`tests/unit/ingest-router.test.ts`, `tests/unit/guideline-transformer.test.ts`)
- [ ] T015 [P] Write integration tests for end-to-end ingest with sample `raw/guidelines` files (`tests/integration/guideline-ingest.test.ts`)
- [ ] T016 [P] Documentation: create `specs/007-guideline-transform-ingest/quickstart.md` and update `docs/guidelines/wiki_format_guidelines.md` examples
- [ ] T017 [P] Optional: add `speckit.git.commit` post-hook automation (config in `.specify/extensions.yml`)

## Notes & Constraints

- Backlink policy: Option A — only create backlinks to existing wiki pages.
- LLM configuration MUST be injectable (env or extension settings); avoid hard-coded API keys.
- Keep prompts deterministic where possible; include a verification/validation step to ensure generated markdown matches the guideline template.
