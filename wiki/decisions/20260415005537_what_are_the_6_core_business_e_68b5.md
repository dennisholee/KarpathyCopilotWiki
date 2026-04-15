---
title: "Decision - what are the 6 core business entities in  IPMS Con"
summary: "Archived decision for query: what are the 6 core business entities in  IPMS Con"
created: 2026-04-14T16:55:37.993Z
modified: 2026-04-14T16:55:37.993Z
tags: ["decision", "copilot-chat", "archived"]
links:
  - "[[Phase 1.2.2: IPMS Semantic Ontology (OWL-DL)]]"
  - "[[Phase 1.2.4 Quick Reference Guide]]"
  - "[[✅ Phase 1.2.4 EXECUTION COMPLETE - FINAL SUMMARY]]"
  - "[[Phase 1.2.3: COBOL-to-Ontology Type Mapper]]"
  - "[[Phase 1.2.4: Semantic Model Designer Report]]"
---

# Decision - what are the 6 core business entities in  IPMS Con

## Summary
Archived decision for query: what are the 6 core business entities in  IPMS Con

## Tags
- decision
- copilot-chat
- archived

## Links

- [[Phase 1.2.2: IPMS Semantic Ontology (OWL-DL)]]
- [[Phase 1.2.4 Quick Reference Guide]]
- [[✅ Phase 1.2.4 EXECUTION COMPLETE - FINAL SUMMARY]]
- [[Phase 1.2.3: COBOL-to-Ontology Type Mapper]]
- [[Phase 1.2.4: Semantic Model Designer Report]]

## Content

### Question
what are the 6 core business entities in  IPMS Conceptual Model?

### Conversation

**User:** what are the 6 core business entities in  IPMS Conceptual Model?

**Assistant:** **Direct Answer**

The provided evidence confirms that the IPMS Conceptual Model has **6 core business entities**, but it does **not explicitly list all six by name**. In the supplied material, **Portfolio**, **Transaction**, and **AuditLog** are directly identified as root entities; the other three appear to correspond to the **Position**, **Error/ErrorLog**, and **BatchJob** domains, but those are **inferred from related glossary and gap references rather than explicitly enumerated** in the conceptual-model summary.

**Key Details**

