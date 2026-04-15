---
title: "PHASE 1.6 CHANGE MANAGEMENT FRAMEWORK & TOOLKIT"
tags:
  - ingested
  - source-md
  - group-raw-root
links:
  - "/raw/PHASE_1_6_CHANGE_MANAGEMENT.md"
created: 2026-04-15T17:11:14.627Z
source: "/raw/PHASE_1_6_CHANGE_MANAGEMENT.md"
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
  - /raw/PHASE_1_6_COMPLETE_DELIVERABLES_INDEX.md
  - /raw/PHASE_1_6_GOVERNANCE_POLICIES_DETAILED.md
  - /raw/PHASE_1_6_RACI_ORGANIZATION.md
  - /raw/PHASE_1_6_SEMANTIC_GOVERNANCE_CAPSTONE.md
  - /raw/PHASE_2_IMPLEMENTATION_KICKOFF.md

## Source Content
# PHASE 1.6 CHANGE MANAGEMENT FRAMEWORK & TOOLKIT
## IPMS Investment Portfolio Management System

**Document Version:** 1.0  
**Effective Date:** 1 May 2026  
**Classification:** INTERNAL  
**Owner:** Data Governance Manager

---

## SECTION 1: CHANGE MANAGEMENT PROCEDURE

### Change Types & Authority Matrix

| Change Type | Example | Scope | Approval Authority | Timeline |
|---|---|---|---|---|
| **Trivial** | DQ metric threshold ±1%, minor glossary update | Single metric/term update | DQ Manager / Steward | 1 day |
| **Minor** | DQ rule threshold update (±3%), business rule logic refinement | Single dimension/rule | DG Manager + Steward | 5 days |
| **Standard** | Phase B rule deployment (BR-001, BR-004), new metadata class | Single domain, <$100K | DG Committee approval | 15 days |
| **Major** | Phase C rule deployment, major policy change, new DGP policy | Cross-domain, >$100K | Governance Council approval | 30 days |
| **Strategic** | Governance framework redesign, new data domain, technology platform | Enterprise-scale, >$500K | Executive Steering approval | 60+ days |

### Phase A: Initiation

**1. Submit Change Request**

Template fields:
- Request ID (auto-generated: CGMR-2026-001)
- Requester name, email, role
- Request date
- Business justification (why needed, business owner approval)
- Proposed change description
- Affected systems/programs/domains
- Estimated effort & timeline
- Requested implementation date
- Change type classification (Trivial/Minor/Standard/Major/Strategic)

**2. Preliminary Feasibility Review (DG Manager)**
- Review scope & estimate
- Classify change type
- Route to appropriate approval body
- Timeline: 1 business day

### Phase B: Review & Approval (5-30 days depending on change type)

**1. Technical Assessment**
- Database architect review (if DB changes): feasibility, performance impact
- COBOL architect review (if program changes): integration complexity, testing needs
- Data architect review (if ontology/lineage changes): semantic model impact
- DBA review (if infrastructure changes): resource impact, SLA implications

**2. Business Impact Analysis**
- Domain steward review: business rule impact, SLA implications
- Cross-steward review: multi-domain dependencies
- Affected user community consultation

**3. Governance Review**
- Policy compliance review (compliance officer)
- Regulatory impact (if applicable)
- Risk assessment (new failure points, mitigation)

**4. Approval Decision**

Approval levels:
- **Trivial/Minor:** DG Manager + relevant Steward (email approval acceptable)
- **Standard:** Data Governance Committee (requires committee vote, simple majority)
- **Major:** Data Governance Council (requires council vote, consensus preferred)
- **Strategic:** Executive Steering Committee (board-level approval)

### Phase C: Implementation (10-60 days based on complexity)

**1. Design & Planning**
- Detailed design document creation
- Test strategy development
- Deployment plan development (DEV → TEST → STAGING → PROD)
- Rollback procedure documentation

**2. Development & Testing**
- Code development (COBOL stubs, DB2 triggers, scripts)
- Unit testing (developer responsibility)
- Integration testing (cross-system validation)
- User acceptance testing (business user sign-off)
- Performance testing (if applicable)

**3. Deployment**
- Deployment readiness review (confirm all quality gates passed)
- Communication launch (notify stakeholders)
- Change documentation update (policies, procedures, lineage)
- Production deployment (using deployment runbook)
- Monitoring setup (alert thresholds for new constraints)

### Phase D: Monitoring (30 days post-implementation)

