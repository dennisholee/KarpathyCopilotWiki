---
title: "PHASE 1.6 GOVERNANCE ORGANIZATION & RACI MATRIX"
modified: 2026-04-14T16:01:11.115Z
---

# PHASE 1.6 GOVERNANCE ORGANIZATION & RACI MATRIX
## IPMS Investment Portfolio Management System

**Document Version:** 1.0  
**Effective Date:** 1 May 2026  
**Classification:** INTERNAL  
**Owner:** Chief Data Officer

---

## SECTION 1: EXECUTIVE GOVERNANCE ORGANIZATION CHART

### Three-Level Governance Hierarchy

```
                          ┌─────────────────────────────────────┐
                          │  Chief Risk Officer (CRO)           │
                          │  Executive Sponsor for Governance   │
                          │  Reports to: Chief Financial Officer│
                          └────────────────┬────────────────────┘
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
        ┌───────────▼─────────────┐                 ┌────────────▼──────────────┐
        │  Chief Data Officer     │                 │ Executive Steering        │
        │  (CDO)                  │                 │ Committee (Monthly)       │
        │  Full-time, Reports to  │                 │                          │
        │  Chief Risk Officer     │                 │ Members:                 │
        │  Authority: Policy      │                 │ - Chief Financial Officer│
        │  approval, risk         │                 │ - Chief Risk Officer     │
        │  management             │                 │ - Chief Audit Officer    │
        │                         │                 │ - Business Unit Heads    │
        │  Responsibilities:      │                 │                          │
        │  - Data governance      │                 │ Authority:               │
        │    strategy             │                 │ - Board-level reporting  │
        │  - Executive dashboard  │                 │ - Risk escalations       │
        │  - Regulatory alignment │                 │ - Strategic decisions    │
        └────────┬────────────────┘                 └──────────────────────────┘
                 │
                 │
    ┌────────────▼──────────────────────────────────────┐
    │  Data Governance Office (DGO)                     │
    │  Operational Hub - Reports to CDO                │
    │                                                   │
    │  ┌──────────────────────────────────────────────┴─┐
    │  │ Data Governance Manager (Full-time)            │
    │  │ - Day-to-day governance execution              │
    │  │ - Meeting facilitation & facilitation          │
    │  │ - Policy enforcement & escalation              │
    │  │ - Metrics reporting & dashboards               │
    │  │ - Steward coaching & enablement                │
    │  │ - Governance quality assurance                 │
    │  │                                                │
    │  └──────────────────────────────────────────────┬─┘
    │                                                 │
    │         ┌───────────────────────────────────────┴──────────────────────┐
    │         │                                                             │
    │         │                    ┌─────────────────────────────────────┐  │
    │         │                    │ Data Quality Manager               │  │
    │         │                    │ - DQ rule maintenance (57 rules)   │  │
    │         │                    │ - Metric collection & dashboards   │  │
    │         │                    │ - Dimension measurement            │  │
    │         │                    │ - Remediation campaign execution   │  │
    │         │                    │ - Root cause analysis              │  │
    │         │                    └─────────────────────────────────────┘  │
    │         │                                                             │
    │         │    ┌──────────────────────────────────────────────────────┐ │
    │         │    │ Data Architect                                       │ │
    │         │    │ - Semantic model & ontology governance              │ │
    │         │    │ - OWL-DL ontology versioning                        │ │
    │         │    │ - Type mapping curation                             │ │
    │         │    │ - Lineage model updates (PROV)                      │ │
    │         │    │ - Cross-domain data architecture                    │ │
    │         │    └──────────────────────────────────────────────────────┘ │
    │         │                                                             │
    │         │  ┌────────────────────────────────────────────────────────┐ │
    │         │  │ Database Administrator (DBA)                           │ │
    │         │  │ - DB2 constraint enforcement (triggers, checks)       │ │
    │         │  │ - Schema governance & index management                │ │
    │         │  │ - Performance monitoring & optimization               │ │
    │         │  │ - Backup/recovery procedures                          │ │
    │         │  │ - Audit trail custody & maintenance                   │ │
    │         │  └────────────────────────────────────────────────────────┘ │
    │         │                                                             │
    │         │    ┌──────────────────────────────────────────────────────┐ │
    │         │    │ Security & Compliance Officer                        │ │
    │         │    │ - SOX control documentation                          │ │
    │         │    │ - Data classification enforcement                    │ │
    │         │    │ - Access control management (RBAC)                   │ │
    │         │    │ - Audit trail chain-of-custody                       │ │
    │         │    │ - Regulatory compliance tracking                     │ │
    │         │    │ - Incident response coordination                     │ │
    │         │    └──────────────────────────────────────────────────────┘ │
    │         └───────────────────────────────────────────────────────────────┘
    │
    └─────────┬──────────────────────────────────────────────┐
              │                                              │
     ┌────────▼──────────────┐           ┌────────────────┐ │
     │ Domain Data Stewards  │           │ Governance     │ │
     │ (4 FTE)               │           │ Committees     │ │
     │                       │           │                │ │
     │ 1. Portfolio Steward  │           │ 1. Data        │ │
     │ 2. Position Steward   │           │    Governance  │ │
     │ 3. Transaction        │           │    Committee   │ │
     │    Steward            │           │    (Bi-weekly) │ │
     │ 4. Audit Steward      │           │                │ │
     │                       │           │ 2. Data        │ │
     │ Each steward:         │           │    Governance  │ │
     │ - Domain rule owner   │           │    Council     │ │
     │ - DQ scoreboard       │           │    (Monthly)   │ │
     │ - Business glossary   │           │                │ │
     │ - Exception authority │           │ 3. Domain      │ │
     │ - Escalation point    │           │    Stewardship │ │
     │                       │           │    Teams       │ │
     │ Reports to:           │           │    (Weekly)    │ │
     │ - DG Manager          │           │                │ │
     │ (dotted to             │           │ Members        │ │
     │  Business              │           │ assigned per   │ │
     │  domain heads)         │           │ steering       │ │
     │                       │           │ structure      │ │
     └───────────────────────┘           └────────────────┘ │
                                                             │
     Extended stakeholder roles (Part-time):                │
     - COBOL Architects (3): Program integration support    │
     - Database Team (2 DBAs): Infrastructure support       │
     - Data Analysts (2): Steward data support              │
     - Testing Coordinator (1): Change management support   │
                                                             │
     Total Governance FTE: 8 core + ~5 extended = 13 FTE    │
```