- Linked Data: SKOS annotations map all 148 business glossary terms to ontology classes/properties 7.
- Phase 1.2.4 Quick Reference Guide Project: Investment Portfolio Management System (IPMS) Phase: 1.2.4 Semantic Model Designer Date: 11 April 2026 Status: ✅ COMPLETE --- Executive Summary (1 Page) Phase 1.2.4 successfully synthesized all prior analysis phases (1.1-1.2.3) into a unified 3-layer semantic data model spanning Conceptual, Logical (OWL-DL), and Physical (DB2) representations.
- Key Achievements | Metric | Result | |--------|--------| | Field Coverage | 267/267 COBOL fields (100%) | | Type Precision | 265/267 exact/superset match (99%) | | Business Rules | 18/18 formalized as OWL axioms (100%) | | Glossary Integration | 148/148 business terms linked (100%) | | OWL Completeness | 42 formal axioms + 12 derived constraints | | Cross-Layer Traceability | Every field traced COBOL↔OWL↔DB2 (100%) | | Architecture Score | 95% (Excellent) | Critical Findings 🚨 BLOCKING Issues (Must Fix Before Phase 1.3): 1.
- 14 missing CHECK constraints for enums ✅ GREEN Items (Ready for Production): - All 6 core entities well-defined - All relationships formalized with cardinality - Portfolio state machine axiomatized - Transaction immutability enforced - Audit trail architecture complete - Error categorization exhaustive --- 3-Layer Model Overview LAYER 1: CONCEPTUAL MODEL (Business Entities) LAYER 2: LOGICAL MODEL (OWL-DL Ontology) LAYER 3: PHYSICAL MODEL (DB2 Schema) --- Gap Inventory & Remediation Plan CRITICAL GAPS (BLOCKING) | Gap | Issue | Remediation | Timeline | Owner | |-----|-------|-------------|----------|-------| | GAP-007 | DECIMAL(18,3) truncates COBOL 4-decimal quantity | ALTER TABLE TRANSACTIONHISTORY, POSITIONHISTORY MODIFY QUANTITY DECIMAL(18,4) | Q2 2026 | Data Arch | | BR-005 | Amount formula (qty × price ≈ amount) NOT validated | ADD CHECK constraint: ABS(AMOUNT - (QUANTITY × PRICE)) < 0.01; Add COBOL validation | Q1 2026 (URGENT!) | DB Admin | MEDIUM GAPS (Q2 2026 Priority) | Gap | Issue | Remediation | Owner | |-----|-------|-------------|-------| | GAP-004 | Portfolio creation date overwritten by batch | Add NEWPORTFOLIODATE immutable; prevent overwrite; backfill from AUDITLOG | Data Quality | | GAP-006 | Derived fields (BRANCHID, RISKLEVEL) undocumented | Document calculation formulas in code comments & data dictionary | Business Analysis | | GAP-008 | Portfolio ID length inconsistency (X8 vs X10) | Verify max length; standardize copybook definitions | COBOL Governance | | GAP-014 | AUDITLOG storage location unclear | Inventory all audit storage; consolidate to DB2 AUDAUDITLOG table | Audit/Compliance | | GAP-015 | BATCHJOB table missing from schema | Create BATCHJOB table: (JOBID, JOBDATE, JOBSTATUS, STEP, RECORDCOUNT, etc.) | DB Admin | | 14× Type Constraints | Missing CHECK for STATUS/TYPE/CATEGORY/SEVERITY enums | ADD 14 CHECK constraints (Portfolio status, Transaction type, Error category, etc.) | DB Admin | LOW GAPS (Q3 2026 and Later) | Gap | Issue | Remediation | Owner | |-----|-------|-------------|-------| | GAP-009 | Date format inconsistency (9(8) vs ISO 8601) | Standardize to ISO 8601 (YYYY-MM-DD) everywhere | Data Governance | | GAP-001 | CICS transaction IDs inferred but not explicit | Cross-reference online programs to CICS transaction IDs | Online Development | | GAP-010 | Dual error logging (VSAM vs DB2) | Consolidate to DB2 table only; migrate VSAM files | Batch Operations | | GAP-013 | Boolean representation (CHAR(1) Y/N) | Change to BOOLEAN if DBMS supports; add CHECK constraint | DB Admin | --- Phase 1.3 Readiness ✅ Approved to Proceed The semantic model is production-ready for Phase 1.3 (Business Rules Formalization): Prerequisites Met: - ✅ All 6 entities fully defined - ✅ All 8 relationships mapped with cardinality - ✅ All 18 business rules formalized as OWL axioms - ✅ All 267 fields traced across 3 layers - ✅ All 148 business terms integrated via SKOS - ✅ 15 gaps identified + prioritized with remediation Blocking Actions Required: - [ ] Fix BR-005 (Amount formula validation) — Q1 2026 (URGENT) - [ ] Plan GAP-007 (Quantity precision) — Q2 2026 (HIGH) Phase 1.3 Will Deliver: 1.

**Supporting References**

- Wiki: Phase 1.2.2: IPMS Semantic Ontology (OWL-DL)
- Wiki: Phase 1.2.4 Quick Reference Guide
- Wiki: ✅ Phase 1.2.4 EXECUTION COMPLETE - FINAL SUMMARY
- Wiki: Phase 1.2.3: COBOL-to-Ontology Type Mapper
- Wiki: Phase 1.2.4: Semantic Model Designer Report

### Rationale

- Answer archived from the grounded wiki query flow.
- Supporting wiki pages: Phase 1.2.2: IPMS Semantic Ontology (OWL-DL), Phase 1.2.4 Quick Reference Guide, ✅ Phase 1.2.4 EXECUTION COMPLETE - FINAL SUMMARY, Phase 1.2.3: COBOL-to-Ontology Type Mapper, Phase 1.2.4: Semantic Model Designer Report

## Metadata
- **Archived**: 2026-04-14T16:55:37.993Z
- **Conversation Length**: 2 messages
- **Supporting Pages**: 5
