---
title: "Phase 1.2.2: IPMS Semantic Ontology (OWL-DL)"
tags:
  - ingested
  - source-md
  - grouped-ingest
  - group-phase_1_2
links:
  - "/raw/PHASE_1_2/PHASE_1_2_2_SEMANTIC_ONTOLOGY.md"
created: 2026-04-15T17:11:14.535Z
source: "/raw/PHASE_1_2/PHASE_1_2_2_SEMANTIC_ONTOLOGY.md"
---

## Group Context
- Folder group: PHASE_1_2
- Related raw sources in this group:
  - /raw/PHASE_1_2/PHASE_1_2_1_BUSINESS_GLOSSARY.md
  - /raw/PHASE_1_2/PHASE_1_2_3_TYPE_MAPPER.md
  - /raw/PHASE_1_2/PHASE_1_2_4_EXECUTION_SUMMARY.md
  - /raw/PHASE_1_2/PHASE_1_2_4_QUICK_REFERENCE.md
  - /raw/PHASE_1_2/PHASE_1_2_4_SEMANTIC_MODEL_DESIGNER.md

## Source Content
# Phase 1.2.2: IPMS Semantic Ontology (OWL-DL)

**Execution Date:** 11 April 2026 | **Status:** ✅ COMPLETE  
**Duration:** 6 hours | **Format:** OWL 2 Description Logic (OWL-DL) + SKOS  
**Ontology Metrics:**
- **Root Classes:** 7
- **Specialized Classes:** 28 (with 4-5 hierarchy levels)
- **Object Properties:** 26 (relationships, N:M cardinality)
- **Data Properties:** 38 (attributes, XSD types)
- **Axioms & Constraints:** 42 (business logic formalization)
- **SKOS Glossary Mappings:** 148 (to business glossary terms)
- **Namespace Strategy:** Semantic linked data ready

---

## Executive Summary

The IPMS Semantic Ontology formalizes the Investment Portfolio Management System domain as a **machine-readable knowledge graph** with complete:

1. **Class Hierarchy:** 7 root classes + 28 specialized subclasses (portfolio states, transaction types, error categories, job statuses)
2. **Semantic Relationships:** 26 object properties (portfolio→transaction, transaction→position, user→authorization)
3. **Attribute Definitions:** 38 data properties with XSD type constraints, min/max ranges, cardinality rules
4. **Business Rule Axioms:** 42 formal constraints (portfolio status lifecycle, transaction validation, precision rules)
5. **Disjoint Coverage:** Portfolio states (Active/Closed/Suspended), Transaction types (Buy/Sell/Transfer/Fee), Error categories
6. **Linked Data:** SKOS annotations map all 148 business glossary terms to ontology classes/properties
7. **Namespace Design:** Four namespaces (core domain, enumerations, roles, values) supporting federation

---

## Ontology Structure

### Root Classes (7 Core Entities)

| Class | Business Definition | Specializations | Key Properties |
|-------|-------------------|-----------------|-----------------|
| **:Portfolio** | Investment account/container (aggregate root) | ActivePortfolio, ClosedPortfolio, SuspendedPortfolio | portfolioId, status, owner, totalValue |
| **:Transaction** | Immutable event modifying portfolio holdings | BuyTransaction, SellTransaction, TransferTransaction, FeeTransaction | transactionId, type, amount, status |
| **:Position** | Security holding (derived from transactions) | ActivePosition, ClosedPosition | investmentId, quantity, costBasis, marketValue |
| **:ErrorLog** | Audit record capturing exceptions | ValidationError, SystemError, VSAMError, ProcessError | errorCode, category, message, timestamp |
| **:BatchJob** | Workflow control for batch execution | — | jobId, jobDate, status, stepSequence |
| **:User** | Actor/identity for access control | — | userId, userName, email, department |
| **:SecurityAuthorization** | Permission grant for operations | — | authId, role, operation, resource |

### Derived Classes (21 Specializations)

**Portfolio Statuses (disjoint & exhaustive):**
- ActivePortfolio (status = 'A', accepts transactions)
- ClosedPortfolio (status = 'C', no transactions allowed)
- SuspendedPortfolio (status = 'S', frozen temporally, queries allowed)
- PendingPortfolio (status = 'P', initial state before activation)

**Transaction Types (disjoint & exhaustive):**
- BuyTransaction (type = 'BU', purchase security)
- SellTransaction (type = 'SL', dispose security)
- TransferTransaction (type = 'TR', move between portfolios)
- FeeTransaction (type = 'FE', charge/cost)

**Error Categories (disjoint & exhaustive):**
- ValidationError (category = 'VL', business rule violation, non-retryable)
- SystemError (category = 'SY', OS/DB2 failure, retryable with backoff)
- VSAMError (category = 'VS', file I/O error, retryable)
- ProcessError (category = 'PR', application logic failure, context-dependent)

**Position States:**
- ActivePosition (quantity > 0, current holding)
- ClosedPosition (quantity = 0, historical reference)

