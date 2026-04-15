---
title: "Phase 1.5: DQ Measurement SQL Procedures (10+ Queries)"
tags:
  - ingested
  - source-md
  - group-raw-root
links:
  - "/raw/PHASE_1_5_SQL_PROCEDURES.md"
created: 2026-04-15T17:11:14.621Z
source: "/raw/PHASE_1_5_SQL_PROCEDURES.md"
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
  - /raw/PHASE_1_5_DQ_RULES_REGISTRY.md
  - /raw/PHASE_1_5_QUICK_REFERENCE.md
  - /raw/PHASE_1_6_CHANGE_MANAGEMENT.md
  - /raw/PHASE_1_6_COMPLETE_DELIVERABLES_INDEX.md
  - /raw/PHASE_1_6_GOVERNANCE_POLICIES_DETAILED.md
  - /raw/PHASE_1_6_RACI_ORGANIZATION.md
  - /raw/PHASE_1_6_SEMANTIC_GOVERNANCE_CAPSTONE.md
  - /raw/PHASE_2_IMPLEMENTATION_KICKOFF.md

## Source Content
# Phase 1.5: DQ Measurement SQL Procedures (10+ Queries)

**Production-Ready SQL for Automated Data Quality Checking**

**Date:** 11 April 2026  
**System:** Investment Portfolio Management System (IPMS)  
**Frequency:** Daily execution (23:00-04:00 UTC) + Hourly monitoring (timeliness SLAs)  

---

## TABLE OF CONTENTS

