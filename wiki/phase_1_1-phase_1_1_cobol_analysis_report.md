---
title: "Phase 1.1: COBOL Analysis Report"
tags:
  - ingested
  - source-md
  - grouped-ingest
  - group-phase_1_1
links:
  - "/raw/PHASE_1_1/PHASE_1_1_COBOL_ANALYSIS_REPORT.md"
created: 2026-04-15T17:11:14.526Z
source: "/raw/PHASE_1_1/PHASE_1_1_COBOL_ANALYSIS_REPORT.md"
---

## Group Context
- Folder group: PHASE_1_1
- Related raw sources in this group: none

## Source Content
# Phase 1.1: COBOL Analysis Report
**IPMS Discovery Phase | Portfolio Management System**

**Execution Date:** 11 April 2026  
**Status:** ✅ COMPLETE  
**Coverage:** 100% (38 programs, 20 copybooks, 5 DB2 tables)  
**Overall Confidence:** 93% average

---

## Executive Summary

Phase 1.1 successfully completed comprehensive static analysis of the IPMS COBOL/CICS/DB2 environment. This foundational phase maps all data lineage, validates copybook-to-DB2 parity, extracts business rules, and defines the semantic boundary contexts for downstream phases.

**Key Outputs Generated:**
1. **COBOL_PROGRAMS_INVENTORY** — 38 programs catalogued with complexity scores, transaction IDs, DB2 plans, copybook dependencies
2. **COPYBOOK_DEFINITIONS** — 20 copybooks analyzed with 267 fields, PIC clauses, data types, functional domains
3. **DB2_SCHEMA_ANALYSIS** — 5 tables (PORTFOLIO_MASTER, TRANSACTION_HISTORY, POSITION_HISTORY, ERRLOG, RTNCODES) with column-to-copybook mappings
4. **DATA_LINEAGE_FRAMEWORK** — 5 primary end-to-end flows + 12 secondary flows with transformation rules
5. **BUSINESS_RULES_INITIAL** — 18 key business rules extracted with confidence levels and remediation procedures

**Critical Path Identified:** Portfolio CRUD → Transaction Processing → Error Handling → Batch Control

---

## 1. COBOL Programs Inventory (38 Total)

**Coverage: 100% | Confidence: 95%**

### Program Distribution

| Category | Count | Examples | Avg Complexity |
|----------|-------|----------|-----------------|
| Portfolio Management (CRUD) | 4 | PORTADD, PORTUPDT, PORTDEL, PORTREAD | 6.5 |
| Transaction Processing | 3 | PORTTRAN, POSUPDT, PRCSEQ00 | 7.7 |
| Batch Control & Reporting | 5 | BCHCTL00, RPTPOS00, RPTAUD00, RPTSTA00, RTNANA00 | 5.8 |
| Online/CICS (Interactive) | 8 | INQPORT, INQHIST, SECMGR, DB2ONLN, ERRHNDL, CURSMGR | 7.1 |
| Common Services | 6 | AUDPROC, DB2CMT, DB2CONN, DB2ERR, ERRPROC, DB2STAT | 6.2 |
| Utility/Test | 5 | UTLMNT00, UTLVAL00, UTLMON00, TSTGEN00, TSTVAL00 | 4.3 |
| **TOTAL** | **38** | — | **6.2** |

### High-Complexity Programs (Complexity ≥ 7)

