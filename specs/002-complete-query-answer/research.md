# Research: Complete Query Answer

## Decision 1: Keep retrieval local and add answer synthesis on top

**Decision**: Preserve the existing local retrieval path in the extension (`SearchEngine`, `WikiManager`, keyword fallback) and add a second stage that synthesizes a structured answer from selected evidence rather than streaming only ranked snippets.

**Rationale**: The current implementation already knows how to enumerate relevant pages from the workspace. The missing capability is not retrieval itself but answer construction. Reusing the existing retrieval layer minimizes risk, keeps workspace data selection local, and isolates the feature change to the query pipeline.

**Alternatives considered**:

- Replace the retrieval stack entirely with a new external search service. Rejected because it increases complexity and violates the local-first direction.
- Keep the current snippet-list output and only lengthen excerpts. Rejected because it still leaves answer assembly to the user and does not satisfy the spec.

## Decision 2: Use the VS Code chat model request path for synthesis, not an environment-variable gate

**Decision**: Use the active chat request model made available to the participant for answer synthesis, and stop treating `GITHUB_COPILOT_API_KEY` as the gate for the primary path.

**Rationale**: The extension already runs inside the VS Code chat participant context, where the model is available as part of the chat request flow. Gating the primary path on an environment variable is mismatched to the actual extension integration model and is likely why the current code frequently falls back to low-quality keyword behavior.

**Alternatives considered**:

- Keep the environment-variable gate. Rejected because it does not reflect how the feature is invoked in VS Code.
- Introduce a separate remote API client. Rejected because it duplicates platform capabilities and weakens extension integration.

## Decision 3: Standardize the response as a structured answer package

**Decision**: Every successful answer should be emitted as a structured package with `Direct Answer`, `Key Details`, and `Supporting References`, with optional `Conflicts` and `Coverage Gaps` sections when needed.

**Rationale**: This directly encodes the accepted clarification for “comprehensive and complete” and makes the result testable. It also prevents regressions back to terse search-result output.

**Alternatives considered**:

- Free-form narrative response only. Rejected because it is harder to verify for completeness and references.
- Page list plus one-sentence summary. Rejected because it remains search-oriented, not answer-oriented.

## Decision 4: Make conflict handling explicit in the response contract

**Decision**: When evidence conflicts, the answer must summarize the conflict, present the most defensible answer, and cite the conflicting sources.

**Rationale**: The domain content in the wiki can be incomplete, synthesized, or sourced from multiple documents. Hiding conflicts would overstate certainty and reduce trust in the system.

**Alternatives considered**:

- Always choose the highest-ranked source. Rejected because relevance does not imply correctness.
- Refuse to answer on any conflict. Rejected because the spec requires best-available answers with disclosed limitations.

## Decision 5: Limit follow-up context to one previous wiki turn

**Decision**: Only the immediately previous wiki query/answer pair should be reused for follow-up interpretation.

**Rationale**: This matches the accepted clarification and gives deterministic behavior. It supports natural follow-ups without allowing long chat history to distort current retrieval or answer synthesis.

**Alternatives considered**:

- No context reuse. Rejected because it makes common follow-up prompts unnecessarily brittle.
- Full-session reuse. Rejected because it increases ambiguity and makes failures harder to reason about.

## Decision 6: Validate with integration tests around behavior, not just ranking

**Decision**: Add integration coverage for direct-answer behavior, multi-page synthesis, conflict disclosure, partial coverage, and one-turn follow-up handling.

**Rationale**: Ranking-only tests would not catch the central product failure here. The spec is about answer quality and grounded structure, so the tests need to assert user-visible response shape and evidence handling.

**Alternatives considered**:

- Rely only on manual chat testing. Rejected because regressions in formatting and evidence disclosure would be too easy to miss.
- Test only retrieval counts. Rejected because that would not verify completeness or traceability.
