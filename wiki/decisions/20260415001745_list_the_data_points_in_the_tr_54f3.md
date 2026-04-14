---
title: "Decision - list the data points in the transaction entity"
summary: "Archived decision for query: list the data points in the transaction entity"
created: 2026-04-14T16:17:45.480Z
modified: 2026-04-14T16:17:45.480Z
tags: ["decision", "copilot-chat", "archived"]
links:
  - "[[Phase 1.1: COBOL Analysis Report]]"
  - "[[Phase 1.2.1: IPMS Business Glossary Extraction]]"
  - "[[PHASE 1.6 COMPLETE DELIVERABLES INDEX]]"
  - "[[Phase 1.3: Business Rules & Constraints Formalization]]"
  - "[[Phase 1.5: Data Quality Dimension Analysis for IPMS]]"
---

# Decision - list the data points in the transaction entity

## Summary
Archived decision for query: list the data points in the transaction entity

## Tags
- decision
- copilot-chat
- archived

## Links

- [[Phase 1.1: COBOL Analysis Report]]
- [[Phase 1.2.1: IPMS Business Glossary Extraction]]
- [[PHASE 1.6 COMPLETE DELIVERABLES INDEX]]
- [[Phase 1.3: Business Rules & Constraints Formalization]]
- [[Phase 1.5: Data Quality Dimension Analysis for IPMS]]

## Content

### Question
list the data points in the transaction entity

### Conversation

**User:** list the data points in the transaction entity

**Assistant:** **Direct Answer**

The grounded evidence identifies the **Transaction** entity as an immutable event log with these data points: **TRANSACTIONID, TRANSACTIONDATE, TRANSACTIONTIME, TRANSACTIONTYPE, INVESTMENTID, QUANTITY, PRICE, AMOUNT, CURRENCYCODE, TRANSACTIONSTATUS, PROCESSTIMESTAMP,** and **PROCESSUSER**. It also lists **Transaction Key** as a synonym for **TRANSACTIONID**, **Buy Transaction** and **Sell Transaction** as specific **TRANSACTIONTYPE** values, and **Transaction Record** as the complete entity structure. The documented transaction type values are **BU, SL, TR,** and **FE**.

**Key Details**