**1. Daily Monitoring**
- Rule violation rate trending
- Performance metrics (latency, throughput)
- Exception escalations
- Issue logging & tracking

**2. Weekly Review**
- Metrics summary report
- Issue trend analysis
- Stakeholder feedback collection
- Go/no-go assessment for continuation

**3. 30-Day Post-Implementation Review**
- Final metrics assessment (vs. baseline)
- Issue resolution verification
- Stakeholder feedback compiled
- Success criteria verdict
- Decision: accept, modify, or rollback

---

## SECTION 2: CHANGE MANAGEMENT TEMPLATES

### Change Request Template (FORM CG-001)

```
════════════════════════════════════════════════════════════════════════
                    GOVERNANCE CHANGE REQUEST FORM
════════════════════════════════════════════════════════════════════════

REQUEST IDENTIFICATION
─────────────────────────────────────────────────────────────────────────
Request ID:                [AUTO-GENERATED: CGMR-2026-XXX]
Request Date:              [DATE]
Requester Name:            [NAME]
Requester Email:           [EMAIL]
Requester Role:            [POSITION]
Requested Approval Date:   [TARGET DATE]
Requested Implementation:  [TARGET DEPLOYMENT DATE]

CHANGE JUSTIFICATION
─────────────────────────────────────────────────────────────────────────
Change Title:              [Brief title, e.g., "Increase DQ Completeness Target"]
Change Type (check one):   [ ] Trivial   [ ] Minor   [ ] Standard   [ ] Major   [ ] Strategic

Business Reason:           [Why is this change needed? What problem does it solve?]
                          
Expected Business Benefit: [Quantified benefits: cost reduction, risk reduction, efficiency gain]

Business Owner Approval:   [Name/Signature: business owner endorsement required]

CHANGE DESCRIPTION
─────────────────────────────────────────────────────────────────────────
Current Situation:         [How does it work today?]

Proposed Change:           [What exactly will change? Be specific.]

Alternative Approaches:    [What other solutions were considered? Why rejected?]

Critical Success Factors:  [What must go right for this change to succeed?]

IMPACT ASSESSMENT
─────────────────────────────────────────────────────────────────────────
Systems Affected:          [List all systems: DB2 tables, programs, processes]

Programs Affected:         [COBOL programs impacted]

Data Flows Affected:       [Data lineage changes, if any]

Business Rules Affected:   [Rules created, modified, or removed]

DQ Dimensions Affected:    [If DQ change: Completeness, Accuracy, Consistency, Uniqueness, Timeliness]

Users/Stakeholders:        [Who is impacted?]

EFFORT ESTIMATION
─────────────────────────────────────────────────────────────────────────
Design & Planning:         [Estimated hours]
Development/Code:          [Estimated hours]
Testing (Unit/Integration): [Estimated hours]
UAT:                       [Estimated hours]
Documentation:             [Estimated hours]
Deployment:                [Estimated hours]
─────────────────────────────────────────────────────────────────────────
TOTAL ESTIMATED EFFORT:    [TOTAL hours] = [TOTAL man-days @ 8hr/day]

Testing Timeline:          [ ] DEV: [X days]  [ ] TEST: [X days]  [ ] STAGING: [X days]

RESOURCE REQUIREMENTS
─────────────────────────────────────────────────────────────────────────
Technical Resources:       [COBOL architect, DBA, Data architect - required roles]

Database Resources:        [ ] DB2 capacity   [ ] Storage expansion   [ ] Backup capacity

Tool/Infrastructure:       [ ] New software licenses   [ ] Hardware   [ ] Network

Estimated Budget Impact:   [$X cost for change]

RISK ASSESSMENT
─────────────────────────────────────────────────────────────────────────
Key Risks:                 [What could go wrong?]
                          
Probability (Low/Med/High): [Assessment]

Impact (Low/Med/High):     [Assessment]

Mitigation Strategy:       [How will you prevent this risk?]

Contingency Plan:          [Fallback if risk occurs?]

Rollback Complexity:       [ ] Simple (5-min rollback)   [ ] Complex (2-hour rollback)   [ ] Critical (requires DBA intervention)

SIGN-OFF & APPROVAL
─────────────────────────────────────────────────────────────────────────
Requestor Signature:       ________________________  Date: __________

Technical Lead Approval:   ________

## Sources
- [`/raw/PHASE_1_6_CHANGE_MANAGEMENT.md`](/raw/PHASE_1_6_CHANGE_MANAGEMENT.md)