---
title: "PHASE 1.6 DETAILED DATA GOVERNANCE POLICIES"
modified: 2026-04-14T16:01:11.104Z
---

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

DEPLOYMENT PLAN
Target promotion date: [30 May 2026]
Deployment window: Saturday 11 PM - 6 AM (minimal trading impact)
Rollback plan: Revert CHECK constraint to ±0.02 tolerance (5-minute rollback)
Stakeholder notification: Sent to Portfolio Managers 1 day before deployment

POST-IMPLEMENTATION MONITORING
Monitoring period: 30 days
Metrics tracked:
  - BR-004 violation rate (expected 0.24% initial, trending toward 0.10%)
  - Portfolio reconciliation exceptions (expected decrease)
  - User escalations (expected decrease)
  - Data quality exceptions (expected ~20% reduction)
Success criteria:
  - BR-004 violations <0.3% (no increase)
  - No unexpected data quality degradation
  - User satisfaction maintained/improved
Review date: [30 June 2026]

AUDIT TRAIL
Submitted by: [Name, Date]
Approved by: [Database Admin, Date]
Approved by: [COBOL Architect, Date]
Approved by: [Portfolio Steward, Date]
Approved by: [DG Manager, Date]
Deployed by: [DBA, Date]
Verified by: [QA, Date]
```

---

## POLICY DGP-004: METADATA MANAGEMENT POLICY (COMPLETE)

[Full policy document - see main capstone report Section 2, Policy #4]

### Metadata Element Specification

**Business Term Metadata (SKOS):**
```
Term ID: PORTFLIO-STATUS
Term Name: Portfolio Status
Definition: Current state of portfolio lifecycle (Pending, Active, Closed, Suspended)
Synonyms: Portfolio State, Portfolio State Code, Portfolio Condition
Related Terms: Portfolio FSM, Transaction Status, Account Status
Data Steward: Portfolio Steward
Related Entities: Portfolio class (OWL)
First Defined: Phase 1.2.1 (2026-04)
Last Reviewed: 2026-04-11
Associated Rules: BR-001 (Portfolio State Machine)
Example Values: "Pending", "Active", "Closed", "Suspended"
SKOS Concept: <skos:Concept rdf:about="http://ipms.internal/glossary/PORTFLIO-STATUS">
              <skos:prefLabel>Portfolio Status</skos:prefLabel>
              <skos:definition>Current state of portfolio lifecycle...</skos:definition>
              <skos:altLabel>Portfolio State</skos:altLabel>
              <skos:scopeNote>Controlled vocabulary: 4 valid values</skos:scopeNote>
              </skos:Concept>
```

**OWL Class Metadata:**
```
Class ID: Portfolio
URI: http://ipms.internal/ontology/IPMS#Portfolio
Definition: Investment portfolio holding multiple positions (stocks, bonds, derivatives)
Business Purpose: Track investor portfolio composition, valuation, performance
Attributes: 25 data properties (portfolio_id, portfolio_name, portfolio_status, etc.)
Relationships: 
  - hasPosition (1:Many to Position class)
  - heldBy (1:1 to Party class)
  - managedBy (1:1 to Party class for portfolio manager)
Cardinality:
  - Each Portfolio must have ≥1 Position
  - Each Portfolio has exactly 1 Portfolio Manager
  - Each Position belongs to exactly 1 Portfolio
Constraints: OWL axioms derived from BR-001–BR-015:
  - BR-001 (Portfolio FSM): portfolio_status ∈ {Pending, Active, Closed, Suspended}
  - BR-004 (Amount Range): ABS(portfolio.value - SUM(positions.value)) ≤ 0.02
  - BR-015 (Consistency): portfolio.value = SUM(positions. value)  ± 0.02
