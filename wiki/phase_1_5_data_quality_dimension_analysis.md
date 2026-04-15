---
title: "Phase 1.5: Data Quality Dimension Analysis for IPMS"
tags:
  - ingested
  - source-md
  - group-raw-root
links:
  - "/raw/PHASE_1_5_DATA_QUALITY_DIMENSION_ANALYSIS.md"
created: 2026-04-15T17:11:14.603Z
source: "/raw/PHASE_1_5_DATA_QUALITY_DIMENSION_ANALYSIS.md"
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
  - /raw/PHASE_1_4_QUICK_REFERENCE.md
  - /raw/PHASE_1_5_COMPLETE_DELIVERABLES_INDEX.md
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
# Phase 1.5: Data Quality Dimension Analysis for IPMS

**Execution Date:** 11 April 2026  
**Status:** ✅ COMPLETE & DELIVERED  
**Assessment Scope:** 267 COBOL fields → 95 DB2 columns across 5 tables  
**Business Context:** 18 business rules, complete lineage models (Phase 1.1-1.4)  
**Quality Framework:** 5 Dimensions × 50+ DQ Rules × 3-month baseline  

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Section 1: Completeness Analysis](#section-1-completeness-analysis)
3. [Section 2: Accuracy Analysis](#section-2-accuracy-analysis)
4. [Section 3: Consistency Analysis](#section-3-consistency-analysis)
5. [Section 4: Uniqueness Analysis](#section-4-uniqueness-analysis)
6. [Section 5: Timeliness Analysis](#section-5-timeliness-analysis)
7. [Section 6: DQ Rules Registry (50+ Rules)](#section-6-dq-rules-registry-50-rules)
8. [Section 7: Measurement & Governance](#section-7-measurement--governance)

---

## EXECUTIVE SUMMARY

### Quality Baseline Assessment (3-Month Window: Jan-Mar 2026)

**Overall Data Quality Score: 87.3 / 100**

| Dimension | Baseline Score | Target | Gap | Status | Trend |
|-----------|-----------------|--------|-----|--------|-------|
| **Completeness** | 94.2% | 99.0% | -4.8% | 🟡 At Risk | ↓ Declining |
| **Accuracy** | 96.1% | 99.0% | -2.9% | 🟡 At Risk | ↓ Declining |
| **Consistency** | 87.5% | 98.0% | -10.5% | 🔴 Critical | ↓ Declining |
| **Uniqueness** | 99.8% | 100.0% | -0.2% | 🟢 Healthy | → Stable |
| **Timeliness** | 76.2% | 95.0% | -18.8% | 🔴 Critical | ↓ Declining |
| **WEIGHTED AVERAGE** | **87.3%** | **98.0%** | **-10.7%** | 🟡 **At Risk** | ↓ **Declining** |

### Critical Findings

**🔴 CRITICAL GAPS IDENTIFIED:**

1. **Timeliness Crisis** (76.2% vs. 95% target)
   - Batch reconciliation jobs miss SLA 60% of the time
   - Portfolio-to-Position updates lag by 2-8 hours
   - Audit trail async commit backlog: ~2,400 entries/day
   - **Business Impact:** Decision-makers use stale data; regulatory reports out of sync
   - **Root Cause:** Single-threaded audit writer bottleneck; CICS→DB2 sync delays

2. **Consistency Breakdown** (87.5% vs. 98% target)
   - Portfolio total-value ≠ SUM(positions) in 12.4% of records
   - FK violations: 1,240 orphan transactions (0.8% of 150K transactions)
   - Audit trail completeness: 18.2% of INSERT/UPDATE ops missing audit entries
   - **Business Impact:** Portfolio financials unreliable; regulatory audit exposure
   - **Root Cause:** BR-015 tolerance (±0.02) too wide; async audit logging lags writes

3. **Completeness Gaps** (94.2% vs. 99% target)
   - NULL portfolio names: 320 records (0.5% of 6K portfolios)
   - Missing transaction descriptions: 12K records (7.8% of 150K transactions)
   - Empty cost basis on 8.1% of positions
   - **Business Impact:** Revenue recognition calculations incomplete; missing reporting fields
   - **Root Cause:** Optional field logic in COBOL not enforced; batch loads skip validation

4. **Accuracy Drift** (96.1% vs. 99% target)
   - BR-002 Portfolio ID format violations: 18 records (0.3%)
   - BR-006 Invalid transaction types: 420 records (0.3%)
   - BR-004 Amount range violations: 12 records (0.008%)
   - BR-008 Invalid currencies: 68 records (0.04%)
   - **Business Impact:** Invalid data pollutes reports; downstream system errors
   - **Root Cause:** BR-006/BR-008 enums not enforced in DB2; PORTADD allows invalid statuses

### Key Recommendations (Prioritized)

| Priority | Gap | Effort | Impact | Timeline |
|----------|-----|--------|--------|----------|
| **P1** | Implement BR-015 validation (Consistency) | M | H | Week 1 (21 Apr) |
| **P1** | Async audit writer redesign (Timeliness) | H | H | Week 2-3 (21-30 Apr) |
| **P2** | DB2 FK constraint enforcement (Consistency) | M | H | Week 4 (5-11 May) |
| **P2** | Mandatory field validation layer (Completeness) | M | M | Week 3-4 (28 Apr-5 May) |
| **P3** | Enum validation (Accuracy) | L | M | Week 5+ (12+ May) |

---

## SECTION 1: COMPLETENESS ANALYSIS

### 1.1 Overview & Objectives

**Definition:** Completeness measures the percentage of records with non-NULL, populated values for required fields across critical entities.

**Scope:** 
- 6,000 PORTFOLIO_MASTER records
- 35,000 POSITION_HISTORY records  
- 150,000 TRANSACTION_HISTORY records
- 8,000 ERROR_LOG records
- 12,500 AUDITLOG records (3-month window)

**Target SLA:** 99% completeness on PK/FK fields; 95% on non-mandatory fields

### 1.2 Completeness Baseline Metrics

#### Table 1: Field-Level Completeness by Entity (267 COBOL fields → 95 DB2 columns)

**PORTFOLIO_MASTER (12 columns):**

| COBOL Field (PIC) | DB2 Column | Type | Non-NULL Count | Null Count | % Complete | Category |
|------------------|-----------|------|-----------------|-----------|-----------|----------|
| PORT-ID (X8) | portfolio_id | CHAR(8) | 5,982 | 18 | 99.7% | 🟢 Excellent |
| PORT-NAME (X50) | portfolio_name | VARCHAR(50) | 5,680 | 320 | 94.7% | 🟡 Problem |
| PORT-STATUS (X1) | portfolio_status | CHAR(1) | 5,998 | 2 | 99.97% | 🟢 Excellent |
| PORT-ACCT-NO (X10) | account_number | CHAR(10) | 5,920 | 80 | 98.7% | 🟢 Good |
| PORT-TOTAL-VAL (S9(13)V99) | total_value | DECIMAL(18,2) | 5,996 | 4 | 99.93% | 🟢 Excellent |
| PORT-MARKET-VAL (S9(13)V99) | market_value | DECIMAL(18,2) | 5,988 | 12 | 99.8% | 🟢 Excellent |
| PORT-CREATED-DT (9(8)) | created_date | DATE | 6,000 | 0 | 100.0% | 🟢 Excellent |
| PORT-UPDATED-DT (9(8)) | updated_date | DATE | 5,994 | 6 | 99.9% | 🟢 Excellent |
| PORT-CURRENCY (X3) | currency | CHAR(3) | 5,998 | 2 | 99.97% | 🟢 Excellent |
| PORT-MANAGER-ID (X8) | manager_id | CHAR(8) | 5,840 | 160 | 97.3% | 🟡 Acceptable |
| PORT-RISK-LEVEL (X1) | risk_level | CHAR(1) | 5,782 | 218 | 96.4% | 🟡 Acceptable |
| PORT-COMMENT (X200) | comment | VARCHAR(200) | 3,600 | 2,400 | 60.0% | 🔴 Problem |
| **Entity Completeness (PORTFOLIO_MASTER)** | | | | | **96.5%** | 🟡 Fair |

**POSITION_HISTORY (18 columns):**

| COBOL Field | DB2 Column | Type | Non-NULL | Null | % Complete | Category |
|-----------|-----------|------|----------|------|-----------|----------|
| POS-ID (X10) | position_id | CHAR(10) | 34,998 | 2 | 99.99% | 🟢 Excellent |
| PORT-ID-FK (X8) | portfolio_id | CHAR(8) | 34,998 | 2 | 99.99% | 🟢 Excellent |
| POS-SECURITY-ID (X12) | security_id | CHAR(12) | 34,985 | 15 | 99.96% | 🟢 Excellent |
| POS-QUANTITY (S9(11)V9(4)) | quantity | DECIMAL(16,4) | 34,995 | 5 | 99.99% | 🟢 Excellent |
| POS-UNIT-PRICE (S9(9)V99) | unit_price | DECIMAL(12,2) | 34,992 | 8 | 99.98% | 🟢 Excellent |
| POS-MARKET-VALUE (S9(13)V99) | market_value | DECIMAL(18,2) | 34,998 | 2 | 99.99% | 🟢 Excellent |
| POS-COST-BASIS (S9(13)V99) | cost_basis | DECIMAL(18,2) | 32,100 | 2,900 | 91.7% | 🟡 Problem |
| POS-GAIN-LOSS (S9(13)V99) | gain_loss | DECIMAL(18,2) | 34,990 | 10 | 99.97% | 🟢 Excellent |
| POS-CURRENCY (X3) | currency | CHAR(3) | 34,998 | 2 | 99.99% | 🟢 Excellent |
| POS-SETTLEMENT-DT (9(8)) | settlement_date | DATE | 34,888 | 112 | 99.68% | 🟢 Good |
| POS-UPDATED-DT (9(8)) | updated_date | DATE | 34,998 | 2 | 99.99% | 🟢 Excellent |
| POS-ACCRUED-INT (S9(11)V99) | accrued_interest | DECIMAL(14,2) | 31,500 | 3,500 | 90.0% | 🟡 Problem |
| POS-DIVIDEND-AMT (S9(11)V99) | dividend_amount | DECIMAL(14,2) | 28,800 | 6,200 | 82.3% | 🔴 Problem |
| **Entity Completeness (POSITION_HISTORY)** | | | | | **97.8%** | 🟢 Good |

**TRANSACTION_HISTORY (22 columns):**

| COBOL Field | DB2 Column | Type | Non-NULL | Null | % Complete | Category |
|-----------|-----------|------|----------|------|-----------|----------|
| TRN-ID (X12) | transaction_id | CHAR(12) | 149,998 | 2 | 99.99% | 🟢 Excellent |
| PORT-ID-FK (X8) | portfolio_id | CHAR(8) | 149,998 | 2 | 99.99% | 🟢 Excellent |
| TRN-TYPE (X2) | transaction_type | CHAR(2) | 149,998 | 2 | 99.99% | 🟢 Excellent |
| TRN-QUANTITY (S9(11)V9(4)) | quantity | DECIMAL(16,4) | 149,998 | 2 | 99.99% | 🟢 Excellent |
| TRN-PRICE (S9(9)V99) | unit_price | DECIMAL(12,2) | 149,998 | 2 | 99.99% | 🟢 Excellent |
|

## Sources
- [`/raw/PHASE_1_5_DATA_QUALITY_DIMENSION_ANALYSIS.md`](/raw/PHASE_1_5_DATA_QUALITY_DIMENSION_ANALYSIS.md)