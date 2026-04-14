---
description: "Acceptance Test Matrix: Specification to Test Case Mapping"
---

# Acceptance Test Matrix

**Phase 1 Deliverable**: Maps specification requirements (FR-001 through FR-008) and success criteria (SC-001) to test cases.

**Status**: Phase 1 Complete  
**Date**: April 14, 2026  

---

## Requirement Mapping

### FR-001: Ingest PDFs from `/raw` and Extract Text

**Specification**:
> Extension processes PDF files placed in `/raw` folder, extracts text content, identifies concepts, and generates wiki pages with Title/Summary/Tags/Links/Content.

**Acceptance Test Cases**:

#### T_FR001_001: PDF Upload Triggers Ingest Pipeline
- **Setup**: Place `sample.pdf` in `/raw` folder
- **Action**: File watcher detects file creation
- **Expected**: Ingest pipeline starts automatically (debounce 500ms)
- **Verification**: Status bar shows "Ingesting sample.pdf", temp file appears in staging folder
- **Test Type**: Integration

#### T_FR001_002: Text Extraction from PDF
- **Setup**: `sample.pdf` contains "Machine Learning is a subset of AI"
- **Action**: Call extraction service
- **Expected**: Extracted text includes "Machine Learning" and "AI"
- **Verification**: `extractedText` field populated in RawDocument
- **Test Type**: Unit

#### T_FR001_003: Concept Extraction (NER)
- **Setup**: Extracted text: "Decision trees are used in classification tasks"
- **Action**: Run concept extraction with spaCy NER
- **Expected**: Identifies concepts: "Decision trees", "classification"
- **Verification**: NER results include confidence > 0.7
- **Test Type**: Unit

#### T_FR001_004: Draft Page Generation
- **Setup**: Concepts extracted; links to `/raw/sample.pdf` identified
- **Action**: Generate draft wiki page
- **Expected**: Page created with Title, Summary, Tags, Links, Content fields
- **Verification**: Schema validation passes (see T_SCHEMA_001)
- **Test Type**: Unit

---

### FR-002: Bidirectional Backlinks

**Specification**:
> When a new page is created, the extension identifies related existing pages and inserts `[[WikiLinks]]` bidirectionally. Changes to pages are idempotent (duplicate links not inserted).

**Acceptance Test Cases**:

#### T_FR002_001: Backlink Insertion on New Page
- **Setup**: Existing page "DecisionTrees.md" with title "Decision Trees"
- **Action**: Ingest creates new page "MLConcepts.md" linking to decision trees
- **Expected**: New page contains `[[Decision Trees]]` link
- **Verification**: `[[Decision Trees]]` appears in MLConcepts.md content
- **Test Type**: Integration

#### T_FR002_002: Reverse Backlink Update
- **Setup**: MLConcepts.md created with forward link to DecisionTrees.md
- **Action**: DecisionTrees.md read and checked
- **Expected**: DecisionTrees.md has reverse backlink to MLConcepts
- **Verification**: `[[MLConcepts]]` or similar reference in DecisionTrees content
- **Test Type**: Integration

#### T_FR002_003: Idempotent Backlink Insertion
- **Setup**: Pages A and B already linked via `[[B]]` in A
- **Action**: Backlink reconciliation ran again (e.g., manual rebuild)
- **Expected**: No duplicate `[[B]]` inserted in A
- **Verification**: Count of `[[B]]` references = 1
- **Test Type**: Unit

---

### FR-003: Atomic YYYYMMDDNN Filenames

**Specification**:
> All wiki pages use `YYYYMMDDNN.md` filenames (atomic, unique, date-sequential).

**Acceptance Test Cases**:

#### T_FR003_001: Filename Generation
- **Setup**: Today is 2026-04-14
- **Action**: Generate filename for new page
- **Expected**: Filename is `20260414NN.md` where NN is sequence
- **Verification**: Regex match `^[0-9]{8}[0-9]{2}\.md$`
- **Test Type**: Unit

#### T_FR003_002: Sequence Increment
- **Setup**: Existing files: `20260414_01.md`, `20260414_02.md`
- **Action**: Generate next filename for 2026-04-14
- **Expected**: Filename is `20260414_03.md`
- **Verification**: Sequence = 03, zero-padded
- **Test Type**: Unit

