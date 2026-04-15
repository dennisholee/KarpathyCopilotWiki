---
title: "Phase 1.5: Quick Reference & Navigation Guide"
tags:
  - ingested
  - source-md
  - group-raw-root
links:
  - "/raw/PHASE_1_5_QUICK_REFERENCE.md"
created: 2026-04-15T17:11:14.615Z
source: "/raw/PHASE_1_5_QUICK_REFERENCE.md"
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
  - /raw/PHASE_1_5_SQL_PROCEDURES.md
  - /raw/PHASE_1_6_CHANGE_MANAGEMENT.md
  - /raw/PHASE_1_6_COMPLETE_DELIVERABLES_INDEX.md
  - /raw/PHASE_1_6_GOVERNANCE_POLICIES_DETAILED.md
  - /raw/PHASE_1_6_RACI_ORGANIZATION.md
  - /raw/PHASE_1_6_SEMANTIC_GOVERNANCE_CAPSTONE.md
  - /raw/PHASE_2_IMPLEMENTATION_KICKOFF.md

## Source Content
# Phase 1.5: Quick Reference & Navigation Guide

**Phase 1.5: Data Quality Dimension Analysis - COMPLETE**

**Execution Date:** 11 April 2026  
**Status:** ✅ ALL DELIVERABLES COMPLETE & DELIVERED  
**Quality Score:** 87.3 / 100  
**Total Pages:** 4,000+ words across 4 documents  
**Rules Formalized:** 57 DQ rules across 5 dimensions  
**SQL Procedures:** 10+ automated daily checks  

---

## QUICK LINKS TO DELIVERABLES

### 📄 Main Deliverables (File Locations)

| Document | Purpose | Pages | Key Metrics |
|----------|---------|-------|-------------|
| [PHASE_1_5_DATA_QUALITY_DIMENSION_ANALYSIS.md](./PHASE_1_5_DATA_QUALITY_DIMENSION_ANALYSIS.md) | Executive assessment + baseline metrics | 65+ | 87.3% overall score |
| [PHASE_1_5_DQ_RULES_REGISTRY.md](./PHASE_1_5_DQ_RULES_REGISTRY.md) | 57 formal DQ rule specifications | 45+ | 12 C-rules, 14 A-rules, 16 CN-rules, 8 U-rules, 7 T-rules |
| [PHASE_1_5_SQL_PROCEDURES.md](./PHASE_1_5_SQL_PROCEDURES.md) | 10+ production SQL queries | 30+ | Daily + hourly automated checks |
| [PHASE_1_5_QUICK_REFERENCE.md](./PHASE_1_5_QUICK_REFERENCE.md) | This document | 5+ | Navigation + summaries |

---

## EXECUTIVE DASHBOARD (ONE-PAGE VIEW)

