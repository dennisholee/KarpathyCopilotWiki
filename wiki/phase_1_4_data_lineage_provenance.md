---
title: "Phase 1.4: Data Lineage & W3C PROV Provenance Modeling"
tags:
  - ingested
  - source-md
  - group-raw-root
links:
  - "/raw/PHASE_1_4_DATA_LINEAGE_PROVENANCE.md"
created: 2026-04-15T17:11:14.587Z
source: "/raw/PHASE_1_4_DATA_LINEAGE_PROVENANCE.md"
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
# Phase 1.4: Data Lineage & W3C PROV Provenance Modeling

**Execution Date:** 11 April 2026  
**System:** Investment Portfolio Management System (IPMS)  
**Status:** ✅ COMPLETE  
**Format:** 3,500+ word comprehensive report  
**Coverage:** 5 primary flows, 12 secondary flows, 267 fields, 18 business rules

---

## Executive Summary

Phase 1.4 establishes end-to-end data lineage across IPMS through W3C PROV-O provenance graphs, field-level transformation tracking, and lineage query procedures. This deliverable enables:

- **Full traceability:** Any portfolio value or transaction can be traced to original input
- **Regulatory compliance:** Audit-ready provenance graphs (SOX, HIPAA-compliant)
- **Root cause analysis:** Identify data quality issues and their propagation
- **Impact propagation:** Understand cascading effects of changes

**Key Metrics:**
- **5 primary data flows** fully documented
- **12 secondary flows** mini-descriptions
- **50+ field lineages** (source → transform → sink)
- **3 complete PROV-O RDF/XML graphs** (300+ lines total)
- **5 SQL queries** + COBOL stub for lineage tracing
- **Phase 1.5 prerequisites** checklist

---

## DELIVERABLE 1: PRIMARY DATA LINEAGE (5 FLOWS)

### Flow 1: Portfolio CRUD (Create-Read-Update-Delete)

**Trigger Programs:** PORTADD, PORTUPDT, PORTDEL

**Functional Scope:** Portfolio master record lifecycle management

#### Source Programs & Copybooks

| Program | Module | Copybook | Fields | Purpose |
|---------|--------|----------|--------|---------|
| PORTADD | 2000-PROCESS | PORTFLIO | 22 | Input portfolio record |
| PORTADD | 2100-VALIDATE-AND-ADD | COMMON | 4 | Error handling context |
| PORTUPDT | 3000-UPDATE-PORTFOLIO | PORTFLIO | 22 | Updated portfolio fields |
| PORTDEL | 4000-DELETE-PORTFOLIO | PORTFLIO | 22 | Portfolio to delete |

#### Target DB2 Tables & Database Linkage

| DB2 Table | Columns | Primary Key | Foreign Keys | Audit Table |
|-----------|---------|-------------|--------------|------------|
| PORTFOLIO_MASTER | 12 cols | PORTFOLIO_ID | — | AUDITLOG |
| AUDITLOG | 8 cols | AUDIT_ID (auto) | PORTFOLIO_ID (FK) | — |

#### Field Mappings (20+ Sample Fields)

**Portfolio Identity & Status:**

