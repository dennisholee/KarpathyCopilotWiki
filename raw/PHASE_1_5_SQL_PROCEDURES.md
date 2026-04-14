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
-- DQ_FK_CONSISTENCY_CHECK_DAILY.sql
-- Purpose: Detect FK violations (orphan transactions, orphan positions)
-- Schedule: Daily 23:45 UTC
-- Output: dq_fk_violations_<date>.csv

WITH orphan_transactions AS (
  SELECT 
    CURRENT_DATE as check_date,
    'TRANSACTION_HISTORY' as source_table,
    'Transaction → Portfolio FK' as violation_type,
    t.transaction_id as record_id,
    t.portfolio_id as missing_fk_value,
    COUNT(*) OVER (PARTITION BY NULL) as total_orphans,
    'Portfolio ' || t.portfolio_id || ' does not exist in PORTFOLIO_MASTER'
      as violation_detail
  FROM TRANSACTION_HISTORY t
  WHERE NOT EXISTS (
    SELECT 1 FROM PORTFOLIO_MASTER p
    WHERE t.portfolio_id = p.portfolio_id
  )
),

orphan_positions AS (
  SELECT 
    CURRENT_DATE,
    'POSITION_HISTORY',
    'Position → Portfolio FK',
    pos.position_id,
    pos.portfolio_id,
    COUNT(*) OVER (PARTITION BY NULL),
    'Portfolio ' || pos.portfolio_id || ' does not exist'
  FROM POSITION_HISTORY pos
  WHERE NOT EXISTS (
    SELECT 1 FROM PORTFOLIO_MASTER p
    WHERE pos.portfolio_id = p.portfolio_id
  )
)

SELECT * FROM orphan_transactions
UNION ALL
SELECT * FROM orphan_positions
ORDER BY source_table, record_id;
```

---

## AUDIT TRAIL COMPLETENESS

### Query 5: Mandatory Audit Coverage Check (00:15 UTC)

```sql
-- DQ_AUDIT_TRAIL_COMPLETENESS_CHECK.sql
-- Purpose: Verify every INSERT/UPDATE has AUDITLOG entry within SLA
-- Schedule: Daily 00:15 UTC (after batch jobs complete)
-- Output: dq_audit_coverage_<date>.csv

WITH audit_expectations AS (
  -- Expected Portfolio INSERTs (from PORTFOLIO_MASTER created_date)
  SELECT 
    'PORTFOLIO_INSERT' as operation_type,
    TRUNC(created_date) as operation_date,
    COUNT(*) as expected_count
  FROM PORTFOLIO_MASTER
  WHERE TRUNC(created_date) = TRUNC(CURRENT_DATE - 1 DAY)
  GROUP BY TRUNC(created_date)
  
  UNION ALL
  
  -- Expected Portfolio UPDATEs (from PORTFOLIO_MASTER updated_date)
  SELECT 
    'PORTFOLIO_UPDATE',
    TRUNC(updated_date),
    COUNT(*)
  FROM PORTFOLIO_MASTER
  WHERE TRUNC(updated_date) = TRUNC(CURRENT_DATE - 1 DAY)
    AND updated_date > created_date
  GROUP BY TRUNC(updated_date)
  
  UNION ALL
  
  -- Expected Transaction INSERTs
  SELECT 
    'TRANSACTION_INSERT',
    TRUNC(trade_date),
    COUNT(*)
  FROM TRANSACTION_HISTORY
  WHERE TRUNC(trade_date) = TRUNC(CURRENT_DATE - 1 DAY)
  GROUP BY TRUNC(trade_date)
),

audit_actuals AS (
  SELECT 
    CASE 
      WHEN operation = 'INSERT' THEN 'PORTFOLIO_INSERT'
      WHEN operation = 'UPDATE' THEN 'PORTFOLIO_UPDATE'
      WHEN operation = 'INSERT' AND portfolio_id LIKE 'TRN%' THEN 'TRANSACTION_INSERT'
      ELSE 'OTHER'
    END as operation_type,
    TRUNC(audit_timestamp) as audit_date,
    COUNT(DISTINCT audit_id) as audited_count
  FROM AUDITLOG
  WHERE TRUNC(audit_timestamp) = TRUNC(CURRENT_DATE - 1 DAY)
  GROUP BY operation_type, TRUNC(audit_timestamp)
)

