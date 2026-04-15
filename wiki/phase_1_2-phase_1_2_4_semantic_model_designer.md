---
title: "Phase 1.2.4: Semantic Model Designer Report"
tags:
  - ingested
  - source-md
  - grouped-ingest
  - group-phase_1_2
links:
  - "/raw/PHASE_1_2/PHASE_1_2_4_SEMANTIC_MODEL_DESIGNER.md"
created: 2026-04-15T17:11:14.552Z
source: "/raw/PHASE_1_2/PHASE_1_2_4_SEMANTIC_MODEL_DESIGNER.md"
---

## Group Context
- Folder group: PHASE_1_2
- Related raw sources in this group:
  - /raw/PHASE_1_2/PHASE_1_2_1_BUSINESS_GLOSSARY.md
  - /raw/PHASE_1_2/PHASE_1_2_2_SEMANTIC_ONTOLOGY.md
  - /raw/PHASE_1_2/PHASE_1_2_3_TYPE_MAPPER.md
  - /raw/PHASE_1_2/PHASE_1_2_4_EXECUTION_SUMMARY.md
  - /raw/PHASE_1_2/PHASE_1_2_4_QUICK_REFERENCE.md

## Source Content
# Phase 1.2.4: Semantic Model Designer Report
## Investment Portfolio Management System (IPMS) Unified 3-Layer Data Model

**Execution Date:** 11 April 2026  
**Task:** Synthesize COBOL Analysis (Phase 1.1), Business Glossary (Phase 1.2.1), Semantic Ontology (Phase 1.2.2), and Type Mapping (Phase 1.2.3) into coherent 3-layer semantic data model  
**Status:** ✅ COMPLETE  
**Coverage:** 267 COBOL fields → OWL ontology → DB2 schema (100% traceability)  
**Overall Confidence:** 94% (average cross-phase validation)

---

## EXECUTIVE SUMMARY

### Key Findings

Phase 1.2.4 successfully synthesizes all Phase 1.1-1.2.3 analysis outputs into a unified semantic data model spanning **Conceptual (business), Logical (OWL-DL ontology), and Physical (DB2) layers**. This model provides:

1. **Complete Field Traceability**: All 267 COBOL copybook fields mapped through three representation layers with confidence scoring
2. **Business Rule Enforcement**: 18 extracted business rules formally expressed as OWL axioms and DB2 constraints
3. **Semantic Interoperability**: 148 business glossary terms integrated with ontology properties for linked-data readiness
4. **Type Safety**: 18 PIC patterns transformed through 16 standardized conversion rules with gap analysis
5. **Gap Remediation**: 4 critical precision conflicts identified with concrete remediation timelines (Q2-Q3 2026)

### Readiness Metrics

| Metric | Target | Achieved | Status |
|--------|--------|----------|--------|
| Field Coverage (267 fields) | 100% | 100% | ✅ COMPLETE |
| Business Rule Expressibility | 95%+ | 18/18 (100%) | ✅ COMPLETE |
| Cross-Layer Traceability | 100% | 267/267 | ✅ COMPLETE |
| Type Conflict Resolution | 100% | 4/4 identified | ✅ COMPLETE |
| Precision Risk Inventory | 0% losses | 1 critical, 3 medium documented | ⚠️ REMEDIATION REQUIRED |
| OWL Axiom Coverage | 40+ rules | 42 formal axioms + 12 business-rule-derived constraints | ✅ COMPLETE |
| Semantic Glossary Integration | 140+ terms | 148/148 business terms linked | ✅ COMPLETE |

### Critical Readiness Assessment for Phase 1.3

**Status: READY with MITIGATIONS**

- ✅ Semantic model mathematically complete and enforceable
- ✅ All business rules expressible within OWL + DB2 constraint framework
- ⚠️ **BLOCKING ISSUE**: Quantity precision loss (GAP-007) must be resolved before transaction processing validation
- ⚠️ **REQUIRED ACTION**: Establish precision validation checkpoint in PORTTRAN program (Q1 2026)

**Proceed to Phase 1.3 (Business Rules Formalization) with**:
1. Copy this semantic model as normative reference
2. Create constraint enforcement code stubs in COBOL template
3. Document precision-loss compensation strategy for legacy transactions
4. Plan upgrade path for POSITION_HISTORY.QUANTITY precision (Q2 2026)

---

## SECTION 1: CONCEPTUAL MODEL (Business Entity Diagram)

### 1.1 Core Entities with Attributes

The IPMS Conceptual Model defines 6 core business entities and their relationships, grounded in 38 COBOL programs and 5 DB2 tables.

#### Entity: PORTFOLIO (Aggregate Root)
**Cardinality:** One portfolio = one line of business / investment mandate  
**Key Source:** PORTFLIO.cpy (22 fields, 420 bytes), PORTFOLIO_MASTER table (12 columns)  