```
╔═══════════════════════════════════════════════════════════════════════╗
║               IPMS DATA QUALITY DASHBOARD - SUMMARY                   ║
║                        11 April 2026                                  ║
╚═══════════════════════════════════════════════════════════════════════╝

OVERALL DQ SCORE:  87.3 / 100  🟡 AT RISK       Status: INCOMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DIMENSION SCORECARD:
┌──────────────────┬──────────────────┬────────────────┬─────────────┐
│ Dimension        │ Current / Target │ Gap            │ SLA Status  │
├──────────────────┼──────────────────┼────────────────┼─────────────┤
│ ✓ Completeness   │ 94.2%  / 99.0%   │ -4.8%          │ 🟡 Fair     │
│ ✓ Accuracy       │ 96.1%  / 99.0%   │ -2.9%          │ 🟡 Fair     │
│ ✗ Consistency    │ 87.5%  / 98.0%   │ -10.5%         │ 🔴 CRITICAL │
│ ✓ Uniqueness     │ 99.8%  / 100.0%  │ -0.2%          │ 🟢 Healthy  │
│ ✗ Timeliness     │ 76.2%  / 95.0%   │ -18.8%         │ 🔴 CRITICAL │
└──────────────────┴──────────────────┴────────────────┴─────────────┘

TOP 5 CRITICAL GAPS:

🔴 P1: Timeliness (Batch job delays) ................ -18.8% gap / ~600 events/mo
🔴 P1: Consistency (Portfolio balance BR-015) ....... -10.5% gap / 735 portfolios
🔴 P1: Audit trail completeness ..................... -17.2% gap / 12.5K events/mo
🟡 P2: Completeness (Description/names) ............. -3.3% gap / 332 records
🟡 P2: Accuracy (Transaction type enum) ............. -0.3% gap / 420 records

REMEDIATIONS IN PROGRESS:

[████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 24%
    Week 1: Portfolio balance, Batch job optimization
    Week 2-3: Audit writer redesign, FK constraints
    Week 4+: Enum validation enforcement

SLA BREACH FREQUENCY (Last 30 Days):

    Completeness: 15 days of breaches
    Accuracy: 28 days of breaches
    Consistency: 30 days of breaches (all month!)
    Uniqueness: 1 day of breaches
    Timeliness: 24 days of breaches

Phase 1.5 Readiness: 80% READY (awaiting Phase A deployment)
```

---

## CRITICAL ISSUES SUMMARY TABLE

| Severity | Issue | Gap | Records | Root Cause | Timeline | Owner |
|----------|-------|-----|---------|-----------|----------|--------|
| 🔴 P1 | Timeliness SLA (batch jobs) | -35% | 600/mo | RTNANA perf, no indexes | W1-W2 | Ops |
| 🔴 P1 | Portfolio balance (BR-015) | -10.5% | 735 | Dividend logic, async updates | W1-W2 | DBA |
| 🔴 P1 | Audit trail (81.8% coverage) | -17.2% | 12.5K/mo | Single-threaded writer | W2-W3 | Arch |
| 🟡 P2 | FK violations (orphans) | -0.7% | 1,240 | Soft-delete cascade | W2 | DBA |
| 🟡 P2 | Portfolio ID format (BR-002) | -0.2% | 18 | No validation at entry | W3 | Dev |
| 🟡 P2 | Transaction type enum (BR-006) | -0.3% | 420 | ETL mapping missing | W3-W4 | ETL |

---

## KEY FINDINGS BY DIMENSION

### 1. COMPLETENESS (94.2% vs 99% target)

**Good News:** PK/FK fields nearly perfect (99.99% filled)  
**Problem Areas:**
- Portfolio names: 320 NULLs (5.3%) ← backfill from COBOL archive
- Transaction descriptions: 12K NULLs (8%) ← new ETL missing mapping
- Position cost basis: 2.9K NULLs (8.3%) ← optional per business rules

**Remediation:** Week 1-2 | Effort: 3 hours

---

### 2. ACCURACY (96.1% vs 99% target)

**Good News:** Amount ranges perfectly valid (99.994%)  
**Problem Areas:**
- BR-006 (Transaction types): 420 invalid (0.3%) ← "BU-SL" typos, "UNPROCESSED"
- BR-002 (Portfolio IDs): 18 invalid format (0.3%) ← "PORT00001", "PORT-1234"
- BR-008 (Currencies): 68 invalid (0.045%) ← "AUD", "CNY", "INR"

**Remediation:** Week 3-4 | Effort: 5 hours

---

### 3. CONSISTENCY (87.5% vs 98% target) ⚠️ WORST DIMENSION

**Critical Issues:**
- BR-015 (Portfolio balance): 735 imbalanced (12.25%) ← dividend logic breaks
- FK violations: 1,240 orphan transactions (0.83%) ← no cascade delete
- Audit trail: 12.5K missing entries (18.2% ops) ← async writer backlog

**Remediation:** Week 1-3 | Effort: 12 hours (highest effort)

---

### 4. UNIQUENESS (99.8% vs 100% target)