#### T_FR003_003: Cross-Day Sequence Reset
- **Setup**: Last file is 2026-04-14_05.md; today is 2026-04-15
- **Action**: Generate filename for 2026-04-15
- **Expected**: Filename is `20260415_01.md` (sequence resets)
- **Verification**: Date prefix incremented, sequence = 01
- **Test Type**: Unit

---

### FR-004: Traceability to `/raw` Sources

**Specification**:
> Every wiki page MUST cite at least one `/raw` source in the `Links` field, or be marked `needsSource: true`. No hallucinated content without source attribution.

**Acceptance Test Cases**:

#### T_FR004_001: Links to `/raw` Enforced
- **Setup**: Generate wiki page from `/raw/sample.pdf`
- **Action**: Check page schema
- **Expected**: `links` field includes `/raw/sample.pdf`
- **Verification**: Page.links.some(link => link.includes('/raw/'))
- **Test Type**: Unit

#### T_FR004_002: Needs Source Flagging
- **Setup**: Page generated with assertions not citing `/raw`
- **Action**: Run validator
- **Expected**: Page marked `needsSource: true`
- **Verification**: Page.needsSource === true
- **Test Type**: Unit

#### T_FR004_003: Markdown Link Rendering
- **Setup**: Page with link to `/raw/source.pdf`
- **Action**: Render markdown to HTML (check preview)
- **Expected**: Link is clickable and references `/raw/source.pdf`
- **Verification**: HTML contains `href="/raw/source.pdf"`
- **Test Type**: Manual

---

### FR-005: Foam Graph Compatibility

**Specification**:
> All wiki pages generated with `[[WikiLink]]` syntax. Foam graph visualization correctly renders edges between linked pages.

**Acceptance Test Cases**:

#### T_FR005_001: WikiLink Syntax Generation
- **Setup**: Generate page with related concept links
- **Action**: Check content for Foam link syntax
- **Expected**: Content contains `[[Related Concept]]` (double brackets)
- **Verification**: Regex `\[\[[^\]]+\]\]` matches
- **Test Type**: Unit

#### T_FR005_002: Foam Graph Rendering
- **Setup**: Create wiki with 5 pages, interconnected with backlinks
- **Action**: Open Foam graph (manual step)
- **Expected**: Graph displays nodes for each page; edges represent `[[WikiLinks]]`
- **Verification**: Visual inspection confirms correct topology
- **Test Type**: Manual

---

### FR-006: Query via Copilot Chat

**Specification**:
> Users query wiki via Copilot Chat participant (`@wiki`). Extension searches wiki, injects context, and Copilot synthesizes responses. Responses cite supporting pages and `/raw` sources.

**Acceptance Test Cases**:

#### T_FR006_001: Participant Registration
- **Setup**: Extension activated
- **Action**: Open Copilot Chat sidebar
- **Expected**: `@wiki` participant appears in participant list
- **Verification**: Can type `@wiki` and see participant name
- **Test Type**: Manual

#### T_FR006_002: Search Query Execution
- **Setup**: Wiki contains pages on "Decision Trees"
- **Action**: User types `@wiki search for decision tree algorithms`
- **Expected**: Extension searches wiki, returns top results into chat context
- **Verification**: Chat displays results with titles and excerpts
- **Test Type**: Integration

#### T_FR006_003: Context Injection
- **Setup**: Search results ready
- **Action**: Copilot prepares to synthesize response
- **Expected**: Wiki page content injected into model context
- **Verification**: Response generated with proper citations
- **Test Type**: Integration

#### T_FR006_004: Decision Archival
- **Setup**: User queries and receives Copilot response
- **Action**: User confirms to archive decision
- **Expected**: Decision page created under `/wiki/decisions/` with transcript
- **Verification**: File created with correct schema (Title, transcript, links)
- **Test Type**: Integration

---

### FR-007: Linting (Orphan Detection + Claim Analysis)

**Specification**:
> `wiki.lint` command (quick mode: orphans; deep mode: orphans + contradictions) identifies quality issues.

**Acceptance Test Cases**:

