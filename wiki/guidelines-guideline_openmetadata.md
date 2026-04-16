---
title: "Technical Guideline: The Contract Hierarchy"
tags:
  - ingested
  - source-md
  - grouped-ingest
  - group-guidelines
links:
  - "/raw/guidelines/guideline_openmetadata.md"
created: 2026-04-16T02:29:18.881Z
source: "/raw/guidelines/guideline_openmetadata.md"
---

## Group Context
- Folder group: guidelines
- Related raw sources in this group:
  - /raw/guidelines/guideline_bian_customer_data_domain_wiki.md
  - /raw/guidelines/guideline_CDMS_Architecture_Wiki.md
  - /raw/guidelines/OECD_Guidance_for_the_Standard_Audit_File_Tax_v2.0.md
  - /raw/guidelines/OECD_Guidance_for_the_Standard_Audit_File_Tax_v2.0.pdf

## Source Content
To implement an OpenMetadata (OM) Data Contract, you must follow a schema-first structure that integrates Schema Enforcement, Data Quality, and Service Level Agreements (SLAs) into a single JSON/YAML definition.
## Technical Guideline: The Contract Hierarchy
The OM model treats a contract as an "Expectation Wrapper" around a logical entity (like a Table or Topic). The technical structure is divided into four key blocks:

   1. Identity & Scope: Links the contract to a specific versioned entity and owner.
   2. Schema Constraints: Defines exactly which columns/fields are "contracted" and their data types.
   3. Quality Assertions: References specific testCase entities that must pass for the contract to stay in ACTIVE status.
   4. SLA Requirements: Quantifiable operational metrics like freshness and availability.

------------------------------
## Comprehensive Example: Order System Contract
This example demonstrates a contract for a Snowflake table named fact_orders. It enforces a strict schema, specific data quality tests, and a 24-hour freshness SLA.

# OpenMetadata Data Contract Specificationname: "Orders_Financial_Contract"description: "Contract between Order-Service (Producer) and Finance-Analytics (Consumer)"status: "ACTIVE"  # Lifecycle: DRAFT, ACTIVE, DEPRECATED, RETIREDowner: 
  name: "order_platform_team"
  type: "team"
# 1. Target Entity (The asset being governed)entity:
  type: "table"
  fqn: "snowflake.production.sales.fact_orders"
# 2. Schema Specification (Schema Enforcement)schema:
  strict: true  # If true, any columns added to the table NOT listed here violate the contract
  columns:
    - name: "order_id"
      dataType: "UUID"
      required: true
      description: "Primary key for order tracking"
    - name: "total_amount"
      dataType: "DECIMAL"
      precision: 10
      scale: 2
      required: true
    - name: "currency"
      dataType: "STRING"
      validation: 
        values: ["USD", "GBP", "EUR"] # Enum-style validation
# 3. Data Quality Assertions (Business Rules)# These map to TestCases already defined in the OpenMetadata Profilerquality:
  - testCase: "snowflake.production.sales.fact_orders.check_not_null_order_id"
    severity: "CRITICAL"
  - testCase: "snowflake.production.sales.fact_orders.check_range_total_amount"
    parameters:
      min: 0.01
    severity: "MAJOR"
# 4. Service Level Agreements (Operational Rules)sla:
  - name: "Freshness"
    description: "Data must be updated every 24 hours"
    property: "lastUpdate"
    condition: "<="
    value: "24h"
  - name: "Availability"
    description: "Uptime for the source system"
    property: "uptime"
    condition: ">="
    value: "99.9%"
# 5. Lifecycle & Incident ConfigincidentManagement:
  enabled: true
  notifyOwners: true
  autoCreateTicket: true # Integration with Jira/PagerDuty

------------------------------
## Best Practices for the Technical Schema

* Version Control: Store these YAML definitions in your Git repository alongside your DDL/SQL. Use the OpenMetadata API/CLI to "push" the contract during deployment.
* FQN Matching: Ensure the fqn (Fully Qualified Name) exactly matches the entity in the OpenMetadata catalog; otherwise, the automated monitoring will fail to link.
* Granularity: Do not contract every column in a table. Only include columns that are critical for downstream consumers to reduce "maintenance tax."
* Strict Mode: Use strict: true for gold-tier datasets to prevent "schema drift" where upstream teams add columns that might contain PII without review.

## Sources
- [`/raw/guidelines/guideline_openmetadata.md`](/raw/guidelines/guideline_openmetadata.md)