---
title: "PHASE 1.6 DETAILED DATA GOVERNANCE POLICIES"
tags:
  - ingested
  - source-md
  - group-raw-root
links:
  - "/raw/PHASE_1_6_GOVERNANCE_POLICIES_DETAILED.md"
created: 2026-04-15T17:11:14.644Z
source: "/raw/PHASE_1_6_GOVERNANCE_POLICIES_DETAILED.md"
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
  - /raw/PHASE_1_5_SQL_PROCEDURES.md
  - /raw/PHASE_1_6_CHANGE_MANAGEMENT.md
  - /raw/PHASE_1_6_COMPLETE_DELIVERABLES_INDEX.md
  - /raw/PHASE_1_6_RACI_ORGANIZATION.md
  - /raw/PHASE_1_6_SEMANTIC_GOVERNANCE_CAPSTONE.md
  - /raw/PHASE_2_IMPLEMENTATION_KICKOFF.md

## Source Content
# PHASE 1.6 DETAILED DATA GOVERNANCE POLICIES
## IPMS Investment Portfolio Management System

**Document Version:** 1.0  
**Effective Date:** 1 May 2026  
**Classification:** INTERNAL  
**Owner:** Data Governance Manager

---

## TABLE OF CONTENTS

1. [DGP-001: Data Quality Policy](DGP-001)
2. [DGP-002: Data Lineage & Provenance Policy](DGP-002)
3. [DGP-003: Business Rules Governance Policy](DGP-003)
4. [DGP-004: Metadata Management Policy](DGP-004)
5. [DGP-005: Data Classification Policy](DGP-005)
6. [DGP-006: Data Stewardship Policy](DGP-006)
7. [DGP-007: Compliance & Audit Policy](DGP-007)

---

## POLICY DGP-001: DATA QUALITY POLICY (COMPLETE)