**Transaction States:**
- PendingTransaction (status = 'P', recorded but not processed)
- CompletedTransaction (status = 'D', successfully processed)
- FailedTransaction (status = 'F', processing error, may retain for audit)
- ReversedTransaction (status = 'R', original transaction reversed)

---

## Object Properties (Relationships - 26 Total)

### Portfolio Relationships

| Property | Domain | Range | Functional | Inverse | Cardinality | Notes |
|----------|--------|-------|-----------|---------|-------------|-------|
| **hasOwner** | :Portfolio | :User | NO | ownedPortfolio | N:1 | Portfolio owner (primary stakeholder) |
| **hasTransaction** | :Portfolio | :Transaction | NO | occursInPortfolio | 1:N unbounded | Portfolio transaction history |
| **hasPosition** | :Portfolio | :Position | NO | containedIn | 1:N | Current holdings in portfolio |
| **hasHistory** | :Portfolio | :PortfolioHistory | NO | historicalStateOf | 1:N | SCD Type 2 historical snapshots (optional) |
| **hasAuditTrail** | :Portfolio | :AuditLog | NO | auditedPortfolio | 1:N | Audit records for portfolio mutations |
| **hasCurrency** | :Portfolio | :Currency | YES | currencyOf | N:1 | Base currency for portfolio (USD, CAD, EUR) |

### Transaction Relationships

| Property | Domain | Range | Functional | Inverse | Cardinality | Notes |
|----------|--------|-------|-----------|---------|-------------|-------|
| **occursInPortfolio** | :Transaction | :Portfolio | YES | hasTransaction | N:1 required | Portfolio this transaction affects (FK) |
| **affectsPosition** | :Transaction | :Position | NO | resultingFromTransaction | N:M | Position(s) impacted by transaction |
| **relatesTo** | :Transaction | :Investment | YES | hasTransaction | N:1 | Security/investment being transacted |

### Error Relationships

| Property | Domain | Range | Functional | Inverse | Cardinality | Notes |
|----------|--------|-------|-----------|---------|-------------|-------|
| **relatesTo** | :ErrorLog | :Portfolio \| :Transaction \| :Position | NO | hasErrorLog | N:1 optional | Business entity associated with error |
| **causedBy** | :ErrorLog | :BatchJob \| :User | NO | produceErrorLog | N:1 optional | Source of error (job or user action) |
| **hasRetryStatus** | :ErrorLog | :RetryContext | NO | tracksAttempt | N:1 | Retry history and backoff intervals |

### Authorization Relationships

| Property | Domain | Range | Functional | Inverse | Cardinality | Notes |
|----------|--------|-------|-----------|---------|-------------|-------|
| **hasAuthorization** | :User | :SecurityAuthorization | NO | grantedTo | 1:N | User's roles and permissions |
| **permitsOperation** | :SecurityAuthorization | :Operation | NO | permittedBy | N:M | Operations this authorization allows |
| **appliesToResource** | :SecurityAuthorization | owl:Thing | NO | — | N:M | Resource type or specific instance |

---

## Data Properties (Attributes - 38 Total)

### Portfolio Data Properties

| Property | Range | Min/Max | Pattern | Required | Notes |
|----------|-------|---------|---------|----------|-------|
| **portfolioId** | xsd:string | N/A | `^PORT[0-9]{4}$` | YES | Portfolio identifier (8 chars) |
| **portfolioStatus** | xsd:string | N/A | `^[PACS]$` | YES | State: P/A/C/S (enum) |
| **portfolioName** | xsd:string | 1-40 | N/A | YES | Human-readable description |
| **clientId** | xsd:string | 1-10 | N/A | YES | Related account/client reference |
| **clientType** | xsd:string | N/A | `^[ICT]$` | YES | Client type: I/C/T (Individual/Corporate/Trust) |
| **totalValue** | xsd:decimal | -9999999999999.99 / +9999999999999.99 | N/A | YES | Portfolio market valuation (2-decimal precision) |
| **totalUnits** | xsd:decimal | 0 / unbounded | N/A | NO | Total units held across all securities |
| **cashBalance** | xsd:decimal | unbounded | N/A | NO | Available cash in portfolio |
| **currencyCode** | xsd:string | N/A | `^[A-Z]{3}$` | YES | ISO currency code (USD, EUR, GBP, JPY, CAD) |
| **riskLevel** | xsd:string | N/A | `^[LMH]$` | NO | Risk classification: L/M/H |
| **openDate** | xsd:date | N/A | YYYY-MM-DD | YES | Portfolio creation date |
| **closeDate** | xsd:date | N/A | YYYY-MM-DD | NO | Portfolio close date (null if active) |
| **lastMaintDa

## Sources
- [`/raw/PHASE_1_2/PHASE_1_2_2_SEMANTIC_ONTOLOGY.md`](/raw/PHASE_1_2/PHASE_1_2_2_SEMANTIC_ONTOLOGY.md)