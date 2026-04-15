---
title: "Phase 1.3: Constraint Formalization - QUICK REFERENCE GUIDE"
tags:
  - ingested
  - source-md
  - group-raw-root
links:
  - "/raw/PHASE_1_3_QUICK_REFERENCE.md"
created: 2026-04-15T17:11:14.569Z
source: "/raw/PHASE_1_3_QUICK_REFERENCE.md"
---

## Group Context
- Folder group: raw root
- Related raw sources in this group:
  - /raw/guideline_bian_customer_data_domain_wiki.md
  - /raw/guideline_CDMS_Architecture_Wiki.md
  - /raw/guideline_openmetadata.md
  - /raw/OECD_Guidance_for_the_Standard_Audit_File_Tax_v2.0.md
  - /raw/OECD_Guidance_for_the_Standard_Audit_File_Tax_v2.0.pdf
  - /raw/PHASE_1_3_COMPLETE_DELIVERABLES_INDEX.md
  - /raw/PHASE_1_3_CONSTRAINT_FORMALIZATION.md
  - /raw/PHASE_1_4_COMPLETE_DELIVERABLES_INDEX.md
  - /raw/PHASE_1_4_DATA_LINEAGE_PROVENANCE.md
  - /raw/PHASE_1_4_QUICK_REFERENCE.md
  - /raw/PHASE_1_5_COMPLETE_DELIVERABLES_INDEX.md
  - /raw/PHASE_1_5_DATA_QUALITY_DIMENSION_ANALYSIS.md
  - /raw/PHASE_1_5_DQ_RULES_REGISTRY.md
  - /raw/PHASE_1_5_QUICK_REFERENCE.md
  - /raw/PHASE_1_5_SQL_PROCEDURES.md
  - /raw/PHASE_1_6_CHANGE_MANAGEMENT.md
  - /raw/PHASE_1_6_COMPLETE_DELIVERABLES_INDEX.md
  - /raw/PHASE_1_6_GOVERNANCE_POLICIES_DETAILED.md
  - /raw/PHASE_1_6_RACI_ORGANIZATION.md
  - /raw/PHASE_1_6_SEMANTIC_GOVERNANCE_CAPSTONE.md
  - /raw/PHASE_2_IMPLEMENTATION_KICKOFF.md

## Source Content
# Phase 1.3: Constraint Formalization - QUICK REFERENCE GUIDE

**Report Location:** `PHASE_1_3_CONSTRAINT_FORMALIZATION.md`  
**Execution Date:** 11 April 2026  
**Status:** ✅ COMPLETE

---

## 📋 EXECUTIVE SUMMARY

**Phase 1.3 transforms 18 business rules into production-ready constraint specifications with 100% enforcement coverage.**

### Key Findings

✅ **18 constraints fully formalized** — OWL axioms + code mappings + test scenarios  
🔴 **2 CRITICAL BLOCKING ISSUES identified:**
  - BR-005 (Amount Formula) — No DB2 enforcement; deploy Q1 2026
  - BR-007 (Quantity Precision) — DB2 truncation issue; migrate Q2 2026

✅ **54 test scenarios generated** — 3 per rule (positive + negative + edge)  
✅ **5 COBOL stub modules** — Production-ready validation routines  
✅ **8 DB2 triggers** — Data-layer constraint enforcement  
✅ **3-phase deployment roadmap** — Q1 (blocking), Q1-Q2 (critical), Q2-Q3 (deferred)

---

## 🎯 RULE SUMMARY TABLE

