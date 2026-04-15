---
title: "Decision - what attributes exists in the portfolio aggregate"
summary: "Archived decision for query: what attributes exists in the portfolio aggregate"
created: 2026-04-14T16:56:52.796Z
modified: 2026-04-14T16:56:52.796Z
tags: ["decision", "copilot-chat", "archived"]
links:
  - "[[Phase 1.5: Data Quality Dimension Analysis for IPMS]]"
  - "[[Phase 1.2.2: IPMS Semantic Ontology (OWL-DL)]]"
  - "[[Phase 1.4: Data Lineage & W3C PROV Provenance Modeling]]"
  - "[[Phase 1.5: Quick Reference & Navigation Guide]]"
  - "[[Phase 1.2.1: IPMS Business Glossary Extraction]]"
---

# Decision - what attributes exists in the portfolio aggregate

## Summary
Archived decision for query: what attributes exists in the portfolio aggregate

## Tags
- decision
- copilot-chat
- archived

## Links

- [[Phase 1.5: Data Quality Dimension Analysis for IPMS]]
- [[Phase 1.2.2: IPMS Semantic Ontology (OWL-DL)]]
- [[Phase 1.4: Data Lineage & W3C PROV Provenance Modeling]]
- [[Phase 1.5: Quick Reference & Navigation Guide]]
- [[Phase 1.2.1: IPMS Business Glossary Extraction]]

## Content

### Question
what attributes exists in the portfolio aggregate root?

### Conversation

**User:** what attributes exists in the portfolio aggregate root?

**Assistant:** **Direct Answer**

The evidence only supports a **partial** Portfolio attribute list, not a complete schema: the Portfolio aggregate root is shown with **portfolio ID**, **portfolio name**, **total value**, **creation date** (and a proposed immutable **NEWPORTFOLIODATE**), **branch ID**, **risk level**, and **status**. This is grounded by references to portfolio ID length inconsistency, null portfolio names, portfolio total-value checks, portfolio creation date overwrite remediation, derived fields for branch ID and risk level, and missing enum constraints for portfolio status; no full authoritative attribute list is provided in the supplied evidence.

**Key Details**

- 99% target) - NULL portfolio names: 320 records (0.5% of 6K portfolios) - Missing transaction descriptions: 12K records (7.8% of 150K transactions) - Empty cost basis on 8.1% of positions - Business Impact: Revenue recognition calculations incomplete; missing reporting fields - Root Cause: Optional field logic in COBOL not enforced; batch loads skip validation 4.
- Phase 1.2.2: IPMS Semantic Ontology (OWL-DL) Execution Date: 11 April 2026 | Status: ✅ COMPLETE Duration: 6 hours | Format: OWL 2 Description Logic (OWL-DL) + SKOS Ontology Metrics: - Root Classes: 7 - Specialized Classes: 28 (with 4-5 hierarchy levels) - Object Properties: 26 (relationships, N:M cardinality) - Data Properties: 38 (attributes, XSD types) - Axioms & Constraints: 42 (business logic formalization) - SKOS Glossary Mappings: 148 (to business glossary terms) - Namespace Strategy: Semantic linked data ready --- Executive Summary The IPMS Semantic Ontology formalizes the Investment Portfolio Management System domain as a machine-readable knowledge graph with complete: 1.
- Class Hierarchy: 7 root classes + 28 specialized subclasses (portfolio states, transaction types, error categories, job statuses) 2.
- Semantic Relationships: 26 object properties (portfolio→transaction, transaction→position, user→authorization) 3.

**Supporting References**

- Wiki: Phase 1.5: Data Quality Dimension Analysis for IPMS
- Wiki: Phase 1.2.2: IPMS Semantic Ontology (OWL-DL)
- Wiki: Phase 1.4: Data Lineage & W3C PROV Provenance Modeling
- Wiki: Phase 1.5: Quick Reference & Navigation Guide
- Wiki: Phase 1.2.1: IPMS Business Glossary Extraction

### Rationale

- Answer archived from the grounded wiki query flow.
- Supporting wiki pages: Phase 1.5: Data Quality Dimension Analysis for IPMS, Phase 1.2.2: IPMS Semantic Ontology (OWL-DL), Phase 1.4: Data Lineage & W3C PROV Provenance Modeling, Phase 1.5: Quick Reference & Navigation Guide, Phase 1.2.1: IPMS Business Glossary Extraction

## Metadata
- **Archived**: 2026-04-14T16:56:52.796Z
- **Conversation Length**: 2 messages
- **Supporting Pages**: 5