### Governance Committee Charters

#### 1. DATA GOVERNANCE COMMITTEE (Bi-weekly, Operational)

**Purpose:** 
- Operational governance execution, escalated issue resolution, policy compliance verification
- Recommendations to Governance Council for strategic decisions

**Members (7 voting):**
- Data Governance Manager (Chair)
- 4 Domain Data Stewards (Portfolio, Position, Transaction, Audit)
- Data Architect
- Database Administrator
- Data Quality Manager

**Additional Attendees (non-voting):**
- Security & Compliance Officer (quarterly attendance, compliance topics)
- COBOL Architect (as-needed for rule enforcement topics)
- Meeting Coordinator (administrative support)

**Meeting Frequency:** 
- Every other Tuesday, 10:00 AM (1-hour meetings)
- Escalation meetings on-demand (48-hour notice)

**Agenda & Deliverables:**
1. Policy Compliance Status (10 min)
   - DQ policy execution status (quality target tracking)
   - Business rules enforcement progress (rule violations trending)
   - Metadata governance updates (ontology/glossary changes)
   
2. Escalated Issues Report (10 min)
   - Critical data quality exceptions (RED/ORANGE alerts)
   - Policy conflicts or ambiguities
   - Cross-domain impact issues
   
3. Change Management Review (15 min)
   - Change requests in-flight (status update)
   - Approval decisions (approve/defer/reject)
   - Testing & deployment readiness checks
   
4. Risk Management (10 min)
   - New governance risks identified
   - Risk mitigation status updates
   - Contingency activation if needed
   
5. Metrics & Tracking (10 min)
   - 15 KPIs updated (weekly trend report)
   - Policy compliance rate (% systems implementing)
   - Steward competency assessments
   