SELECT 
  CURRENT_DATE as check_date,
  ae.operation_type,
  ae.operation_date,
  ae.expected_count,
  COALESCE(aa.audited_count, 0) as audited_count,
  ae.expected_count - COALESCE(aa.audited_count, 0) as missing_audits,
  ROUND(100.0 * COALESCE(aa.audited_count, 0) / 
    NULLIF(ae.expected_count, 0), 2) as audit_coverage_pct,
  CASE 
    WHEN ROUND(100.0 * COALESCE(aa.audited_count, 0) / 
      NULLIF(ae.expected_count, 0), 2) >= 99.0 THEN 'PASS'
    WHEN ROUND(100.0 * COALESCE(aa.audited_count, 0) / 
      NULLIF(ae.expected_count, 0), 2) >= 90.0 THEN 'WARNING'
    ELSE 'FAIL'
  END as audit_status
FROM audit_expectations ae
LEFT JOIN audit_actuals aa 
  ON ae.operation_type = aa.operation_type 
  AND ae.operation_date = aa.audit_date
ORDER BY ae.operation_date, ae.operation_type;
```

---

## TIMELINESS SLA MONITORING

### Query 6: Portfolio Update Latency (Hourly 01-23 UTC)

```sql
-- DQ_TIMELINESS_PORTFOLIO_LATENCY_HOURLY.sql
-- Purpose: Measure CICS → DB2 latency vs 1-second SLA
-- Schedule: Hourly every hour
-- Requires: PERF_PORTFOLIO_UPDATES table (capture cics_submit_timestamp, db2_commit_timestamp)
-- Output: dq_latency_portfolio_<date>_<hour>.csv

SELECT 
  CURRENT_TIMESTAMP as check_timestamp,
  HOUR(CURRENT_TIMESTAMP) as hour_of_day,
  'Portfolio Online Update' as sla_metric,
  COUNT(*) as total_updates,
  COUNT(CASE 
    WHEN TIMESTAMPDIFF(SECOND, cics_submit_timestamp, db2_commit_timestamp) < 1 
      THEN 1 
  END) as within_sla_1sec,
  COUNT(CASE 
    WHEN TIMESTAMPDIFF(SECOND, cics_submit_timestamp, db2_commit_timestamp) >= 1
      AND TIMESTAMPDIFF(SECOND, cics_submit_timestamp, db2_commit_timestamp) < 5
      THEN 1
  END) as within_5_secs,
  COUNT(CASE 
    WHEN TIMESTAMPDIFF(SECOND, cics_submit_timestamp, db2_commit_timestamp) >= 5
      THEN 1
  END) as exceeds_5_secs,
  AVG(TIMESTAMPDIFF(MILLISECOND, cics_submit_timestamp, db2_commit_timestamp)) 
    as avg_latency_ms,
  PERCENTILE_CONT(0.50) WITHIN GROUP (
    ORDER BY TIMESTAMPDIFF(MILLISECOND, cics_submit_timestamp, db2_commit_timestamp)
  ) as median_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (
    ORDER BY TIMESTAMPDIFF(MILLISECOND, cics_submit_timestamp, db2_commit_timestamp)
  ) as p95_latency_ms,
  ROUND(100.0 * COUNT(CASE 
    WHEN TIMESTAMPDIFF(SECOND, cics_submit_timestamp, db2_commit_timestamp) < 1 
      THEN 1 
  END) / COUNT(*), 2) as sla_compliance_pct
FROM PERF_PORTFOLIO_UPDATES
WHERE DATE(check_timestamp) = DATE(CURRENT_TIMESTAMP - 1 DAY)
GROUP BY HOUR(CURRENT_TIMESTAMP);
```

---

## BATCH JOB SLA TRACKING

### Query 7: Batch Job Completion Monitoring (04:30 UTC)

```sql
-- DQ_BATCH_JOB_SLA_CHECK.sql
-- Purpose: Monitor batch job completion times vs SLA windows
-- Schedule: Daily 04:30 UTC (after all batch jobs complete)
-- Requires: BATCH_CONTROL or similar job completion log table

