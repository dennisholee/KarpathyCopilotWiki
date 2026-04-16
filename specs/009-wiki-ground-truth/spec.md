# Feature Specification: Wiki Ground Truth Toggle

**Feature Branch**: `009-wiki-ground-truth`  
**Created**: 2026-04-16  
**Status**: Ready  
**Input**: User description: "when using \"@wiki\" allow users to turn on or off the ground truth as a setting. When turned on the llm chat should use documents in the wiki directory only. When turned off then the llm chat should still use wiki the wiki directory but may source information else where as suited."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Restrict Answers To Wiki Ground Truth (Priority: P1)

As a user relying on curated repository knowledge, I can set `@wiki` to strict ground-truth mode so responses are based only on documents in the wiki directory.

**Why this priority**: This is the core control requested by the user. Without it, `@wiki` cannot be forced into a strictly grounded mode.

**Independent Test**: Can be fully tested by selecting `strict` mode, asking `@wiki` a question that is answerable from wiki content, and verifying the response uses wiki evidence only and does not rely on outside information.

**Acceptance Scenarios**:

1. **Given** `wiki.groundTruthMode` is set to `strict`, **When** a user asks `@wiki` a question, **Then** the answer is constrained to information grounded in the wiki directory.
2. **Given** `wiki.groundTruthMode` is set to `strict`, **When** the wiki directory does not contain enough evidence to answer the question, **Then** `@wiki` reports the gap rather than supplementing the answer from outside sources.

---

### User Story 2 - Allow Flexible Answers In Flexible Mode (Priority: P1)

As a user exploring beyond the curated wiki, I can set `@wiki` to flexible mode so it still uses the wiki directory but may supplement the response with other relevant information when needed.

**Why this priority**: The feature is explicitly a toggle. Flexible mode must be useful and distinct from the strict wiki-only mode.

**Independent Test**: Can be fully tested by selecting `flexible` mode, asking `@wiki` a question where wiki evidence is partial, and verifying the response still incorporates wiki material while being allowed to include additional supporting information.

**Acceptance Scenarios**:

1. **Given** `wiki.groundTruthMode` is set to `flexible`, **When** a user asks `@wiki` a question, **Then** the answer still considers the wiki directory as a primary source of context.
2. **Given** `wiki.groundTruthMode` is set to `flexible` and wiki evidence is incomplete, **When** `@wiki` answers the question, **Then** it may supplement the answer with information beyond the wiki rather than refusing to answer solely because wiki coverage is partial.

---

### User Story 3 - Show Which Answering Mode Is Active (Priority: P2)

As a user, I can tell whether `@wiki` is operating in strict ground-truth mode or flexible mode so I understand how the answer was produced.

**Why this priority**: The toggle changes trust boundaries. Users need clear visibility into which mode is active to interpret responses correctly.

**Independent Test**: Can be fully tested by switching `wiki.groundTruthMode` between `strict` and `flexible` and verifying `@wiki` communicates the active mode in a clear and consistent way during responses or related user-visible surfaces.

**Acceptance Scenarios**:

1. **Given** `wiki.groundTruthMode` changes between `strict` and `flexible`, **When** a user next interacts with `@wiki`, **Then** the active answer mode is communicated clearly.
2. **Given** a response is produced in strict or flexible mode, **When** a user reviews the result, **Then** they can distinguish whether the answer was limited to wiki evidence or allowed to use broader sources.

### Edge Cases

- If `wiki.groundTruthMode` changes between two `@wiki` requests, the next request uses the newly selected mode without requiring a restart.
- If the wiki directory is empty or unavailable while `wiki.groundTruthMode` is `strict`, `@wiki` returns a grounded failure or coverage-gap response rather than fabricating an answer.
- If the wiki directory contains only partial evidence while `wiki.groundTruthMode` is `strict`, `@wiki` returns only the grounded portion and explicitly identifies missing coverage.
- If `wiki.groundTruthMode` is switched from `flexible` back to `strict`, future answers revert to wiki-only grounding without leaking prior non-wiki sourcing behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a user-controlled setting that determines whether `@wiki` operates in strict ground-truth mode or flexible mode.
- **FR-001a**: The system MUST default `wiki.groundTruthMode` to `strict` for newly opened workspaces unless the user explicitly changes it.
- **FR-002**: When strict ground-truth mode is enabled, the system MUST constrain `@wiki` answers to information grounded in the wiki directory only.
- **FR-003**: When strict ground-truth mode is enabled, the system MUST avoid supplementing answers with information from outside the wiki directory.
- **FR-004**: When flexible mode is selected, the system MUST continue using the wiki directory as a primary source of context for `@wiki` answers.
- **FR-005**: When flexible mode is selected, the system MAY supplement `@wiki` answers with additional information beyond the wiki directory when the wiki alone is insufficient.
- **FR-006**: The system MUST preserve grounded wiki references in both strict and flexible modes whenever wiki evidence contributes to the answer.
- **FR-007**: The system MUST communicate the active answering mode to the user in a clear, user-visible way.
- **FR-008**: The system MUST apply the currently configured mode to each new `@wiki` request without requiring the user to reopen the workspace or restart the extension.
- **FR-009**: If strict ground-truth mode is enabled and the wiki directory does not contain sufficient evidence, the system MUST return a coverage-gap or insufficient-support response instead of inventing unsupported claims.
- **FR-010**: The system MUST keep the meaning of the setting limited to `@wiki` answering behavior and MUST NOT change unrelated ingest, indexing, or wiki file management workflows.

### Key Entities *(include if feature involves data)*

- **Ground Truth Setting**: A user-controlled preference that selects whether `@wiki` answers in strict wiki-only mode or flexible mode.
- **Strict Ground-Truth Mode**: The `@wiki` answering mode in which only documents from the wiki directory may be used as answer evidence.
- **Flexible Mode**: The `@wiki` answering mode in which wiki documents remain primary context but additional information may be used when appropriate.
- **Wiki Evidence Set**: The subset of content from the wiki directory that grounds and supports a given `@wiki` response.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of sampled `@wiki` responses produced while strict ground-truth mode is enabled cite only wiki-directory evidence.
- **SC-002**: 100% of sampled `@wiki` responses produced while strict ground-truth mode is enabled return an explicit insufficient-support or coverage-gap result when wiki evidence is missing.
- **SC-003**: 100% of sampled `@wiki` responses produced after toggling the setting reflect the newly selected mode on the next request.
- **SC-004**: In flexible mode, sampled `@wiki` responses continue to include relevant wiki evidence whenever the wiki contains support for the question.
- **SC-005**: Users can identify the active `@wiki` answering mode for 100% of sampled responses during acceptance review.
- **SC-006**: 100% of sampled newly opened workspaces expose `wiki.groundTruthMode` with `strict` as the initial default until the user changes it.

## Assumptions

- `@wiki` already has an answer generation flow that distinguishes grounded wiki evidence from synthesized answer content.
- The wiki directory remains the canonical local source of repository knowledge for `@wiki`.
- Flexible mode is allowed to use broader information sources, but wiki evidence should still be preferred whenever available.
- The requested setting applies to answering behavior only and does not imply changes to raw ingest, wiki generation, or model proposal features unless explicitly extended later.