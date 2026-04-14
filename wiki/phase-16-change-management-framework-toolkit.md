---
title: "PHASE 1.6 CHANGE MANAGEMENT FRAMEWORK & TOOLKIT"
modified: 2026-04-14T15:42:00.563Z
---

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

Technical Lead Approval:   ________________________  Date: __________

Business Steward Approval: ________________________  Date: __________

Governance Approval:       ________________________  Date: __________  
[Appropriate authority per change type]
```

### Impact Analysis Checklist (FORM CG-002)

```
═══════════════════════════════════════════════════════════════════════════
              IMPACT ANALYSIS CHECKLIST FOR GOVERNANCE CHANGES
═══════════════════════════════════════════════════════════════════════════

Change Request ID: [CGMR-XXXX]    Change Title: [CHANGE TITLE]
Impact Analysis Owner: [NAME]     Analysis Date: [DATE]

SYSTEM IMPACT ANALYSIS
──────────────────────────────────────────────────────────────────────────
Affected Systems:
  [ ] DB2 PORTFOLIO_MASTER table
  [ ] DB2 POSITION_MASTER table
  [ ] DB2 TRANSACTION table
  [ ] DB2 ACCOUNT_MASTER table
  [ ] DB2 AUDITLOG table
  [ ] CICS online transaction processing
  [ ] COBOL batch programs
  [ ] Other: _____________________

DATABASE IMPACT
──────────────────────────────────────────────────────────────────────────
Schema changes:                [ ] Yes [ ] No
  If yes: [ ] Columns added     [ ] Columns deleted     [ ] Data type changed
           [ ] Indexes added    [ ] Constraints added  [ ] Triggers added

Data migration needed:         [ ] Yes [ ] No
  If yes: Estimated records affected: [NUMBER]
          Estimated migration time: [HOURS]
          Manual intervention: Yes [ ] No [ ]

Performance impact:            [ ] Yes [ ] No
  If yes: [ ] Query performance degradation expected
          [ ] Index strategy update required
          [ ] Archive/purge needed

COBOL PROGRAM IMPACT
──────────────────────────────────────────────────────────────────────────
Programs affected:
  [ ] Portfolio programs: PORTADD, PORTUPDT, PORTQRY, PORTMSTR, _____
  [ ] Position programs: POSHOLD, POSTRAN, POSVAL, _____
  [ ] Batch programs: PRCSEQ, BCHCON, RTNANA, _____
  [ ] Other: _____

Code changes impact:           [ ] None [ ] Minor [ ] Moderate [ ] Significant
  [ ] New COPY modules needed
  [ ] Existing paragraphs modified
  [ ] New business logic added
  [ ] Interaction points with other programs changed

Compilation verification:      [ ] New programs compile successfully
                              [ ] Existing programs compile without errors
                              [ ] Link-edit successful
                              [ ] CICS map compilation (if BMS changes)

BUSINESS RULE IMPACT
──────────────────────────────────────────────────────────────────────────
Business rules affected:
  Current rules impacted:     [BR-001] [BR-002] [BR-004] [BR-015] [etc]
  [ ] Rules modified (logic changed)
  [ ] Rules added (new constraints)
  [ ] Rules removed (constraints eliminated)
  [ ] Rules prioritized (enforcement order changed)

Rule enforcement verification: [ ] All affected rules still enforced
                              [ ] Enforcement mechanism working
                              [ ] Edge cases tested

DATA LINEAGE IMPACT
──────────────────────────────────────────────────────────────────────────
Data flows affected:
  [ ] F-001 (Portfolio Inquiry → Portfolio Master Update)
  [ ] F-002 (Position Creation & Valuation)
  [ ] F-003 (Transaction Processing)
  [ ] F-004 (Audit Trail Generation)
  [ ] F-005 (Batch Reconciliation)

Lineage documentation:        [ ] Updated (W3C PROV models refreshed)
                              [ ] No changes required

Field-level lineage:          [ ] All affected fields re-mapped
                              [ ] Mapping conflicts resolved

DQ RULES IMPACT
──────────────────────────────────────────────────────────────────────────
DQ rules affected:            [NUMBER: X of 57 DQ rules impacted]

