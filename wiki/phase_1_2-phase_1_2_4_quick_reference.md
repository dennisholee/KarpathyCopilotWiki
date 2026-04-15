---
title: "Phase 1.2.4 Quick Reference Guide"
tags:
  - ingested
  - source-md
  - grouped-ingest
  - group-phase_1_2
links:
  - "/raw/PHASE_1_2/PHASE_1_2_4_QUICK_REFERENCE.md"
created: 2026-04-15T17:11:14.547Z
source: "/raw/PHASE_1_2/PHASE_1_2_4_QUICK_REFERENCE.md"
---

## Group Context
- Folder group: PHASE_1_2
- Related raw sources in this group:
  - /raw/PHASE_1_2/PHASE_1_2_1_BUSINESS_GLOSSARY.md
  - /raw/PHASE_1_2/PHASE_1_2_2_SEMANTIC_ONTOLOGY.md
  - /raw/PHASE_1_2/PHASE_1_2_3_TYPE_MAPPER.md
  - /raw/PHASE_1_2/PHASE_1_2_4_EXECUTION_SUMMARY.md
  - /raw/PHASE_1_2/PHASE_1_2_4_SEMANTIC_MODEL_DESIGNER.md

## Source Content
# Phase 1.2.4 Quick Reference Guide

**Project:** Investment Portfolio Management System (IPMS)  
**Phase:** 1.2.4 Semantic Model Designer  
**Date:** 11 April 2026  
**Status:** ✅ COMPLETE  

---

## Executive Summary (1 Page)

Phase 1.2.4 successfully synthesized all prior analysis phases (1.1-1.2.3) into a unified **3-layer semantic data model** spanning Conceptual, Logical (OWL-DL), and Physical (DB2) representations.

### Key Achievements

| Metric | Result |
|--------|--------|
| **Field Coverage** | 267/267 COBOL fields (100%) |
| **Type Precision** | 265/267 exact/superset match (99%) |
| **Business Rules** | 18/18 formalized as OWL axioms (100%) |
| **Glossary Integration** | 148/148 business terms linked (100%) |
| **OWL Completeness** | 42 formal axioms + 12 derived constraints |
| **Cross-Layer Traceability** | Every field traced COBOL↔OWL↔DB2 (100%) |
| **Architecture Score** | **95% (Excellent)** |

### Critical Findings

🚨 **BLOCKING Issues (Must Fix Before Phase 1.3):**
1. **GAP-007 (Quantity Precision)** — 4-decimal truncation in DB2 DECIMAL(18,3)
2. **BR-005 (Amount Formula)** — Not validated; system accepts impossible transactions

⚠️ **Important Issues (Q2 2026 Remediation):**
3. GAP-004 (Portfolio creation date immutability)
4. GAP-006 (Derived fields undocumented)
5. 14 missing CHECK constraints for enums

✅ **GREEN Items (Ready for Production):**
- All 6 core entities well-defined
- All relationships formalized with cardinality
- Portfolio state machine axiomatized
- Transaction immutability enforced
- Audit trail architecture complete
- Error categorization exhaustive

---

## 3-Layer Model Overview

### LAYER 1: CONCEPTUAL MODEL (Business Entities)

