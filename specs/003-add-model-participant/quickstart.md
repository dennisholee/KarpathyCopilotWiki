# Quickstart: Add Model Participant

## Prerequisites

- Install dependencies in `extension/`.
- Open the repository in VS Code with Copilot Chat enabled.
- Ensure the workspace contains the existing `/wiki` and `/raw` folders used by the extension.

## Run The Extension

1. From `extension/`, run `npm install` if needed.
2. Run `npm run check-types`.
3. Start the extension in VS Code debug mode using the existing extension launch configuration.

## Exercise The Feature

1. Open Copilot Chat.
2. Invoke `@wiki /model` with a modelling requirement, for example:

```text
@wiki /model Extend the portfolio model with suitability rating, review frequency, and rule-based validation for high-risk clients.
```

3. Verify the response includes:
   - a selected baseline model
   - a concise change summary
   - a full resulting OpenMetadata-style contract
   - rationale for the proposal
   - cited wiki evidence

## Validate Edge Cases

1. Submit a requirement with no credible existing model match and verify the system asks for refinement instead of generating a proposal.
2. Submit a requirement whose evidence conflicts across wiki pages and verify the response returns one preferred proposal with explicit conflict disclosure and citations.
3. Submit a requirement with underspecified rules and verify unsupported or assumed portions are marked clearly.

## Validation Commands

Run these from `extension/`:

```text
npm run check-types
npm test -- --runInBand --coverage=false test/integration/copilot.test.ts test/unit/modeling/modelMatcher.test.ts test/unit/modeling/proposalBuilder.test.ts test/unit/modeling/contractValidator.test.ts test/unit/modeling/proposalFormatter.test.ts
```

This focused suite validates:

- `/model` participant integration flow
- baseline selection and refinement guidance
- proposal building and evidence assembly
- contract validation
- proposal formatting and YAML payload rendering