6. Working Group Summaries (5 min)
   - DQ remediation working group updates
   - Rule enforcement working group updates
   - Metadata management updates

**Decision Authority:**
- Approve policy exceptions up to 30 days
- Approve minor rule changes (threshold adjustments, &lt;2 business unit impact)
- Recommend major policy changes to Governance Council
- Escalate unresolved conflicts to CDO

**Voting Rules:**
- Simple majority (4 of 7 votes) for routine decisions
- Consensus required for policy changes
- Any member can escalate to Governance Council

---

#### 2. DATA GOVERNANCE COUNCIL (Monthly, Strategic)

**Purpose:**
- Strategic data governance oversight, policy approvals, cross-domain alignment
- Executive-level governance scorecard and roadmap

**Members (7 voting):**
- Chief Data Officer (Chair)
- 4 Domain Data Stewards (Portfolio, Position, Transaction, Audit)
- Data Governance Manager
- 1 Business Sponsor (rotating quarterly: CFO, CRO, Chief Audit Officer)

**Additional Attendees (non-voting):**
- Data Architect (quarterly deep-dives on semantic model)
- DBA (quarterly deep-dives on constraint enforcement)
- Data Quality Manager (quarterly deep-dives on DQ progress)

**Meeting Frequency:**
- 1st Monday of each month, 9:00 AM (1.5-hour meeting)
- Strategic planning sessions as-needed (board meeting prep)

**Agenda & Deliverables:**
1. Governance Health Scorecard (15 min)
   - 15 KPIs summary (traffic light assessment)
   - Governance maturity level
   - Strategic initiatives status
   - Policy compliance audit results
   
2. Strategic Initiatives Review (20 min)
   - Phase A/B/C roadmap progress
   - Critical blockers or risks
   - Resource re-allocation decisions
   - Budget tracking vs. plan
   
3. Policy Framework Enhancements (15 min)
   - New policies proposed (DGP-008, DGP-009 as needed)
   - Policy changes recommended from Governance Committee
   - Effectiveness review of existing policies
   - Compliance change notifications
   
4. Cross-Domain Alignment (15 min)
   - Portfolio-Position-Transaction consistency issues
   - Audit trail completeness vs. regulatory requirements
   - Data flows updates (lineage model refresh)
   - Stewardship collaboration outcomes
   
5. Stakeholder Communication (10 min)
   - External audit/regulatory feedback
   - Business stakeholder feedback survey
   - Training program updates
   - Communication effectiveness survey
   
6. Risk & Issue Escalation (10 min)
   - Executive-level governance risks
   - Material impacts from governance activities
   - Escalations from Governance Committee

**Decision Authority:**
- Approve new data governance policies
- Approve major rule changes (>$1M business impact, cross-domain)
- Approve policy exceptions >30 days
- Recommend strategic governance investments to Executive Committee
- Approve governance roadmap (90/180/360-day plan)

**Voting Rules:**
- Simple majority (4 of 7) for routine approvals
- Consensus required for new policies
- CDO can invoke executive decision for time-critical items


#### 3. EXECUTIVE STEERING COMMITTEE (Monthly, Board-Level)

**Purpose:**
- Board-level governance reporting, regulatory compliance, budget/resource approval
- Executive visibility into data governance ROI and strategic impact

**Members (5):**
- Chief Financial Officer (Chair)
- Chief Risk Officer
- Chief Data Officer
- Chief Audit Officer
- Business head representative (rotating: Managing Director Portfolio Management, Key accounts, Operations Head)

**Attendees (non-voting):**
- Data Governance Manager (administrative, report presentation)

**Meeting Frequency:**
- 2nd Monday of each month, 8:00 AM (1-hour executive briefing)
- Board meeting prep sessions as-needed

**Agenda & Deliverables:**
1. Executive Summary Scorecard (10 min)
   - Overall DQ Score (87.3% → target 98%)
   - Rule enforcement rate (0% Phase A → 100% Phase C)
   - Policy compliance (% systems)
   - Governance maturity (Level 2.5 → target Level 4)
   - Critical exceptions (any RED alerts)
   