```
6 Core Entities:

PORTFOLIO (Aggregate Root)
├─ portfolioId (PK), status (P/A/C/S), totalValue
├─ clientType (I/C/T), riskLevel (L/M/H)
└─ State machine: P→A→(S↔A)→C

TRANSACTION (Domain Event - Immutable)
├─ transactionId (PK), type (BU/SL/TR/FE)
├─ quantity ⚠️, price, amount, status (P/D/F/R)
└─ Immutable post-commit; only status may change via reversal

POSITION (Value Object - Derived)
├─ investmentId (PK), quantity ⚠️
├─ costBasis, marketValue (daily refresh)
└─ Derived from transactions BUT schema allows direct updates (risk!)

USER (Identity)
├─ userId (PK), userName, email, department
└─ Every operation attributed to USER

ERRORLOG (System Record)
├─ errorId (PK), errorCode, category (VL/PR/SY/VS)
├─ severity (L/M/H), relatedEntity (portfolio/transaction/position)
└─ Every error categorized; must not be null

BATCHJOB (Execution Context)
├─ jobId (PK), jobDate, status (R/C/E)
├─ stepSequence, recordCount, errorCount
└─ Tracks batch execution history & prerequisites

Relationships (8 total):
├─ Portfolio 1:N Transaction (portfolio has many transactions)
├─ Portfolio 1:N Position (portfolio has many positions)
├─ Portfolio 1:N ErrorLog (audit trail per portfolio)
├─ Transaction N:M Position (transaction affects multiple positions)
├─ User 1:N Portfolio (user owns portfolios)
├─ User 1:N ErrorLog (user creates errors via program)
├─ BatchJob 1:N ErrorLog (batch produces error records)
└─ ErrorLog N:1 User (error caused by user/program context)

5 Key Constraints:
1. Portfolio State Machine (P→A→C|S only; C is terminal)
2. Transaction Immutability (post-commit; only status changes for reversal)
3. Position Derived (from SUM of transactions; direct updates risky)
4. Audit Trail Completeness (every mutation logged with before/after image)
5. Error Exhaustiveness (4 disjoint categories: VL/PR/SY/VS)
```

### LAYER 2: LOGICAL MODEL (OWL-DL Ontology)

```
7 Root Classes:
├─ :Portfolio (4 specializations: Active/Closed/Suspended/Pending)
├─ :Transaction (4 specializations: Buy/Sell/Transfer/Fee)
├─ :Position (2 specializations: Active/Closed)
├─ :ErrorLog (4 specializations: Validation/Process/System/VSAM)
├─ :User
├─ :BatchJob
└─ :SecurityAuthorization

26 Object Properties (Relationships):
├─ hasTransaction, hasPosition, hasAuditTrail (Portfolio)
├─ occursInPortfolio, affectsPosition (Transaction)
├─ derivedFromTransaction (Position)
├─ createdBy, modifiedBy (audit trail)
└─ + 18 more (see full report)

38 Data Properties (Attributes):
├─ portfolioId: xsd:string pattern ^PORT[0-9]{4}$
├─ quantity: xsd:decimal(15,4) ⚠️ TRUNCATED TO (18,3) IN DB2
├─ amount: xsd:decimal(15,2)
├─ status: xsd:string enum {P,A,C,S}
└─ + 34 more with XSD constraints

42 Formal Axioms (Business Rules):
├─ AX-01: Portfolio.totalValue derivation formula
├─ AX-04: Portfolio state machine transitions
├─ AX-08: Transaction immutability post-commit
├─ AX-17: Error category exhaustiveness (4 types)
├─ AX-21-23: Audit trail completeness
└─ + 37 more axioms encoding business logic

SKOS Glossary Integration:
└─ 148 business terms → OWL classes/properties (100% coverage)
   Example: PORTFOLIO_ID → skos:exactMatch → ipms:portfolioId
                        → COBOL: PORT-ID
                        → DB2: PORTFOLIO_ID
                        → Confidence: 99%
```

### LAYER 3: PHYSICAL MODEL (DB2 Schema)