- COBOLPROGRAMSINVENTORY — 38 programs catalogued with complexity scores, transaction IDs, DB2 plans, copybook dependencies 2.
- Phase 1.2.1: IPMS Business Glossary Extraction Execution Date: 11 April 2026 | Status: ✅ COMPLETE Duration: 16 hours | Total Terms Extracted: 148 Coverage: 100% (267 copybook fields + 95 DB2 columns) Average Confidence: 92% --- Contents Executive Summary Business Glossary Metrics: - Total unique terms: 148 - Domains: 10 (Portfolio, Transaction, Position, Audit, Error, Batch, Return Codes, Security, Data Types, Constants) - Copybook fields catalogued: 267/267 (100%) - DB2 columns mapped: 95/95 (100%) - Business rules cross-referenced: 18/18 (100%) - Field-to-DB2 synonym pairs: 47 identified - Data type mappings: 12 unique PIC→DB2 transformations - Average confidence level: 92% Coverage by Domain: | Domain | Terms | Examples | Confidence | |--------|-------|----------|-----------| | Portfolio Management | 18 | PORTFOLIOID, PORTFOLIOSTATUS, CLIENTTYPE | 96% | | Transaction Processing | 16 | TRANSACTIONTYPE, QUANTITY, PRICE | 96% | | Position Management | 12 | POSITIONQUANTITY, COSTBASIS, MARKETVALUE | 93% | | Audit & Compliance | 14 | AUDITACTION, BEFOREIMAGE, AFTERIMAGE | 94% | | Error Handling | 18 | ERRORCATEGORY, SQLCODE, RETRYCOUNT | 93% | | Batch/Job Control | 15 | JOBSTATUS, PREREQUISITECOUNT | 95% | | Return Codes & Status | 20 | RETURNCODE, HIGHESTCODE, STATUSACTIVE | 97% | | Security & Authorization | 8 | AUTHORIZATIONCHECK, USERVALIDATION | 90% | | Data Types & Formats | 12 | Packed Decimal, Timestamp, Date Format | 95% | | Reference/Constants | 15 | Portfolio ID Prefix, Currency Codes | 100% | Key Findings: - High confidence terms (95%+): 92 terms (62%) — hard-coded, explicitly documented - Medium confidence terms (85-94%): 45 terms (30%) — inferred from patterns/usage - Lower confidence terms (<85%): 11 terms (7%) — derived calculations, inferred logic - Synonym pairs identified: 47 unique COBOL↔DB2 naming mappings - Data type transformations: 12 conversion rules (e.g., S9(13)V99 COMP-3 → DECIMAL(18,2)) --- Domain: Portfolio Management (18 Terms) Root Entity: Portfolio (aggregate root for all portfolio data) | # | Term | Definition | Data Type | COBOL Name | DB2 Column | Rule | Confidence | |---|------|-----------|-----------|-----------|-----------|------|-----------| | 1 | PORTFOLIOID | Unique portfolio identifier | CHAR(8) | PORT-ID | PORTFOLIOID | BR-002 | 99% | | 2 | ACCOUNTNUMBER | Related account reference | CHAR(10) | PORT-ACCOUNT-NO | ACCOUNTTYPE | BR-003 | 96% | | 3 | CLIENTID | Client name/identifier | CHAR(10) | PORT-ACCOUNT-NO | CLIENTID | BR-003 | 94% | | 4 | PORTFOLIONAME | Human-readable description | VARCHAR(40) | PORT-CLIENT-NAME | PORTFOLIONAME | — | 95% | | 5 | CLIENTTYPE | Entity type (I/C/T) | CHAR(1) | PORT-CLIENT-TYPE | (not in master) | BR-005 | 98% | | 6 | PORTFOLIOSTATUS | State (P/A/C/S) | CHAR(1) | PORT-STATUS | STATUS | BR-001 | 99% | | 7 | PORTFOLIOTOTALVALUE | Market value | DECIMAL(15,2) | PORT-TOTAL-VALUE | (calculated) | BR-004 | 97% | | 8 | CASHBALANCE | Available cash | DECIMAL(15,2) | PORT-CASH-BALANCE | (not in schema) | — | 90% | | 9 | CURRENCYCODE | 3-char currency | CHAR(3) | (implied) | CURRENCYCODE | BR-008 | 92% | | 10 | OPENDATE | Portfolio creation date | DATE | PORT-CREATE-DATE | OPENDATE | — | 96% | | 11 | CLOSEDATE | Portfolio close date | DATE | (implied) | CLOSEDATE | — | 88% | | 12 | LASTMAINTDATE | Last modification time | TIMESTAMP | PORT-LAST-MAINT | LASTMAINTDATE | — | 94% | | 13 | LASTMAINTUSER | User who modified | CHAR(8) | PORT-LAST-USER | LASTMAINTUSER | BR-012 | 96% | | 14 | BRANCHID | Owning branch | CHAR(2) | (derived from ID) | BRANCHID | — | 75% GAP-006 | | 15 | RISKLEVEL | Investment risk | CHAR(1) | (derived) | RISKLEVEL | — | 70% GAP-006 | | 16 | Portfolio Identifier | Synonym for PORTFOLIOID | X(8) | PORT-ID | PORTFOLIOID | BR-002 | 97% | | 17 | Portfolio Key | Technical key | X(8) | PORT-ID | PORTFOLIOID | BR-002 | 95% | | 18 | Portfolio Master Record | Complete portfolio entity | Struct | PORTFLIO | PORTFOLIOMASTER | — | 98% | Synonym Mappings: - PORTFOLIOID ← → PORT-ID ← → PORTID - ACCOUNTNUMBER ← → PORT-ACCOUNT-NO - PORTFOLIONAME ← → PORT-CLIENT-NAME - CLIENTTYPE ← → PORT-CLIENT-TYPE - PORTFOLIOSTATUS ← → PORT-STATUS - TOTAL portfolio VALUE ← → PORT-TOTAL-VALUE Business Rules Cross-Reference: - BR-001: Portfolio status lifecycle (P→A→C or S) - BR-002: Portfolio ID format validation (PORT+4-digit seq) - BR-003: Account number uniqueness - BR-004: Amount range constraint - BR-005: Client type immutability - BR-012: Audit logging requirement Data Quality Notes: - Branch ID and Risk Level are derived but not in copybook (GAP-006: documentation recommended) - Portfolio status values are immutable after initial transition (enforced in PORTVAL) - All portfolio mutations logged to AUDITLOG via AUDPROC --- Domain: Transaction Processing (16 Terms) Root Entity: Transaction (immutable event log) | # | Term | Definition | Data Type | COBOL Name | DB2 Column | Rule | Confidence | |---|------|-----------|-----------|-----------|-----------|------|-----------| | 1 | TRANSACTIONID | Unique transaction key | CHAR(20) | (generated) | TRANSACTIONID | — | 92% | | 2 | TRANSACTIONDATE | Date of transaction | DATE | TRN-DATE | TRANSACTIONDATE | — | 98% | | 3 | TRANSACTIONTIME | Time of transaction | TIME | TRN-TIME | TRANSACTIONTIME | — | 97% | | 4 | TRANSACTIONTYPE | Buy/Sell/Transfer/Fee | CHAR(2) | TRN-TYPE | TRANSACTIONTYPE | BR-006 | 99% | | 5 | INVESTMENTID | Security identifier | CHAR(10) | TRN-INVESTMENT-ID | INVESTMENTID | — | 97% | | 6 | QUANTITY | Count of shares | DECIMAL(18,4) | TRN-QUANTITY | QUANTITY | BR-007 | 96% | | 7 | PRICE | Per-unit cost | DECIMAL(18,4) | TRN-PRICE | PRICE | — | 94% | | 8 | AMOUNT | Total value | DECIMAL(18,2) | TRN-AMOUNT | AMOUNT | — | 97% | | 9 | CURRENCYCODE | 3-char currency | CHAR(3) | TRN-CURRENCY | CURRENCYCODE | BR-008 | 98% | | 10 | TRANSACTIONSTATUS | State (P/D/F/R) | CHAR(1) | TRN-STATUS | STATUS | BR-017 | 98% | | 11 | PROCESSTIMESTAMP | When processed | TIMESTAMP | TRN-PROCESS-DATE | CREATEDTS | — | 94% | | 12 | PROCESSUSER | User who entered | CHAR(8) | TRN-PROCESS-USER | CREATEDBY | BR-012 | 95% | | 13 | Transaction Key | Unique identifier | CHAR(20) | (generated) | TRANSACTIONID | — | 90% | | 14 | Buy Transaction | Transaction type BU | CHAR(2) | TRN-TYPE='BU' | TRANSACTIONTYPE='BU' | BR-006 | 100% | | 15 | Sell Transaction | Transaction type SL | CHAR(2) | TRN-TYPE='SL' | TRANSACTIONTYPE='SL' | BR-006 | 100% | | 16 | Transaction Record | Complete transaction entity | Struct | TRNREC | TRANSACTIONHISTORY | — | 96% | Critical Issue (GAP-007): - QUANTITY stored as S9(11)V9(4) COMP-3 in COBOL (4 decimals) - DB2 expects DECIMAL(18,4) but POSHIST uses DECIMAL(15,3) (3 decimals) - Precision loss risk: Rounding rule undocumented - Remediation: Locate rounding code in POSUPDT or PORTTRAN Synonym Mappings: - TRANSACTIONTYPE ← → TRN-TYPE - QUANTITY ← → TRN-QUANTITY - PRICE ← → TRN-PRICE - AMOUNT ← → TRN-AMOUNT Enumeration Values: - BU = Buy transaction - SL = Sell transaction - TR = Transfer transaction - FE = Fee charge --- Domain: Audit & Compliance (14 Terms) Root Entity: AuditLog (immutable compliance trail) | # | Term | Definition | Data Type | COBOL Name | DB2 Column | Rule | Confidence | |---|------|-----------|-----------|-----------|-----------|------|-----------| | 1 | AUDITTIMESTAMP | When event occurred | TIMESTAMP | AUD-TIMESTAMP | ERRORTIMESTAMP | BR-012 | 96% | | 2 | AUDITPROGRAMID | Source program | CHAR(8) | AUD-PROGRAM | PROGRAMID | BR-012 | 97% | | 3 | AUDITUSERID | Acting user | CHAR(8) | AUD-USER-ID | (inferred) | BR-012 | 98% | | 4 | AUDITTYPE | Event category (TRAN/USER/SYST) | CHAR(4) | AUD-TYPE | ERRORTYPE | BR-012 | 96% | | 5 | AUDITACTION | Action verb (CREATE/UPDATE/DELETE) | CHAR(8) | AUD-ACTION | (not in schema) | BR-012 | 98% | | 6 | AUDITSTATUS | Outcome (SUCC/FAIL/WARN) | CHAR(4) | AUD-STATUS | (not in schema) | BR-012 | 97% | | 7 | BEFOREIMAGE | Previous state | VARCHAR(100) | AUD-BEFORE-IMAGE | (inferred) | BR-012 | 94% | | 8 | AFTERIMAGE | New state | VARCHAR(100) | AUD-AFTER-IMAGE | (inferred) | BR-012 | 94% | | 9 | AUDITMESSAGE | Human description | VARCHAR(100) | AUD-MESSAGE | ERRORMESSAGE | BR-012 | 90% | | 10 | AUDITPORTFOLIOID | Related portfolio | CHAR(8) | AUD-PORTFOLIO-ID | PORTFOLIOID | BR-012 | 92% | | 11 | AUDITACCOUNTNO | Related account | CHAR(10) | AUD-ACCOUNT-NO | (inferred) | BR-012 | 91% | | 12 | AUDITTERMINAL | CICS terminal ID | CHAR(8) | AUD-TERMINAL | (not in schema) | BR-012 | 88% | | 13 | AUDITSYSTEMID | LPAR/host identifier | CHAR(8) | AUD-SYSTEM-ID | (not in schema) | BR-012 | 85% | | 14 | Immutable Audit Trail | Complete audit entity | Struct | AUDITLOG | ERRORLOG | BR-012 | 92% | Immutability Guarantee: - Audit records NEVER updated or deleted after creation - Retention policy: 90 days minimum (inferred from cleanup schedules) - All portfolio data mutations logged per BR-012 - Before/after images enable SCD Type 2 reconciliation --- Extracted Synonym Mapping (47 Pairs) This section documents COBOL ↔ DB2 naming mappings to ensure semantic consistency across layers.
- Portfolio Entity (8 pairs): 1.
- PORTFLIO.PORT-LAST-MAINT ↔ PORTFOLIOMASTER.LASTMAINTDATE Transaction Entity (6 pairs): 9.

**Supporting References**

- Wiki: Phase 1.1: COBOL Analysis Report
- Wiki: Phase 1.2.1: IPMS Business Glossary Extraction
- Wiki: PHASE 1.6 COMPLETE DELIVERABLES INDEX
- Wiki: Phase 1.3: Business Rules & Constraints Formalization
- Wiki: Phase 1.5: Data Quality Dimension Analysis for IPMS

### Rationale

- Answer archived from the grounded wiki query flow.
- Supporting wiki pages: Phase 1.1: COBOL Analysis Report, Phase 1.2.1: IPMS Business Glossary Extraction, PHASE 1.6 COMPLETE DELIVERABLES INDEX, Phase 1.3: Business Rules & Constraints Formalization, Phase 1.5: Data Quality Dimension Analysis for IPMS

## Metadata
- **Archived**: 2026-04-14T16:17:45.480Z
- **Conversation Length**: 2 messages
- **Supporting Pages**: 5