Rules requiring updates:
  [ ] Completeness rules (null checking logic)
  [ ] Accuracy rules (constraint validation)
  [ ] Consistency rules (cross-field validation)
  [ ] Uniqueness rules (duplicate detection)
  [ ] Timeliness rules (SLA checking)

Testing coverage:             [ ] All 57 DQ rules validated in new environment
                              [ ] New DQ scenarios tested

CROSS-DOMAIN IMPACT
──────────────────────────────────────────────────────────────────────────
Portfolio domain:             [ ] Impacted    [ ] Not impacted
Position domain:              [ ] Impacted    [ ] Not impacted
Transaction domain:           [ ] Impacted    [ ] Not impacted
Audit domain:                 [ ] Impacted    [ ] Not impacted

Inter-domain dependencies:    [ ] Portfolio ↔ Position consistency
                              [ ] Position ↔ Transaction integration
                              [ ] All ↔ Audit trail completeness
                              [ ] None

TESTING REQUIREMENTS
──────────────────────────────────────────────────────────────────────────
Test Plan Required:           [ ] Yes [ ] No
  Estimated test effort:      [HOURS]
  Test environments needed:   [ ] DEV [ ] TEST [ ] STAGING [ ] PROD
  Test data: [ ] Use existing  [ ] Generate new scenarios

Regression Testing:           [ ] Required (ALL existing test cases re-run)
                              [ ] Not required

User Acceptance Testing:      [ ] Required (business user validation)
                              [ ] Not required
  Business users: [NAMES/DEPARTMENTS]

DEPLOYMENT IMPACT
──────────────────────────────────────────────────────────────────────────
Deployment complexity:        [ ] Simple (1-step fix)  [ ] Moderate  [ ] Complex (multi-night window)

Deployment window needed:     [ ] Off-business hours    [ ] Weekend   [ ] Scheduled maintenance window

System downtime:              [ ] None (online deployment)   [ ] <1 hour   [ ] 1-4 hours   [ ] 4+ hours

Rollback complexity:          [ ] Simple (revert script, <5 min)
                              [ ] Moderate (partial restore, <30 min)
                              [ ] Complex (full DBA intervention, <2 hr)

Rollback SLA:                 [TIME TO RESTORE] minutes

STAKEHOLDER COMMUNICATION
──────────────────────────────────────────────────────────────────────────
Stakeholders to notify:       [ ] Portfolio managers     [ ] Trading operations
                              [ ] Financial reporting   [ ] Compliance/Audit
                              [ ] Business leadership    [ ] System users (all)

Communication plan:           [ ] Draft email notification
                              [ ] Training session needed
                              [ ] Documentation updates required

USER IMPACT ASSESSMENT
──────────────────────────────────────────────────────────────────────────
User groups affected:         [DESCRIBE: Portfolio managers, traders, etc.]
User workflow changes:        [ ] Yes [ ] No
  If yes: Workflow changes documented: [ ] Yes [ ] No

Training required:            [ ] Yes [ ] No
  If yes: [ ] Online training module [ ] In-person sessions [ ] Job aid

Estimated user impact level:  [ ] None [ ] Low [ ] Medium [ ] High

APPROVAL & SIGN-OFF
──────────────────────────────────────────────────────────────────────────
Impact Analysis Completed by: [NAME]                    Date: __________
Reviewed by Technical Lead:   [NAME]                    Date: __________
Approved by Domain Steward:   [NAME]                    Date: __________
Approved by DG Manager:       [NAME]                    Date: __________

IMPACT ANALYSIS SIGN-OFF:     ✅ APPROVED    ❌ NEEDS REVISION
                              
If NEEDS REVISION, describe required changes:
____________________________________________________________________
____________________________________________________________________
```

### Test Plan Template (FORM CG-003)

```
════════════════════════════════════════════════════════════════════════
                       TEST PLAN FOR CHANGE VALIDATION
════════════════════════════════════════════════════════════════════════

Change Request ID: [CGMR-XXXX]   Activity: [BUSINESS RULE NAME]
Test Lead: [NAME]                Test Start Date: [DATE]

TEST SCOPE
─────────────────────────────────────────────────────────────────────────
What is being tested:      [Rule enforcement, DQ measurement, system integration, etc.]
Affected domains:          [Portfolio, Position, Transaction, Audit - check all that apply]
Regression test scope:     [ ] Full regression (all 54 existing tests + new scenarios)
                          [ ] Targeted regression (only related test cases)

