# Quickstart: OpenMetadata Contract Alignment

## Prerequisites

- Install dependencies in `extension/`.
- Open the repository in VS Code with Copilot Chat enabled.
- Ensure the workspace already contains the ingested architecture, OECD guideline, and OpenMetadata guideline content under `/wiki` and `/raw`.

## Run The Extension

1. From `extension/`, install dependencies if needed.
2. Run `npm run check-types`.
3. Start the extension in VS Code debug mode using the existing extension launch configuration.

## Exercise The Feature

### Scenario 1: Derive An OpenMetadata-Aligned Proposal

Use a derive-style request:

```text
@wiki /model generate CDMS's tax model based on the OECD tax model using the OpenMetadata guideline
```

Verify the response:

- returns a proposal response, not a definition summary
- renders the proposed contract with aligned top-level fields such as `name`, `displayName`, `owner`, `targetEntity`, `schemaText`, `resources`, and `incidentManagement`
- keeps evidence and rationale outside the contract body in the review sections
- includes raw-source traceability for grounded proposal evidence
- marks unsupported owner, quality, SLA, or incident values as gaps instead of inventing them

### Scenario 2: Enhance An Existing Model In The Same Shape

Use an enhancement request:

```text
@wiki /model enhance the party model by adding an account number using the OpenMetadata guideline
```

Verify the response:

- uses the same aligned contract shape as derive requests
- preserves the enhancement change summary and baseline rationale
- serializes the resulting schema into `schemaText`
- includes raw-source traceability for grounded proposal evidence
- keeps placement evidence and operational gaps explicit

### Scenario 3: Keep Definition Responses Unchanged

Use an informational request:

```text
@wiki /model what is cdms
```

Verify the response:

- returns a grounded summary rather than an aligned contract
- includes evidence and raw-source traceability
- does not emit `schemaText`, `resources`, or other proposal-only contract sections

### Scenario 4: Incomplete Operational Evidence

Use a derive request likely to have conceptual model evidence but incomplete operational details:

```text
@wiki /model generate party model
```

Verify the response:

- produces an aligned proposal contract when schema evidence is sufficient
- leaves owner, quality, SLA, or incident sections unresolved when the corpus does not ground them
- surfaces those gaps in assumptions or unresolved-notes sections rather than inventing values

### Scenario 5: Default To OpenMetadata Without Named Format

Use a request with no alternate contract-format guidance:

```text
@wiki /model generate customer profile model
```

Verify the response:

- still returns the OpenMetadata-aligned contract shape
- does not require an explicit OpenMetadata request to choose that shape
- includes raw-source traceability for grounded proposal evidence

### Scenario 6: Request Refinement For Ambiguous Scope

Use an ambiguous request:

```text
@wiki /model explain the mapping thing
```

Verify the response:

- asks for refinement
- does not emit an aligned contract
- does not invent a target model

## Validation Commands

Run these from `extension/`:

```text
npm run check-types
npm test -- --runInBand --coverage=false test/integration/copilot.test.ts test/unit/modeling/modelMatcher.test.ts test/unit/modeling/proposalBuilder.test.ts test/unit/modeling/contractValidator.test.ts test/unit/modeling/proposalFormatter.test.ts
```

This focused validation should cover:

- derive and enhance proposal formatting in the aligned OpenMetadata contract shape
- preservation of grounded rationale and evidence sections
- preservation of raw-source traceability for grounded proposal evidence
- omission or explicit gap-marking for unsupported owner and operational fields
- default logical `targetEntity` handling for conceptual models
- physical asset override handling for grounded physical requests
- refinement-required behavior for ambiguous requests
- continued non-contract behavior for definition-style requests

## Representative Review Checks

Use these prompts as the minimum review corpus for the success criteria:

| Scenario | Prompt | Expected Outcome |
|----------|--------|------------------|
| EC-001 | `@wiki /model generate CDMS's tax model based on the OECD tax model using the OpenMetadata guideline` | Returns an aligned proposal contract with grounded schema, evidence, and explicit unresolved operational sections when needed. |
| EC-002 | `@wiki /model enhance the party model by adding an account number using the OpenMetadata guideline` | Returns the aligned contract shape while preserving enhancement change intent and baseline rationale. |
| EC-003 | `@wiki /model what is cdms` | Returns a grounded summary, not a contract. |
| EC-004 | `@wiki /model generate party model` | Returns an aligned proposal with logical `targetEntity` handling and explicit gaps where operational evidence is missing. |
| EC-005 | `@wiki /model generate customer table contract` | Returns an aligned proposal that uses a physical asset type in `targetEntity` only when the request or grounded evidence clearly supports that interpretation. |
| EC-006 | `@wiki /model explain the mapping thing` | Requests refinement instead of inventing a target model or emitting an aligned contract. |

## Final Execution Notes

- Executed from `extension/` on 2026-04-15.
- `npm run check-types` passed.
- Focused validation command passed:

```text
npx jest --coverage=false test/unit/modeling/modelMatcher.test.ts test/unit/modeling/proposalBuilder.test.ts test/unit/modeling/proposalFormatter.test.ts test/unit/modeling/contractValidator.test.ts test/integration/copilot.test.ts
```

- Focused suite result: 5 suites passed, 90 tests passed, 0 failed.

## Measured Outcomes

| Scenario | Status | Evidence |
|----------|--------|----------|
| EC-001 | PASS | Derive-style integration coverage verified aligned YAML sections, grounded schema output, and guideline handling. |
| EC-002 | PASS | Enhance-style integration coverage verified aligned contract output plus baseline and change-summary context. |
| EC-003 | PASS | Definition-response integration and formatter coverage verified grounded summary behavior with no aligned contract emission. |
| EC-004 | PASS | Incomplete-evidence integration coverage verified explicit gaps and unresolved operational sections without fabrication. |
| EC-005 | PASS | Added unit and integration coverage verified logical `targetEntity` defaulting and physical `table` override when the request is explicitly physical. |
| EC-006 | PASS | Refinement regression coverage verified ambiguous requests ask for clarification instead of emitting an aligned contract. |

| Criterion | Measured Outcome | Status |
|-----------|------------------|--------|
| SC-001 | 100% of measured derive-style scenarios emitted the aligned top-level contract sections. | PASS |
| SC-002 | 100% of measured enhance-style scenarios used the same aligned contract structure as derive responses. | PASS |
| SC-003 | 100% of measured aligned proposals preserved grounded rationale and evidence references. | PASS |
| SC-004 | 100% of measured incomplete-evidence scenarios surfaced explicit gaps or omissions instead of fabricated operational values. | PASS |
| SC-005 | 100% of measured definition-style scenarios remained non-contract summaries. | PASS |

Open gaps: the measured review corpus is intentionally focused on the representative prompts above rather than a larger randomized prompt set.