Versioning: Version 1.0 (Phase 1.2.2), Last updated 2026-04-11
Deprecated properties: None
```

**Field Mapping Metadata:**
```
Field ID: PRTFLO-01-001
COBOL Location: PORTFLIO copybook, Level 01 PORTFOLIO-MASTER group, data item PORTFOLIO-ID
COBOL Picture: PIC 9(4) (numeric 4-digit)
COBOL Length: 4 bytes
DB2 Target: PORTFOLIO_MASTER table, column PORTFOLIO_ID
DB2 Type: INTEGER or DECIMAL(4,0)
DB2 Constraints: PRIMARY KEY, NOT NULL
Mapping Type: Direct 1:1 mapping
Precision Loss: None
Domain Constraints: 1001–9999 (valid portfolio ID range)
DQ Rules Applied:
  - DQ-COMPLETENESS-001: PORTFOLIO_ID NOT NULL (100% coverage required)
  - DQ-ACCURACY-002: PORTFOLIO_ID ∈ PORTFOLIO_ID_RANGE (1001–9999)
  - DQ-UNIQUENESS-001: PORTFOLIO_ID unique in PORTFOLIO_MASTER
Business Justification: Portfolio ID uniquely identifies portfolio across IPMS
Last Reviewed: 2026-04-11 (Phase 1.2.3 completion)
Steward Approval: [Portfolio Steward signature]
Version: 1.0
```

---

## POLICY DGP-005: DATA CLASSIFICATION POLICY (COMPLETE)

[Full policy document - see main capstone report Section 2, Policy #5]

### Classification Assignment by Field

| Field | Copybook | Table Column | Classification | Justification | Access Control |
|---|---|---|---|---|---|
| PORTFOLIO-ID | PORTFLIO | PORTFOLIO_MASTER.PORTFOLIO_ID | CONFIDENTIAL (T3) | Client portfolio identifier | RBAC: Portfolio team |
| PORTFOLIO-NAME | PORTFLIO | PORTFOLIO_MASTER.PORTFOLIO_NAME | INTERNAL (T2) | Public portfolio name | Unrestricted read |
| PORTFOLIO-VALUE | PORTFLIO | PORTFOLIO_MASTER.PORTFOLIO_VALUE | CONFIDENTIAL (T3) | Financial portfolio valuation | RBAC: Finance team |
| POSITION-ACCOUNT-NBR | POSREC | POSITION_MASTER.ACCOUNT_NUMBER | RESTRICTED (T4) | Client account number (PII) | Explicit approval required |
| POSITION-COST-BASIS | POSREC | POSITION_MASTER.COST_BASIS | CONFIDENTIAL (T3) | Historical cost tracking | RBAC: Portfolio managers |
| TRANSACTION-USER-ID | TRNREC | TRANSACTION.USER_ID | INTERNAL (T2) | Employee ID (anonymized) | Staff directory access |
| TRANSACTION-AMOUNT | TRNREC | TRANSACTION.AMOUNT | CONFIDENTIAL (T3) | Financial transaction amount | RBAC: Finance/Operations |
| AUDIT-ACTION | AUDITLOG | AUDITLOG.ACTION_TYPE | CONFIDENTIAL (T3) | System action logged | RBAC: Compliance team |
| AUDIT-BEFORE-VALUE | AUDITLOG | AUDITLOG.BEFORE_VALUE | RESTRICTED (T4) | Pre-change audit data | Explicit approval, cryptographic signing |
| ERROR-MESSAGE | ERRHAND | ERROR_LOG.ERROR_MESSAGE | INTERNAL (T2) | Error log entry | Technical support staff |

---

## POLICY DGP-006: DATA STEWARDSHIP POLICY (COMPLETE)

[Full policy document - see main capstone report Section 2, Policy #6]

### Steward Role Responsibilities Matrix

| Responsibility | Portfolio Steward | Position Steward | Transaction Steward | Audit Steward |
|---|---|---|---|---|
| Domain governance | Portfolio domain | Position domain | Transaction domain | Audit domain |
| Business glossary | 18 portfolio terms | 14 position terms | 12 transaction terms | 8 audit terms |
| OWL ontology classes | Portfolio class | Position class | Transaction class | AuditEvent class |
| Business rules | BR-001, BR-002, BR-004, BR-015 | BR-007, BR-009, BR-010 | BR-006, BR-008, BR-014 | BR-011, BR-012, BR-013 |
| DQ scorecard | Portfolio DQ (94.2% baseline) | Position DQ (95.8%) | Transaction DQ (96.1%) | Audit DQ (89.2%) |
| Exception authority | <$1M variance | <$5M variance portfolio | <$10M daily volume | Audit trail 100% coverage |
| Policy compliance | DGP-003 (rules) | DGP-004 (metadata) | DGP-001 (quality) | DGP-007 (compliance) |
| Escalation authority | Portfolio Director | Risk Director | Operations Director | Chief Compliance Officer |

### Steward Escalation Procedures

**Escalation Level 1: Domain Stewardship Team Meeting**
- Attendees: 4 Stewards, Data Governance Manager, Data Architect
- Frequency: Monthly (3rd Monday)
- Issues escalated: Cross-domain impact (e.g., Portfolio-Position consistency issue)
- Authority: Discussion, record decision, escalate if consensus 

**Escalation Level 2: Data Governance Committee**
- Attendees: Data Governance Manager (chair), 4 Stewards, DBA, DQ Manager, Data Architect
- Frequency: Bi-weekly (1st & 3rd Tuesday)
- Issues escalated: Policy conflicts, cross-domain rule constraints, major DQ exceptions
- Authority: Approve exceptions up to 90 days, modify procedures, resources allocation

**Escalation Level 3: Executive Steering Committee**
- Attendees: CDO (chair), CRO, CFO, Business heads, Stewards (as needed)
- Frequency: Monthly (2nd Monday)
- Issues escalated: Strategic policy changes, regulatory compliance, budget/resource decisions, governance framework changes
- Authority: Approve major policy changes, allocate budget, strategic direction

---

## POLICY DGP-007: COMPLIANCE & AUDIT POLICY (COMPLETE)

[Full policy document - see main capstone report Section 2, Policy #7]

### Audit Trail Validation Procedures

**Daily Audit Trail Validation (4:30 AM UTC):**
1. Query AUDITLOG table for completeness:
   - Count INSERTs/UPDATEs/DELETEs on PORTFOLIO_MASTER yesterday
   - Count corresponding audit entries in AUDITLOG with matching timestamp ±5 seconds
   - Calculate completeness: (Matching entries / Total operations) × 100
   - Alert if <99%

2. Audit trail content validation:
   - For each audit entry: verify before/after values populated
   - Verify user_id and timestamp non-null
   - Verify operation_type ∈ {INSERT, UPDATE, DELETE}
   - Alert if any record missing required fields

3. Performance validation:
   - Measure audit write latency (Audit timestamp - Transaction timestamp)
   - Alert if average latency >500ms or max latency >5 seconds

**Monthly Audit Trail Audit (1st of month, 6 AM UTC):**
1. Hash verification: Calculate SHA-256 hash of audit records, compare with stored hash
2. Completeness verification: Spot-check 100 transactions for complete audit trail (sample validation)
3. Archival verification: Verify 2+ year-old audit entries archived successfully
4. Recovery testing: Test restore of audit entries from backup (validation SLA <30 minutes)

**Quarterly SOX Control Review (Q1, Q2, Q3, Q4):**
1. SOX compliance checklist:
   - [ ] Audit trail 100% coverage (INSERTs/UPDATEs all logged)
   - [ ] Audit trail content complete (before/after values captured)
   - [ ] Audit trail accessible (query SLA <5 seconds met)
   - [ ] Audit trail retention 7 years verified
   - [ ] Access control: only authorized users can query audit trail
   - [ ] Incident response procedures documented

2. Control documentation:
   - Document evidence of audit trail controls
   - Maintain documentation folder (Digital Vault or document management system)
   - Attach audit trail validation reports as supporting evidence

---

**END OF PHASE 1.6 DETAILED POLICIES DOCUMENT**

**Next Document:** RACI Matrix & Organization Chart
