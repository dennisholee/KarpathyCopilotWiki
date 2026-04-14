# Chat Answer Contract

## Scope

This contract defines the request and response behavior for the `@wiki` participant when handling a user query that expects a comprehensive and complete answer.

## Supported Request Forms

### Free-Form Question

Examples:

- `@wiki what are the portfolio business rules`
- `@wiki explain iso 20022 in this workspace`

Behavior:

- Treat the full prompt as a question to answer.
- Retrieve supporting wiki evidence.
- Return a structured grounded answer, not a result list.
- If remote answer synthesis is explicitly enabled, use it only for the direct-answer wording while preserving local evidence selection and visible grounding references.

### Search-Prefixed Question

Examples:

- `@wiki search portfolio business rules`
- `@wiki search for transaction validation logic`

Behavior:

- Accept the request form for compatibility.
- Still return a structured answer when evidence is sufficient.
- If evidence is insufficient, return grounded partial/no-answer behavior rather than only ranked snippets.

## Response Shape

### Standard Successful Response

The response must contain these sections in order:

1. `Direct Answer`
2. `Key Details`
3. `Supporting References`

### Conditional Sections

Add `Conflicts` when relevant evidence materially disagrees.

Add `Coverage Gaps` when the answer is partial or insufficient.

## Response Rules

- `Direct Answer` must answer the user’s question immediately.
- `Key Details` must contain the main supporting facts needed for first-pass understanding.
- `Supporting References` must include the supporting wiki pages used in the answer.
- Source references from supporting pages must be surfaced when available.
- The participant must not present unsupported statements as settled facts.
- When evidence conflicts, the participant must summarize the conflict, present the most defensible answer, and cite the conflicting sources.
- When evidence is partial, the participant must return the supported answer portion and clearly mark the gap.
- Follow-up interpretation may use only the immediately previous wiki query/answer pair.
- Remote answer synthesis must be disabled by default and must only run when explicitly enabled by user configuration.
- When remote answer synthesis is used, the response must disclose that fact visibly in the answer stream.
- When remote answer synthesis is disabled or unavailable, the participant must still return the grounded local structured answer.

## No-Evidence Contract

When no sufficiently relevant grounded evidence exists:

- State that the available wiki material is insufficient to answer the query.
- Do not fabricate a complete answer.
- Suggest one useful follow-up action or narrower query.

## Archival Contract

If the user archives the conversation:

- Persist the user question.
- Persist the structured answer body.
- Persist the same supporting references shown to the user.
- Persist supporting source references when they were shown to the user.
- Persist the conversation transcript.

## Compatibility Notes

- Existing search command forms remain accepted.
- The feature changes the output contract from `ranked results with excerpts` to `grounded structured answer`.
