---
title: "Phase 1.3: Business Rules & Constraints Formalization"
tags:
  - ingested
  - source-md
  - group-raw-root
links:
  - "/raw/PHASE_1_3_CONSTRAINT_FORMALIZATION.md"
created: 2026-04-15T17:11:14.563Z
source: "/raw/PHASE_1_3_CONSTRAINT_FORMALIZATION.md"
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
# Phase 1.3: Business Rules & Constraints Formalization
## IPMS Investment Portfolio Management System

**Execution Date:** 11 April 2026  
**Status:** ✅ COMPLETE & DELIVERED  
**Report Length:** 5,200+ words  
**Output Scope:** 18 constraint templates, 5 COBOL stubs, 8 DB2 triggers, 54 test cases

---

## Executive Summary

### Phase Objective
Formalize 18 business rules identified in Phase 1.1 into executable constraint specifications with comprehensive enforcement mechanisms, test coverage, and governance procedures.

### Key Findings
- **100% of business rules (18/18) mapped to formal constraint specifications** with OWL axioms, Drools pseudo-code, and enforcement implementations
- **Critical Gaps Confirmed:**
  - **BR-005 (Amount Formula):** No DB2 enforcement; invalid qty×price combinations currently allowed → Q1 2026 remediation
  - **BR-007 (Quantity Precision):** DECIMAL(18,3) truncates COBOL 4-decimal requirement → Q2 2026 DB2 migration
- **Test Coverage:** 54 test scenarios across 18 rules (3 per rule = positive + negative + edge)
- **Enforcement Architecture:** 3-tier model (DB2 triggers for data-layer constraints, COBOL stubs for business-logic validation, Drools engine for complex rules)

### Phase A Blocking Actions (Q1 2026)
| Rule | Priority | Blocker | Remediation |
|------|----------|---------|-------------|
| BR-005 | CRITICAL | Amount formula not validated | ADD CHECK constraint + trigger |
| BR-007 | CRITICAL | Quantity precision truncation | Migrate DECIMAL 18,3 → 18,4 |

### Phase B Implementation (Q1-Q2 2026)
- BR-001 (Portfolio FSM), BR-004 (Amount Range), BR-012 (Audit), BR-013 (Authorization)

### Phase C Deferred (Q2-Q3 2026)
- 12 remaining rules (BR-002, BR-003, BR-006, BR-008, BR-009, BR-010, BR-011, BR-014, BR-015, BR-016, BR-017, BR-018)

---

## DELIVERABLE 1: CONSTRAINT TEMPLATE LIBRARY

### BR-001: Portfolio State Machine

```
RULE ID: BR-001
Title: Portfolio State Machine (P→A→C|S)
Business Objective: Enforce valid portfolio lifecycle; prevent invalid state transitions
  that would corrupt financial recordkeeping.

OWL Axiom: ∀p ∈ Portfolio: 
  - p.status ∈ {Pending, Active, Closed, Suspended}
  - Pending → Active (required for all new portfolios)
  - Active → {Closed, Suspended} (portfolio end-of-life)
  - Suspended ↔ Active (reversible, for temporary holds)
  - No backward transitions to Pending
  - Closed is terminal (no transitions out)

Enforcement Points: 
  1. PORTUPDT COBOL program (CICS transaction PTAR)
  2. PORTFOLIO_MASTER table UPDATE trigger (DB2)
  3. PORTMSTR module status update routine

CONSTRAINT SPECIFICATION:
  1. Type: State Machine / Enumeration
  2. Scope: Portfolio lifecycle (portfolio-level)
  3. Trigger: On UPDATE to PORTFOLIO_MASTER.STATUS
  4. Validation Logic (pseudo):
     - Current state = PORTFOLIO_MASTER.STATUS
     - Proposed state = NEW.STATUS
     - Valid transitions:
       * Pending → Active ONLY (first state change)
       * Active → Closed (unidirectional)
       * Active → Suspended (reversible)
       * Suspended → Active (reversible)
       * All other transitions → REJECT
  5. Error Handling: ROLLBACK, return code 008 (Invalid state transition)
  6. Exception Cases: None (state machine is absolute)

ENFORCEMENT MECHANISMS:
  ☑ DB2 trigger (BEFORE UPDATE on PORTFOLIO_MASTER)
  ☑ COBOL procedural validation (PORTUPDT)
  ☐ Application layer (implicit in trigger)

OWL→DROOLS (Pseudo-code):
  rule "Portfolio Valid State Transition"
    when
      $p: Portfolio(status != null)
      $newStatus: String()
      eval(isValidTransition($p.status, $newStatus))
    then
      insert(new StateTransitionValidation($p.portfolioId, true));
  end
  
  function isValidTransition(current, proposed):
    validMap = {
      "Pending": ["Active"],
      "Active": ["Closed", "Suspended"],
      "Suspended": ["Active"],
      "Closed": []
    }
    return validMap[current].contains(proposed)

OWL→COBOL (Pseudo-code):
  PROCEDURE VALIDATE-PORTFOLIO-STATUS-CHANGE
    MOVE PORTFOLIO-CURRENT-STATUS TO WS-CURRENT-STATE
    MOVE PORTFOLIO-NEW-STATUS TO WS-PROPOSED-STATE
    
    EVALUATE TRUE
      WHEN WS-CURRENT-STATE = "P" AND WS-PROPOSED-STATE = "A"
        MOVE "Y" TO WS-VALID-FLAG
      WHEN WS-CURRENT-STATE = "A" AND WS-PROPOSED-STATE = "C"
        MOVE "Y" TO WS-VALID-FLAG
      WHEN WS-CURRENT-STATE = "A" AND WS-PROPOSED-STATE = "S"
        MOVE "Y" TO WS-VALID-FLAG
      WHEN WS-CURRENT-STATE = "S" AND WS-PROPOSED-STATE = "A"
        MOVE "Y" TO WS-VALID-FLAG
      WHEN OTHER
        MOVE "N" TO WS-VALID-FLAG
        MOVE "008" TO WS-ERROR-CODE
        MOVE "Invalid portfolio state transition attempted" 
          TO WS-ERROR-MESSAGE
    END-EVALUATE

OWL→SQL (Pseudo-code):
  CREATE TRIGGER TR_BR_001_PORTFOLIO_STATUS_VALID
  BEFORE UPDATE ON PORTFOLIO_MASTER
  FOR EACH ROW
  BEGIN
    IF NEW.STATUS NOT IN ('P', 'A', 'C', 'S') THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 
        'Invalid portfolio status value';
    END IF;
    
    IF NOT (
      (OLD.STATUS = 'P' AND NEW.STATUS = 'A') OR
      (OLD.STATUS = 'A' AND NEW.STATUS IN ('C', 'S')) OR
      (OLD.STATUS = 'S' AND NEW.STATUS = 'A') OR
      (OLD.STATUS = NEW.STATUS)
    ) THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 
        CONCAT('Invalid state transition: ', OLD.STATUS, ' -> ', NEW.STATUS);
    END IF;
  END;

TEST CASES:
  TC-BR-001-001 (Positive):
    Input: Portfolio status P → A transition
    Expected: PASS (valid first state change)
    Verification: PORTFOLIO_MASTER.STATUS updated to 'A', RC=0
    
  TC-BR-001-002 (Negative):
    Input: Portfolio status A → P transition (backward to Pending)
    Expected: FAIL with RC=8
    Verification: Transaction rolled back, error message logged, STATE unchanged
    
  TC-BR-001-003 (Edge):
    Input: Portfolio status C → S transition (attempt from terminal Closed state)
    Expected: FAIL with RC=8
    Verification: Terminal state transition rejected, ERRLOG record created
```

