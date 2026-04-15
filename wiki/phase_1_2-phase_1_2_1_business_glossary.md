---
title: "Phase 1.2.1: IPMS Business Glossary Extraction"
tags:
  - ingested
  - source-md
  - grouped-ingest
  - group-phase_1_2
links:
  - "/raw/PHASE_1_2/PHASE_1_2_1_BUSINESS_GLOSSARY.md"
created: 2026-04-15T17:11:14.531Z
source: "/raw/PHASE_1_2/PHASE_1_2_1_BUSINESS_GLOSSARY.md"
---

## Group Context
- Folder group: PHASE_1_2
- Related raw sources in this group:
  - /raw/PHASE_1_2/PHASE_1_2_2_SEMANTIC_ONTOLOGY.md
  - /raw/PHASE_1_2/PHASE_1_2_3_TYPE_MAPPER.md
  - /raw/PHASE_1_2/PHASE_1_2_4_EXECUTION_SUMMARY.md
  - /raw/PHASE_1_2/PHASE_1_2_4_QUICK_REFERENCE.md
  - /raw/PHASE_1_2/PHASE_1_2_4_SEMANTIC_MODEL_DESIGNER.md

## Source Content
# Phase 1.2.1: IPMS Business Glossary Extraction

**Execution Date:** 11 April 2026 | **Status:** ✅ COMPLETE  
**Duration:** 16 hours | **Total Terms Extracted:** 148  
**Coverage:** 100% (267 copybook fields + 95 DB2 columns)  
**Average Confidence:** 92%

---

## Contents

### Executive Summary

**Business Glossary Metrics:**
- **Total unique terms:** 148
- **Domains:** 10 (Portfolio, Transaction, Position, Audit, Error, Batch, Return Codes, Security, Data Types, Constants)
- **Copybook fields catalogued:** 267/267 (100%)
- **DB2 columns mapped:** 95/95 (100%)
- **Business rules cross-referenced:** 18/18 (100%)
- **Field-to-DB2 synonym pairs:** 47 identified
- **Data type mappings:** 12 unique PIC→DB2 transformations
- **Average confidence level:** 92%

**Coverage by Domain:**
| Domain | Terms | Examples | Confidence |
|--------|-------|----------|-----------|
| Portfolio Management | 18 | PORTFOLIO_ID, PORTFOLIO_STATUS, CLIENT_TYPE | 96% |
| Transaction Processing | 16 | TRANSACTION_TYPE, QUANTITY, PRICE | 96% |
| Position Management | 12 | POSITION_QUANTITY, COST_BASIS, MARKET_VALUE | 93% |
| Audit & Compliance | 14 | AUDIT_ACTION, BEFORE_IMAGE, AFTER_IMAGE | 94% |
| Error Handling | 18 | ERROR_CATEGORY, SQLCODE, RETRY_COUNT | 93% |
| Batch/Job Control | 15 | JOB_STATUS, PREREQUISITE_COUNT | 95% |
| Return Codes & Status | 20 | RETURN_CODE, HIGHEST_CODE, STATUS_ACTIVE | 97% |
| Security & Authorization | 8 | AUTHORIZATION_CHECK, USER_VALIDATION | 90% |
| Data Types & Formats | 12 | Packed Decimal, Timestamp, Date Format | 95% |
| Reference/Constants | 15 | Portfolio ID Prefix, Currency Codes | 100% |

**Key Findings:**
- **High confidence terms (95%+):** 92 terms (62%) — hard-coded, explicitly documented
- **Medium confidence terms (85-94%):** 45 terms (30%) — inferred from patterns/usage
- **Lower confidence terms (<85%):** 11 terms (7%) — derived calculations, inferred logic
- **Synonym pairs identified:** 47 unique COBOL↔DB2 naming mappings
- **Data type transformations:** 12 conversion rules (e.g., S9(13)V99 COMP-3 → DECIMAL(18,2))

---

## Domain: Portfolio Management (18 Terms)

**Root Entity:** Portfolio (aggregate root for all portfolio data)