#### T_FR007_001: Orphan Page Detection (Quick Mode)
- **Setup**: Page with zero inbound `[[WikiLinks]]`
- **Action**: Run `wiki.lint` quick mode
- **Expected**: Page listed as orphan
- **Verification**: Report.orphanPages includes page filename
- **Test Type**: Unit

#### T_FR007_002: Contradiction Detection (Deep Mode)
- **Setup**: Two pages contradict: "A causes B" vs "A prevents B"; both cite `/raw` sources
- **Action**: Run `wiki.lint` deep mode
- **Expected**: Contradiction reported with both pages listed
- **Verification**: Report includes contradiction details (pages, claim, sources)
- **Test Type**: Unit

#### T_FR007_003: Lint Report Generation
- **Setup**: Lint analysis complete
- **Action**: Export report
- **Expected**: Report includes severity levels, remediation suggestions
- **Verification**: Report readable and actionable
- **Test Type**: Unit

---

### FR-008: Index Rebuild

**Specification**:
> `wiki.indexRebuild` command rebuilds `index.md` (categories) and `glossary.md` (terms + definitions). Updates are idempotent.

**Acceptance Test Cases**:

#### T_FR008_001: Index Rebuild
- **Setup**: Wiki with 10 pages tagged with categories
- **Action**: Run `wiki.rebuildIndex`
- **Expected**: `index.md` updated with categories and page listings
- **Verification**: `index.md` contains expected categories and all 10 pages
- **Test Type**: Integration

#### T_FR008_002: Glossary Generation
- **Setup**: Wiki pages with definitions extracted
- **Action**: Run index rebuild
- **Expected**: `glossary.md` populated with terms and definitions
- **Verification**: `glossary.md` contains at least 5 glossary terms
- **Test Type**: Unit

#### T_FR008_003: Idempotent Rebuild
- **Setup**: Index rebuilt once; run rebuild again
- **Action**: Compare outputs
- **Expected**: `index.md` and `glossary.md` unchanged (idempotent)
- **Verification**: File checksums identical before/after
- **Test Type**: Unit

---

## Success Criteria

### SC-001: Backlink Coverage (80%+ Target)

**Metric**: Percentage of wiki pages with at least one inbound backlink (excluding index/glossary).

**Test Case**: T_BACKLINK_COVERAGE
- **Setup**: Complete ingest of 20-page sample wiki
- **Action**: Count pages with inbound links
- **Expected**: ≥ 16 pages (80%) have ≥ 1 inbound link
- **Verification**: (pagesWithBacklinks / totalPages) ≥ 0.8
- **Test Type**: Integration

---

## Schema Validation Tests

### T_SCHEMA_001: Page Schema Validation

**Setup**: Generated wiki page
**Action**: Validate against JSON Schema
**Expected**: Schema validation passes with all required fields present

**Required Fields**:
- `filename` (string, matches `[0-9]{8}[0-9]{2}\.md`)
- `title` (string, non-empty)
- `summary` (string, non-empty)
- `tags` (array of strings)
- `links` (array of strings, ≥ 1 `/raw` path)
- `content` (string, valid CommonMark)

**Test Type**: Unit

---

## Test Coverage Summary

| Phase | Test Type | Count | Target Coverage |
|-------|-----------|-------|-----------------|
| Unit | Unit | 18 | 70%+ |
| Integration | Integration | 12 | 20%+ |
| Manual | Manual | 4 | 10%+ |
| **Total** | **Mixed** | **34** | **≥80%** |

---

## Test Execution Plan

### Phase 2A (Extension Scaffold)
- Run unit tests: T_FR003, T_SCHEMA_001 (filename generation, schema validation)
- Manual verification: GUI command registration

### Phase 2B (Core Workflows)
- Run integration tests: T_FR001–FR003 (ingest, backlinks, index)
- Run unit tests: T_FR004, T_FR007 (traceability, linting)

### Phase 2C (Copilot Chat Integration)
- Run integration tests: T_FR006 (query, decision archival)
- Manual tests: Copilot Chat interaction

### Phase 2D (Polish)
- Re-run all tests with final build
- Manual GUI regression testing
- Generate coverage report (expect 80%+)

---

**Next**: Phase 2A implementation (T014–T022b)