TEST STRATEGY
─────────────────────────────────────────────────────────────────────────
Test levels:               [ ] Unit testing      (developer responsibility)
                          [ ] Integration test  (cross-system validation)
                          [ ] System test       (end-to-end functionality)
                          [ ] UAT               (business user validation)
                          [ ] Performance test  (if applicable)

Test environments:         [ ] DEV [ ] TEST [ ] STAGING

Entry criteria:            [ ] Code compiled successfully
                          [ ] Unit testing complete, all defects closed
                          [ ] Manual code review approved
                          [ ] Test environment available

Exit criteria:             [ ] All test cases passed
                          [ ] No critical/high defects remain
                          [ ] Performance baselines met
                          [ ] UAT sign-off obtained
                          [ ] Documentation complete

TEST CASES SPECIFICATION
─────────────────────────────────────────────────────────────────────────
Test Case Categories:

CATEGORY 1 - POSITIVE TEST CASES (Rule works as designed)
  TC-001: Valid Portfolio State Transition (Pending → Active)
    - Setup: Portfolio in Pending status
    - Action: Execute PORTUPDT with status change to Active
    - Expected Result: Portfolio status changed to Active, audit log entry created
    - Test Data: Portfolio P001 created in PENDING state
    
  TC-002: Valid Portfolio State Transition (Active → Closed)
    - Setup: Portfolio in Active status
    - Action: Execute PORTUPDT with status change to Closed
    - Expected Result: Portfolio status changed to Closed, no further changes allowed
    - Test Data: Portfolio P002 created in ACTIVE state

[Add X more positive test cases for comprehensive coverage]

CATEGORY 2 - NEGATIVE TEST CASES (Rule rejects invalid scenarios)
  TC-101: Invalid Portfolio State Transition (Closed→Active - not allowed)
    - Setup: Portfolio in Closed status
    - Action: Attempt PORTUPDT with status change to Active
    - Expected Result: Transaction REJECTED, return code 008 (Invalid state transition)
    - Audit trail: Rejected transaction logged
    
  TC-102: Invalid Portfolio State Transition (Pending→Closed - must go through Active)
    - Setup: Portfolio in Pending status  
    - Action: Attempt PORTUPDT with status change to Closed (skip Active)
    - Expected Result: Transaction REJECTED, portfolio stays Pending
    
[Add X more negative test cases]

CATEGORY 3 - EDGE CASE TESTS
  TC-201: Suspended ↔ Active Toggle (reversible state)
    - Setup: Portfolio in Active status
    - Action: Change to Suspended, then back to Active
    - Expected Result: Both transitions allow, audit trail shows both changes
    
  TC-202: Boundary Values (portfolio limits)
    - Amount at maximum value: $999,999,999.99
    - Amount at minimum value: $0.00
    - Expected Result: Both accepted, amounts calculated correctly

CATEGORY 4 - DATA QUALITY INTEGRATION TEST
  TC-301: DQ Measurement - Accuracy dimension tracks rule violations
    - Setup: Run 100 portfolio state transitions (10% invalid)
    - Action: Calculate accuracy dimension metric
    - Expected Result: Accuracy = 90% (matches 10% violation rate)

  TC-302: DQ Measurement - Consistency dimension impacts
    - Setup: Execute rule changes affecting consistency
    - Action: Measure portfolio total value = SUM(positions)
    - Expected Result: Consistency metric reflects portfolio-position alignment

CATEGORY 5 - REGRESSION TEST (Existing functionality still works)
  TC-401: Existing Portfolio Inquiry (PORTQRY) still functions
    - Action: Execute PORTQRY transaction
    - Expected Result: Portfolio data displayed correctly
    
  TC-402: Existing Position holding (POSHOLD) still functions
    - Action: Execute POSHOLD transaction
    - Expected Result: Position data unchanged, no side effects

[Link to original 54 test cases from Phase 1.3 - all must pass]

CATEGORY 6 - PERFORMANCE TEST (If applicable)
  TC-501: Batch DQ measurement execution time unchanged
    - Action: Execute 57 DQ rules on 75K portfolio records
    - Expected Result: Execution completes in <45 minutes (baseline: 45 min)
    
  TC-502: Transaction throughput unchanged
    - Action: Simulate 1000 PORTUPDT transactions/hour
    - Expected Result: Response time <2 seconds per transaction (baseline: 1.5 sec)