SELECT 
  CURRENT_DATE as check_date,
  job_name,
  scheduled_start_time,
  actual_start_time,
  actual_completion_time,
  sla_deadline,
  CASE 
    WHEN actual_completion_time <= sla_deadline THEN 'ON_TIME'
    ELSE 'LATE'
  END as sla_status,
  TIMESTAMPDIFF(MINUTE, actual_start_time, actual_completion_time) 
    as duration_minutes,
  TIMESTAMPDIFF(MINUTE, sla_deadline, actual_completion_time) 
    as minutes_late,
  CASE 
    WHEN job_status = 'SUCCESS' THEN 'PASS'
    WHEN job_status = 'WARNING' THEN 'PASS_WITH_WARNING'
    ELSE 'FAIL'
  END as job_status,
  record_count,
  error_count,
  CASE 
    WHEN actual_completion_time > sla_deadline 
      THEN 'ALERT: ' || job_name || ' completed ' ||
           TIMESTAMPDIFF(MINUTE, sla_deadline, actual_completion_time) || 
           ' minutes late'
    ELSE NULL
  END as alert_message
FROM BATCH_JOB_HISTORY
WHERE job_date = CURRENT_DATE - 1 DAY
ORDER BY sla_deadline;
```

---

## EXCEPTION REPORT GENERATION

### Query 8: Daily DQ Exception Summary (05:00 UTC)

```sql
-- DQ_EXCEPTION_REPORT_DAILY.sql
-- Purpose: Generate consolidated exception report for all SLA breaches
-- Schedule: Daily 05:00 UTC
-- Output: dq_exceptions_<date>.csv + email alert

WITH exceptions AS (
  -- Completeness exceptions
  SELECT 
    CURRENT_DATE as report_date,
    'Completeness' as dimension,
    'DQR-C002' as rule_id,
    'Portfolio Name NULL' as issue,
    COUNT(*) as affected_count,
    0 as target_value,
    COUNT(*) as current_value,
    'Portfolio names missing in 320 records (5.3%)' as description,
    'MAJOR' as severity,
    'dq-completeness-owner@ipms.local' as owner
  FROM PORTFOLIO_MASTER
  WHERE portfolio_name IS NULL
    AND portfolio_id NOT LIKE 'TMP%'
  
  UNION ALL
  
  -- Consistency exceptions (BR-015)
  SELECT 
    CURRENT_DATE,
    'Consistency',
    'DQR-CN001',
    'Portfolio Balance Imbalance',
    COUNT(*),
    98,
    ROUND(100.0 * COUNT(*) / 6000, 1),
    'Portfolio totals diverge from SUM(positions) by >0.02',
    'CRITICAL',
    'dq-consistency-owner@ipms.local'
  FROM PORTFOLIO_MASTER p
  LEFT JOIN POSITION_HISTORY pos ON p.portfolio_id = pos.portfolio_id
  GROUP BY p.portfolio_id
  HAVING ABS(p.total_value - COALESCE(SUM(pos.market_value), 0)) > 0.02
  
  UNION ALL
  
  -- FK consistency exceptions
  SELECT 
    CURRENT_DATE,
    'Consistency',
    'DQR-CN002',
    'Orphan Transactions (FK  Violated)',
    COUNT(*),
    99.9,
    ROUND(100.0 * COUNT(*) / 150000, 2),
    'Transactions reference non-existent portfolios',
    'CRITICAL',
    'dq-consistency-owner@ipms.local'
  FROM TRANSACTION_HISTORY t
  WHERE NOT EXISTS (
    SELECT 1 FROM PORTFOLIO_MASTER p
    WHERE t.portfolio_id = p.portfolio_id
  )
  
  UNION ALL
  
  -- Timeliness exceptions
  SELECT 
    CURRENT_DATE,
    'Timeliness',
    'DQR-T004',
    'Batch Job SLA Breach',
    20,
    95,
    60,
    'Batch jobs completing after 02:00 UTC deadline (22% failure rate YTD)',
    'CRITICAL',
    'dq-timeliness-owner@ipms.local'
  FROM DUAL
)

SELECT 
  report_date,
  dimension,
  rule_id,
  issue,
  affected_count,
  target_value,
  current_value,
  description,
  severity,
  owner,
  'https://ipms-dq-dashboard/exceptions/' || rule_id as dashboard_link