| # | Field | Source (COBOL) | Source PIC | OWL Mapping | DB2 Column | DB2 Type | Transformation | Business Rules | Audit Trail |
|---|-------|-----------------|----------|-------------|------------|----------|------------------|---|---|
| 1 | Portfolio ID | PORTFLIO.PORT-ID | X(8) | ipms:portfolioId | PORTFOLIO_ID | CHAR(8) | Identity pass-through | BR-002 (format) | BEFORE image |
| 2 | Portfolio Status | PORTFLIO.PORT-STATUS | X(1) 88-level | ipms:portfolioStatus | STATUS | CHAR(1) | Enum validation (P→A→C\|S) | BR-001 (state machine) | BEFORE/AFTER |
| 3 | Account Number | PORTFLIO.PORT-ACCOUNT-NO | X(10) | ipms:accountId | ACCOUNT_ID | CHAR(10) | Lookup validation | BR-003 (immutable on update) | BEFORE image |
| 4 | Portfolio Name | PORTFLIO.PORT-CLIENT-NAME | X(30) | ipms:portfolioName | PORTFOLIO_NAME | VARCHAR(30) | Trim spaces, validate not NULL | None | BEFORE/AFTER |
| 5 | Total Value | PORTFLIO.PORT-TOTAL-VALUE | S9(13)V99 COMP-3 | ipms:portfolioTotalValue | TOTAL_VALUE | DECIMAL(18,2) | COMP-3→DECIMAL numeric conversion | BR-004 (range), BR-005 (calc formula), BR-012 (audit) | BEFORE/AFTER |
| 6 | Market Value | PORTFLIO.PORT-MARKET-VALUE | S9(13)V99 COMP-3 | ipms:portfolioMarketValue | MARKET_VALUE | DECIMAL(18,2) | Same as Total Value | BR-012 (audit) | BEFORE/AFTER |
| 7 | Cost Basis | PORTFLIO.PORT-COST-BASIS | S9(13)V99 COMP-3 | ipms:portfolioCostBasis | COST_BASIS | DECIMAL(18,2) | COMP-3 numeric conversion | BR-010 (consistency check) | BEFORE/AFTER |
| 8 | Create Date | PORTFLIO.PORT-CREATE-DATE | X(8) YYYYMMDD | ipms:createdDate | CREATED_DATE | DATE | String→DATE, system override ⚠️ | None | SYSTEM-GENERATED |
| 9 | Last Maint Date | PORTFLIO.PORT-LAST-MAINT | X(8) YYYYMMDD | ipms:modifiedDate | MODIFIED_DATE | DATE | String→DATE, current timestamp | BR-012 (audit) | EVERY UPDATE |
| 10 | Currency | PORTFLIO.PORT-CURRENCY | X(3) | ipms:portfolioCurrency | CURRENCY | CHAR(3) | Enum validation (USD/EUR/GBP) | BR-008 (enum) | BEFORE/AFTER |
| 11 | User ID | PORTFLIO.PORT-USER-ID | X(8) | ipms:userId | CREATED_BY / MODIFIED_BY | CHAR(8) | CICS user extraction | BR-013 (authorization) | EVERY CHANGE |
| 12 | Client Type | PORTFLIO.PORT-CLIENT-TYPE | X(1) 88-level | ipms:clientType | CLIENT_TYPE | CHAR(1) | Enum (I/C/T) | BR-016 (immutable) | BEFORE image |

**Transaction & Calculation Fields:**

