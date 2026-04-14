---
title: "Decision - what business rules exists in the porfolio applica"
summary: "Archived decision for query: what business rules exists in the porfolio applica"
created: 2026-04-14T16:16:27.772Z
modified: 2026-04-14T16:16:27.772Z
tags: ["decision", "copilot-chat", "archived"]
links:
  - "[[Phase 1.5: Data Quality Dimension Analysis for IPMS]]"
  - "[[Phase 1.5: Quick Reference & Navigation Guide]]"
  - "[[Phase 1.4 Data Lineage & PROV Provenance - Quick Reference]]"
  - "[[Phase 1.6: Semantic Data Governance Capstone]]"
  - "[[Phase 1.3: Business Rules & Constraints Formalization]]"
---

# Decision - what business rules exists in the porfolio applica

## Summary
Archived decision for query: what business rules exists in the porfolio applica

## Tags
- decision
- copilot-chat
- archived

## Links

- [[Phase 1.5: Data Quality Dimension Analysis for IPMS]]
- [[Phase 1.5: Quick Reference & Navigation Guide]]
- [[Phase 1.4 Data Lineage & PROV Provenance - Quick Reference]]
- [[Phase 1.6: Semantic Data Governance Capstone]]
- [[Phase 1.3: Business Rules & Constraints Formalization]]

## Content

### Question
what business rules exists in the porfolio application

### Conversation

**User:** what business rules exists in the porfolio application

**Assistant:** **Direct Answer**

The available evidence says the portfolio application has **18 business rules** in its business context, but it does **not provide the full list** here. The rules explicitly referenced are **BR-015 Portfolio balance**, **BR-002 Portfolio ID format**, and **BR-006 Transaction type enum**; it also notes that **position cost basis is optional per business rules**. Separate from those business rules, the Phase 1.5 assessment formalized **57 data-quality rules** across 5 dimensions, so those should not be assumed to be the same as the 18 application business rules.

**Key Details**

- 95% target) - Batch reconciliation jobs miss SLA 60% of the time - Portfolio-to-Position updates lag by 2-8 hours - Audit trail async commit backlog: ~2,400 entries/day - Business Impact: Decision-makers use stale data; regulatory reports out of sync - Root Cause: Single-threaded audit writer bottleneck; CICS→DB2 sync delays 2.
- Phase 1.5: Quick Reference & Navigation Guide Phase 1.5: Data Quality Dimension Analysis - COMPLETE Execution Date: 11 April 2026 Status: ✅ ALL DELIVERABLES COMPLETE & DELIVERED Quality Score: 87.3 / 100 Total Pages: 4,000+ words across 4 documents Rules Formalized: 57 DQ rules across 5 dimensions SQL Procedures: 10+ automated daily checks --- QUICK LINKS TO DELIVERABLES 📄 Main Deliverables (File Locations) | Document | Purpose | Pages | Key Metrics | |----------|---------|-------|-------------| | PHASE15DATAQUALITYDIMENSIONANALYSIS.md | Executive assessment + baseline metrics | 65+ | 87.3% overall score | | PHASE15DQRULESREGISTRY.md | 57 formal DQ rule specifications | 45+ | 12 C-rules, 14 A-rules, 16 CN-rules, 8 U-rules, 7 T-rules | | PHASE15SQLPROCEDURES.md | 10+ production SQL queries | 30+ | Daily + hourly automated checks | | PHASE15QUICKREFERENCE.md | This document | 5+ | Navigation + summaries | --- EXECUTIVE DASHBOARD (ONE-PAGE VIEW) --- CRITICAL ISSUES SUMMARY TABLE | Severity | Issue | Gap | Records | Root Cause | Timeline | Owner | |----------|-------|-----|---------|-----------|----------|--------| | 🔴 P1 | Timeliness SLA (batch jobs) | -35% | 600/mo | RTNANA perf, no indexes | W1-W2 | Ops | | 🔴 P1 | Portfolio balance (BR-015) | -10.5% | 735 | Dividend logic, async updates | W1-W2 | DBA | | 🔴 P1 | Audit trail (81.8% coverage) | -17.2% | 12.5K/mo | Single-threaded writer | W2-W3 | Arch | | 🟡 P2 | FK violations (orphans) | -0.7% | 1,240 | Soft-delete cascade | W2 | DBA | | 🟡 P2 | Portfolio ID format (BR-002) | -0.2% | 18 | No validation at entry | W3 | Dev | | 🟡 P2 | Transaction type enum (BR-006) | -0.3% | 420 | ETL mapping missing | W3-W4 | ETL | --- KEY FINDINGS BY DIMENSION 1.
- COMPLETENESS (94.2% vs 99% target) Good News: PK/FK fields nearly perfect (99.99% filled) Problem Areas: - Portfolio names: 320 NULLs (5.3%) ← backfill from COBOL archive - Transaction descriptions: 12K NULLs (8%) ← new ETL missing mapping - Position cost basis: 2.9K NULLs (8.3%) ← optional per business rules Remediation: Week 1-2 | Effort: 3 hours --- 2.
- 23:15 UTC → DQACCURACYRULESCHECKDAILY.sql 3.

**Supporting References**

- Wiki: Phase 1.5: Data Quality Dimension Analysis for IPMS
- Wiki: Phase 1.5: Quick Reference & Navigation Guide
- Wiki: Phase 1.4 Data Lineage & PROV Provenance - Quick Reference
- Wiki: Phase 1.6: Semantic Data Governance Capstone
- Wiki: Phase 1.3: Business Rules & Constraints Formalization

### Rationale

- Answer archived from the grounded wiki query flow.
- Supporting wiki pages: Phase 1.5: Data Quality Dimension Analysis for IPMS, Phase 1.5: Quick Reference & Navigation Guide, Phase 1.4 Data Lineage & PROV Provenance - Quick Reference, Phase 1.6: Semantic Data Governance Capstone, Phase 1.3: Business Rules & Constraints Formalization

## Metadata
- **Archived**: 2026-04-14T16:16:27.772Z
- **Conversation Length**: 2 messages
- **Supporting Pages**: 5