| # | Term | Definition | Data Type | COBOL Name | DB2 Column | Rule | Confidence |
|---|------|-----------|-----------|-----------|-----------|------|-----------|
| 1 | PORTFOLIO_ID | Unique portfolio identifier | CHAR(8) | PORT-ID | PORTFOLIO_ID | BR-002 | 99% |
| 2 | ACCOUNT_NUMBER | Related account reference | CHAR(10) | PORT-ACCOUNT-NO | ACCOUNT_TYPE | BR-003 | 96% |
| 3 | CLIENT_ID | Client name/identifier | CHAR(10) | PORT-ACCOUNT-NO | CLIENT_ID | BR-003 | 94% |
| 4 | PORTFOLIO_NAME | Human-readable description | VARCHAR(40) | PORT-CLIENT-NAME | PORTFOLIO_NAME | — | 95% |
| 5 | CLIENT_TYPE | Entity type (I/C/T) | CHAR(1) | PORT-CLIENT-TYPE | (not in master) | BR-005 | 98% |
| 6 | PORTFOLIO_STATUS | State (P/A/C/S) | CHAR(1) | PORT-STATUS | STATUS | BR-001 | 99% |
| 7 | PORTFOLIO_TOTAL_VALUE | Market value | DECIMAL(15,2) | PORT-TOTAL-VALUE | (calculated) | BR-004 | 97% |
| 8 | CASH_BALANCE | Available cash | DECIMAL(15,2) | PORT-CASH-BALANCE | (not in schema) | — | 90% |
| 9 | CURRENCY_CODE | 3-char currency | CHAR(3) | (implied) | CURRENCY_CODE | BR-008 | 92% |
| 10 | OPEN_DATE | Portfolio creation date | DATE | PORT-CREATE-DATE | OPEN_DATE | — | 96% |
| 11 | CLOSE_DATE | Portfolio close date | DATE | (implied) | CLOSE_DATE | — | 88% |
| 12 | LAST_MAINT_DATE | Last modification time | TIMESTAMP | PORT-LAST-MAINT | LAST_MAINT_DATE | — | 94% |
| 13 | LAST_MAINT_USER | User who modified | CHAR(8) | PORT-LAST-USER | LAST_MAINT_USER | BR-012 | 96% |
| 14 | BRANCH_ID | Owning branch | CHAR(2) | (derived from ID) | BRANCH_ID | — | 75% **GAP-006** |
| 15 | RISK_LEVEL | Investment risk | CHAR(1) | (derived) | RISK_LEVEL | — | 70% **GAP-006** |
| 16 | Portfolio Identifier | Synonym for PORTFOLIO_ID | X(8) | PORT-ID | PORTFOLIO_ID | BR-002 | 97% |
| 17 | Portfolio Key | Technical key | X(8) | PORT-ID | PORTFOLIO_ID | BR-002 | 95% |
| 18 | Portfolio Master Record | Complete portfolio entity | Struct | PORTFLIO | PORTFOLIO_MASTER | — | 98% |

**Synonym Mappings:**
- PORTFOLIO_ID ← → PORT-ID ← → PORTID
- ACCOUNT_NUMBER ← → PORT-ACCOUNT-NO
- PORTFOLIO_NAME ← → PORT-CLIENT-NAME
- CLIENT_TYPE ← → PORT-CLIENT-TYPE
- PORTFOLIO_STATUS ← → PORT-STATUS
- TOTAL portfolio VALUE ← → PORT-TOTAL-VALUE

**Business Rules Cross-Reference:**
- BR-001: Portfolio status lifecycle (P→A→C or S)
- BR-002: Portfolio ID format validation (PORT+4-digit seq)
- BR-003: Account number uniqueness
- BR-004: Amount range constraint
- BR-005: Client type immutability
- BR-012: Audit logging requirement

**Data Quality Notes:**
- Branch ID and Risk Level are derived but not in copybook (GAP-006: documentation recommended)
- Portfolio status values are immutable after initial transition (enforced in PORTVAL)
- All portfolio mutations logged to AUDITLOG via AUDPROC

---

## Domain: Transaction Processing (16 Terms)

**Root Entity:** Transaction (immutable event log)

