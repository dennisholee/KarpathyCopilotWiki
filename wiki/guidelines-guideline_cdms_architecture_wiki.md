---
title: "Customer Data Management System (CDMS) Data Architecture Wiki## 1. Executive Summary & Purpose"
tags:
  - ingested
  - source-md
  - grouped-ingest
  - group-guidelines
links:
  - "/raw/guidelines/guideline_CDMS_Architecture_Wiki.md"
created: 2026-04-16T02:29:18.868Z
source: "/raw/guidelines/guideline_CDMS_Architecture_Wiki.md"
---

## Group Context
- Folder group: guidelines
- Related raw sources in this group:
  - /raw/guidelines/guideline_bian_customer_data_domain_wiki.md
  - /raw/guidelines/guideline_openmetadata.md
  - /raw/guidelines/OECD_Guidance_for_the_Standard_Audit_File_Tax_v2.0.md
  - /raw/guidelines/OECD_Guidance_for_the_Standard_Audit_File_Tax_v2.0.pdf

## Source Content
To align perfectly with the 13 specific data domains (custodianship assets) identified in the reference architecture, the Section 2: Conceptual Data Model and Section 4: Data Product Catalog have been updated.
------------------------------
## Customer Data Management System (CDMS) Data Architecture Wiki## 1. Executive Summary & Purpose
Domain Mission: To provide a unified, trusted, and real-time "Golden Record" for all party data. This domain solves fragmented identities, enabling personalized servicing, regulatory compliance, and seamless lifecycle management.
Success Metrics: >98% precision in Entity Resolution; 100% population of mandatory KYC fields.
## 2. Conceptual Data Model (The "What")
The CDMS is composed of 13 core data assets serving as the foundational building blocks for the customer record:

   1. Party: The base entity record.
   2. Individual: Personal attributes for natural persons.
   3. Organization: Legal and structural data for corporate entities.
   4. Segmentation & Classification: Behavioral and value-based tiering.
   5. Tax: Regulatory tax residency and reporting identifiers.
   6. Consents & Preferences: Marketing opt-ins and privacy settings.
   7. Contact Points: Addresses, emails, and phone numbers.
   8. Hierarchies & Groupings: Complex structures (e.g., Mastergroups).
   9. Financial Crime Risk: KYC/AML scores and PEP status.
   10. Party Agreement: Legal contracts linking parties to products.
   11. Product Holdings: Summary of active services held by the party.
   12. Roles & Relationships: Definitions of party-to-party interactions.
   13. Contact History: A chronological log of all interactions.

## 3. Data Flow & Integration (The "How")

* Ingestion: Real-time via Kafka for "Data Change Drafting" and Batch via S3 for "External Party Data Monitoring."
* Transformation: Standardization via Address Validation and Entity Resolution services.

## 4. Data Product Catalog (The "Outputs")
The Golden Record: A consolidated output encompassing all 13 data assets listed in Section 2.

* Query & Consumption: REST/GraphQL APIs for real-time servicing; Snowflake for "Market/Product Footprint" reporting.

## 5. Governance & Compliance

* Sensitivity: PII (Individual, Tax, Contact Points) and Highly Sensitive (Financial Crime Risk).
* Access Control: Field-level masking based on user role (e.g., Tax and Risk data restricted to Compliance roles).

## 6. Observability & Technical Health

* SLAs: Profile updates reflected in <10 seconds; 99.99% API availability.
* Monitoring: Automated alerts for "Data Validation Exceptions."

## 7. Versioning & Change Management

* Policy: Schema changes to any of the 13 assets require a 90-day deprecation notice.
* Maintenance: Automated "Party Merge & Purge" logs for auditability.

## Sources
- [`/raw/guidelines/guideline_CDMS_Architecture_Wiki.md`](/raw/guidelines/guideline_CDMS_Architecture_Wiki.md)