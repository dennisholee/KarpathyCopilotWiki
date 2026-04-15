# Contract: `/model` Participant Interaction

## Command

- Participant: `@wiki`
- Slash command: `/model`

## Request Shape

The user submits a natural-language modelling requirement in chat.

### Example

```text
@wiki /model Add a transaction suitability classification with business rules for approval thresholds and exception handling.
```

## Response Shape

The participant returns one markdown response with these sections:

1. `Preferred Baseline Model`
2. `Change Summary`
3. `Proposed Contract`
4. `Rationale`
5. `Conflicts` (only when needed)
6. `Assumptions / Gaps` (only when needed)
7. `Wiki Evidence Used`

## Behavioral Rules

- If no credible baseline model exists, the participant must ask the user to refine the requirement and must not emit a proposal.
- If evidence conflicts exist, the participant must still return one preferred proposal and explicitly cite the conflicting evidence.
- The `Proposed Contract` section must contain the full resulting contract, not only changed fields.
- The `Change Summary` section must concisely describe differences from the selected baseline model.

## Minimum Reviewable Payload

- baseline model identifier or title
- full resulting contract payload
- concise change summary
- rationale
- cited wiki evidence
- business rules and validation logic for each proposed attribute