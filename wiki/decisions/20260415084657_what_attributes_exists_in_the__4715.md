---
title: "Decision - what attributes exists in the transaction model"
summary: "Archived decision for query: what attributes exists in the transaction model"
created: 2026-04-15T00:46:57.831Z
modified: 2026-04-15T00:46:57.831Z
tags: ["decision", "copilot-chat", "archived"]
links:
  - "[[Phase 1.5: Data Quality Dimension Analysis for IPMS]]"
  - "[[Phase 1.2.2: IPMS Semantic Ontology (OWL-DL)]]"
  - "[[Phase 1.2.4 Quick Reference Guide]]"
  - "[[Phase 1.5: Quick Reference & Navigation Guide]]"
  - "[[✅ Phase 1.2.4 EXECUTION COMPLETE - FINAL SUMMARY]]"
---

# Decision - what attributes exists in the transaction model

## Summary
Archived decision for query: what attributes exists in the transaction model

## Tags
- decision
- copilot-chat
- archived

## Links

- [[Phase 1.5: Data Quality Dimension Analysis for IPMS]]
- [[Phase 1.2.2: IPMS Semantic Ontology (OWL-DL)]]
- [[Phase 1.2.4 Quick Reference Guide]]
- [[Phase 1.5: Quick Reference & Navigation Guide]]
- [[✅ Phase 1.2.4 EXECUTION COMPLETE - FINAL SUMMARY]]

## Content

### Question
what attributes exists in the transaction model

### Conversation

**User:** what attributes exists in the transaction model

**Assistant:** **Direct Answer**

The grounded evidence does **not** provide a complete attribute list for the **Transaction** model. It only supports that Transaction exists as a modeled class with **transaction types** as specialized subclasses and a **portfolio→transaction** relationship, and it implies a **portfolio-linked foreign key/relationship** because the data quality analysis reports **1,240 orphan transactions**. No explicit transaction data attributes are listed in the supplied evidence, so any fuller schema would be ungrounded.

**Key Details**

- 98% target) - Portfolio total-value ≠ SUM(positions) in 12.4% of records - FK violations: 1,240 orphan transactions (0.8% of 150K transactions) - Audit trail completeness: 18.2% of INSERT/UPDATE ops missing audit entries - Business Impact: Portfolio financials unreliable; regulatory audit exposure - Root Cause: BR-015 tolerance (±0.02) too wide; async audit logging lags writes 3.
- Phase 1.2.2: IPMS Semantic Ontology (OWL-DL) Execution Date: 11 April 2026 | Status: ✅ COMPLETE Duration: 6 hours | Format: OWL 2 Description Logic (OWL-DL) + SKOS Ontology Metrics: - Root Classes: 7 - Specialized Classes: 28 (with 4-5 hierarchy levels) - Object Properties: 26 (relationships, N:M cardinality) - Data Properties: 38 (attributes, XSD types) - Axioms & Constraints: 42 (business logic formalization) - SKOS Glossary Mappings: 148 (to business glossary terms) - Namespace Strategy: Semantic linked data ready --- Executive Summary The IPMS Semantic Ontology formalizes the Investment Portfolio Management System domain as a machine-readable knowledge graph with complete: 1.
- Class Hierarchy: 7 root classes + 28 specialized subclasses (portfolio states, transaction types, error categories, job statuses) 2.
- Semantic Relationships: 26 object properties (portfolio→transaction, transaction→position, user→authorization) 3.

**Supporting References**

- Wiki: Phase 1.5: Data Quality Dimension Analysis for IPMS
- Wiki: Phase 1.2.2: IPMS Semantic Ontology (OWL-DL)
- Wiki: Phase 1.2.4 Quick Reference Guide
- Wiki: Phase 1.5: Quick Reference & Navigation Guide
- Wiki: ✅ Phase 1.2.4 EXECUTION COMPLETE - FINAL SUMMARY

### Rationale

- Answer archived from the grounded wiki query flow.
- Supporting wiki pages: Phase 1.5: Data Quality Dimension Analysis for IPMS, Phase 1.2.2: IPMS Semantic Ontology (OWL-DL), Phase 1.2.4 Quick Reference Guide, Phase 1.5: Quick Reference & Navigation Guide, ✅ Phase 1.2.4 EXECUTION COMPLETE - FINAL SUMMARY

## Metadata
- **Archived**: 2026-04-15T00:46:57.831Z
- **Conversation Length**: 2 messages
- **Supporting Pages**: 5