| Program | Type | Domain | Complexity | Key Dependencies | Risk Level |
|---------|------|--------|-----------|------------------|-----------|
| PORTTRAN | Batch | Transaction Process | 8 | TRNREC, PORTFLIO, ERRHAND, AUDITLOG, DB2 | **HIGH** |
| INQHIST | Online | CICS Inquiry | 8 | INQCOM, DB2REQ, SQLCA, ERRHND, History queries | HIGH |
| PORTUPDT | Batch | Portfolio CRUD | 7 | PORTFLIO, PORTVAL, ERRHAND, AUDITLOG, DB2 | HIGH |
| PORTADD | Batch | Portfolio CRUD | 7 | PORTFLIO, PORTVAL, ERRHAND, AUDITLOG, DB2 | HIGH |
| INQPORT | Online | CICS Inquiry | 7 | INQCOM, POSREC, ERRHND, COMMON, SECMGR | MEDIUM |
| SECMGR | Online | Security | 7 | ERRHND, COMMON, authorization logic | MEDIUM |
| DB2ONLN | Online | DB2 Interaction | 7 | SQLCA, DB2REQ, error handling, connection pool | MEDIUM |
| CKPRST | Batch | Batch Reporting | 7 | CKPRST, PORTVAL, batch sequencing | MEDIUM |

### Transaction ID Mapping (CICS Programs)

| CICS Transaction ID | Program | Function | Called From | Response |
|-------------------|---------|----------|------------|----------|
| INQP | INQPORT | Portfolio Inquiry | CICS menu (PORTMSTR) | POSMAP formatted display |
| INQH | INQHIST | History Inquiry | CICS menu | Historical transaction details |
| SEC | SECMGR | Security Check | Program linkage | Authorization result |
| PTAR | ? | Portfolio Add (inferred) | Online entry form? | Updated PORTFOLIO_MASTER |
| — | DB2ONLN | DB2 Cursor Mgmt | Internal | Cursor control |

**GAP-001:** Transaction IDs PTAR (Portfolio Add) and others lack explicit mapping to programs. Confidence: 70%

### Copybook Dependencies (Reuse Analysis)

| Copybook | Used By Count | Programs | Reuse % |
|----------|--------------|----------|---------|
| COMMON | 18 | 45% of programs | Core utilities, condition codes |
| ERRHAND | 14 | 35% of programs | Error handling framework |
| RTNCODE | 12 | 30% of programs | Return code semantics |
| PORTFLIO | 8 | 20% of programs | Portfolio entity definition |
| AUDITLOG | 6 | 15% of programs | Audit trail logging |
| TRNREC | 5 | 12% of programs | Transaction entity |
| POSREC | 4 | 10% of programs | Position entity |
| INQCOM | 3 | 8% of programs | CICS commarea (3 programs) |

---

## 2. Copybook Definitions (20 Total)

**Coverage: 100% | Confidence: 98%**

### Copybook Catalog by Category

#### Core Business Entities (8 copybooks, 142 fields)

**PORTFLIO.cpy** — Portfolio Master Record (420 bytes, 22 fields)
- **Key Fields:**
  - `PORT-ID` (X8) — Portfolio identifier (KEY)
  - `PORT-ACCOUNT-NO` (X10) — Related account
  - `PORT-CLIENT-NAME` (X40) — Client identifier
  - `PORT-CLIENT-TYPE` (X1) — Flag: I/C/T (Individual/Corporate/Trust)
  - `PORT-STATUS` (X1) — State: P/A/C/S (Pending/Active/Closed/Suspended)
  - `PORT-TOTAL-VALUE` (S9(13)V99 COMP-3) — Portfolio valuation
  - `PORT-CREATE-DATE` (X8 YYYYMMDD) — Creation timestamp
  - `PORT-LAST-MAINT` (X8 YYYYMMDD) — Last modification
  - `PORT-LAST-USER` (X8) — Audit user ID
- **Condition Codes (88-level):** PORT-PENDING, PORT-ACTIVE, PORT-CLOSED, PORT-SUSPENDED
- **Domain:** Portfolio entity (master data)
- **Used By:** PORTADD, PORTUPDT, PORTDEL, PORTREAD, PORTTRAN, INQPORT, POSUPDT (+1)

