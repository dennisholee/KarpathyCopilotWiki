# Data Model: Complete Query Answer

## Purpose

Define the user-facing and internal data objects needed to transform local wiki search results into a grounded, structured answer.

## Entities

### UserQuery

Represents the incoming question being handled by the `@wiki` participant.

- `prompt`: the user’s raw question text
- `mode`: `free-form` or `search-command`
- `followUpContext`: the immediately previous wiki query/answer pair when present
- `timestamp`: request time for logging and archival context

### EvidenceCandidate

Represents one retrieved wiki page before final selection.

- `pageId`: unique wiki page identifier
- `title`: page title
- `excerpt`: short extracted text snippet
- `relevanceScore`: normalized score from retrieval
- `matchType`: `title`, `content`, or `semantic`
- `sourceFile`: originating source file path when available

### EvidenceBundle

Represents the grounded material actually used to answer the question.

- `query`: normalized working query
- `supportingPages`: selected supporting pages used in the answer
- `sourceReferences`: raw source references surfaced from the supporting pages
- `supportingFacts`: distilled grounded facts extracted from the selected evidence
- `coverageAssessment`: `complete`, `partial`, `insufficient`, or `conflicted`

### StructuredAnswer

Represents the response shape required by the spec.

- `directAnswer`: the main answer sentence or short paragraph
- `keyDetails`: ordered list of important supporting details
- `supportingReferences`: ordered list of wiki pages and source references
- `conflicts`: optional conflict summary items
- `coverageGaps`: optional list of unanswered or weakly supported parts of the query
- `confidenceLabel`: `supported`, `partially-supported`, or `insufficient-support`

### ConflictItem

Represents a meaningful disagreement across evidence.

- `topic`: subject of the disagreement
- `competingClaims`: short summaries of the conflicting claims
- `supportingSources`: references backing each competing claim
- `mostDefensiblePosition`: the answer stance presented to the user

### CoverageGap

Represents a missing or weakly supported part of the answer.

- `missingTopic`: the portion of the query not fully answerable
- `reason`: why the gap exists, such as no relevant evidence or only partial evidence
- `suggestedFollowUp`: a user-visible next step or narrower question

### ArchivedDecisionAnswer

Represents the persisted answer state when the user archives the conversation.

- `query`: original user question
- `answerBody`: rendered structured answer text
- `supportingPages`: wiki pages cited in the answer
- `sourceReferences`: raw sources cited in the answer
- `conversationTurns`: user/assistant transcript used for the archived page

## Relationships

- One `UserQuery` produces zero or more `EvidenceCandidate` items.
- A filtered set of `EvidenceCandidate` items becomes one `EvidenceBundle`.
- One `EvidenceBundle` produces one `StructuredAnswer`.
- One `StructuredAnswer` may contain zero or more `ConflictItem` entries.
- One `StructuredAnswer` may contain zero or more `CoverageGap` entries.
- An archived conversation stores one `ArchivedDecisionAnswer` built from the final `StructuredAnswer` and transcript.

## Validation Rules

- A `StructuredAnswer` must always include `directAnswer`, even when the value is a clear limitation statement.
- `supportingReferences` must be non-empty when `confidenceLabel` is `supported` or `partially-supported`.
- `conflicts` must be present when `coverageAssessment` is `conflicted`.
- `coverageGaps` must be present when `coverageAssessment` is `partial` or `insufficient`.
- `followUpContext` must include at most one previous wiki query/answer pair.
- `ArchivedDecisionAnswer` must preserve the same references shown in the user-visible answer.

## State Transitions

### Query Lifecycle

1. `received` → incoming `UserQuery`
2. `retrieved` → candidate evidence collected
3. `grounded` → evidence bundle selected and assessed
4. `answered` → structured answer produced and streamed
5. `archived` → optional persisted decision record created

### Coverage Assessment Lifecycle

1. `complete` when evidence fully addresses the question
2. `partial` when some parts are answerable and some are not
3. `conflicted` when evidence supports competing claims
4. `insufficient` when no defensible grounded answer can be produced