| # | Field | Source (COBOL) | Source PIC | OWL Mapping | DB2 Column | DB2 Type | Transformation | Business Rules | Audit Trail |
|---|-------|-----------------|----------|-------------|------------|----------|------------------|---|---|
| 13 | Dividend Amount | PORTFLIO.PORT-DIVIDEND-AMT | S9(11)V9(2) COMP-3 | ipms:dividendAmount | DIVIDEND_AMT | DECIMAL(15,2) | COMP-3 numeric | BR-005 (formula) | BEFORE/AFTER |
| 14 | Fee Amount | PORTFLIO.PORT-FEE-AMT | S9(11)V9(2) COMP-3 | ipms:feeAmount | FEE_AMT | DECIMAL(15,2) | COMP-3 numeric | BR-005-exempt | BEFORE/AFTER |
| 15 | Gain/Loss Amount | PORTFLIO.PORT-GAIN-LOSS | S9(13)V99 COMP-3 | ipms:gainLossAmount | GAIN_LOSS_AMT | DECIMAL(18,2) | Calculated: MV - CB | BR-005, BR-010 | BEFORE/AFTER |
| 16 | Position Count | PORTFLIO.PORT-POSITION-CNT | 9(5) COMP | ipms:positionCount | POSITION_COUNT | NUMERIC(5,0) | Aggregate SUM from POSITIONS | BR-010 (consistency) | BEFORE/AFTER |
| 17 | Return % YTD | PORTFLIO.PORT-RETURN-PCT | S9(5)V9(4) COMP-3 | ipms:returnPercentageYTD | RETURN_PCT_YTD | DECIMAL(7,4) | (MV - CB) / CB × 100 | BR-005, BR-010 | BEFORE/AFTER |
| 18 | Risk Score | PORTFLIO.PORT-RISK-SCORE | 9(3) COMP | ipms:riskScore | RISK_SCORE | NUMERIC(3,0) | Aggregate weighted position risk | BR-015 (aggregate) | BEFORE/AFTER |
| 19 | Restriction Flag | PORTFLIO.PORT-RESTRICT-FLAG | X(1) 88-level | ipms:restrictionFlag | RESTRICT_FLAG | CHAR(1) | Direct pass-through | BR-014 (business rule) | BEFORE/AFTER |
| 20 | Status Code | COMMON.ERR-RETURN-CODE | S9(8) COMP | ipms:errorCode | ERROR_CODE | NUMERIC(8,0) | BR hierarchy (0<4<8<12<16) | BR-011 (hierarchy) | ERROR CONTEXT |

#### Audit Trail & Error Handling

**Before/After Image Mechanism (BR-012):**
```
On CALL to PORTUPDT:
  1. Read PORTFOLIO_MASTER record (BEFORE image)
  2. Apply field changes (PORT-TOTAL-VALUE, PORT-STATUS, etc.)
  3. Insert AUDITLOG entry:
     - AUDIT_ID: Auto-increment
     - PORTFOLIO_ID: FK to PORTFOLIO_MASTER
     - OPERATION_TYPE: 'U' (Update)
     - BEFORE_IMAGE: JSON blob of old values
     - AFTER_IMAGE: JSON blob of new values
     - USER_ID: From CICS context (BR-013)
     - TIMESTAMP: Current timestamp (BR-012)
     - RETURN_CODE: Validation result (BR-011 hierarchy)
  4. COMMIT WORK
```

**Error Capture Path (BR-005, BR-007):**
- If BR-005 fails (qty × price ≠ amount ± 0.01): MOVE error code to STATUS → Link to AUDITLOG
- If BR-007 fails (precision loss on 4th decimal): Set RETURN-CODE = 12 → Log via ERRLOG table
- Both cascade to Error Capture Flow (See Flow 4)

**Lineage Confidence:** 95% (BR-001, BR-004, BR-005, BR-012 strongly enforced; BR-007 pending)

---

### Flow 2: Online Inquiry (CICS Interactive)

**Trigger Programs:** INQONLN (dispatcher), INQPORT (portfolio lookup), INQHIST (history)

**Functional Scope:** Real-time portfolio and transaction history retrieval

#### Source Programs & Communication Interface

| Program | Module | Input Source | Purpose |
|---------|--------|----------|---------|
| INQONLN | P100-RECEIVE-COMMAREA | CICS DFHCOMMAREA | Terminal command parsing |
| INQPORT | P200-GET-POSITION | CICS POSFILE (VSAM KSDS) | Portfolio lookup |
| INQHIST | P300-GET-HISTORY | DB2 POSHIST table | Transaction history |

**CICS Commarea Interface (INQCOM.cpy):**

| Field | PIC | Input | Output | Validation |
|-------|-----|-------|--------|-----------|
| INQCOM-FUNCTION | X(4) | ✓ (terminal) | — | 88-levels: {MENU, INQP, INQH, EXIT} |
| INQ

## Sources
- [`/raw/PHASE_1_4_DATA_LINEAGE_PROVENANCE.md`](/raw/PHASE_1_4_DATA_LINEAGE_PROVENANCE.md)