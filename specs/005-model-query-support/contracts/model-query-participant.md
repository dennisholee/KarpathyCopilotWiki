# Contract: `/model` Query Participant Interaction

## Command

- Participant: `@wiki`
- Slash command: `/model`

## Request Shape

The user submits one natural-language modelling request in chat.

### Supported Intents

1. `derive`: generate a new model that does not already exist
2. `enhance`: modify an existing model with new attributes or rules
3. `define`: explain an existing model or relationship without generating a contract

### Examples

```text
@wiki /model generate the cdms tax model based on the cdms architecture, open metadata guideline and the oecd guideline
@wiki /model enhance the party model by adding an account number
@wiki /model what is the relationship model
```

## Response Shape

### Derive / Enhance Response

The participant returns one markdown response with these sections:

1. `Preferred Baseline Model` or `Derived Model Context`
2. `Change Summary`
3. `Proposed Contract`
4. `Rationale`
5. `Conflicts` (only when needed)
6. `Assumptions / Gaps` (only when needed)
7. `Wiki Evidence Used`
8. `Compliance Validation`

### Definition Response

The participant returns one markdown response with these sections:

1. `Model Definition`
2. `Key Entities / Relationships`
3. `Rationale`
4. `Wiki Evidence Used`
5. `Raw Source Traceability`
6. `Assumptions / Gaps` (only when needed)

## Behavioral Rules

- The system must classify the request intent before deciding which response family to use.
- Informational `define` requests must not emit a contract unless the user explicitly asks to generate or enhance one.
- If the request names one or more modelling guidelines, the response must explain how those guidelines affected output shape.
- If no explicit guideline is provided, generated contracts must default to the OpenMetadata contract shape.
- If the request is `enhance`, the response must identify a baseline model and a proposed insertion or modification point.
- If the request is `derive`, the response may proceed without a baseline model only when the evidence bundle is sufficient to derive a grounded model.
- Generic aggregation pages such as glossary or index pages may support the response, but they must not be selected as the primary baseline when more specific model evidence exists.

## Minimum Reviewable Payload

### For Derive / Enhance

- intent outcome (`derived` or `enhanced`)
- baseline model identifier when applicable
- full resulting contract payload
- concise change summary
- rationale
- cited wiki evidence
- conflict or assumption disclosure when applicable

### For Define

- grounded model definition summary
- key entities and/or relationships
- rationale
- cited wiki evidence
- mapped raw sources for cited definition evidence
- assumption disclosure when applicable