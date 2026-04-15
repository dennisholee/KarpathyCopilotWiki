---
title: "Phase 1.5: DQ Rules Registry (50+ Executable Specifications)"
tags:
  - ingested
  - source-md
  - group-raw-root
links:
  - "/raw/PHASE_1_5_DQ_RULES_REGISTRY.md"
created: 2026-04-15T17:11:14.608Z
source: "/raw/PHASE_1_5_DQ_RULES_REGISTRY.md"
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
  - /raw/PHASE_1_5_DATA_QUALITY_DIMENSION_ANALYSIS.md
  - /raw/PHASE_1_5_QUICK_REFERENCE.md
  - /raw/PHASE_1_5_SQL_PROCEDURES.md
  - /raw/PHASE_1_6_CHANGE_MANAGEMENT.md
  - /raw/PHASE_1_6_COMPLETE_DELIVERABLES_INDEX.md
  - /raw/PHASE_1_6_GOVERNANCE_POLICIES_DETAILED.md
  - /raw/PHASE_1_6_RACI_ORGANIZATION.md
  - /raw/PHASE_1_6_SEMANTIC_GOVERNANCE_CAPSTONE.md
  - /raw/PHASE_2_IMPLEMENTATION_KICKOFF.md

## Source Content
# Phase 1.5: DQ Rules Registry (50+ Executable Specifications)

**Document:** Data Quality Rules Formalization for IPMS  
**Date:** 11 April 2026  
**Version:** 1.0  
**Total Rules:** 57 formal specifications

---

## TABLE OF CONTENTS

