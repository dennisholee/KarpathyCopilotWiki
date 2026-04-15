---
title: "📘 BIAN Customer Data Domains Wiki"
tags:
  - ingested
  - source-md
  - group-raw-root
links:
  - "/raw/guideline_bian_customer_data_domain_wiki.md"
created: 2026-04-15T17:11:14.366Z
source: "/raw/guideline_bian_customer_data_domain_wiki.md"
---

## Group Context
- Folder group: raw root
- Related raw sources in this group:
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
  - /raw/PHASE_1_6_SEMANTIC_GOVERNANCE_CAPSTONE.md
  - /raw/PHASE_2_IMPLEMENTATION_KICKOFF.md

## Source Content
# 📘 BIAN Customer Data Domains Wiki
### *OpenMetadata-Compatible Semantic Contracts for Customer-Centric Banking*

> **Scope**: BIAN Service Domains managing customer identity, relationships, holdings, agreements, and tax data [[3]][[11]][[21]][[41]][[51]][[61]][[71]][[81]]  
> **Format**: OpenMetadata v1.x `Domain` entities with `bian_semantic_contract` custom properties  
> **Version**: BIAN v12.1 / OpenMetadata 1.4+

---

## 🗂️ Table of Contents

1. [Domain Overview Matrix](#domain-overview-matrix)
2. [Party Lifecycle Management](#party-lifecycle-management)
3. [Party Reference Data Directory](#party-reference-data-directory)
4. [Customer Relationship Management](#customer-relationship-management)
5. [Customer Agreement](#customer-agreement)
6. [Customer Product & Service Directory](#customer-product--service-directory)
7. [Customer Tax Handling](#customer-tax-handling)
8. [Customer Position](#customer-position)
9. [OpenMetadata Import Guide](#openmetadata-import-guide)
10. [Business Rules Reference](#business-rules-reference)

---

## 📊 Domain Overview Matrix

| Domain | BIAN Asset Type | Functional Pattern | Core Business Object | Primary Use Case |
|--------|----------------|-------------------|---------------------|-----------------|
| **Party Lifecycle Management** | `PartyRelationship` | `Process` | Party Relationship Lifecycle Phase | KYC/onboarding qualification checks [[11]] |
| **Party Reference Data Directory** | `PartyReferenceData` | `Catalog` | Customer Reference Data Entry | Central party reference for all interactions [[61]] |
| **Customer Relationship Management** | `CustomerRelationship` | `Manage` | Customer Relationship Plan | Relationship development & retention [[21]] |
| **Customer Agreement** | `CustomerAgreement` | `Agree Terms` | Customer Master Agreement | Master legal terms & conditions [[71]] |
| **Customer Product & Service Directory** | `CustomerProductService` | `Catalog` | In-force Product/Service Entry | Holdings inventory (no balances) [[51]] |
| **Customer Tax Handling** | `CustomerTaxObligation` | `Fulfill` | Customer Tax Report | Consolidated tax reporting [[41]] |
| **Customer Position** | `CustomerFinancialPosition` | `Track` | Consolidated Position Statement | Unified financial snapshot [[81]] |

---

## 🧑 Party Lifecycle Management

### Business Context & Rules
```markdown
**Purpose**: Tracks the state of a party relationship with the bank from initial 
qualification checks through ongoing maintenance [[11]].

**Key Business Rules**:
1. Qualification checks MUST vary by party type (individual, corporate, partner) 
   and jurisdiction
2. Regulatory KYC/AML checks MUST be performed before relationship activation
3. Periodic re-assessments MUST follow regulatory schedules or event triggers
4. Status changes MUST generate notifications to dependent service domains
5. All checks MUST be auditable with full provenance

**Lifecycle States**: 
`Prospect` → `Under Review` → `Qualified` → `Active` → `Suspended` → `Terminated`

**Compliance Dependencies**: 
- Local AML/KYC regulations (e.g., FATF, EU AMLD)
- Data residency requirements for party attributes
```

### OpenMetadata Domain Contract
```json
{
  "id": "bian-party-lifecycle-mgmt",
  "name": "Party Lifecycle Management",
  "description": "Tracks party relationship state from initial qualification checks through ongoing maintenance per regulatory requirements.",
  "owner": { "type": "team", "id": "customer-onboarding" },
  "tags": [
    { "tagFQN": "BIAN.ServiceDomain", "source": "manual" },
    { "tagFQN": "BIAN.FunctionalPattern.Process", "source": "manual" },
    { "tagFQN": "DataClassification.PII", "source": "manual" },
    { "tagFQN": "Regulatory.KYC", "source": "manual" }
  ],
  "customProperties": {
    "bian_semantic_contract": {
      "contract_version": "BIAN v12.1",
      "asset_type": "PartyRelationship",
      "functional_pattern": "Process",
      "control_record": "PartyRelationshipProcedure",
      "service_operations": [
        "initiatePartyLifecycle",
        "retrievePartyStatus", 
        "updateQualificationChecks",
        "executePeriodicReassessment",
        "controlLifecycleState"
      ],
      "data_entities": [
        "PartyRelationship",
        "QualificationCheck",
        "RegulatoryRequirement",
        "LifecyclePhase",
        "StatusNotification"
      ],
      "lifecycle_states": ["Prospect", "Under Review", "Qualified", "Active", "Suspended", "Terminated"],
      "business_rules": [
        "Rule-PLM-001: Jurisdiction-specific checklists MUST be applied per party type",
        "Rule-PLM-002: Failed KYC checks MUST halt progression to Active state",
        "Rule-PLM-003: Reassessment triggers MUST include time-based and event-based conditions",
        "Rule-PLM-004: All state transitions MUST emit audit events"
      ],
      "dependencies": [
        "Party Reference Data Directory",
        "Customer Agreement", 
        "Legal Entity Directory",
        "Guideline Compliance"
      ],
      "contract_endpoint_spec": {
        "base_path": "/v1/party/lifecycle",
        "auth": "OAuth2 + Mutual TLS",
        "data_format": "JSON (ISO 20022 party.001 aligned)",
        "rate_limit": "100 req/min per client"
      }
    }
  }
}
```

---

## 📇 Party Reference Data Directory

### Business Context & Rules
```markdown
**Purpose**: Maintains canonical party reference information used across all 
banking interactions including relationship development, sales, servicing, 
and product delivery [[61]].

**Key Business Rules**:
1. Single source of truth for party identifiers (internal IDs, LEI, tax IDs)
2. Demographic data MUST be validated against authoritative sources where available
3. Contact preferences MUST respect channel-specific consent records
4. Association data (e.g., corporate hierarchies) MUST maintain referential integrity
5. Updates MUST propagate to subscribed domains within SLA bounds

**Data Categories**:
- Identity: Legal name, identifiers, tax numbers
- Contact: Addresses, phone, email, preferred channels  
- Demographics: Age band, segment, risk indicators
- Associations: Corporate structures, authorized signatories, relationships

**Governance**: 
- Master Data Management (MDM) ownership required
- Change approval workflow for critical attributes
```

### OpenMetadata Domain Contract
```json
{
  "id": "bian-party-reference-directory",
  "name": "Party Reference Data Directory",
  "description": "Maintains canonical party reference information including identity, contacts, demographics, and associations for use across all banking interactions.",
  "owner": { "type": "team", "id": "master-data-management" },
  "tags": [
    { "tagFQN": "BIAN.ServiceDomain", "source": "manual" },
    { "tagFQN": "BIAN.FunctionalPattern.Catalog", "source": "manual" },
    { "tagFQN": "DataClassification.PII", "source": "manual" },
    { "tagFQN": "DataDomain.ReferenceData", "source": "manual" }
  ],
  "customProperties": {
    "bian_semantic_contract": {
      "contract_version": "BIAN v12.1",
      "asset_type": "PartyReferenceData", 
      "functional_pattern": "Catalog",
      "control_record": "PartyReferenceDataDirectoryEntry",
      "service_operations": [
        "registerPartyEntry",
        "retrievePartyReference",
        "updatePartyAttributes", 
        "controlEntryHandling",
        "executeEntryNotification"
      ],
      "data_entities": [
        "PartyReferenceEntry",
        "IdentityAttributes",
        "ContactDetails", 
        "DemographicIndicators",
        "AssociationRecord",
        "BankingRelationshipLink"
      ],
      "lifecycle_states": ["Draft", "Validated", "Active", "Deprecated", "Archived"],
      "business_rules": [
        "Rule-PRD-001: Party identifiers MUST be globally unique within bank scope",
        "Rule-PRD-002: Contact updates MUST trigger consent re-verification for marketing channels",
        "Rule-PRD-003: Corporate hierarchy changes MUST validate circular refer

## Sources
- [`/raw/guideline_bian_customer_data_domain_wiki.md`](/raw/guideline_bian_customer_data_domain_wiki.md)