[Full policy document - see main capstone report Section 2, Policy #1]

### Policy DGP-001 Appendix: Quality Target Measurement Procedures

**Completeness Dimension — Measurement Procedure:**
- SQL Query: Count NON-NULL values for each required field / Total records × 100
- Applied to: Portfolio Names, Transaction Descriptions, Position Cost Basis
- Frequency: Daily 4:00 AM UTC
- Alert threshold: <94% (YELLOW), <92% (RED)
- Remediation owner: Domain Steward + Data Quality Manager
- Baseline (Jan-Mar 2026): 94.2%
- Q2 Target: 97%
- Final Target: 99%

**Accuracy Dimension — Measurement Procedure:**
- SQL Query: Count constraint-compliant records / Total records × 100
- Business Rule Validation: BR-001 (FSM), BR-002 (ID format), BR-004 (amount range), BR-006 (type enum), BR-008 (currency)
- Frequency: Daily 4:00 AM UTC
- Alert threshold: <96% (YELLOW), <94% (RED)
- Remediation owner: Domain Steward + Data Quality Manager
- Baseline: 96.1%
- Q2 Target: 98%
- Final Target: 99%

**Consistency Dimension — Measurement Procedure:**
- Portfolio consistency: Portfolio.total_value = SUM(Position.position_value) ± tolerance (±0.02)
- FK consistency: All POSITION_MASTER.portfolio_id exist in PORTFOLIO_MASTER
- Audit consistency: All INSERT/UPDATE operations have corresponding audit entry
- Frequency: Daily 4:00 AM UTC
- Alert threshold: <88% (YELLOW), <85% (RED)
- Remediation owner: Domain Steward
- Baseline: 87.5%
- Q2 Target: 95%
- Final Target: 98%

**Uniqueness Dimension — Measurement Procedure:**
- Count records with duplicate portfolio ID, position ID, transaction ID
- Frequency: Daily 4:00 AM UTC
- Alert threshold: <99.5% (YELLOW), <99% (RED)
- Remediation owner: Database Administrator
- Baseline: 99.8%
- Q2 Target: 100%
- Final Target: 100%

**Timeliness Dimension — Measurement Procedure:**
- Portfolio-to-Position lag: Time from portfolio UPDATE to Position sync ≤30 minutes
- Batch completion: Reconciliation job completion ≤2 hours
- Audit write latency: Audit entry written ≤100ms after transaction
- Frequency: Continuous (real-time alerts)
- Alert threshold: >60 minutes lag (YELLOW), >2 hours lag (RED)
- Remediation owner: Database Administrator + CICS Operations
- Baseline: 76.2%
- Q2 Target: 90%
- Final Target: 95%

---

## POLICY DGP-002: DATA LINEAGE & PROVENANCE POLICY (COMPLETE)

[Full policy document - see main capstone report Section 2, Policy #2]

### Lineage Documentation Template

For each data flow, document using this template:

```
FLOW ID: F-001
Flow Name: Portfolio Inquiry → Portfolio Master Update
Direction: CICS INQSET → PORTFLIO copybook → PORTFOLIO_MASTER DB2 table
Primary Programs: PORTUPDT (COBOL), PTAR (CICS transaction)

Starting Point:
  - Agent: Portfolio Manager (CICS user)
  - System: CICS INQSET BMS map
  - Fields: Portfolio.ID, Portfolio.Status, Portfolio.Total.Value, Portfolio.Name

Transformation Steps:
  1. CICS PORTUPDT transaction validates portfolio change request
     - Validates Portfolio FSM state (BR-001)
     - Calculates total value from position values (BR-015)
     - Program: PORTUPDT (COBOL)
     - Copybook: PORTFLIO
     - Algorithm: SUM(POSITION.position_value) where POSITION.portfolio_id = PORTFLIO.portfolio_id

  2. DB2 PORTFOLIO_MASTER table UPDATE
     - Trigger: TR_BR_001_PORTFOLIO_FSM (validates state machine)
     - Trigger: TR_BR_004_AMOUNT_RANGE (validates amount ranges)
     - DB2 table: PORTFOLIO_MASTER

Ending Point:
  - System: DB2 PORTFOLIO_MASTER
  - Fields: portfolio_id, portfolio_status, portfolio_value, portfolio_name
  - Timestamp: UTC transaction timestamp

Field-Level Lineage Map:
  PORTFLIO.PORTFOLIO-ID → PORTFOLIO_MASTER.PORTFOLIO_ID (1:1)
  PORTFLIO.PORTFOLIO-NAME → PORTFOLIO_MASTER.PORTFOLIO_NAME (1:1)
  PORTFLIO.PORTFOLIO-STATUS → PORTFOLIO_MASTER.PORTFOLIO_STATUS (1:1, BR-001 validates valid transitions)
  PORTFLIO.PORTFOLIO-TOTAL → PORTFOLIO_MASTER.PORTFOLIO_VALUE (calculated: SUM(positions))

Audit Trail:
  - AUDITLOG entry created for each PORTFOLIO_MASTER.UPDATE
  - Timestamp, User ID, Before/After values captured
  - Linked to W3C PROV activity: prov:wasGeneratedBy TR_BR_001_PORTFOLIO_FSM

W3C PROV RDF/XML:
  <prov:Entity rdf:about="http://ipms.internal/entity/portfolio/P123">
    <prov:wasDerivedFrom rdf:resource="http://ipms.internal/entity/position/A1"/>
    <prov:wasGeneratedBy rdf:resource="http://ipms.internal/activity/portupdt_001"/>
    <prov:wasAttributedTo rdf:resource="http://ipms.internal/agent/portfolio_manager"/>
    <prov:generatedAtTime rdf:datatype="http://www.w3.org/2001/XMLSchema#dateTime">2026-04-11T15:30:45Z</prov:generatedAtTime>
  </prov:Entity>

Governance:
  - Steward: Portfolio Steward
  - Review frequency: Annual (April governance review)
  - Change notification: Any program changes to PORTUPDT or PORTFLIO require lineage update within 48 hours
```

---

## POLICY DGP-003: BUSINESS RULES GOVERNANCE POLICY (COMPLETE)

[Full policy document - see main capstone report Section 2, Policy #3]

### Rule Change Request Template

```
BUSINESS RULE CHANGE REQUEST

Request ID: BRCR-001 (auto-generated)
Request Date: [Date]
Requester Name: [Portfolio Manager]
Requester Email: [email]
Requester Role: [Position]

BUSINESS JUSTIFICATION
Current Rule: BR-004 Amount Range (±0.02 tolerance)
Proposed Change: Increase tolerance to ±0.05 (allow wider variance)
Business Reason: Portfolio managers report tolerance too tight for corporate actions (stock splits)
Expected Impact: Reduces data quality exception escalations by ~20%
Business Owner Approval: [Portfolio Director signature/approval ID]

PROPOSED RULE SPECIFICATION
Rule ID: BR-004 (modified)
Title: Amount Range Validation (±0.05 tolerance)
Existing Logic: ABS(Portfolio.total_value - expected_value) ≤ 0.02
Proposed Logic: ABS(Portfolio.total_value - expected_value) ≤ 0.05

AFFECTED SYSTEMS & DEPENDENCIES
Programs affected: PORTUPDT, POSVAL, PRCSEQ (3 programs)
DB2 triggers: TR_BR_004_AMOUNT_RANGE (1 trigger)
Data flows: F-001 (Portfolio inquiry), F-003 (Position valuation)
Business processes: Portfolio review, valuation reconciliation
Estimated violation reduction: 20% (from 0.3% to 0.24% of transactions)

IMPLEMENTATION REQUIREMENTS
Database changes: Modify CHECK constraint on PORTFOLIO_MASTER
COBOL changes: Modify BR-004-VALIDATE COPY module tolerance parameter
Testing: 54 existing test scenarios must re-validate; 10 new edge case scenarios added
UAT: 2 weeks (portfolio managers test with wider tolerance)

ESTIMATED EFFORT
Analysis & design: 8 hours (DBA + COBOL architect)
Code changes: 16 hours (developers + DBA)
Testing: 24 hours (QA + business users)
Total effort: 48 hours (6 person-days)
Timeline: 15 calendar days (DEV 5 days → TEST 3 days → STAGING 3 days → PROD 4 days)

APPROVAL WORKFLOW
Review authorities:
  [ ] Database Administrator: Technical feasibility review
  [ ] COBOL Architect: Integration impact assessment
  [ ] Portfolio Steward: Business impact & test coverage review
  [ ] Data Governance Manager: Policy compliance & cross-domain impact review
  [ ] APPROVED: [CDO signature if major change]

TESTING SIGN-OFF
[ ] Regression testing: All 54 existing test scenarios pass
[ ] New test scenarios: 10 edge cases pass (tolerance boundary tests)
[ ] UAT sign-off: Portfolio Manager group UAT passed
[ ] Production readiness: Deployment checklist completed

DEPLOY

## Sources
- [`/raw/PHASE_1_6_GOVERNANCE_POLICIES_DETAILED.md`](/raw/PHASE_1_6_GOVERNANCE_POLICIES_DETAILED.md)