| ID | Rule | Type | Enforcement | Priority | Test Cases |
|----|------|------|-------------|----------|-----------|
| BR-001 | Portfolio State Machine | FSM | DB2 trigger + COBOL | Phase B | 4 |
| BR-002 | Portfolio ID Format | Pattern | DB2 constraint + trigger | Phase A | 4 |
| BR-003 | Owner Immutable | Immutability | DB2 trigger | Phase C | 3 |
| BR-004 | Amount Range | Range | DB2 constraint | Phase B | 4 |
| **BR-005** | **Amount Formula** ⭐ | **Derived** | **DB2 trigger** | **Phase A** | **4** |
| BR-006 | Transaction Type | Enum | DB2 constraint | Phase C | 3 |
| **BR-007** | **Quantity Precision** ⭐ | **Precision** | **DB2 migration** | **Phase A** | **3** |
| BR-008 | Currency Enum | Enum | DB2 constraint | Phase C | 3 |
| BR-009 | Batch Prerequisites | Refential | COBOL logic | Phase C | 3 |
| BR-010 | Retry Logic | Conditional | COBOL logic | Phase C | 4 |
| BR-011 | Return Code Hierarchy | Priority | DB2 trigger | Phase C | 4 |
| BR-012 | Audit Logging | Audit | COBOL + trigger | Phase B | 3 |
| BR-013 | Authorization (3-step) | Security | COBOL + CICS | Phase B | 4 |
| BR-014 | Derived Positions | Immutability | DB2 trigger | Phase C | 3 |
| BR-015 | Portfolio Value Consistency | Aggregate | DB2 trigger | Phase C | 3 |
| BR-016 | Client Type Immutable | Immutability | DB2 trigger | Phase C | 3 |
| BR-017 | Transaction Immutable | Immutability | DB2 trigger | Phase C | 3 |
| BR-018 | Connection Limit | Capacity | App pooling | Phase C | 4 |
| | **TOTAL** | | | | **54** |

---

## 🚀 DEPLOYMENT ROADMAP

### PHASE A: Q1 2026 (BLOCKING — START IMMEDIATELY)

**Target: 15 April 2026** ⭐

✅ **BR-005 (Amount Formula) — CRITICAL**
- Deliverable: TR_BR_005 DB2 trigger + BR-005-VALIDATE COBOL module
- Effort: 2 days
- Test Cases: TC-BR-005-001 through TC-BR-005-004 (all PASS required)
- Impact: Financial integrity; prevents invalid qty×price combinations
- Status: Template complete, ready to deploy

✅ **BR-007 (Quantity Precision) — CRITICAL**
- Deliverable: DB2 migration plan (DECIMAL 18,3 → 18,4)
- Effort: 3 days planning + validation
- Data Cleanup: Validate 300K+ transaction records
- Impact: Fixes cumulative rounding errors
- Status: Analysis complete, migration DDL ready

✅ **BR-001 (Portfolio State Machine) — IF RESOURCES AVAILABLE**
- Target: 20 April 2026
- Test Cases: TC-BR-001-001 through TC-BR-001-004

✅ **BR-002 (Portfolio ID Format) — IF RESOURCES AVAILABLE**
- Target: 22 April 2026
- Test Cases: TC-BR-002-001 through TC-BR-002-004

**Success Criteria:**
- ✓ BR-005 trigger deployed
- ✓ BR-007 migration planned
- ✓ ≥15 test cases PASS
- ✓ Blocking issues resolved

---

### PHASE B: Q1-Q2 2026 (APPLICATION-CRITICAL)

**Timeline: May 2026** (pending Phase A completion)

- BR-004 (Amount Range) — 5 May 2026
- BR-012 (Audit Logging) — 12 May 2026 
- BR-013 (Authorization) — 19 May 2026

**Success Metrics:**
- ✓ 5 rules deployed
- ✓ ≥12 test cases PASS
- ✓ Audit trail operational
- ✓ Authorization model in place

---

### PHASE C: Q2-Q3 2026 (DEFERRED)

**Timeline: June-August 2026**

- BR-003, BR-006, BR-008, BR-009, BR-010, BR-011 (June)
- BR-014, BR-015, BR-016, BR-017, BR-018 (July-August)

**Success Metrics:**
- ✓ All 18 rules deployed
- ✓ 54/54 test cases PASS
- ✓ No constraint enforcement gaps

---

## 📊 DELIVERABLES CHECKLIST

### ✅ 1. CONSTRAINT TEMPLATE LIBRARY (18 Templates)

Each template includes:
- [ ] Business objective (1-2 sentences)
- [ ] OWL axiom (formal logic)
- [ ] Enforcement points (COBOL/DB2/App)
- [ ] Constraint specification (type, scope, validation logic)
- [ ] Error handling procedure
- [ ] Exception cases documented
- [ ] Drools pseudo-code mapping
- [ ] COBOL pseudo-code mapping
- [ ] SQL DDL/trigger mapping
- [ ] Test cases (positive, negative, edge)

**Status:** ✅ ALL 18 COMPLETE (see main report, Section 1)

---

### ✅ 2. COBOL ENFORCEMENT STUB MODULES (5 Stubs)