### BR-002: Portfolio ID Pattern

```
RULE ID: BR-002
Title: Portfolio ID Format Validation (^PORT[0-9]{4}$)
Business Objective: Enforce portfolio ID naming convention; ensure uniqueness, 
  consistency, and human readability across all systems.

OWL Axiom: ∀p ∈ Portfolio: p.portfolioId MATCHES "^PORT[0-9]{4}$"
  - Exactly 8 characters
  - Prefix "PORT" (4 chars)
  - Followed by exactly 4 decimal digits
  - Examples: PORT0001, PORT9999
  - Non-examples: PORT00001 (too long), port0001 (lowercase), PORT000A (non-digit)

Enforcement Points:
  1. PORTADD COBOL program (portfolio creation)
  2. INSERT trigger on PORTFOLIO_MASTER (DB2)
  3. CICS transaction validation before EXEC SQL

CONSTRAINT SPECIFICATION:
  1. Type: Format / Pattern Matching
  2. Scope: Portfolio creation (INSERT), not UPDATE (immutable once created)
  3. Trigger: On INSERT + Initial entry validation in PORTADD
  4. Validation Logic:
     - Parse PORTFOLIO_MASTER.PORTFOLIO_ID
     - Check length = 8
     - Check prefix = "PORT"
     - Check chars 5-8 are numeric
  5. Error Handling: REJECT INSERT with code 00A (Invalid portfolio ID format)
  6. Exception Cases: None (format is absolute)

ENFORCEMENT MECHANISMS:
  ☑ DB2 CHECK constraint + trigger (INSERT validation)
  ☑ COBOL pattern validation (PORTADD before EXEC SQL)
  ☐ Application layer (redundant with DB2)

OWL→DROOLS:
  rule "Portfolio ID Format Check"
    when
      $p: Portfolio(portfolioId != null)
      eval(!$p.portfolioId.matches("^PORT[0-9]{4}$"))
    then
      insert(new ConstraintViolation("BR-002", $p.portfolioId, 
        "Invalid format; must match PORT[0-9]{4}"));
  end

OWL→COBOL:
  PROCEDURE VALIDATE-PORTFOLIO-ID-FORMAT
    MOVE FUNCTION LENGTH(PORTFOLIO-ID) TO WS-ID-LENGTH
    IF WS-ID-LENGTH NOT = 8
      MOVE "N" TO WS-VALID-FLAG
      MOVE "00A" TO WS-ERROR-CODE
      MOVE "Portfolio ID must be exactly 8 characters" 
        TO WS-ERROR-MESSAGE
      GOBACK
    END-IF
    
    IF PORTFOLIO-ID(1:4) NOT = "PORT"
      MOVE "N" TO WS-VALID-FLAG
      

## Sources
- [`/raw/PHASE_1_3_CONSTRAINT_FORMALIZATION.md`](/raw/PHASE_1_3_CONSTRAINT_FORMALIZATION.md)