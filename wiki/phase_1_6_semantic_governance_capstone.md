---
title: "Phase 1.6: Semantic Data Governance Capstone"
tags:
  - ingested
  - source-md
  - group-raw-root
links:
  - "/raw/PHASE_1_6_SEMANTIC_GOVERNANCE_CAPSTONE.md"
created: 2026-04-15T17:11:14.659Z
source: "/raw/PHASE_1_6_SEMANTIC_GOVERNANCE_CAPSTONE.md"
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
  - /raw/PHASE_1_6_GOVERNANCE_POLICIES_DETAILED.md
  - /raw/PHASE_1_6_RACI_ORGANIZATION.md
  - /raw/PHASE_2_IMPLEMENTATION_KICKOFF.md

## Source Content
# Phase 1.6: Semantic Data Governance Capstone
## IPMS Investment Portfolio Management System

**Execution Date:** 11 April 2026  
**Status:** ✅ COMPLETE & DELIVERED  
**Report Length:** 8,500+ words  
**Integration Scope:** All Phase 1.1-1.5 artifacts (60,000+ words cumulative)

---

## EXECUTIVE SUMMARY

### Phase 1.6 Objective
Design and formally establish a comprehensive, operationalizable semantic data governance framework that:
- Institutionalizes all Phase 1.1-1.5 discoveries (COBOL analysis, semantic ontology, business rules, data lineage, DQ framework)
- Defines clear organizational accountability with RACI matrices
- Establishes 7 core data governance policies
- Creates 15+ governance KPIs with baseline metrics
- Implements formal change management procedures
- Engages stakeholders through structured governance cadence
- Defines 90-180-360 day execution roadmap with clear milestones
- Identifies and mitigates governance risks

### Key Context from Prior Phases

| Phase | Key Deliverable | Status |
|-------|-----------------|--------|
| 1.1 | 38 COBOL programs, 18 business rules identified | ✅ Complete |
| 1.2.1 | 148 business terms, OWL ontology (7 classes, 42 axioms) | ✅ Complete |
| 1.2.2 | Type mapping (267 fields, 18 PIC patterns) | ✅ Complete |
| 1.2.3 | Semantic model (3-layer unified architecture) | ✅ Complete |
| 1.3 | Business rules formalized (18 constraints, 54 test scenarios) | ✅ Complete |
| 1.4 | Data lineage & W3C PROV models (5 primary flows, 12 secondary) | ✅ Complete |
| 1.5 | DQ baseline (87.3/100), 57 DQ rules, 3 critical gaps | ✅ Complete |

### Critical Metrics Baseline (from Phase 1.5)

**Data Quality Baseline (87.3/100):**
- Completeness: 94.2% (target: 99.0%, gap: -4.8%)
- Accuracy: 96.1% (target: 99.0%, gap: -2.9%)
- Consistency: 87.5% (target: 98.0%, gap: -10.5% 🔴 CRITICAL)
- Uniqueness: 99.8% (target: 100.0%, gap: -0.2%)
- Timeliness: 76.2% (target: 95.0%, gap: -18.8% 🔴 CRITICAL)

**Critical Gaps Requiring Governance Action:**
- BR-005: Amount formula not validated (Q1 2026 remediation)
- BR-007: Quantity precision truncation (Q2 2026 DB2 migration)
- Timeliness bottleneck: Single-threaded audit writer, CICS→DB2 sync delays
- Consistency violations: Portfolio value ≠ SUM(positions) in 12.4% of records

**Business Rules Foundation:**
- 18 business rules formalized across Portfolio, Position, Transaction, Audit domains
- Phase A priority: BR-005, BR-007
- Phase B priority: BR-001, BR-004, BR-012, BR-013
- Phase C deferred: 12 remaining rules

---

## SECTION 1: GOVERNANCE ORGANIZATIONAL STRUCTURE

### 1.1 Governance Operating Model

The semantic data governance operating model anchors around four structural pillars:

**PILLAR 1: Executive Leadership**
- **Chief Data Officer (CDO)** — Executive sponsor, reports to Chief Risk Officer
  - Strategic data governance leadership
  - Cross-functional conflict resolution
  - Board-level regulatory compliance accountability
  
- **Chief Risk Officer (CRO)** — CCO supervisor, business user representation
  - Regulatory compliance mandate
  - Data governance policy approval authority
  - Business strategy alignment

**PILLAR 2: Data Governance Office (DGO)**
- **Data Governance Manager** — Full-time operational leadership
  - Day-to-day governance execution
  - Policy enforcement, meeting facilitation
  - Issue escalation management
  - Metrics tracking and reporting

- **4 Domain Data Stewards** — Per-domain accountability ownership
  - **Portfolio Steward** (Portfolio domain, 6 programs: PORTADD, PORTUPDT, PORTQRY, etc.)
  - **Position Steward** (Position domain, 8 programs: POSHOLD, POSTRAN, POSVAL, etc.)
  - **Transaction Steward** (Transaction/Party domain, 12 programs, audit trails)
  - **Audit Steward** (Audit/Compliance domain, error handling, regulatory trails)