2. Regulatory Compliance Status (10 min)
   - SOX control compliance (# of controls implemented)
   - Audit findings & remediation status
   - Regulatory change notifications
   - Risk incidents related to data governance
   
3. Business Impact & ROI (10 min)
   - DQ improvement financial impact (decision-making quality, risk reduction)
   - Business rule enforcement benefits (fraud prevention, compliance)
   - Governance investment cost vs. benefit
   - Stakeholder satisfaction (governance acceptance)
   
4. Strategic Decisions Required (20 min)
   - Policy framework changes requiring executive approval
   - Budget/resource allocation (hiring, tools, infrastructure)
   - Phase roadmap approvals (go/no-go decisions)
   - Governance tool investments
   
5. Risk & Incidents (5 min)
   - Material governance risks
   - Incidents with board-level impact
   - Contingency activation decisions

**Decision Authority:**
- Approve governance budget & resource allocation
- Approve major policy framework changes
- Escalate governance matters to Board if material
- Approve governance technology investments
- Set governance strategic direction for enterprise

---

### Domain Stewardship Teams

#### Portfolio Stewardship Team
- **Members:** Portfolio Steward (lead), Portfolio Business Owner, COBOL Architect, 1 Data Analyst
- **Scope:** Portfolio entity governance, PORTFLIO copybook, business rules BR-001/BR-002/BR-004/BR-015
- **Meeting:** Weekly Wednesdays 2 PM (30-min sync)
- **Deliverables:** Weekly escalation summary, business rule weekly compliance, glossary maintenance

#### Position Stewardship Team
- **Members:** Position Steward (lead), Position Business Owner, Analyst
- **Scope:** Position entity governance, POSREC copybook, rules BR-007/BR-009/BR-010
- **Meeting:** Weekly Thursdays 2 PM (30-min sync)

#### Transaction Stewardship Team
- **Members:** Transaction Steward (lead), Trading Operations lead, Database Analyst
- **Scope:** Transaction entity, TRNREC copybook, rules BR-006/BR-008/BR-014
- **Meeting:** Weekly Fridays 2 PM (30-min sync)

#### Audit Stewardship Team
- **Members:** Audit Steward (lead), Compliance Officer, Security Officer
- **Scope:** Audit entity, AUDITLOG copybook, rules BR-011/BR-012/BR-013, SOX controls
- **Meeting:** Weekly Mondays 3 PM (30-min sync)

#### Cross-Domain Stewardship Sync
- **Members:** All 4 Stewards, Data Governance Manager
- **Scope:** Portfolio-Position consistency, audit trail cross-domain impact, data flow integration
- **Meeting:** Monthly 3rd Friday 10 AM (1-hour cross-domain review)

---

## SECTION 2: RACI MATRIX — 20 GOVERNANCE ACTIVITIES

### RACI Definition
- **R (Responsible):** Executes the task, does the work
- **A (Accountable):** Authority, decision-maker, final approval
- **C (Consulted):** Provides input, expertise, reviewed but not required
- **I (Informed):** Kept in loop, notified of outcome

### RACI Matrix – Complete 20 Activities

| **Governance Activity** | **CDO** | **CRO** | **DG Manager** | **Portfolio Steward** | **Position Steward** | **Trans Steward** | **Audit Steward** | **DBA** | **Data Arch** | **DQ Mgr** | **Sec/Compliance** |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1. Approve Data Quality Policy (DGP-001)** | A | C | R | C | C | C | C | C | C | C | R |
| **2. Define/Update Data Quality Targets** | C | I | A | R | R | R | R | C | C | R | I |
| **3. Maintain Business Glossary (SKOS)** | I | - | C | R | R | C | C | - | A | - | - |
| **4. Update OWL Ontology & Axioms** | C | - | I | C | C | C | C | - | A | - | - |
| **5. Define New Business Rules** | C | I | I | R | R | R | R | - | C | - | C |
| **6. Enforce DB2 Constraints & Triggers** | I | - | I | C | C | C | C | A | C | - | - |
| **7. Evaluate Data Quality (Dimension Scores)** | I | - | R | C | C | C | C | I | - | A | - |
| **8. Remediate DQ Exceptions** | I | - | R | R | R | R | R | R | - | A | I |
| **9. Manage Data Lineage Models (PROV)** | C | - | I | C | C | C | C | C | A | - | - |
| **10. Approve Change Requests** | A | - | R | C | C | C | C | C | C | - | C |
| **11. Conduct Impact Analysis** | C | - | R | R | R | R | R | R | A | C | I |
| **12. Execute Testing & Deployment** | I | - | C | C | C | C | C | R | C | I | I |
| **13. Handle Policy Exceptions/Waivers** | A | C | R | A | A | A | A | - | - | - | C |
| **14. Execute Compliance Reporting** | A | R | R | C | C | C | C | I | - | - | A |
| **15. Manage Governance Risks** | A | R | R | C | C | C | C | - | - | - | C |
| **16. Execute Stakeholder Communication** | A | C | R | I | I | I | I | - | - | - | I |
| **17. Deliver Steward Training Program** | C | - | A | R | R | R | R | - | - | - | - |
| **18. Administer Governance Tools** | I | - | R | - | - | - | - | A | C | C | - |
| **19. Approve Business Rule Changes** | C | I | R | A | A | A | A | C | C | - | C |
| **20. Escalation Issue Resolution** | A | C | R | I | I | I | I | - | - | - | I |

### Notes on RACI Matrix

**Row 1 - Approve Data Quality Policy:**
- DQ Manager (R): Draft policy, collect stakeholder input
- Security Officer (R): Compliance review, regulatory alignment
- CDO (A): Final approval, executive ownership

**Row 2 - Define Quality Targets:**
- Domain Stewards (R): Business contextual input on realistic targets
- DG Manager (A): Coordinate across domains, ensure alignment
- DQ Manager (R): Technical feasibility assessment

**Row 6 - Enforce DB2 Constraints:**
- DBA (A): Authority on database implementation
- Data Architect (C): Consulted on semantic model alignment
- Domain Stewards (C): Consulted on business impact

**Row 10 - Approve Change Requests:**
- CDO (A): Strategic decisions, major changes >$1M impact
- DG Manager (R): Process coordination, approval workflow
- Minor changes: DG Manager + Steward approval sufficient

**Row 13 - Handle Policy Exceptions:**
- CDO (A): Strategic exceptions, >90 day waiver authority
- Stewards (A): Domain-level exceptions decision
- DG Manager (R): Exception tracking, escalation coordination

---

## SECTION 3: COMPETENCY FRAMEWORK & HIRING PROFILES

### Position: Chief Data Officer (CDO)
- **Reports To:** Chief Risk Officer
- **Direct Reports:** Data Governance Manager, 4 Stewards (dotted)
- **Experience Required:** 15+ years data management, 10+ years governance leadership, C-suite visibility
- **Education:** MBA or equivalent advanced degree preferred
- **Key Competencies:**
  - Enterprise data strategy & governance
  - Organizational change management
  - Executive communication & steering
  - Financial acumen (budget management, ROI)
  - Regulatory compliance knowledge
  - Team leadership & talent development
- **Compensation:** Executive level (VP equivalent)
- **Hiring Timeline:** Days 1-30 (Phase A prep)

### Position: Data Governance Manager
- **Reports To:** CDO
- **Direct Reports:** DQ Manager, Data Architect, DBA, Security Officer, 4 Stewards
- **Experience Required:** 8+ years data governance, 5+ years operations management, team leadership
- **Education:** Bachelor degree in data management, computer science, or related field
- **Key Competencies:**
  - Data governance frameworks (Gartner, DAMA-DMBOK)
  - Process design & improvement
  - Cross-functional team leadership
  - Problem-solving & escalation management
  - Stakeholder engagement
  - Metrics-driven decision making
- **Compensation:** Senior manager level ($150K-$180K range)
- **Hiring Timeline:** Days 15-45 (Phase A Week 1-2)

### Position: Portfolio Data Steward (4 roles, 1 per domain)
- **Reports To:** Data Governance Manager
- **Direct Reports:** None (individual contributor)
- **Experience Required:**
  - Portfolio domain: 7+ years portfolio management / investment operations
  - Position domain: 6+ years position analysis / valuations
  - Transaction domain: 6+ years transaction processing / trading ops
  - Audit domain: 7+ years compliance / audit / regulatory affairs
- **Technical Skills Required:**
  - SQL (advanced), DB2 (intermediate)
  - COBOL awareness (business logic understanding)
  - Data modeling concepts
  - Excel (advanced)
- **Governance Knowledge:** Data quality, stewardship roles, business rules
- **Compensation:** Senior analyst level ($110K-$140K range)
- **Hiring Timeline:** Days 30-60 (Phase A Week 2-3, internal hiring preferred)

### Position: Data Quality Manager
- **Reports To:** Data Governance Manager
- **Experience Required:** 6+ years data quality engineering, analytics background
- **Technical Skills:**
  - SQL (expert), Python/R (intermediate)
  - BI tools (Tableau, Power BI, Looker)
  - DQ frameworks & methodologies
  - Automation/RPA experience preferred
- **Compensation:** Senior analyst level ($120K-$150K range)
- **Hiring Timeline:** Days 30-60 (Phase A)

### Position: Data Architect
- **Reports To:** CDO (governance), CIO (technical infrastructure)
- **Experience Required:** 12+ years data architecture, 7+ years semantic modeling
- **Education:** Computer science or equivalent advanced degree
- **Technical Skills:**
  - OWL-DL, RDF/SKOS (expert)
  - ISO 19101 data architecture standards
  - Entity/semantic modeling
  - Lineage design & W3C PROV
  - Data governance frameworks
- **Compensation:** Principal level ($170K-$210K range)
- **Hiring Timeline:** Days 1-30 (internal existing data architect recommended)

### Position: Database Administrator (existing expanded role)
- **Reports To:** Data Governance Manager (governance), Database Infrastructure Manager (technical)
- **Experience Required:** 10+ years DB2, 3+ years governance involvement
- **Technical Skills:**
  - DB2 triggers, stored procedures (expert)
  - Performance tuning & optimization
  - Backup/recovery procedures
  - SQL (expert)
  - CICS integration experience
- **Compensation:** Senior DBA level ($140K-$170K range)
- **Hiring Timeline:** Days 1-30 (internal expansion of existing DBA team)

### Position: Security & Compliance Officer (existing expanded role)
- **Reports To:** Chief Compliance Officer / Chief Information Security Officer
- **Experience Required:** 8+ years data security/compliance, 5+ years governance
- **Technical Skills:**
  - SOX control frameworks
  - Regulatory compliance (HIPAA, SEC, FINRA if applicable)
  - Access control management (RBAC implementation)
  - Encryption technologies
  - Audit trail design
- **Compensation:** Senior security officer level ($150K-$190K range)
- **Hiring Timeline:** Existing role expanded (part-time to governance)

---

## Organization Change Management

### Month 1 (April 2026) - Governance Team Recruitment & Onboarding

**Week 1 (11-15 April):**
- CDO job description finalized, recruiting initiated (external search)
- Data Governance Manager position opened
- Domain steward positions opened (internal posting priority)

**Week 2 (16-22 April):**
- CDO candidates interviewed, offer extended
- DG Manager interviews, likely offer by end of week

**Week 3 (23-29 April):**
- CDO start date confirmed (target 1 May)
- DG Manager start date confirmed (target 15 May)
- Domain steward interviews, offers extended (internal candidates preferred)

**Week 4 (30 Apr - 11 May):**
- CDO onboarding (orientation, stakeholder meetings)
- DG Manager onboarding (orientation, process documentation)
- Domain steward onboarding Phase 1 (business process deep-dive)

### Month 2-3 (May-June 2026) - Extended Team Onboarding

- 4 Domain Stewards onboarding (8-week curriculum)
- Data Quality Manager hired & onboarded
- Data Architect assignment confirmed
- DBA expanded role clarification
- Security Officer expanded role clarification

### Month 4+ (July 2026 onwards) - Organization Stabilization

- Governance team fully operational
- Governance committee meetings running on schedule
- Policies DGP-001–007 all approved & communicated
- 90-day transition complete to steady-state operations

---

**END OF GOVERNANCE ORGANIZATION DOCUMENT**