```
5 DB2 Tables (95 columns total):

PORTFOLIO_MASTER (12 columns)
├─ PORTFOLIO_ID (CHAR 8, PK)
├─ ACCOUNT_NUMBER, CLIENT_NAME, CLIENT_TYPE
├─ STATUS (CHAR 1), TOTAL_VALUE (DECIMAL 18,2)
├─ OPEN_DATE (DATE), LAST_MAINT_DATE (TIMESTAMP)
└─ Notes: ✅ 100% mapped; TYPE constraints MISSING; FK to ACCOUNT missing

TRANSACTION_HISTORY (13 columns, quarterly partitioned)
├─ TRANSACTION_ID (CHAR 12, PK)
├─ PORTFOLIO_ID (CHAR 8, FK)
├─ TYPE (CHAR 2), QUANTITY (DECIMAL 18,3) ⚠️ LOSS!
├─ PRICE (DECIMAL 11,4), AMOUNT (DECIMAL 18,2)
├─ STATUS (CHAR 1), TRANSACTION_DATE (DATE), TRANSACTION_TIME (TIME)
└─ Notes: ⚠️ GAP-007 QUANTITY truncates 4th decimal; BR-005 amount formula NOT validated

POSITION_HISTORY (11 columns)
├─ INVESTMENT_ID (CHAR 12, PK), PORTFOLIO_ID (CHAR 8, FK)
├─ QUANTITY (DECIMAL 15,3) ⚠️ LOSS!
├─ COST_BASIS (DECIMAL 18,4), MARKET_VALUE (DECIMAL 18,2)
├─ POSITION_DATE (DATE), STATUS (CHAR 1)
└─ Notes: ⚠️ GAP-007 QUANTITY truncates 4th decimal; schema allows direct updates

ERROR_LOG (10 columns)
├─ ERROR_ID (INTEGER, PK), ERROR_CODE (SMALLINT)
├─ CATEGORY (CHAR 2), SEVERITY (CHAR 1)
├─ MESSAGE (VARCHAR 200), TIMESTAMP (TIMESTAMP)
├─ USER_ID (CHAR 8), PROGRAM_ID (CHAR 8)
├─ RETRY_COUNT (SMALLINT), RETRYABLE (CHAR 1 Y/N)
└─ Notes: ✅ 100% mapped; TYPE constraints MISSING; User/Program must be NOT NULL

RTNCODES (6 columns)
├─ RETURN_CODE (NUMERIC 2, PK)
└─ Description, Action, Category fields (reference data)

Schema Gaps:
├─ 14 missing CHECK constraints (enums: STATUS, TYPE, CATEGORY, etc.)
├─ 2 missing FK constraints (TRANSACTION→PORTFOLIO, POSITION→PORTFOLIO)
├─ Missing BATCH_JOB table (GAP-015)
├─ Missing AUDIT_LOG table (GAP-014)
├─ ⚠️ 2 CRITICAL: Quantity precision (GAP-007), Amount formula validation (BR-005)
```

---

## Gap Inventory & Remediation Plan

### CRITICAL GAPS (BLOCKING)

| Gap | Issue | Remediation | Timeline | Owner |
|-----|-------|-------------|----------|-------|
| **GAP-007** | DECIMAL(18,3) truncates COBOL 4-decimal quantity | ALTER TABLE TRANSACTION_HISTORY, POSITION_HISTORY MODIFY QUANTITY DECIMAL(18,4) | Q2 2026 | Data Arch |
| **BR-005** | Amount formula (qty × price ≈ amount) NOT validated | ADD CHECK constraint: ABS(AMOUNT - (QUANTITY × PRICE)) < 0.01; Add COBOL validation | Q1 2026 (URGENT!) | DB Admin |

### MEDIUM GAPS (Q2 2026 Priority)

| Gap | Issue | Remediation | Owner |
|-----|-------|-------------|-------|
| GAP-004 | Portfolio creation date overwritten by batch | Add NEW_PORTFOLIO_DATE immutable; prevent overwrite; backfill from AUDITLOG | Data Quality |
| GAP-006 | Derived fields (BRANCH_ID, RISK_LEVEL) undocumented | Document calculation formulas in code comments & data dictionary | Business Analysis |
| GAP-008 | Portfolio ID length inconsistency (X8 vs X10) | Verify max length; standardize copybook definitions | COBOL Governance |
| GAP-014 | AUDITLOG storage location unclear | Inventory all audit storage; consolidate to DB2 AUD_AUDIT_LOG table | Audit/Compliance

## Sources
- [`/raw/PHASE_1_2/PHASE_1_2_4_QUICK_REFERENCE.md`](/raw/PHASE_1_2/PHASE_1_2_4_QUICK_REFERENCE.md)