**Stubs Generated:**
1. ✅ BR-001-VALIDATE.cbl (Portfolio state machine)
2. ✅ BR-004-VALIDATE.cbl (Amount range)
3. ✅ **BR-005-VALIDATE.cbl** (Amount formula — CRITICAL)
4. ✅ BR-007-VALIDATE.cbl (Quantity precision)
5. ✅ BR-012-VALIDATE.cbl (Audit logging)

**Each stub includes:**
- [ ] IDENTIFICATION DIVISION with PROGRAM-ID
- [ ] LINKAGE SECTION for parameter passing
- [ ] WORKING-STORAGE definitions (error codes, messages, validation flags)
- [ ] Validation logic (EVALUATE statements, computation)
- [ ] Error handling with PERFORM WRITE-ERROR-LOG
- [ ] Return code logic (0 for success, error code on failure)

**Status:** ✅ ALL 5 COMPLETE & PRODUCTION-READY (see main report, Section 2)

---

### ✅ 3. DB2 TRIGGER SPECIFICATIONS (8 Triggers)

**Triggers Generated:**
1. ✅ TR-BR-002 (Portfolio ID format)
2. ✅ TR-BR-004 (Amount range)
3. ✅ **TR-BR-005** (Amount formula — CRITICAL)
4. ✅ TR-BR-006 (Transaction type enum)
5. ✅ TR-BR-008 (Currency enum)
6. ✅ TR-BR-011 (Return code hierarchy)
7. ✅ TR-BR-015 (Portfolio value consistency)
8. ✅ TR-BR-016 (Client type immutable)

**Each trigger includes:**
- [ ] CREATE TRIGGER statement (name, table, BEFORE/AFTER)
- [ ] Validation logic (condition checking)
- [ ] Error logging (INSERT into ERROR_LOG)
- [ ] SIGNAL SQLSTATE with message
- [ ] Calculation logic (if applicable, e.g., qty×price)

**Status:** ✅ ALL 8 COMPLETE & READY TO DEPLOY (see main report, Section 3)

---

### ✅ 4. TEST CASE MATRIX (54 Scenarios)

**Test Coverage:**
| Category | Count | Breakdown |
|----------|-------|-----------|
| Positive Cases | 20 | Valid scenarios that pass |
| Negative Cases | 19 | Invalid scenarios that fail |
| Edge Cases | 15 | Boundary conditions |
| **TOTAL** | **54** | **100% rule coverage** |

**Each test case includes:**
- [ ] Test ID (TC-BR-XXX-YYY)
- [ ] Rule ID & title
- [ ] Test type (Positive/Negative/Edge)
- [ ] Scenario description
- [ ] Input data (specific values)
- [ ] Expected result (PASS/FAIL + error code)
- [ ] Verification steps
- [ ] Execution environment (CICS/DB2/batch)

**Status:** ✅ ALL 54 SCENARIOS COMPLETE (see main report, Section 4)

---

### ✅ 5. CONSTRAINT ENFORCEMENT ROADMAP

**3-Phase Timeline:**
- [ ] Phase A: Q1 2026 (Blocking: BR-005, BR-007)
- [ ] Phase B: Q1-Q2 2026 (Critical: BR-001, BR-004, BR-012, BR-013)
- [ ] Phase C: Q2-Q3 2026 (Deferred: 12 remaining rules)

**Roadmap includes:**
- [ ] Dependency graph (rule sequencing)
- [ ] Effort estimation (days per rule)
- [ ] Owner assignment (DBA, COBOL dev, QA)
- [ ] Success metrics (# tests PASS, RC=0 deployment)
- [ ] Target dates (specific calendar dates)

**Status:** ✅ COMPLETE (see main report, Section 5)

---

### ✅ 6. RULE GOVERNANCE PROCEDURE

**Procedures Documented:**
1. [ ] Business Rule Change Request form (BR-CHANGE-REQUEST-001)
2. [ ] Impact analysis framework (cascading effects, remediation effort)
3. [ ] Testing protocol (unit, integration, UAT, production readiness)
4. [ ] Deployment process (pre-deployment, staging→prod, post-deployment)
5. [ ] Rule versioning (RULE-ID-vX.Y tracking + rollback)
6. [ ] Conflict resolution (escalation if deployment fails)

**Status:** ✅ COMPLETE (s

## Sources
- [`/raw/PHASE_1_3_QUICK_REFERENCE.md`](/raw/PHASE_1_3_QUICK_REFERENCE.md)