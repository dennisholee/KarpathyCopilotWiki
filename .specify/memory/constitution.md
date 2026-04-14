<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- [PRINCIPLE_1_NAME] -> Markdown-First
- [PRINCIPLE_2_NAME] -> Compounding Knowledge
- [PRINCIPLE_3_NAME] -> Traceability
- [PRINCIPLE_4_NAME] -> Structural Integrity
- [PRINCIPLE_5_NAME] -> Quality & Verifiability
Added sections: Constraints, Formatting Standards
Removed sections: none
Templates requiring updates (✅ updated / ⚠ pending):
- .specify/templates/plan-template.md: ⚠ pending (Constitution Check present — review for wiki-specific gating)
- .specify/templates/spec-template.md: ⚠ pending (Review required to include wiki standards)
- .specify/templates/tasks-template.md: ⚠ pending (Verify path conventions and document requirements for wiki content)
Follow-up TODOs:
- TODO(RATIFICATION_DATE): Provide original ratification date (ISO YYYY-MM-DD)
-->

# KarpathyCopilotWiki Constitution

## Core Principles

### Markdown-First
All outputs MUST be standard Markdown (CommonMark compatible). No proprietary or binary formats are permitted. Pages should render predictably in standard Markdown viewers and editors.

### Compounding Knowledge
Contributions MUST synthesize and add durable knowledge to the wiki rather than only answering ephemeral queries. Content accepted into the wiki becomes part of the canonical knowledge graph and MUST link to source material in `/raw`.

### Traceability
Every wiki claim MUST cite at least one source file under `/raw`. Links to source files belong in the `Links` field of a page. If an assertion cannot be traced to `/raw`, do NOT create or publish the page.

### Structural Integrity
Files MUST follow the `YYYYMMDDNN` naming convention (date + two-digit sequence) to ensure chronological ordering and uniqueness. Filenames and directories should reflect a single, focused concept per file.

### Quality & Verifiability
Entries MUST be atomic (one concept per file), verifiable, and minimally complete: include `Title`, `Summary`, `Tags`, `Links`, and `Content` fields. Avoid personal conjecture and unverifiable claims.

## Constraints

- **Atomic Notes**: One concept per file. Combine related concepts only when they form a single atomic idea with clear boundaries.
- **No Hallucinations**: If information is not present in `/raw`, do not invent wiki pages or assert unverified facts. Instead, create a research note that references missing sources and label it `Needs Source`.
- **Local-First with Optional Remote**: By default, all operations (embeddings, search, inference) use local models and compute. Remote services (e.g., GitHub Copilot API) may be used **only** when:
  1. Explicitly enabled by users via CLI flag (`--use-copilot`) or configuration
  2. The feature gracefully degrades to local-only if remote service is unavailable
  3. Users are informed of remote API usage with clear logging
  4. No sensitive wiki content is sent to remote services without disclosure
  5. Users maintain control over API credentials (never auto-transmitted)

## Formatting Standards

Every wiki file MUST contain the following top-level fields (in Markdown):

- **Title**: Single-line human-friendly title
- **Summary**: One-paragraph summary of the concept and its purpose
- **Tags**: Comma-separated tags for discoverability
- **Links**: List of source file paths (under `/raw`) that justify claims in the page
- **Content**: The body content (Markdown) containing the canonical explanation, examples, and any references

Filenames MUST follow `YYYYMMDDNN` (e.g., `2026041301.md`). Use two-digit sequence numbers when multiple atomic notes are created on the same date.

## Governance

The constitution is the authoritative policy for wiki content and structure. Amendments to this document MUST follow these rules:

- Propose changes via a pull request titled `docs: amend constitution to vX.Y.Z` with a clear rationale and migration plan.
- Amendments MUST include: description of change, affected templates/files, testing/validation steps, and roll-back instructions.
- Constitution versioning follows semantic versioning:
	- MAJOR: Backward-incompatible governance changes.
	- MINOR: New principle or significant policy addition.
	- PATCH: Clarifications, wording fixes, or non-functional edits.
- A PR that changes the constitution requires at least one designated reviewer from the docs maintainers and a passing verification that pages comply with the amended rules.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): provide original ratification date in YYYY-MM-DD | **Last Amended**: 2026-04-13