TEST EXECUTION
─────────────────────────────────────────────────────────────────────────
Total test cases:          [NUMBER]
Estimated execution time:  [DAYS]
Test environment allocation: [HOURS/DAY]
Test data setup time:      [HOURS]

Defect tracking system:    [JIRA / Azure DevOps / other tool]
Test execution tool:       [ ] Manual   [ ] Automated (script name: _____)

TEST RESULTS SUMMARY
─────────────────────────────────────────────────────────────────────────
Test Execution Status:     [ ] NOT STARTED  [ ] IN PROGRESS  [ ] COMPLETE

Results:
  Total test cases run:    [NUMBER]
  Passed:                  [NUMBER] ([PERCENT]%)
  Failed:                  [NUMBER] ([PERCENT]%)
  Skipped:                 [NUMBER] ([PERCENT]%)

Defects found:
  Critical:                [NUMBER] - List: _______________
  High:                    [NUMBER] - List: _______________
  Medium:                  [NUMBER] - List: _______________
  Low:                     [NUMBER] - List: _______________

All defects resolved:      [ ] Yes [ ] No
  If No, pending defects: [LIST CRITICAL/HIGH ONLY]

UAT SIGN-OFF
─────────────────────────────────────────────────────────────────────────
User Acceptance Test Conducted By: [BUSINESS USER NAMES]
UAT Date:                          [DATE]
UAT Result:                        [ ] APPROVED   [ ] NEEDS REWORK

Business User Comments:
  [Feedback on functionality, usability, business impact]

DEPLOYMENT READINESS VERIFICATION
─────────────────────────────────────────────────────────────────────────
[ ] All test cases passed (0 critical/high defects)
[ ] Regression tests passed  
[ ] Performance baselines met
[ ] UAT sign-off obtained
[ ] Documentation complete & accurate
[ ] Deployment procedure reviewed
[ ] Rollback procedure tested (validation: <5 min rollback achieved)
[ ] Stakeholder communication plan ready
[ ] Monitoring & alerting configured

SIGN-OFF APPROVAL
─────────────────────────────────────────────────────────────────────────
Test Lead Approval:        ________________________  Date: __________
QA Lead Approval:          ________________________  Date: __________  
Business User Approval:    ________________________  Date: __________

DEPLOYMENT READINESS:      ✅ APPROVED FOR DEPLOYMENT
                          ❌ NOT READY - REMEDIATION REQUIRED
```

---

## SECTION 3: DEPLOYMENT RUNBOOK

### Deployment Checklist for Phase A: BR-005 Amount Formula Enforcement

```
════════════════════════════════════════════════════════════════════════
     DEPLOYMENT RUNBOOK: BR-005 AMOUNT FORMULA VALIDATION
     Target Deployment Date: 15 April 2026
════════════════════════════════════════════════════════════════════════

PRE-DEPLOYMENT VERIFICATION (Day Before: 14 April)
─────────────────────────────────────────────────────────────────────────
[ ] All test cases PASSED in TEST environment
[ ] UAT sign-off obtained from Portfolio Manager group
[ ] Rollback procedure validated (exec time <5 min confirmed)
[ ] Production backup taken (point-in-time restore ready)
[ ] Production has <10% database capacity utilization (no contention)
[ ] CICS system status: Normal, no pending events
[ ] No planned maintenance windows conflicting
[ ] All stakeholders notified (at least 24 hours notice)
[ ] Deployment team assembled & on-call
[ ] Change control approval ticket: CGMR-2026-005

DEPLOYMENT WINDOW
─────────────────────────────────────────────────────────────────────────
Preferred Window:          Saturday 11:00 PM - Sunday 6:00 AM UTC
                          (minimal portfolio trading impact)
Backup Window:             Sunday 11:00 PM - Monday 6:00 AM UTC
RTL (Regression Test Lag): 2 hours (validate production post-deployment)
RTO (Recovery Time Obj):   1 hour (rollback + data resync)

DEPLOYMENT PROCEDURE (Estimated 2 hours total)
─────────────────────────────────────────────────────────────────────────

