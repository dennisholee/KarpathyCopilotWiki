# Quickstart: Model Query Support

## Prerequisites

- Install dependencies in `extension/`.
- Open the repository in VS Code with Copilot Chat enabled.
- Ensure the workspace already contains the ingested architecture, OpenMetadata guideline, and OECD guideline content under `/wiki` and `/raw`.

## Run The Extension

1. From `extension/`, install dependencies if needed.
2. Run `npm run check-types`.
3. Start the extension in VS Code debug mode using the existing extension launch configuration.

## Exercise The Feature

### Scenario 1: Derive A New Model

Use a request that names a target model that does not yet exist and cites governing sources:

```text
@wiki /model generate the cdms tax model based on the cdms architecture, open metadata guideline and the oecd guideline
```

Verify the response:

- identifies the request as a derived model workflow
- uses domain-specific evidence instead of selecting `Wiki Index` or `Glossary` as the baseline
- returns a full proposal contract
- explains which parts followed named guidelines and which parts defaulted to OpenMetadata

### Scenario 2: Enhance An Existing Model

Use a request that targets an existing model and names a new attribute:

```text
@wiki /model enhance the party model by adding an account number
```

Verify the response:

- finds the existing party model or the closest domain-specific model page
- cross-checks supporting evidence for `account number`
- identifies the most suitable insertion point for the change
- returns a full resulting contract plus a concise change summary

### Scenario 3: Define A Model

Use an informational request:

```text
@wiki /model what is the relationship model
```

Verify the response:

- returns a grounded summary
- includes key entities or relationships
- cites wiki evidence
- preserves raw-source traceability for the cited evidence
- does not emit a contract payload unless the request is changed to a generate/enhance request

### Scenario 4: Request Refinement For Ambiguous Scope

Use a request that does not resolve to a credible model or relationship target:

```text
@wiki /model explain the mapping thing
```

Verify the response:

- identifies that the target scope is ambiguous or not credible
- asks the user to refine the requested model or relationship
- does not invent a baseline, definition, or contract

## Representative Evaluation Corpus

Use the following corpus to measure the success criteria after implementation:

| Scenario | Intent | Example Prompt | Expected Outcome |
|----------|--------|----------------|------------------|
| EC-001 | Derive | `@wiki /model generate the cdms tax model based on the cdms architecture, open metadata guideline and the oecd guideline` | Returns a grounded derived-model contract, cites architecture and guideline evidence, and avoids generic pages as the primary baseline. |
| EC-002 | Enhance | `@wiki /model enhance the party model by adding an account number` | Finds the strongest existing baseline, cites supporting evidence for account number, and proposes a specific insertion point. |
| EC-003 | Define | `@wiki /model what is the relationship model` | Returns a grounded summary with key entities or relationships, preserves raw-source traceability for cited evidence, and emits no contract payload. |
| EC-004 | Guideline Fallback | `@wiki /model generate the party model` | Returns a contract that explicitly defaults unspecified structure to OpenMetadata when no named guideline is provided. |
| EC-005 | Refinement Required | `@wiki /model explain the mapping thing` | Requests clarification because no credible model or relationship scope can be resolved. |

## Success Criteria Scoring

Evaluate the corpus after implementation and record measured results against the specification thresholds:

| Criterion | Corpus Coverage | Pass Rule |
|-----------|-----------------|-----------|
| SC-001 | Derive scenarios such as EC-001 and additional derive prompts with sufficient evidence | At least 90% of measured derive scenarios return grounded derived models. |
| SC-002 | Enhancement scenarios such as EC-002 and additional enhancement prompts | At least 90% of measured enhancement scenarios identify a baseline and insertion point. |
| SC-003 | Definition scenarios such as EC-003 and additional informational prompts | At least 95% of measured definition scenarios return grounded definitions without unsupported changes. |
| SC-003a | All definition scenarios in the corpus | 100% omit contract generation unless the prompt explicitly asks to generate or enhance. |
| SC-004 | Generation and enhancement scenarios with and without named guidelines, including EC-001 and EC-004 | 100% follow named guidance when present or OpenMetadata fallback when absent. |
| SC-005 | All scenarios in the corpus | 100% include rationale, grounded evidence references, and explicit assumptions or conflicts when evidence is incomplete or contradictory. |

Record final measured outcomes in this section when T027 is executed, including total prompts evaluated, passes, failures, and any open gaps.

### Measured Results

- Executed `npm run check-types` successfully on 2026-04-15.
- Executed the focused `/model` validation suite successfully on 2026-04-15: `npm test -- --runInBand --coverage=false --silent test/integration/copilot.test.ts test/unit/modeling/modelMatcher.test.ts test/unit/modeling/proposalBuilder.test.ts test/unit/modeling/contractValidator.test.ts test/unit/modeling/proposalFormatter.test.ts`.
- Focused suite result: 5 suites passed, 87 tests passed, 0 failed.
- Evaluation corpus prompts measured in integration coverage: 5 of 5 passed.

| Scenario | Prompt Status | Result | Notes |
|----------|---------------|--------|-------|
| EC-001 | Executed | PASS | Derived contract generated from architecture and guideline evidence. |
| EC-002 | Executed | PASS | Enhancement resolved the party baseline and placement for `account_number`. |
| EC-003 | Executed | PASS | Definition response returned grounded summary, raw-source traceability, and no contract payload. |
| EC-004 | Executed | PASS | Generated contract defaulted to OpenMetadata when no named guideline was supplied. |
| EC-005 | Executed | PASS | Ambiguous request triggered refinement guidance instead of invented output. |

| Criterion | Measured Outcome | Status |
|-----------|------------------|--------|
| SC-001 | 1 of 1 measured derive scenarios passed (100%) | PASS |
| SC-002 | 1 of 1 measured enhancement scenarios passed (100%) | PASS |
| SC-003 | 1 of 1 measured definition scenarios passed (100%) | PASS |
| SC-003a | 1 of 1 measured definition scenarios omitted contract generation (100%) | PASS |
| SC-004 | 3 of 3 measured guideline/default scenarios passed (100%) | PASS |
| SC-005 | 5 of 5 measured corpus scenarios included rationale, evidence, and explicit assumptions or refinement/conflict handling (100%) | PASS |

Open gaps: corpus execution currently reflects the representative prompts defined above and focused regression coverage, not a larger randomized prompt set.

## Validate Edge Cases

1. Submit a derive request where the evidence is too thin and verify the response calls out missing evidence instead of inventing unsupported fields.
2. Submit an enhancement request where multiple candidate baselines exist and verify the response explains the selected baseline and why alternatives lost.
3. Submit a request with named guidance that only partially covers the needed contract sections and verify the response states which sections defaulted to OpenMetadata.
4. Submit a definition-style request against ambiguous model terminology and verify the system asks for refinement when the scope is not credible.

## Validation Commands

Run these from `extension/`:

```text
npm run check-types
npm test -- --runInBand --coverage=false test/integration/copilot.test.ts test/unit/modeling/modelMatcher.test.ts test/unit/modeling/proposalBuilder.test.ts test/unit/modeling/contractValidator.test.ts test/unit/modeling/proposalFormatter.test.ts
```

This focused validation should cover:

- `/model` intent classification across derive, enhance, and define workflows
- domain-specific baseline selection and generic-page demotion
- guideline precedence and OpenMetadata fallback behavior
- full proposal formatting for derive/enhance responses
- grounded summary formatting for definition responses
- raw-source traceability for evidence used in definition responses
- refinement-required handling for unresolved model scope