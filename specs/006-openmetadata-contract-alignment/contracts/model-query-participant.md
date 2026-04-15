# Contract: `/model` Query Participant Interaction For OpenMetadata-Aligned Proposals

## Command

- Participant: `@wiki`
- Slash command: `/model`

## Request Shape

The user submits one natural-language modeling request in chat.

### Supported Proposal Intents

1. `derive`: generate a new aligned model proposal
2. `enhance`: update an existing model and return the aligned proposal
3. `define`: explain an existing model or domain concept without generating a contract

### Example Requests

```text
@wiki /model generate CDMS's tax model based on the OECD tax model using the OpenMetadata guideline
@wiki /model enhance the party model by adding an account number using the OpenMetadata guideline
@wiki /model what is cdms
```

## Response Shape

### Derive / Enhance Response

The participant returns one markdown response with these sections:

1. `Derived Model Context` or `Preferred Baseline Model`
2. `Change Summary`
3. `Proposed Contract`
4. `Rationale`
5. `Guideline Handling` when named guidance or fallback behavior needs explanation
6. `Assumptions / Gaps` when needed
7. `Conflicts` when needed
8. `Wiki Evidence Used`
9. `Compliance Validation`

The `Proposed Contract` section contains one OpenMetadata-aligned YAML contract with these top-level concepts:

- contract identity and display metadata
- status
- owner
- target entity
- schema text
- resources
- incident management

### Definition Response

The participant returns one grounded markdown summary and does not emit the aligned proposal contract.

## Behavioral Rules

- Derive and enhance requests must use the aligned contract shape.
- Definition requests must stay on the existing non-contract summary path.
- The participant must preserve evidence and rationale as review sections outside the aligned contract body.
- The participant should explain named-guideline precedence or OpenMetadata fallback in a dedicated review section when that reasoning matters to the proposal.
- The participant must default `targetEntity` to a logical modeled entity unless the request or evidence clearly supports a physical asset type.
- Owner, resource, and incident sections may be omitted or marked unresolved when evidence is insufficient, but they must not be fabricated.
- Enhancement requests must still explain the baseline selection and change intent even though the contract shape changes.

## Minimum Reviewable Payload

### For Derive / Enhance

- aligned contract YAML with the required top-level sections
- concise change summary
- grounded rationale
- cited wiki and raw evidence
- guideline-handling explanation when named guidance or fallback is relevant
- explicit assumptions or unresolved gaps when evidence is incomplete
- compliance validation outcome

### For Define

- grounded summary
- cited evidence
- raw-source traceability
- no aligned contract payload
