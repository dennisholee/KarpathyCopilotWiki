---
title: "Phase 1.4 Data Lineage & PROV Provenance - Quick Reference"
tags:
  - ingested
  - source-md
  - group-raw-root
links:
  - "/raw/PHASE_1_4_QUICK_REFERENCE.md"
created: 2026-04-15T17:11:14.593Z
source: "/raw/PHASE_1_4_QUICK_REFERENCE.md"
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
  - /raw/PHASE_1_3_QUICK_REFERENCE.md
  - /raw/PHASE_1_4_COMPLETE_DELIVERABLES_INDEX.md
  - /raw/PHASE_1_4_DATA_LINEAGE_PROVENANCE.md
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
# Phase 1.4 Data Lineage & PROV Provenance - Quick Reference

**Execution Date:** 11 April 2026  
**Status:** ✅ COMPLETE  
**Report Location:** `PHASE_1_4_DATA_LINEAGE_PROVENANCE.md`

---

## 📊 DELIVERABLES AT A GLANCE

### 1️⃣ **Primary Data Lineage (5 Flows)**

| Flow | Trigger Programs | Source | Target | Fields | BR Coverage |
|------|------------------|--------|--------|--------|---|
| **Portfolio CRUD** | PORTADD, PORTUPDT, PORTDEL | PORTFLIO.cpy | PORTFOLIO_MASTER + AUDITLOG | 20 fields | BR-001, BR-002, BR-004, BR-005, BR-012 |
| **Online Inquiry** | INQONLN, INQPORT, INQHIST | CICS Terminal | VSAM POSFILE + DB2 POSHIST | 8 fields | BR-002, BR-004 |
| **Transactions** | PORTTRAN | TRNREC.cpy | TRANSACTION_HISTORY + INVESTMENT_POSITIONS | 22 fields | BR-005 (CRITICAL), BR-006, BR-008, BR-011, BR-012 |
| **Error Capture** | DB2ERR, ERRPROC | Any program error | ERROR_LOG table | 8 fields | BR-011, BR-012, BR-013 |
| **Batch Orchestration** | BCHCTL00, RTNANA00 | Process control | BATCH_CONTROL + reports | 5 fields | BR-010, BR-012 |

### 2️⃣ **W3C PROV-O Graphs (3 Complete RDF/XML)**

| Graph | Entities | Activities | Purpose | Lines |
|-------|----------|-----------|---------|-------|
| **Graph 1: Portfolio Creation** | 3 | 4 | Input→Validate→Insert→Audit | 245 lines |
| **Graph 2: Transaction-Position Update** | 4 | 4 | Transaction→Calculate→Update→Audit | 238 lines |
| **Graph 3: Error-Retry Flow** | 3 | 3 | Invalid→Categorize→Queue | 220 lines |
| **TOTAL** | **10** | **11** | Full provenance chain | **703 lines** |

### 3️⃣ **Field-Level Lineage (50+ Sample Fields)**

**Distribution:**
- 15 Portfolio fields (PORT-* from PORTFLIO.cpy)
- 12 Transaction fields (TRN-* from TRNREC.cpy)
- 10 Position fields (POS-* from POSREC.cpy)
- 8 Error/Audit fields (ERR-*, AUDIT-*)
- 5 Batch Control fields (BCH-* from BCHCTL.cpy)

**Per-Field Details:**
- Source COBOL PIC clause
- OWL semantic mapping
- DB2 target column + type
- Transformation description
- Business rule enforcer
- Audit trail requirement
- Data quality level (C/H/M/L)

### 4️⃣ **Lineage Query Procedures (5 SQL + 1 COBOL)**

| # | Query Name | Purpose | Output |
|---|-----------|---------|--------|
| 1 | Portfolio Lineage Trace | Track portfolio creation→mutations→now | Chronological event log |
| 2 | Transaction→Position Impact | Show transaction flowing through position→portfolio | Cascading updates |
| 3 | Mutations by User-Date | Track all changes by USER001 (2026-04-01 to 04-15) | Change audit trail |
| 4 | Portfolio Reconciliation (BR-015) | Verify: portfolio_total = SUM(positions) ± 0.02 | Consistency report |
| 5 | Error Root Cause Analysis | Classify errors by BR, show remediation path | Error pattern analysis |
| **Bonus** | COBOL Lineage Stub | Execute queries, produce traceability reports | Automated lineage reporting |

---

## 🎯 KEY LINEAGE PATHS

### Path 1: Portfolio Creation
```
Terminal Input (PORT-ID, PORT-TOTAL-VALUE)
  ↓ [PROV:used] PORTADD validation (BR-001, BR-002, BR-005)
  ↓ [PROV:wasGeneratedBy] Validation result
  ↓ [PROV:wasDerivedFrom] DB2 INSERT activity
  ↓ [PROV:wasGeneratedBy] PORTFOLIO_MASTER record
  ↓ [PROV:used] Audit log write (BR-012)
  ↓ [PROV:wasGeneratedBy] AUDITLOG entry
  ↓ [PROV:wasInformedBy] DB2 COMMIT
✅ Lineage Complete: Input → DB2 → Audit → Commit
```

### Path 2: Transaction Impact
```
Transaction Input (TRN-QUANTITY × TRN-PRICE = TRN-AMOUNT)
  ↓ [PROV:used] BR-005 validation (amount formula)
  ↓ [PROV:wasGeneratedBy] TRANSACTION_HISTORY insert
  ↓ [PROV:triggers] Position market value calculation
  ↓ [PROV:wasGeneratedBy] INVESTMENT_POSITION update
  ↓ [PROV:propagates] Portfolio total recalculation
  ↓ [PROV:used] Audit logging (BR-012)
  ↓ [PROV:wasGeneratedBy] AUDITLOG
✅ Lineage Complete: Transaction → Position → Portfolio → Audit
```