PHASE 1: PRE-DEPLOYMENT (0:00 - 0:15, 15 minutes)
─────────────────────────────────────────────────────────────────────────
Time    Step                              Owner              Checklist
───────────────────────────────────────────────────────────────────────
00:00   START Deployment window            Deployment Lead   [ ] Time sync across team
        Announce start in war room chat

00:02   Disable CICS PORTUPDT transactions DBA Operations    [ ] CICS quiesce executed
        (allow in-flight to complete,                            Transaction list empty
         no new transactions enter)                              New txns return "System down" msg

00:05   Notify Portfolio managers of       Communications    [ ] Email sent
        brief service window (5 min)                             Phone notification

00:10   Final production database backup   DBA                [ ] Backup file created
        (capture current state before change)                    Backup verified (size OK)
                                                                 Backup log location logged

00:15   "Ready for deployment" checkpoint  Deployment Lead   [ ] All prerequisites complete
        (verify all pre-deployment steps                        [ ] Team thumbs-up received
         completed successfully)                                [ ] Proceed/Abort decision

PHASE 2: DATABASE DEPLOYMENT (0:15 - 0:45, 30 minutes)
─────────────────────────────────────────────────────────────────────────
00:15   Deploy DB2 BR-005 trigger        DBA                [ ] DDL script execution started
        (T-BR-005-AMOUNT-FORMULA)        (Team: 2 DBAs)         SQL execution timestamp logged
                                                                 No errors returned

00:20   Validate trigger deployed         DBA                [ ] Query SYSCAT.TRIGGERS
        (query system catalog)                                   T_BR_005_AMOUNT_FORMULA listed
                                                                 Trigger status: USABLE

00:25   Create test transaction to        DBA                [ ] Test INSERT stmt executed
        verify trigger fires              (Team: DBA + TEST [ ] Trigger fired (log entry)
                                          Lead)              [ ] Expected validation executed

00:30   Validate trigger behavior         QA/DBA             [ ] Valid txn accepted ✓
        - Test 1: Valid amount formula                       [ ] Invalid txn rejected ✓
        - Test 2: Invalid formula (qty×price mismatch)      [ ] Return code 008 generated ✓
                                                             [ ] Audit trail entry created ✓

00:35   Update DB2 indexes (if needed)   DBA                [ ] REORG executed (if applicable)
        for new constraint column                            [ ] Statistics updated
                                                             [ ] Index performance verified

00:45   "Database deployment complete"   DBA Lead           [ ] BR-005 trigger ready
        checkpoint                                          [ ] Validation tests passed
                                                             [ ] System stable

PHASE 3: COBOL PROGRAM DEPLOYMENT (0:45 - 1:15, 30 minutes)
─────────────────────────────────────────────────────────────────────────
00:45   Deploy BR-005-VALIDATE COPY      COBOL Arch         [ ] Compile BR-005-VALIDATE
        module to COBOL library          (Team:  COBOL          Program object created
                                          Team)              [ ] Link-edit PORTUPDT with
                                                                 new COPY module

00:50   Recompile & link-edit PORTUPDT   COBOL               [ ] PORTUPDT compiled OK
        program with new COPY module                         [ ] Link-edit status: SUCCESS
        (business logic integration)                         [ ] CICS map comp (if changed)

00:55   Deploy updated PORTUPDT load     DBA/CICS            [ ] Load module deployed to
        module to CICS                   Operations              CICS load library
                                                             [ ] CICS catalog updated
                                                             [ ] New program version active

01:00   Refresh CICS program definitions CICS Ops            [ ] CICS REFRESH PROGRAM
                                                             [ ] Program version: BR-005 v1.0

01:05   Validation: 5 manual test        QA/Business        [ ] Manual test 1: Qty=100, Price=50
        scenarios in PRODUCTION          User                   Expected: Total=5000 ✓
        (Portfolio manager executes                          [ ] Manual test 2: Qty=50, Price=0
         PORTUPDT via CICS PTAR txn)                             Expected: Total=0 ✓
                                                             [ ] Manual test 3: Invalid combo
                                                                 qty=100, Price=missing
                                                                 Expected: REJECTED ✓
                                                             [ ] Tests 4-5: Additional edge cases