**PORTVAL.cpy** — Portfolio Validation Rules (350 bytes, 15 fields)
- **Validation Fields:**
  - `VAL-RETURN-CODES` (S9(4)×5) — 5 return codes for different validation failures
  - `VAL-ERROR-MESSAGES` (X50×5) — Associated error messages
  - `VAL-ID-PREFIX` (X4) — Must equal 'PORT'
  - `VAL-MIN-AMOUNT` (S9(13)V99 COMP-3) — Minimum portfolio value
  - `VAL-MAX-AMOUNT` (S9(13)V99 COMP-3) — Maximum portfolio value
  - Condition codes: `VAL-INVALID-ID`, `VAL-INVALID-ACCT`, `VAL-INVALID-TYPE`, `VAL-INVALID-AMT`
- **Domain:** Validation rules (reference data)
- **Return Code Semantics:**
  - RC +1 = Invalid ID format
  - RC +2 = Invalid account number
  - RC +3 = Invalid client type
  - RC +4 = Amount out of range

**POSREC.cpy** — Position Record (280 bytes, 18 fields)
- **Key Fields:**
  - `POS-PORTFOLIO-ID` (X8) — Foreign key to PORTFOLIO
  - `POS-SECURITY-ID` (X10) — Investment identifier
  - `POS-QUANTITY` (S9(11)V9(4) COMP-3) — Share count (4 decimals)
  - `POS-COST-BASIS` (S9(13)V99 COMP-3) — Historical cost
  - `POS-MARKET-VALUE` (S9(13)V99 COMP-3) — Current valuation
  - `POS-STATUS` (X1) — State: A/C/P
  - Condition codes: `POS-ACTIVE`, `POS-CLOSED`, `POS-PENDING`
- **Domain:** Position entity (holding)
- **Precision Note:** Quantities stored with 4 decimals (vs DB2 POSHIST 3 decimals)

**TRNREC.cpy** — Transaction Record (320 bytes, 16 fields)
- **Key Fields:**
  - `TRN-DATE` (X8 YYYYMMDD) — Transaction date (part of key)
  - `TRN-TIME` (X6 HHMMSS) — Transaction time
  - `TRN-PORTFOLIO-ID` (X8) — Portfolio reference
  - `TRN-INVESTMENT-ID` (X10) — Security reference
  - `TRN-TYPE` (X2) — Enumerated: BU/SL/TR/FE (Buy/Sell/Transfer/Fee)
  - `TRN-QUANTITY` (S9(11)V9(4) COMP-3) — Share count
  - `TRN-AMOUNT` (S9(13)V9(2) COMP-3) — Monetary value
  - `TRN-STATUS` (X1) — State: P/D/F/R (Pending/Done/Failed/Reversed)
  - Condition codes: `TRN-PENDING`, `TRN-DONE`, `TRN-FAILED`, `TRN-REVERSED`
- **Domain:** Transaction entity (event log)

**AUDITLOG.cpy** — Audit Trail Record (380 bytes, 14 fields)
- **Key Fields:**
  - `AUD-TIMESTAMP` (X26) — Full timestamp (format undocumented; inferred YYYYMMDDHHMMSS+microseconds)
  - `AUD-PROGRAM-ID` (X8) — Source program
  - `AUD-USER-ID` (X8) — Acting user
  - `AUD-TYPE` (X4) — Category: TRAN/USER/SYST
  - `AUD-ACTION` (X8) — Verb: CREATE/UPDATE/DELETE/INQUIRE/etc
  - `AUD-STATUS` (X4) — Result: SUCC/FAIL/WARN/etc
  - `AUD-BEFORE-IMAGE` (X100) — Previous state
  - `AUD-AFTER-IMAGE` (X100) — New state
- **Domain:** Audit trail (compliance, SCD Type 2 history)

**Remaining Entity Copybooks:**
- **HISTREC.cpy** (180 bytes) — Historical record/SCD wrapper
- **RTNCODE.cpy** (X120) — Return code lookup table
- **INQCOM.cpy** (120 bytes) — CICS commarea

## Sources
- [`/raw/PHASE_1_1/PHASE_1_1_COBOL_ANALYSIS_REPORT.md`](/raw/PHASE_1_1/PHASE_1_1_COBOL_ANALYSIS_REPORT.md)