**Status: EXCELLENT** → Only 2 duplicate portfolio_ids (test data)  
**Remediatio:** 1 hour (delete duplicates, enable constraint)

---

### 5. TIMELINESS (76.2% vs 95% target) ⚠️ SECOND-WORST DIMENSION

**Critical Issues:**
- Batch jobs: 40% late in March (12 of 30 days) ← RTNANA 15% data growth/mo
- Audit writes: 65% exceed 100ms SLA ← queue backlog during EoD (17:00-20:00)
- Portfolio updates: 5% exceed 1-second SLA ← DB2 buffer stalls peak hours

**Remediation:** Week 1-3 | Effort: 10 hours

---

## MEASUREMENT FRAMEWORK

### Daily Automated Checks (23:00-05:00 UTC)

1. **23:00 UTC** → DQ_COMPLETENESS_CHECK_DAILY.sql
2. **23:15 UTC** → DQ_ACCURACY_RULES_CHECK_DAILY.sql
3. **23:30 UTC** → DQ_CONSISTENCY_BR015_CHECK_DAILY.sql
4. **23:45 UTC** → DQ_FK_CONSISTENCY_CHECK_DAILY.sql
5. **00:15 UTC** → DQ_AUDIT_TRAIL_COMPLETENESS_CHECK.sql
6. **04:30 UTC** → DQ_BATCH_JOB_SLA_CHECK.sql
7. **05:00 UTC** → DQ_EXCEPTION_REPORT_DAILY.sql + email alerts
8. **06:00 UTC** → DQ_DASHBOARD_SUMMARY (feeds dashboard)

### Hourly Monitoring (01-23 UTC)

- **Hourly** → DQ_TIMELINESS_PORTFOLIO_LATENCY_HOURLY.sql (track p95 latency)

---

## GOVERNANCE STRUCTURE

**Ownership Assignments:**

| Dimension | Owner | Escalation | Response SLA |
|-----------|-------|-----------|--------------|
| Completeness | Data Steward (Portfolio team) | DQ Manager | <24h |
| Accuracy | Business Rules Owner (Risk team) | Chief Risk Officer | <12h |
| Consistency | Database Admin | CIO | <8h |
| Uniqueness | Data Architect | CTO | <4h |
| Timeliness | Performance Lead | VP Operations | <4h |

**Escalation Rules:**
- Green (95-100%): Routine monitoring
- Yellow (85-95%): Team investigates; plan due 5 days
- Red (<85%): Committee meeting; emergency team engaged; daily updates

---

## REMEDIATION ROADMAP (Q2 2026)

### WEEK 1 (14-18 April)
- [ ] Deploy BR-015 validation trigger (portfolio balance)
- [ ] Backfill portfolio names (320 records)
- [ ] Add DB2 indexes to TRANSACTION_HISTORY
- [ ] Emergency: Analyze batch job bottleneck

### WEEK 2-3 (21-30 April)
- [ ] Redesign async audit writer (multi-threaded)
- [ ] Enable Foreign Key constraints
- [ ] Fix Position UPDATE audit logging
- [ ] Investigate transaction module audit gap

### WEEK 4+ (5+ May)
- [ ] Deploy BR-006 transaction type enum validation
- [ ] Deploy BR-002 portfolio ID format validation
- [ ] BR-008 currency enum enforcement
- [ ] Complete backfill of orphan portraits

---

## FIELD-LEVEL QUALITY HEATMAP

```
PORTFOLIO_MASTER (12 columns):
  portfolio_id        ✅ Excellent (99.97%)
  portfolio_name      ⚠️  Problem (94.7%) ← Needs backfill
  portfolio_status    ✅ Excellent (99.97%)
  account_number      ✅ Good (98.7%)
  total_value         ✅ Excellent (99.93%)
  market_value        ✅ Excellent (99.8%)
  created_date      

## Sources
- [`/raw/PHASE_1_5_QUICK_REFERENCE.md`](/raw/PHASE_1_5_QUICK_REFERENCE.md)