01:15   "COBOL deployment complete"     COBOL Lead          [ ] PORTUPDT updated
        checkpoint                                          [ ] Validation tests passed
                                                             [ ] System stable

PHASE 4: POST-DEPLOYMENT ACTIVATION (1:15 - 1:30, 15 minutes)
─────────────────────────────────────────────────────────────────────────
01:15   Re-enable CICS PORTUPDT        CICS Operations     [ ] Quiesce reversed
        transactions                                        [ ] New transactions flow resuming
        (allow normal txn processing)                       [ ] "System ready" message

01:18   Monitor BR-005 violations for   DQ Manager          [ ] Dashboard showing BR-005
        first 30 minutes (expect ~0%)                           metrics live
                                                             [ ] Violation rate: 0% observed

01:20   First production transaction    QA                  [ ] End-to-end test in PROD
        end-to-end test (PTAR→DB2→     (Observing)             Portfolio created
        Audit log)                                          [ ] Amount formula enforced
                                                             [ ] Audit entry logged

01:25   Notify Portfolio managers of    Communications      [ ] Email sent: "System
        deployment completion                                   restoration complete"
                                                             [ ] Stakeholder call-in (if needed)

01:30   "Production deployment          Deployment Lead     [ ] All checkpoints passed
        complete" checkpoint                                [ ] No critical issues observed

PHASE 5: MONITORING & STABILIZATION (1:30 - 3:00, 90 minutes)
─────────────────────────────────────────────────────────────────────────
01:30   Continuous monitoring           DQ/DB/CICS          [ ] Transaction throughput normal
                                        Operations              (>100/min baseline)
                                                             [ ] Response times normal (<2 sec)
                                                             [ ] BR-005 violations: 0%
                                                             [ ] Error rate: <0.1%

01:45   Metrics validation dashboard    DQ Manager          [ ] All 15 KPIs displaying
        (15 KPIs active)                                    [ ] Alert thresholds working

02:00   Issue triage & escalation       Deployment Lead     [ ] Any issues escalated per
        (if needed)                                             severity SLA
                                                             [ ] Critical issues trigger
                                                                 rollback decision

03:00   Post-deployment stability       Deployment Lead     [ ] 90+ minutes stable
        verification (RTL: Regression  (Final checkpoint)       operation with no critical issues
        Test Lag completed successfully)                    [ ] Rollback decision:
                                                                 ✓ PROCEED with deployment
                                                                 ❌ ROLLBACK required
                                                             [ ] War room stands down
                                                             [ ] Team debriefing scheduled
                                                                 for next business day

ROLLBACK PROCEDURE (If critical issue occurs during Phase 1-3)
─────────────────────────────────────────────────────────────────────────
Rollback Trigger:          Critical error, transaction failures >1%, or data corruption detected

Rollback Steps:
1. ANNOUNCE ROLLBACK in team chat (1 minute)
2. Disable CICS PORTUPDT txns again (2 minutes)
3. RESTORE database from production backup taken at 00:10 (10 minutes)
4. RECOMPILE PORTUPDT with PREVIOUS COPY module (removed BR-005-VALIDATE) (5 minutes)
5. DEPLOY previous PORTUPDT load module to CICS (3 minutes)
6. RE-ENABLE CICS PORTUPDT transactions (1 minute)
7. REGRESSION TEST: Verify 5 test cases in production (5 minutes)
8. NOTIFY stakeholders of rollback (1 minute)

Total Rollback Time: ~27 minutes (well within 1-hour RTO)

Post-Rollback Actions:
- Root cause analysis (DBA + COBOL architect, next 24 hours)
- Review logs for error details
- Adjust procedure if applicable
- Retry deployment with revised plan (72 hours later)

DEPLOYMENT SIGN-OFF
─────────────────────────────────────────────────────────────────────────
Deployment Completed By:    __________________________  Date/Time: ______
Deployment Lead Approval:   __________________________  Date/Time: ______
Operations Sign-Off:        __________________________  Date/Time: ______

Final Status:              ✅ SUCCESSFUL   ❌ ROLLED BACK

If rolled back, describe issue:
________________________________________________________________
________________________________________________________________

Post-Deployment Review Date: April 16, 2026 (next business day)
```

---

**END OF CHANGE MANAGEMENT FRAMEWORK**