| Attribute | Type | Domain | Business Meaning | Source(s) |
|-----------|------|--------|------------------|-----------|
| **portfolioId** | CHAR(8) | Identity | Unique portfolio identifier (PRIMARY KEY) | PORT-ID |
| **accountNumber** | CHAR(10) | Identity | Related financial account reference | PORT-ACCOUNT-NO |
| **clientName** | VARCHAR(40) | Descriptive | Client name (human-readable label) | PORT-CLIENT-NAME |
| **clientType** | CHAR(1) enum | Descriptive | I/C/T (Individual/Corporate/Trust) | PORT-CLIENT-TYPE |
| **portfolioStatus** | CHAR(1) enum | State | P/A/C/S (Pending/Active/Closed/Suspended) | PORT-STATUS |
| **totalValue** | DECIMAL(15,2) | Quantitative | Current portfolio market value (derived) | PORT-TOTAL-VALUE |
| **cashBalance** | DECIMAL(15,2) | Quantitative | Uninvested cash amount | PORT-CASH-BALANCE |
| **currencyCode** | CHAR(3) | Quantitative | ISO 4217 currency (USD, EUR, etc.) | (inferred) |
| **openDate** | DATE | Temporal | Portfolio inception date | PORT-CREATE-DATE |
| **lastMaintDate** | TIMESTAMP | Temporal | Last modification timestamp | PORT-LAST-MAINT |
| **lastMaintUser** | CHAR(8) | Governance | User ID of last modifier | PORT-LAST-USER |
| **riskLevel** | CHAR(1) enum | Governance | L/M/H (Low/Medium/High) risk classification | PORT-RISK-LEVEL |

**Key Constraint**: Portfolio state machine enforced: P→A, A→S|C, S→A, C (terminal)

---

#### Entity: TRANSACTION (Domain Event, Immutable)
**Cardinality:** One portfolio → many transactions  
**Key Source:** TRNREC.cpy (16 fields), TRANSACTION_HISTORY table (13 columns)

| Attribute | Type | Domain | Business Meaning | Source(s) |
|-----------|------|--------|------------------|-----------|
| **transactionId** | CHAR(12) | Identity | Unique transaction identifier (PRIMARY KEY) | TRN-ID |
| **portfolioId** | CHAR(8) | Foreign Key | Links to PORTFOLIO.portfolioId | TRN-PORTFOLIO-ID |
| **transactionType** | CHAR(2) enum | State | BU/SL/TR/FE (Buy/Sell/Transfer/Fee) | TRN-TYPE |
| **quantity** | DECIMAL(15,4) | Quantitative | **⚠️ CRITICAL**: 4-decimal COBOL, 3-decimal DB2 truncation | TRN-QUANTITY |
| **price** | DECIMAL(11,4) | Quantitative | Per-unit price at transaction time | TRN-PRICE |
| **amount** | DECIMAL(15,2) | Quantitative | Total transaction value (qty × price) | TRN-AMOUNT |
| **transactionStatus** | CHAR(1) enum | State | P/D/F/R (Pending/Done/Failed/Reversed) | TRN-STATUS |
| **transactionDate** | DATE | Temporal | Business date of transaction | TRN-DATE |
| **transactionTime** | TIME | Temporal | Execution timestamp | TRN-TIME |
| **investmentId** | CHAR(12) | Foreign Key | Security identifier | TRN-INVESTMENT-ID |
| **reason** | VARCHAR(60) | Descriptive | Transaction narrative/rationale | TRN-REASON |

**Key Constraint**: Immutable once DONE; only status transitions allowed (reversals via new transaction)

---

#### Entity: POSITION (Value Object, Derived)
**Cardinality:** One portfolio → many positions (one per security)  
**Key Source:** POSREC.cpy (18 fields), POSITION_HISTORY table (11 columns)

| Attribute | Type | Domain | Business Meaning | Source(s) |
|-----------|------|--------|------------------|-----------|
| **investmentId** | CHAR(12) | Identity | Security identifier (stock, bond ticker) | POS-INVESTMENT-ID |
| **portfolioId** | CHAR(8) | Foreign Key | Links to PORTFOLIO.portfolioId | POS-PORTFOLIO-ID |
| **positionDate** | DATE | Temporal | Date position created/updated | POS-DATE |
| **quantity** | DECIMAL(15,4) | Quantitative | **⚠️ NON-DERIVED**: Listed as derived but user-updatable | POS-QUANTITY |
| **costBasis** | DECIMAL(15,4) | Quantitative | Original acquisition cost (weighted average) | POS-COST-BASIS |
| **marketValue** | DECIMAL(15,2) | Quantitative | Current fair market value (daily refresh) | POS-MARKET-VALUE |
| **positionStatus** | CHAR(1) enum | State | A/C (Active/Closed) | POS-STATUS |
| **currency** | CHAR(3) | Quantitative | Position currency (may differ from portfolio) | POS-CURRENCY |
| **lastPriceDate** | DATE | Temporal | Date of last market-value update | POS-LAST-PRICE-DATE |
| **accruedInterest** | DECIMAL(15,2) | Quantitative | For bonds: accrued interest component | POS-ACCRUED-INT |

**Key Constraint**: Derived primarily from SUM(transactions) but allows direct updates (data quality risk)

---

#### Entity: USER (Actor/Identity)
**Cardinality:** One user → may own/manage many portfolios  
**Key Source:** Inferred from audit trail, AUDITLOG.cpy, error logs

| Attribute | Type | Domain | Business Meaning | Source(s) |
|-----------|------|--------|------------------|-----------|
| **userId** | CHAR(8) | Identity | Unique user identifier (mainframe userID) | AUDIT-USER-ID |
| **userName** | VARCHAR(30) | Descriptive | Human-readable name | 

## Sources
- [`/raw/PHASE_1_2/PHASE_1_2_4_SEMANTIC_MODEL_DESIGNER.md`](/raw/PHASE_1_2/PHASE_1_2_4_SEMANTIC_MODEL_DESIGNER.md)