### Path 3: Error Flow
```
Invalid Transaction (BR-005 failure: deviation > 0.01)
  ↓ [PROV:used] Validation activity (returns FAIL, RC=12)
  ↓ [PROV:wasGeneratedBy] Error entity (categorized)
  ↓ [PROV:informedBy] ERRPROC classification
  ↓ [PROV:wasGeneratedBy] ERROR_LOG insert
  ↓ [PROV:enqueuedTo] Retry queue (manual review)
✅ Lineage Complete: Error → Log → Queue → Remediation Path
```

---

## 🔗 BUSINESS RULE INTEGRATION

### Flow 1: Portfolio CRUD (BR-001, BR-002, BR-004, BR-005, BR-012)

**BR-001 (State Machine):** Activity validates status transition (P→A→C|S)  
**BR-002 (ID Format):** Activity validates PORT-ID format (^PORT[0-9]{4}$)  
**BR-004 (Range):** Activity validates [-9.999T, +9.999T]  
**BR-005 (Formula):** Activity validates qty × price ≈ amount ±0.01  
**BR-012 (Audit):** Activity generates BEFORE/AFTER images in AUDITLOG

### Flow 3: Transactions (BR-005 CRITICAL, BR-006, BR-008, BR-011, BR-012)

**BR-005 (BLOCKING):** ⚠️ Amount formula validation — **MUST DEPLOY 15 APRIL**  
**BR-006:** Transaction type enum (BU/SL/TR/FE)  
**BR-008:** Currency enum (USD/EUR/GBP/JPY/CAD)  
**BR-011:** Return code hierarchy (0 < 4 < 8 < 12 < 16)  
**BR-012:** Audit logging with mutation tracking

---

## ⚠️ CRITICAL ISSUES & DEPENDENCIES

### 🔴 BLOCKING: BR-005 (Amount Formula)
- **Status:** No DB2 enforcement currently
- **Risk:** Invalid qty×price combinations allowed
- **Remediation:** Deploy trigger TR_BR_005 **15 APRIL 2026**
- **Impact:** Financial accuracy, fraud prevention
- **Lineage Impact:** Query 2 (Transaction Impact Trace) currently bypasses validation

### 🔴 BLOCKING: BR-007 (Quantity Precision)
- **Status:** DB2 DECIMAL(18,3) truncates COBOL 4-decimal requirement
- **Risk:** Cumulative rounding errors in position calculations
- **Remediation:** Plan DB2 migration (DECIMAL(18,3)→DECIMAL(18,4)) by **30 APRIL**
- **Lineage Impact:** Query 4 (Reconciliation) tolerance ±0.02 accounts for this

### 🟡 MEDIUM: Cost Basis Averaging
- **Status:** Not implemented; accumulates qty+cost but doesn't calculate weighted average
- **Lineage Impact:** Field 5 (Position Cost Basis) shows derivative status

---

## 📈 CONFIDENCE SCORES

| Component | Confidence | Rationale |
|-----------|-----------|-----------|
| Flow 1 (Portfolio CRUD) | 95% | BR-001, BR-002, BR-012 strongly enforced |
| Flow 2 (Online Inquiry) | 90% | VSAM read is atomic; DB2 cursors may have isolation issues |
| Flow 3 (Transactions) | 85% | BR-005 critical; BR-007 blocking; precision issues documented |
| Flow 4 (Error Capture) | 98% | Error flow well-formalized; BR-012/BR-013 embedded |
| Flow 5 (Batch Orchestration) | 92% | Well-documented; some implicit dependencies |
| **OVERALL** | **92%** | Strong foundation; blockers identified with roadmap |

---

## 📊 LINEAGE STATISTICS

- **Total Entities Tracked:** 14 (PORTFOLIO_MASTER, TRANSACTION_HISTORY, ERROR_LOG, etc.)
- **Total Activities (Programs):** 20 (PORTADD, PORTTRAN, POSUPDT, INQPORT, etc.)
- **Total Relationships:** 30 (used, wasGeneratedBy, wasDerivedFrom, wasInformedBy, etc.)
- **Business Rules Embedded:** 17/25 (68%)
- **Fields Traced:** 50+ sample (267 total in system)
- **PROV-O RDF Triple Count:** 150+ triples across 3 graphs

---

## 🔍 QUERY EXECUTION EXAMPLES

### Query 1: Portfolio Lineage (Sample Output)
```
event_type      event_date  user_id  event_description              total_value  gain_loss
INITIAL_CREATE  2026-04-10  USER001  Smith Investment (A)           1,250,000    —
TRANSACTION     2026-04-10  USER002  BUY 100 shares @ 50 = 5,000    1,255,000    5,000
MUTATION        2026-04-11  USER001  Status: A → A (no change)      1,255,000    5,000
TRANSACTION     2026-04-12  USER002  DIVIDEND 1,000                 1,256,000    6,000
```

### Query 4: Reconciliation Check (BR-015)
```
portfolio_id  portfolio_stated_total  positions_sum_market  variance  status
PORT0247      1,256,000.00            1,256,000.02          -0.02     PASS ✓
PORT0248      1,500,000.00            1,499,999.75          0.25      FAIL ⚠️
```

### Query 5: Error Analysis (Sample)
```
error_classification    count  pending  resolved  pending_pct  remediation
BR-005-Amount-Formu

## Sources
- [`/raw/PHASE_1_4_QUICK_REFERENCE.md`](/raw/PHASE_1_4_QUICK_REFERENCE.md)