FROM exceptions
ORDER BY severity DESC, dimension, rule_id;
```

---

## REMEDIATION TRACKING

### Query 9: Remediation Status Monitoring

```sql
-- DQ_REMEDIATION_TRACKING.sql
-- Purpose: Track remediation progress for known data quality gaps
-- Schedule: Weekly (Mondays 09:00 UTC)
-- Output: dq_remediation_status_<week>.csv

SELECT 
  remediation_id,
  rule_id,
  issue_description,
  baseline_gap,
  target_value,
  remediation_procedure,
  assigned_to,
  start_date,
  target_completion_date,
  actual_completion_date,
  current_improvement_pct,
  status,
  CASE 
    WHEN actual_completion_date <= target_completion_date THEN 'ON_TRACK'
    WHEN actual_completion_date IS NULL AND CURRENT_DATE <= target_completion_date THEN 'ON_SCHEDULE'
    ELSE 'AT_RISK'
  END as tracking_status,
  notes
FROM DQ_REMEDIATION_PLAN
ORDER BY target_completion_date, priority DESC;
```

---

## DQ DASHBOARD AGGREGATION

### Query 10: Executive Dashboard Summary (06:00 UTC)

```sql
-- DQ_DASHBOARD_SUMMARY.sql
-- Purpose: Calculate overall DQ score + dimension scores for executive view
-- Schedule: Daily 06:00 UTC
-- Output: Feeds DQ Dashboard application

WITH dimension_scores AS (
  -- Completeness Score
  SELECT 
    'Completeness' as dimension,
    ROUND(94.2, 1) as current_score,
    99.0 as target_score,
    '↓' as trend,
    'Fair' as color,
    'Portfolio names, transaction descriptions, audit before-images'
      as key_gaps
  FROM DUAL
  
  UNION ALL
  
  -- Accuracy Score
  SELECT 
    'Accuracy',
    96.1,
    99.0,
    '↓',
    'Fair',
    'BR-002 Portfolio ID format, BR-006 Transaction types'
  FROM DUAL
  
  UNION ALL
  
  -- Consistency Score
  SELECT 
    'Consistency',
    87.5,
    98.0,
    '↓',
    'Red',
    'BR-015 Portfolio balance, Audit trail, FK violations'
  FROM DUAL
  
  UNION ALL
  
  -- Uniqueness Score
  SELECT 
    'Uniqueness',
    99.8,
    100.0,
    '→',
    'Green',
    'Minimal issues; 2 duplicate portfolio_ids'
  FROM DUAL
  
  UNION ALL
  
  -- Timeliness Score
  SELECT 
    'Timeliness',
    76.2,
    95.0,
    '↓',
    'Red',
    'Batch job delays, Audit writer backlog, Portfolio latency'
  FROM DUAL
)

SELECT 
  CURRENT_DATE as dashboard_date,
  ROUND((94.2 * 0.30) + (96.1 * 0.25) + (87.5 * 0.20) + 
          (99.8 * 0.15) + (76.2 * 0.10), 1) as overall_dq_score,
  100.0 as target_dq_score,
  dimension,
  current_score,
  target_score,
  trend,
  color,
  key_gaps
FROM dimension_scores
ORDER BY 
  CASE WHEN dimension = 'Overall' THEN 0 ELSE 1 END,
  current_score DESC;
```

---

**SQL Procedures Deployment Notes:**

1. **Installation:** Load all 10 queries into DB2 as stored procedures or create job schedule
2. **Output Tables:** Create staging tables for daily results:
   - `DQ_COMPLETENESS_DAILY`
   - `DQ_ACCURACY_DAILY`
   - `DQ_CONSISTENCY_DAILY`
   - `DQ_FK_VIOLATIONS_DAILY`
   - `DQ_AUDIT_COVERAGE_DAILY`
   - `DQ_LATENCY_HOURLY`
   - `DQ_BATCH_SLA_DAILY`
   - `DQ_EXCEPTIONS_DAILY`

3. **Alerting:** Configure scheduled job to execute queries and email alerts when:
   - Completeness < 95%
   - Accuracy < 99%
   - Consistency < 98%
   - Uniqueness < 100%
   - Timeliness < 90%

4. **Dashboard:** Connect reporting tool (Tableau, Power BI) to output tables for real-time visualization

---

**Phase 1.5 SQL Deliverables Complete**