- **Data Architect** — Semantic model and ontology governance
  - OWL ontology maintenance and versioning
  - COBOL-to-ontology mapping updates
  - Lineage model updates (W3C PROV)
  - Type mapping curations

- **Database Administrator (DBA)** — Database constraint enforcement
  - DB2 trigger/procedure implementation
  - Schema governance, index management
  - Performance monitoring, optimization
  - Backup/recovery responsibilities

- **Data Quality Manager** — DQ measurement and remediation
  - DQ rule registry maintenance (57 rules)
  - Automated DQ metric collection
  - Dashboard development and monitoring
  - Remediation campaign execution

- **Security & Compliance Officer** — Regulatory alignment
  - SOX control documentation
  - Data classification enforcement
  - Access control management
  - Audit trail custody

**PILLAR 3: Governance Committees**

- **Data Governance Committee (Bi-weekly, operational)**
  - Members: Data Governance Manager, 4 Domain Stewards, Data Architect, DBA, DQ Manager
  - Scope: Policy compliance, escalated issues, rule changes, DQ exceptions
  - Deliverable: Issue registry, policy compliance scorecards, escalation reports

- **Data Governance Council (Monthly, strategic)**
  - Members: CDO, Data Governance Manager, Domain Stewards, CRO representative, key business sponsors
  - Scope: Strategic initiatives, major policy changes, risk management, budget approval
  - Deliverable: Monthly governance report, strategic initiatives tracking

- **Executive Steering Committee (Monthly, executive)**
  - Members: CDO, CRO, CFO, Chief Risk Officer, Business domain heads
  - Scope: Board-level reporting, regulatory compliance, strategic alignment
  - Deliverable: Executive dashboard, risk escalations, strategic approvals

**PILLAR 4: Domain Stewardship Teams**

- **Portfolio Stewardship Team**
  - Members: Portfolio Steward (lead), Portfolio Business Owner, COBOL Architect (PORTMSTR systems), DBA
  - Scope: Portfolio entity governance, PORTFLIO copybook, validation rules (BR-001, BR-002, BR-004)
  - Meetings: Weekly domain sync

- **Position Stewardship Team**
  - Members: Position Steward (lead), Position Business Owner, COBOL Architect, Data Analyst
  - Scope: Position entity governance, POSREC copybook, position cash flows, valuation rules
  - Meetings: Weekly domain sync

- **Cross-Domain Stewardship**
  - Members: 4 Stewards, Data Architect, DBA, DQ Manager
  - Scope: Audit trail integrity, error handling, regulatory linkage, data flows
  - Meetings: Monthly integration review

### 1.2 RACI Matrix: 20+ Governance Activities

**Legend:** R=Responsible (executes), A=Accountable (authority), C=Consulted, I=Informed

| Governance Activity | CDO | DG Manager | Portfolio Steward | Position Steward | Trans Steward | Audit Steward | DBA | Data Arch | DQ Mgr | Sec/Compliance |
|---|---|---|---|---|---|---|---|---|---|---|
| 1. Approve Data Policy | A | C | C | C | C | C | C | C | C | R |
| 2. Define Data Quality Targets | C | A | R | R | R | R | C | C | R | - |
| 3. Maintain Business Glossary | C | C | R | R | C | C | - | A | - | - |
| 4. Update OWL Ontology | C | I | C | C | C | C | - | A | - | - |
| 5. Define Business Rules | C | I | R | R | R | R | - | C | - | - |
| 6. Enforce DB2 Constraints | C | I | C | C | C | C | A | C | - | - |
| 7. Evaluate Data Quality | I | R | C | C | C | C | I | - | A | - |
| 8. Remediate DQ Issues | I | R | R | R | R | R | R | - | A | - |
| 9. Manage Data Lineage | C | I | C | C | C | C | C | A | - | - |
| 10. Change Request Approval | A | R | C | C | C | C | C | C | - | C |
| 11. Impact Analysis | C | R | R | R | R | R | R | A | - | - |
| 12. Testing & Deployment | C | C | C | C | C | C | R | C | - | - |
| 13. Exception Handling | C | R | A | A | A | A | - | - | - | I |
| 14. Compliance Reporting | A | R | C | C | C | C | I | - | - | R |
| 15. Risk Management | A | R | C | C | C | C | - | - | - | R |
| 16. Stakeholder Communication | A | R | C | C | C | C | - | - | - | - |
| 17. Steward Training | I | A | R | R | R | R | - | - | - | - |
| 18. Tool Administration | I | R | - | - | - | - | A | - | - | - |
| 19. Business Rule Change | C | R | A | A | A | A | 

## Sources
- [`/raw/PHASE_1_6_SEMANTIC_GOVERNANCE_CAPSTONE.md`](/raw/PHASE_1_6_SEMANTIC_GOVERNANCE_CAPSTONE.md)