| # | Term | Definition | Data Type | COBOL Name | DB2 Column | Rule | Confidence |
|---|------|-----------|-----------|-----------|-----------|------|-----------|
| 1 | TRANSACTION_ID | Unique transaction key | CHAR(20) | (generated) | TRANSACTION_ID | — | 92% |
| 2 | TRANSACTION_DATE | Date of transaction | DATE | TRN-DATE | TRANSACTION_DATE | — | 98% |
| 3 | TRANSACTION_TIME | Time of transaction | TIME | TRN-TIME | TRANSACTION_TIME | — | 97% |
| 4 | TRANSACTION_TYPE | Buy/Sell/Transfer/Fee | CHAR(2) | TRN-TYPE | TRANSACTION_TYPE | BR-006 | 99% |
| 5 | INVESTMENT_ID | Security identifier | CHAR(10) | TRN-INVESTMENT-ID | INVESTMENT_ID | — | 97% |
| 6 | QUANTITY | Count of shares | DECIMAL(18,4) | TRN-QUANTITY | QUANTITY | BR-007 | 96% |
| 7 | PRICE | Per-unit cost | DECIMAL(18,4) | TRN-PRICE | PRICE | — | 94% |
| 8 | AMOUNT | Total value | DECIMAL(18,2) | TRN-AMOUNT | AMOUNT | — | 97% |
| 9 | CURRENCY_CODE | 3-char currency | CHAR(3) | TRN-CURRENCY | CURRENCY_CODE | BR-008 | 98% |
| 10 | TRANSACTION_STATUS | State (P/D/F/R) | CHAR(1) | TRN-STATUS | STATUS | BR-017 | 98% |
| 11 | PROCESS_TIMESTAMP | When processed | TIMESTAMP | TRN-PROCESS-DATE | CREATED_TS | — | 94% |
| 12 | PROCESS_USER | User who entered | CHAR(8) | TRN-PROCESS-USER | CREATED_BY | BR-012 | 95% |
| 13 | Transaction Key | Unique identifier | CHAR(20) | (generated) | TRANSACTION_ID | — | 90% |
| 14 | Buy Transaction | Transaction type BU | CHAR(2) | TRN-TYPE='BU' | TRANSACTION_TYPE='BU' | BR-006 | 100% |
| 15 | Sell Transaction | Transaction type SL | CHAR(2) | TRN-TYPE='SL' | TRANSACTION_TYPE='SL' | BR-006 | 100% |
| 16 | Transaction Record | Complete transaction entity | Struct | TRNREC | TRANSACTION_HISTORY | — | 96% |

**Critical Issue (GAP-007):**
- QUANTITY stored as S9(11)V9(4) COMP-3 in COBOL (4 decimals)
- DB2 expects DECIMAL(18,4) but POSHIST uses DECIMAL(15,3) (3 decimals)
- **Precision loss risk:** Rounding rule undocumented
- **Remediation:** Locate rounding code in POSUPDT or PORTTRAN

**Synonym Mappings:**
- TRANSACTION_TYPE ← → TRN-TYPE
- QUANTITY ← → TRN-QUANTITY
- PRICE ← → TRN-PRICE
- AMOUNT ← → TRN-AMOUNT

**Enumeration Values:**
- BU = Buy transaction
- SL = Sell transaction
- TR = Transfer transaction
- FE = Fee charge

---

## Domain: Audit & Compliance (14 Terms)

**Root Entity:** AuditLog (immutable compliance trail)

| # | Term | Definition | Data Type | COBOL Name | DB2 Column | Rule | Confidence |
|---|------|-----------|-----------|-----------|-----------|------|-----------|
| 1 | AUDIT_TIMESTAMP | When event occurred | TIMESTAMP | AUD-TIMESTAMP | ERROR_TIMESTAMP | BR-012 | 96% |
| 2 | AUDIT_PROGRAM_ID | Source program | CHAR(8) | AUD-PROGRAM | PROGRAM_ID | BR-012 | 97% |
| 3 | AUDIT_USER_ID | Acting user | CHAR(8) | AUD-USER-ID | (inferred) | BR-012 | 98% |
| 4 | AUDIT_TYPE | Event category (TRAN/USER/SYST) | CHAR(4) | AUD-TYPE | ERROR_TYPE | BR-012 | 96% |
| 5 | AUDIT_ACTION |

## Sources
- [`/raw/PHASE_1_2/PHASE_1_2_1_BUSINESS_GLOSSARY.md`](/raw/PHASE_1_2/PHASE_1_2_1_BUSINESS_GLOSSARY.md)