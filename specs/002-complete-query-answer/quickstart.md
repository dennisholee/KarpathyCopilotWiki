# Quickstart: Complete Query Answer

## Purpose

Validate that the `@wiki` participant returns a comprehensive, grounded answer instead of a short search-result list.

## Prerequisites

- Workspace opened in VS Code
- Extension dependencies installed in `extension/`
- Existing wiki content under `wiki/`
- Copilot Chat available in the editor

## Build And Test

From the repository root:

```bash
cd extension
npm install
npm run compile
npm test
```

## Representative Validation Matrix

Use the following query set to evaluate the measurable outcomes in the spec.

| ID | Query Type | Example Prompt | Expected Result | Related Success Criteria |
|----|------------|----------------|-----------------|--------------------------|
| VQ-001 | Direct answer | `@wiki what are the portfolio business rules` | Returns a direct answer with key details and supporting references | SC-001, SC-003 |
| VQ-002 | Multi-page synthesis | `@wiki explain the portfolio approval process and exceptions` | Combines evidence from multiple pages into one coherent answer | SC-002, SC-003 |
| VQ-003 | Conflict handling | `@wiki what is the correct withdrawal approval rule` | Shows the most defensible answer and a visible conflict section when evidence disagrees | SC-004a |
| VQ-004 | Partial coverage | `@wiki summarize all portfolio reconciliation edge cases` | Returns supported facts and clearly marks the missing coverage | SC-004 |
| VQ-005 | Follow-up context | Initial: `@wiki what are the portfolio business rules` then `@wiki tell me more about the exceptions` | Uses only the immediately previous wiki turn to interpret the follow-up | FR-010 |
| VQ-006 | Remote synthesis disclosure | `@wiki explain iso 20022 in this workspace` with remote synthesis enabled | Shows visible disclosure that remote direct-answer synthesis is in use while keeping grounded references | FR-011 |

## Manual Validation Flow

### Scenario 1: Direct Answer From Existing Wiki Coverage

1. Open Copilot Chat.
2. Ask a question with known support in the workspace, such as a domain rule question.
3. Verify the response contains:
   - a direct answer
   - key details
   - supporting references
4. Verify the response is not merely a ranked list of pages with short excerpts.

### Scenario 2: Conflicting Evidence

1. Ask a question known to touch multiple sources with different wording or conclusions.
2. Verify the response includes:
   - a defensible answer
   - a visible explanation of the conflict
   - references to the conflicting sources

### Scenario 3: Partial Coverage

1. Ask a question that is only partly covered by the wiki.
2. Verify the response:
   - answers the supported portion
   - identifies what remains unsupported
   - suggests a next step or narrower follow-up

### Scenario 4: One-Turn Follow-Up Context

1. Ask an initial question.
2. Ask a follow-up such as `tell me more about the exceptions`.
3. Verify the participant uses only the immediately previous wiki query/answer pair to interpret the follow-up.

### Scenario 5: Remote Synthesis Opt-In And Disclosure

1. Open extension settings.
2. Enable `wiki.enableRemoteAnswerSynthesis`.
3. Ask a question with known wiki support.
4. Verify the response includes visible disclosure that remote direct-answer synthesis is enabled for the response.
5. Disable the setting and repeat.
6. Verify the response still returns grounded local content without the remote-synthesis disclosure line.

## Reviewer Checklist For SC-005

Use this checklist when a reviewer evaluates whether the answer is complete enough for first-pass understanding.

- [ ] The answer gives a direct response to the user’s question without forcing the reader to inspect page snippets first.
- [ ] The answer includes enough key detail to understand the topic at a first pass.
- [ ] The answer includes supporting references to the relevant wiki pages.
- [ ] The answer clearly distinguishes settled facts from gaps or uncertainty.
- [ ] If evidence conflicts, the answer explains the conflict instead of hiding it.
- [ ] If the answer is partial, the missing coverage is easy to identify.
- [ ] If remote synthesis is enabled, the response discloses that fact visibly.

## Recorded Validation Status

The following automated checks were run during implementation:

- [x] `npm run check-types`
- [x] `npm test -- --runInBand`
- [x] `npm run compile`

Representative validation outcome recorded from implementation-time verification:

- [x] VQ-001 direct-answer behavior covered by integration tests and structured answer rendering output
- [x] VQ-002 multi-page synthesis behavior covered by integration tests and grounded fact aggregation output
- [x] VQ-003 conflict disclosure behavior covered by integration tests
- [x] VQ-004 partial and insufficient coverage behavior covered by integration tests
- [x] VQ-005 one-turn follow-up context behavior covered by integration tests
- [x] VQ-006 remote synthesis disclosure behavior implemented and documented in the participant and configuration surface

Final adjustment result:

- No additional command or messaging changes were required after validation beyond the implemented `Ask Wiki` wording, grounded response sections, and remote-synthesis disclosure line.

## Expected Outcome

The participant consistently returns grounded, structured answers with visible references and explicit handling for conflicts or gaps.
