---
title: "PHASE 1.6 GOVERNANCE ORGANIZATION & RACI MATRIX"
tags:
  - ingested
  - source-md
  - group-raw-root
links:
  - "/raw/PHASE_1_6_RACI_ORGANIZATION.md"
created: 2026-04-15T17:11:14.654Z
source: "/raw/PHASE_1_6_RACI_ORGANIZATION.md"
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
  - /raw/PHASE_1_6_SEMANTIC_GOVERNANCE_CAPSTONE.md
  - /raw/PHASE_2_IMPLEMENTATION_KICKOFF.md

## Source Content
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
                  

## Sources
- [`/raw/PHASE_1_6_RACI_ORGANIZATION.md`](/raw/PHASE_1_6_RACI_ORGANIZATION.md)