1. [Completeness Rules (DQR-C001 → DQR-C012)](#completeness-rules)
2. [Accuracy Rules (DQR-A001 → DQR-A014)](#accuracy-rules)
3. [Consistency Rules (DQR-CN001 → DQR-CN016)](#consistency-rules)
4. [Uniqueness Rules (DQR-U001 → DQR-U008)](#uniqueness-rules)
5. [Timeliness Rules (DQR-T001 → DQR-T007)](#timeliness-rules)
6. [Test Case Repository](#test-case-repository)
7. [Enforcement & Remediation](#enforcement--remediation)

---

## COMPLETENESS RULES

### DQR-C001: Portfolio ID Non-Null
- **Entity:** PORTFOLIO_MASTER
- **Attribute:** portfolio_id
- **Condition:** Count(*) WHERE portfolio_id IS NULL = 0
- **Severity:** CRITICAL
- **SLA:** 100% | **Current:** 99.97% | **Gap:** 0%
- **Test:** Expect 0 NULLs (currently passes)

### DQR-C002: Portfolio Name (Conditional)
- **Entity:** PORTFOLIO_MASTER
- **Attribute:** portfolio_name
- **Condition:** Count(*) WHERE portfolio_name IS NULL AND portfolio_id NOT LIKE 'TMP%' < 120
- **Severity:** MAJOR
- **SLA:** 98% | **Current:** 94.7% | **Gap:** -3.3%
- **Test:** Expect <120 NULLs; currently 320 = FAILING

### DQR-C003: Portfolio Status Non-Null
- **SLA:** 100% | **Current:** 99.97% | **Pass**

### DQR-C004: Portfolio Created Date Non-Null
- **SLA:** 100% | **Current:** 100.0% | **Pass**

### DQR-C005: Position Portfolio ID FK Non-Null
- **SLA:** 100% | **Current:** 99.99% | **Pass**

### DQR-C006: Transaction Type Non-Null
- **SLA:** 100% | **Current:** 99.99% | **Pass**

### DQR-C007: Transaction Amount Non-Null
- **SLA:** 100% | **Current:** 99.99% | **Pass**

### DQR-C008: Position Cost Basis (Conditional)
- **Entity:** POSITION_HISTORY
- **Attribute:** cost_basis
- **Condition:** Count(*) WHERE cost_basis IS NULL < 3,000 (8.6% threshold)
- **Severity:** MAJOR
- **SLA:** 95% | **Current:** 91.7% | **Gap:** -3.3%
- **Notes:** Cost basis optional for historical positions; gaps acceptable per business

### DQR-C009: Transaction Description (Conditional)
- **Entity:** TRANSACTION_HISTORY
- **Attribute:** description
- **Condition:** Count(*) WHERE description IS NULL < 12,000 (8% threshold)
- **Severity:** MAJOR
- **SLA:** 95% | **Current:** 92.0% | **Gap:** -3.0%
- **Root Cause:** New ETL missing field mapping (Feb 15)

### DQR-C010: Audit Before-Image (Conditional)
- **Entity:** AUDITLOG
- **Attribute:** before_value
- **Condition:** Count(*) WHERE before_value IS NULL < 1,300 (1% threshold)
- **Severity:** MAJOR
- **SLA:** 98% | **Current:** 89.6% | **Gap:** -8.4%

### DQR-C011: Error Message Populated
- **Entity:** ERROR_LOG
- **Attribute:** error_message
- **Condition:** Count(*) WHERE error_message IS NULL = 0
- **Severity:** CRITICAL
- **SLA:** 99% | **Current:** 99.0% | **Pass**

### DQR-C012: Portfolio Manager ID (Conditional)
- **Severity:** MINOR
- **SLA:** 90% | **Current:** 97.3% | **Pass**

---

## ACCURACY RULES

### DQR-A001: Portfolio ID Format (BR-002)

**Specification:**
```
Entity: PORTFOLIO_MASTER
Attribute: portfolio_id
Rule Type: Pattern Matching
Pattern: ^PORT[0-9]{4}$
Validates: Format must be PORT followed by 4 digits

Test Cases:
  PASS:  PORT0001, PORT5678, PORT9999
  FAIL:  PORT00001 (5-digit), PORTABC4 (alpha), PORT-1234 (dash)
  
SQL Test:
  SELECT COUNT(*) FROM PORTFOLIO_MASTER
  WHERE portfolio_id NOT REGEXP '^PORT[0-9]{4}$';
  Expected: 0 | Current: 18 | Status: FAILING
```

**Severity:** CRITICAL  
**SLA Target:** 99.9%  
**Current:** 99.7%  
**Gap:** -0.2%  
**Enforcement:** DB2 CHECK constraint + PORTADD validation  
**Remediation:** Add CONSTRAINT check_portfolio_id_format  

---

### DQR-A002: Portfolio Status Enum (BR-001)

```
Attribute: portfolio_status
Allowed Values: P (PENDING), A (ACTIVE), S (SUSPENDED), C (CLOSED)
SLA: 99.95% | Current: 99.97% | PASS
```

---

### DQR-A003: Transaction Type Enum (BR-006)

```
Attribute: transaction_type
Allowed Values: BU (Buy), SL (Sell), TR (Transfer), FE (Fee)
SLA: 99.99% | Current: 99.72% | FAILING
Invalid Examples: BU-SL (180), UNPROCESSED (95), NULL (85), XX (45)

SQL Test:
  SELECT transaction_type, COUNT(*) 
  FROM TRANSACTION_HISTORY
  WHERE transaction_type NOT IN ('BU','SL','TR','FE')
  GROUP BY transaction_type;

Enforcement: External ETL + DB2 trigger (pending)
```

---

### DQR-A004: Currency Enum (BR-008)

```
Attribute: currency
Allowed Values: USD, EUR, GBP, JPY, CAD
SLA: 99.98% | Current: 99.954% | PASS (marginal)
Invalid Examples: AUD (25), CNY (18), INR (12), CHF (8), GBp (5)
```

---

### DQR-A005: Amount Range (BR-004)

```
Attribute: amount (TRANSACTION_HISTORY/POSITION_HISTORY)
Range: -9,999,999,999.99 ≤ amount ≤ 9,999,999,999.99
SLA: 99.95% | Current: 99.994% | PASS

Business Rule: Supports range from -9.999 trillion to +9.999 trillion
Test: Find amounts outside range (expect 0; currently 0)
```

---

### DQR-A006: Unit Price ≥ 0

```
Attribute: unit_price (POSITION_HISTORY, TRANSACTION_HISTORY)
Condition: unit_price >= 0
SLA: 99.5% | Current: 99.8% | PASS
```

---

### DQR-A007: Trade Date ≤ Settlement Date

```
Attribute: trade_date, settlement_date
Condition: trade_date <= settlement_date
SLA: 99.0% | Current: 99.2% | PASS
Notes: T+2 settlement standard; settlement typically trade_date + 2 days
```

---

### DQR-A008: Due Date Logic

```
Attribute: due_date / maturity_date
Condition: due_date >= created_date
SLA: 99.0%
```

---

### DQR-A009: Fee Amount ≥ 0

```
Attribute: fee_amount (TRANSACTION_HISTORY)
Condition: fee_amount >= 0 (cannot be negative)
SLA: 99.0%
```

---

### DQR-A010: Commission Amount ≥ 0

```
Attribute: commission_amount
Condition: commission_amount >= 0
SLA: 99.0%
```

---

### DQR-A011: Market Value ≥ 0

```
Attribute: market_value (POSITION_HISTORY)
Condition: market_value >= 0
SLA: 99.5% | Current: 99.8% | PASS
```

---

### DQR-A012: Quantity Sign Consistency

```
Attribute: quantity (POSITION_HISTORY, TRANSACTION_HISTORY)
Condition: Buy transactions have positive quantity;
           Sell transactions have negative quantity
SLA: 95.0%
Test: Check sign consistency with transaction_type field
```

---

### DQR-A013: Cost Basis Validity

```
Attribute: cost_basis (POSITION_HISTORY)
Condition: cost_basis >= 0 (when present)
SLA: 99.0%
```

---

### DQR-A014: Return % Range

```
Attribute: return_pct (derived)
Condition: -100 <= return_pct <= 10000 (represents -100% to +10,000%)
SLA: 99.0%
```

---

## CONSISTENCY RULES

### DQR-CN001: BR-015 Portfolio Value Reconciliation

**High-Priority Consistency Rule**

```
Entity: PORTFOLIO_MASTER, POSITION_HISTORY
Rule: portfolio_total_value ≈ SUM(position.market_value) ± 0.02
Tolerance: 2 cents (0.02)

Test Condition:
  SELECT p.portfolio_id, 
         ABS(p.total_value - SUM(pos.market_value)) as variance
  FROM PORTFOLIO_MASTER p
  LEFT JOIN POSITION_HISTORY pos ON p.portfolio_id = pos.portfolio_id
  GROUP BY p.portfolio_id
  HAVING ABS(p.total_value - SUM(pos.market_value)) > 0.02;
  
Current Violations: 735 (12.25% of portfolios)
SLA Target: 98% | Current: 87.75% | Gap: -10.25% | CRITICAL

Root Causes:
  1. Dividend distribution logic (Feb 1) doesn't atomically update portfolio + positions
  2. Manual portfolio edits bypass validation
  3. Async position updates create temporary inconsistencies
  4. Fee deductions applied to portfolio but not positions

Remediation:
  - Implement DB2 trigger to validate BR-015 post-update
  - Wrap dividend logic in atomic transaction
  - Backfill consistency for 735 imbalanced portfolios
```

---

### DQR-CN002: Transaction → Portfolio FK

```
Entity: TRANSACTION_HISTORY, PORTFOLIO_MASTER
Rule: Every transaction.portfolio_id must exist in PORTFOLIO_MASTER

SQL:
  SELECT COUNT(*) FROM TRANSACTION_HISTORY t
  WHERE NOT EXISTS (
    SELECT 1 FROM PORTFOLIO_MASTER p
    WHERE t.portfolio_id = p.portfolio_id
  );

Current Violations: 1,240 orphans (0.83%)
SLA Target: 99.9

## Sources
- [`/raw/PHASE_1_5_DQ_RULES_REGISTRY.md`](/raw/PHASE_1_5_DQ_RULES_REGISTRY.md)