1. [Daily Completeness Check](#daily-completeness-check)
2. [Daily Accuracy Validation](#daily-accuracy-validation)
3. [Daily Consistency Check](#daily-consistency-check)
4. [FK Consistency Audit](#fk-consistency-audit)
5. [Audit Trail Completeness](#audit-trail-completeness)
6. [Portfolio Reconciliation (BR-015)](#portfolio-reconciliation-br-015)
7. [Timeliness SLA Monitoring](#timeliness-sla-monitoring)
8. [Exception Report Generation](#exception-report-generation)
9. [Remediation Tracking](#remediation-tracking)
10. [DQ Dashboard Aggregation](#dq-dashboard-aggregation)

---

## DAILY COMPLETENESS CHECK

### Query 1: Field-Level Completeness by Entity (23:00 UTC)

```sql
-- DQ_COMPLETENESS_CHECK_DAILY.sql
-- Purpose: Calculate daily completeness % for all critical fields
-- Schedule: Daily 23:00 UTC
-- Output: dq_completeness_daily_<date>.csv

WITH completeness_data AS (
  -- PORTFOLIO_MASTER completeness
  SELECT 
    CURRENT_DATE as measurement_date,
    'PORTFOLIO_MASTER' as entity_name,
    12 as total_columns,
    COUNT(*) as total_records,
    COUNT(portfolio_id) as c_portfolio_id,
    COUNT(portfolio_name) as c_portfolio_name,
    COUNT(portfolio_status) as c_portfolio_status,
    COUNT(account_number) as c_account_number,
    COUNT(total_value) as c_total_value,
    COUNT(market_value) as c_market_value,
    COUNT(created_date) as c_created_date,
    COUNT(updated_date) as c_updated_date,
    COUNT(currency) as c_currency,
    COUNT(manager_id) as c_manager_id
  FROM PORTFOLIO_MASTER
  
  UNION ALL
  
  -- POSITION_HISTORY completeness
  SELECT 
    CURRENT_DATE,
    'POSITION_HISTORY',
    18,
    COUNT(*),
    COUNT(position_id),
    COUNT(portfolio_id),
    COUNT(security_id),
    COUNT(quantity),
    COUNT(unit_price),
    COUNT(market_value),
    COUNT(cost_basis),
    COUNT(gain_loss),
    COUNT(currency),
    COUNT(settlement_date),
    COUNT(accrued_interest)
  FROM POSITION_HISTORY
  
  UNION ALL
  
  -- TRANSACTION_HISTORY completeness
  SELECT 
    CURRENT_DATE,
    'TRANSACTION_HISTORY',
    22,
    COUNT(*),
    COUNT(transaction_id),
    COUNT(portfolio_id),
    COUNT(transaction_type),
    COUNT(quantity),
    COUNT(unit_price),
    COUNT(amount),
    COUNT(cost_basis),
    COUNT(currency),
    COUNT(description),
    COUNT(commission_amount),
    COUNT(fee_amount)
  FROM TRANSACTION_HISTORY
)
SELECT 
  measurement_date,
  entity_name,
  total_records,
  -- Portfolio completeness
  ROUND(100.0 * c_portfolio_id / total_records, 2) as portfolio_id_pct,
  ROUND(100.0 * c_portfolio_name / total_records, 2) as portfolio_name_pct,
  ROUND(100.0 * c_portfolio_status / total_records, 2) as status_pct,
  -- Calculate overall entity completeness
  ROUND(100.0 * (c_portfolio_id + c_portfolio_name + c_portfolio_status + 
         c_account_number + c_total_value + c_currency) / 
         (total_records * 6), 2) as overall_completeness_pct,
  -- Summary status
  CASE 
    WHEN ROUND(100.0 * (c_portfolio_id + c_portfolio_name + c_portfolio_status + 
           c_account_number + c_total_value + c_currency) / 
           (total_records * 6), 2) >= 99.0 THEN 'PASS'
    WHEN ROUND(100.0 * (c_portfolio_id + c_portfolio_name + c_portfolio_status + 
           c_account_number + c_total_value + c_currency) / 
           (total_records * 6), 2) >= 95.0 THEN 'WARNING'
    ELSE 'FAIL'
  END as overall_status
FROM completeness_data
ORDER BY entity_name;
```

---

## DAILY ACCURACY VALIDATION

### Query 2: Business Rule Accuracy Assessment (23:15 UTC)

```sql
-- DQ_ACCURACY_RULES_CHECK_DAILY.sql
-- Purpose: Validate BR-002, BR-004, BR-006, BR-008
-- Schedule: Daily 23:15 UTC
-- Output: dq_accuracy_daily_<date>.csv

WITH accuracy_metrics AS (
  -- BR-002: Portfolio ID Format
  SELECT 
    CURRENT_DATE as check_date,
    'BR-002' as rule_id,
    'Portfolio ID Format' as rule_name,
    COUNT(*) as total_evaluated,
    COUNT(CASE 
      WHEN portfolio_id REGEXP_LIKE(portfolio_id, '^PORT[0-9]{4}$') THEN 1 
    END) as valid_records,
    COUNT(CASE 
      WHEN NOT portfolio_id REGEXP_LIKE(portfolio_id, '^PORT[0-9]{4}$') THEN 1 
    END) as invalid_records
  FROM PORTFOLIO_MASTER
  
  UNION ALL
  
  -- BR-004: Amount Range Validation
  SELECT 
    CURRENT_DATE,
    'BR-004',
    'Amount Range [-9.999T, +9.999T]',
    COUNT(*),
    COUNT(CASE 
      WHEN amount >= -9999999999.99 AND amount <= 9999999999.99 THEN 1 
    END),
    COUNT(CASE 
      WHEN amount < -9999999999.99 OR amount > 9999999999.99 THEN 1 
    END)
  FROM TRANSACTION_HISTORY
  WHERE amount IS NOT NULL
  
  UNION ALL
  
  -- BR-006: Transaction Type Enum
  SELECT 
    CURRENT_DATE,
    'BR-006',
    'Transaction Type Enum (BU/SL/TR/FE)',
    COUNT(*),
    COUNT(CASE 
      WHEN transaction_type IN ('BU', 'SL', 'TR', 'FE') THEN 1 
    END),
    COUNT(CASE 
      WHEN transaction_type NOT IN ('BU', 'SL', 'TR', 'FE') THEN 1 
    END)
  FROM TRANSACTION_HISTORY
  
  UNION ALL
  
  -- BR-008: Currency Enum
  SELECT 
    CURRENT_DATE,
    'BR-008',
    'Currency Enum (USD/EUR/GBP/JPY/CAD)',
    COUNT(*),
    COUNT(CASE 
      WHEN currency IN ('USD', 'EUR', 'GBP', 'JPY', 'CAD') THEN 1 
    END),
    COUNT(CASE 
      WHEN currency NOT IN ('USD', 'EUR', 'GBP', 'JPY', 'CAD') THEN 1 
    END)
  FROM TRANSACTION_HISTORY
)
SELECT 
  check_date,
  rule_id,
  rule_name,
  total_evaluated,
  valid_records,
  invalid_records,
  ROUND(100.0 * valid_records / total_evaluated, 4) as accuracy_pct,
  CASE 
    WHEN ROUND(100.0 * valid_records / total_evaluated, 4) >= 99.9 THEN 'PASS'
    WHEN ROUND(100.0 * valid_records / total_evaluated, 4) >= 99.0 THEN 'WARNING'
    ELSE 'FAIL'
  END as rule_status,
  CASE 
    WHEN invalid_records > 0 THEN 'DQA-' || rule_id || ': ' || 
      invalid_records || ' violations detected'
    ELSE NULL
  END as alert_message
FROM accuracy_metrics
ORDER BY rule_id;
```

---

## DAILY CONSISTENCY CHECK

### Query 3: Portfolio Total Reconciliation (BR-015) (23:30 UTC)

```sql
-- DQ_CONSISTENCY_BR015_CHECK_DAILY.sql
-- Purpose: Validate portfolio_total_value ≈ SUM(positions) ± 0.02
-- Schedule: Daily 23:30 UTC
-- Alert Threshold: >10% imbalanced portfolios
-- Output: dq_br015_consistency_<date>.csv

SELECT 
  CURRENT_DATE as check_date,
  p.portfolio_id,
  p.portfolio_status,
  COUNT(pos.position_id) as position_count,
  p.total_value as portfolio_total,
  COALESCE(SUM(pos.market_value), 0) as calculated_total,
  ABS(p.total_value - COALESCE(SUM(pos.market_value), 0)) as variance,
  ROUND(
    ABS(p.total_value - COALESCE(SUM(pos.market_value), 0)) / 
    NULLIF(p.total_value, 0) * 100, 
    4
  ) as variance_pct,
  CASE 
    WHEN ABS(p.total_value - COALESCE(SUM(pos.market_value), 0)) <= 0.02 
      THEN 'COMPLIANT'
    WHEN ABS(p.total_value - COALESCE(SUM(pos.market_value), 0)) <= 1.00 
      THEN 'WARNING'
    WHEN ABS(p.total_value - COALESCE(SUM(pos.market_value), 0)) <= 10.00 
      THEN 'AT_RISK'
    ELSE 'CRITICAL'
  END as compliance_status,
  DATE(p.updated_date) as last_updated,
  CASE 
    WHEN ABS(p.total_value - COALESCE(SUM(pos.market_value), 0)) > 0.02
      THEN 'DQ-CN001: Portfolio ' || p.portfolio_id || 
           ' imbalance: ' || 
           ROUND(ABS(p.total_value - COALESCE(SUM(pos.market_value), 0)), 2)
    ELSE NULL
  END as remediation_alert
FROM PORTFOLIO_MASTER p
LEFT JOIN POSITION_HISTORY pos ON p.portfolio_id = pos.portfolio_id
GROUP BY p.portfolio_id, p.portfolio_status, p.total_value, p.updated_date, 
         p.created_date
HAVING ABS(p.total_value - COALESCE(SUM(pos.market_value), 0)) > 0.02
ORDER BY variance DESC;
```

---

## FK CONSISTENCY AUDIT

### Query 4: Orphan Records Detection (23:45 UTC)

```sql
-- DQ_FK_CONSISTENCY_CHE

## Sources
- [`/raw/PHASE_1_5_SQL_PROCEDURES.md`](/raw/PHASE_1_5_SQL_PROCEDURES.md)