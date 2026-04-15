import { ProposalBuilder } from '../../../src/modeling/proposalBuilder';
import { ModelSelectionResult } from '../../../src/models/types';
import { QueryResult } from '../../../src/query/queryCommand';

describe('ProposalBuilder', () => {
  const builder = new ProposalBuilder();

  it('should build a derived proposal without a baseline candidate when grounded evidence exists', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'generate the cdms tax model based on the open metadata guideline and the oecd guideline',
        normalizedRequest: 'generate the cdms tax model based on the open metadata guideline and the oecd guideline',
        intent: 'derive',
        requestedChanges: [],
        targetModelName: 'cdms tax',
        inferredEntityName: 'cdms tax',
        requestedGuidelines: [
          { name: 'open metadata guideline', normalizedName: 'open metadata guideline' },
          { name: 'oecd guideline', normalizedName: 'oecd guideline' },
        ],
      },
      candidates: [],
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'cdms tax model',
      effectiveQuery: 'cdms tax model',
      results: [
        {
          pageId: '20240101_cdms-architecture',
          title: 'CDMS Architecture',
          excerpt: '- tax_id\n- tax_code\n- filing_status',
          relevanceScore: 0.82,
          matchType: 'content',
          sourceReferences: ['/raw/CDMS_Architecture_Wiki.md'],
          plaintext: 'CDMS Architecture\ntax_id\ntax_code\nfiling_status',
        },
      ],
      sources: ['/raw/CDMS_Architecture_Wiki.md', '/raw/guideline_openmetadata.md', '/raw/OECD_Guidance_for_the_Standard_Audit_File_Tax_v2.0.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [
          { pageId: '20240101_cdms-architecture', title: 'CDMS Architecture', sourceReferences: ['/raw/CDMS_Architecture_Wiki.md'] },
          { pageId: '20240102_openmetadata-guideline', title: 'Open Metadata Guideline', sourceReferences: ['/raw/guideline_openmetadata.md'] },
          { pageId: '20240103_oecd-guideline', title: 'OECD Guideline', sourceReferences: ['/raw/OECD_Guidance_for_the_Standard_Audit_File_Tax_v2.0.md'] },
        ],
        supportingFacts: [
          { pageId: '20240101_cdms-architecture', title: 'CDMS Architecture', statement: 'Tax code identifies the filing class for audit reporting.', sourceReferences: ['/raw/CDMS_Architecture_Wiki.md'] },
        ],
        sourceReferences: ['/raw/CDMS_Architecture_Wiki.md', '/raw/guideline_openmetadata.md', '/raw/OECD_Guidance_for_the_Standard_Audit_File_Tax_v2.0.md'],
        coverageAssessment: 'complete',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'CDMS tax model can be derived from the grounded evidence.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'supported',
      },
    };

    const proposal = builder.buildDerivedProposal(selection, queryResult);

    expect(proposal.contract.sourceModel).toBe('Derived from grounded wiki evidence');
    expect(proposal.contract.sourceModelId).toBeUndefined();
    expect(proposal.contract.displayName).toBe('CDMS Tax Model');
    expect(proposal.contract.guidelineSources).toEqual(['open metadata guideline', 'oecd guideline']);
    expect(proposal.contract.fallbackStrategy).toContain('fully governs');
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'tax_id')).toBe(true);
    expect(proposal.guidelineResolution?.requestedGuidelines).toHaveLength(2);
    expect(proposal.changeSummary[0].toLowerCase()).toContain('derive a new cdms_tax');
  });

  it('should build a full proposal with contract, evidence, and change summary', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'Add risk rating to the portfolio model',
        normalizedRequest: 'Add risk rating to the portfolio model',
        requestedChanges: ['risk rating'],
        inferredEntityName: 'portfolio',
      },
      candidates: [],
      baselineCandidate: {
        pageId: '20240101_portfolio-model',
        title: 'Portfolio Model',
        relevanceScore: 0.88,
        matchType: 'title',
        sourceReferences: ['/raw/portfolio.md'],
        contentExcerpt: '- portfolio_id\n- portfolio_name',
        plaintext: 'Portfolio Model\nportfolio_id\nportfolio_name',
      },
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'portfolio model',
      effectiveQuery: 'portfolio model',
      results: [],
      sources: ['/raw/portfolio.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [{ pageId: '20240101_portfolio-model', title: 'Portfolio Model', sourceReferences: ['/raw/portfolio.md'] }],
        supportingFacts: [
          { pageId: '20240101_portfolio-model', title: 'Portfolio Model', statement: 'Portfolio captures portfolio identity.', sourceReferences: ['/raw/portfolio.md'] },
          { pageId: '20240101_portfolio-model', title: 'Portfolio Model', statement: 'Risk rating uses an approved 1-5 band for portfolio monitoring.', sourceReferences: ['/raw/portfolio-rules.md'] },
        ],
        sourceReferences: ['/raw/portfolio.md', '/raw/portfolio-rules.md'],
        coverageAssessment: 'complete',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'Portfolio model baseline found.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'supported',
      },
    };

    const proposal = builder.buildProposal(selection, queryResult);

    expect(proposal.contract.displayName).toBe('Portfolio Model');
    expect(proposal.contract.id).toBe('proposal_portfolio');
  expect(proposal.contract.name).toBe('portfolio');
    expect(proposal.contract.domain).toBe('portfolio');
    expect(proposal.contract.sourceModel).toBe('Portfolio Model');
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'risk_rating')).toBe(true);
    expect(proposal.evidence.length).toBeGreaterThan(0);
    expect(proposal.evidence.some((evidence) => evidence.usage === 'Portfolio captures portfolio identity.')).toBe(true);
    expect(proposal.evidence.every((evidence) => typeof evidence.conflicted === 'boolean')).toBe(true);
    expect(proposal.changeSummary[0]).toContain('risk_rating');
    expect(proposal.placementDecisions?.some((decision) => decision.attributeName === 'risk_rating')).toBe(true);
    expect(proposal.placementDecisions?.[0].targetAnchor).toBe('portfolio_name');
    expect(proposal.contract.guidelineSources).toEqual([]);
    expect(proposal.contract.fallbackStrategy).toContain('Default the full contract shape to OpenMetadata');
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'portfolio_id')).toBe(true);
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'risk_rating' && attribute.dataType === 'number')).toBe(true);
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'risk_rating' && attribute.status === 'proposed')).toBe(true);
  });

  it('should build a grounded definition summary without generating a contract', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'what is the relationship model',
        normalizedRequest: 'what is the relationship model',
        intent: 'define',
        requestedChanges: [],
        targetModelName: 'relationship',
        inferredEntityName: 'relationship',
        requestedGuidelines: [],
      },
      candidates: [],
      baselineCandidate: {
        pageId: '20240101_relationship-model',
        title: 'Relationship Model',
        relevanceScore: 0.87,
        matchType: 'title',
        sourceReferences: ['/raw/relationship.md'],
        contentExcerpt: 'Relationship model links party and account records.',
        plaintext: 'Relationship model links party and account records.',
      },
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'relationship model',
      effectiveQuery: 'relationship model',
      results: [],
      sources: ['/raw/relationship.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [{ pageId: '20240101_relationship-model', title: 'Relationship Model', sourceReferences: ['/raw/relationship.md'] }],
        supportingFacts: [
          { pageId: '20240101_relationship-model', title: 'Relationship Model', statement: 'Relationship model links party and account records through role-based associations.', sourceReferences: ['/raw/relationship.md'] },
        ],
        sourceReferences: ['/raw/relationship.md'],
        coverageAssessment: 'complete',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'Relationship model links party and account records through role-based associations.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'supported',
      },
    };

    const summary = builder.buildDefinitionSummary(selection, queryResult);

    expect(summary.summary).toContain('Relationship Model');
    expect(summary.summary).toContain('links party and account records');
    expect(summary.evidence[0].sourceReferences).toContain('/raw/relationship.md');
    expect(summary.rationale).toContain('without generating a contract');
  });

  it('should mark unsupported new attributes as assumed instead of treating baseline sources as sufficient evidence', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'Add client sentiment score to the portfolio model',
        normalizedRequest: 'Add client sentiment score to the portfolio model',
        requestedChanges: ['client sentiment score'],
        inferredEntityName: 'portfolio',
      },
      candidates: [],
      baselineCandidate: {
        pageId: '20240101_portfolio-model',
        title: 'Portfolio Model',
        relevanceScore: 0.88,
        matchType: 'title',
        sourceReferences: ['/raw/portfolio.md'],
        contentExcerpt: '- portfolio_id\n- portfolio_name',
        plaintext: 'Portfolio Model\nportfolio_id\nportfolio_name',
      },
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'portfolio model',
      effectiveQuery: 'portfolio model',
      results: [],
      sources: ['/raw/portfolio.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [{ pageId: '20240101_portfolio-model', title: 'Portfolio Model', sourceReferences: ['/raw/portfolio.md'] }],
        supportingFacts: [],
        sourceReferences: ['/raw/portfolio.md'],
        coverageAssessment: 'partial',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'Portfolio model baseline found.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'supported',
      },
    };

    const proposal = builder.buildProposal(selection, queryResult);

    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'client_sentiment_score' && attribute.status === 'assumed')).toBe(true);
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'client_sentiment_score' && attribute.sourceReferences.length === 0)).toBe(true);
    expect(proposal.assumptions.some((item) => item.includes('client_sentiment_score'))).toBe(true);
  });

  it('should use OpenMetadata fallback for enhancement requests when no guideline is supplied', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'Add risk rating to the portfolio model',
        normalizedRequest: 'Add risk rating to the portfolio model',
        requestedChanges: ['risk rating'],
        inferredEntityName: 'portfolio',
      },
      candidates: [],
      baselineCandidate: {
        pageId: '20240101_portfolio-model',
        title: 'Portfolio Model',
        relevanceScore: 0.88,
        matchType: 'title',
        sourceReferences: ['/raw/portfolio.md'],
        contentExcerpt: '- portfolio_id\n- portfolio_name',
        plaintext: 'Portfolio Model\nportfolio_id\nportfolio_name',
      },
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'portfolio model',
      effectiveQuery: 'portfolio model',
      results: [],
      sources: ['/raw/portfolio.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [{ pageId: '20240101_portfolio-model', title: 'Portfolio Model', sourceReferences: ['/raw/portfolio.md'] }],
        supportingFacts: [],
        sourceReferences: ['/raw/portfolio.md'],
        coverageAssessment: 'complete',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'Portfolio model baseline found.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'supported',
      },
    };

    const proposal = builder.buildProposal(selection, queryResult);

    expect(proposal.contract.guidelineSources).toEqual([]);
    expect(proposal.contract.fallbackStrategy).toContain('Default the full contract shape to OpenMetadata');
  });

  it('should use full OpenMetadata fallback for derived requests when no guideline is supplied', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'generate the party model',
        normalizedRequest: 'generate the party model',
        intent: 'derive',
        requestedChanges: [],
        targetModelName: 'party',
        inferredEntityName: 'party',
        requestedGuidelines: [],
      },
      candidates: [],
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'party model',
      effectiveQuery: 'party model',
      results: [],
      sources: ['/raw/party-domain.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [{ pageId: '20240111_party-domain-notes', title: 'Party Domain Notes', sourceReferences: ['/raw/party-domain.md'] }],
        supportingFacts: [{ pageId: '20240111_party-domain-notes', title: 'Party Domain Notes', statement: 'Party records identify the managed customer or organization.', sourceReferences: ['/raw/party-domain.md'] }],
        sourceReferences: ['/raw/party-domain.md'],
        coverageAssessment: 'partial',
        conflicts: [],
        coverageGaps: [{ missingTopic: 'generate the party model', reason: 'Only part of the question is supported by the currently retrieved evidence.', suggestedFollowUp: 'Ask a narrower follow-up about one aspect of "generate the party model" for a more precise grounded answer.' }],
      },
      answer: {
        directAnswer: 'Party records identify the managed customer or organization.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: ['generate the party model: Only part of the question is supported by the currently retrieved evidence.'],
        confidenceLabel: 'partially-supported',
      },
    };

    const proposal = builder.buildDerivedProposal(selection, queryResult);

    expect(proposal.contract.guidelineSources).toEqual([]);
    expect(proposal.contract.fallbackStrategy).toContain('Default the full contract shape to OpenMetadata');
  });

  it('should default targetEntity to a logical modeled entity for conceptual proposals', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'generate the customer profile model',
        normalizedRequest: 'generate the customer profile model',
        intent: 'derive',
        requestedChanges: [],
        targetModelName: 'customer profile',
        inferredEntityName: 'customer profile',
        requestedGuidelines: [],
      },
      candidates: [],
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'customer profile model',
      effectiveQuery: 'customer profile model',
      results: [
        {
          pageId: '20240101_customer-profile',
          title: 'Customer Profile Model',
          excerpt: '- customer_id\n- customer_name',
          relevanceScore: 0.81,
          matchType: 'content',
          sourceReferences: ['/raw/customer-profile.md'],
          plaintext: 'Customer Profile Model\ncustomer_id\ncustomer_name',
        },
      ],
      sources: ['/raw/customer-profile.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [
          { pageId: '20240101_customer-profile', title: 'Customer Profile Model', sourceReferences: ['/raw/customer-profile.md'] },
        ],
        supportingFacts: [
          {
            pageId: '20240101_customer-profile',
            title: 'Customer Profile Model',
            statement: 'Customer profile captures conceptual customer attributes for onboarding.',
            sourceReferences: ['/raw/customer-profile.md'],
          },
        ],
        sourceReferences: ['/raw/customer-profile.md'],
        coverageAssessment: 'complete',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'Customer profile model can be derived from grounded evidence.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'supported',
      },
    };

    const proposal = builder.buildDerivedProposal(selection, queryResult);

    expect(proposal.contract.targetEntity.type).toBe('modeled-entity');
    expect(proposal.contract.targetEntity.name).toBe('Customer Profile Model');
  });

  it('should switch targetEntity to a physical table when the request is explicitly physical', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'generate the customer table contract',
        normalizedRequest: 'generate the customer table contract',
        intent: 'derive',
        requestedChanges: [],
        targetModelName: 'customer table',
        inferredEntityName: 'customer table',
        requestedGuidelines: [],
      },
      candidates: [],
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'customer table contract',
      effectiveQuery: 'customer table contract',
      results: [
        {
          pageId: '20240102_customer-table',
          title: 'Customer Table Spec',
          excerpt: '- customer_id\n- customer_name\n- status_code',
          relevanceScore: 0.83,
          matchType: 'content',
          sourceReferences: ['/raw/customer-table.md'],
          plaintext: 'Customer Table Spec\ncustomer_id\ncustomer_name\nstatus_code',
        },
      ],
      sources: ['/raw/customer-table.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [
          { pageId: '20240102_customer-table', title: 'Customer Table Spec', sourceReferences: ['/raw/customer-table.md'] },
        ],
        supportingFacts: [
          {
            pageId: '20240102_customer-table',
            title: 'Customer Table Spec',
            statement: 'The customer table stores columns for customer_id, customer_name, and status_code.',
            sourceReferences: ['/raw/customer-table.md'],
          },
        ],
        sourceReferences: ['/raw/customer-table.md'],
        coverageAssessment: 'complete',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'Customer table contract can be derived from grounded evidence.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'supported',
      },
    };

    const proposal = builder.buildDerivedProposal(selection, queryResult);

    expect(proposal.contract.targetEntity.type).toBe('table');
    expect(proposal.contract.targetEntity.name).toBe('Customer Table Model');
  });

  it('should use partial OpenMetadata fallback when a named guideline is not grounded by evidence', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'Enhance the party model by adding an account number using the oecd guideline',
        normalizedRequest: 'Enhance the party model by adding an account number using the oecd guideline',
        intent: 'enhance',
        requestedChanges: ['account number'],
        targetModelName: 'party',
        inferredEntityName: 'party',
        requestedGuidelines: [{ name: 'oecd guideline', normalizedName: 'oecd guideline' }],
      },
      candidates: [],
      baselineCandidate: {
        pageId: '20240101_party-model',
        title: 'Party Model',
        relevanceScore: 0.88,
        matchType: 'title',
        sourceReferences: ['/raw/party.md'],
        contentExcerpt: '- party_id\n- party_name',
        plaintext: 'Party Model\nparty_id\nparty_name',
      },
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'party model',
      effectiveQuery: 'party model',
      results: [],
      sources: ['/raw/party.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [{ pageId: '20240101_party-model', title: 'Party Model', sourceReferences: ['/raw/party.md'] }],
        supportingFacts: [{ pageId: '20240101_party-model', title: 'Party Model', statement: 'Account number identifies the linked account for a party.', sourceReferences: ['/raw/party.md'] }],
        sourceReferences: ['/raw/party.md'],
        coverageAssessment: 'complete',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'Party model baseline found.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'supported',
      },
    };

    const proposal = builder.buildProposal(selection, queryResult);

    expect(proposal.contract.guidelineSources).toEqual(['oecd guideline']);
    expect(proposal.contract.fallbackStrategy).toContain('Use OpenMetadata defaults');
  });

  it('should treat duplicate or rename-style changes as refinements instead of blind additions', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'Rename portfolio name to portfolio label',
        normalizedRequest: 'Rename portfolio name to portfolio label',
        requestedChanges: ['portfolio_name to portfolio_label'],
        inferredEntityName: 'portfolio',
      },
      candidates: [],
      baselineCandidate: {
        pageId: '20240101_portfolio-model',
        title: 'Portfolio Model',
        relevanceScore: 0.88,
        matchType: 'title',
        sourceReferences: ['/raw/portfolio.md'],
        contentExcerpt: '- portfolio_id\n- portfolio_name',
        plaintext: 'Portfolio Model\nportfolio_id\nportfolio_name',
      },
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'portfolio model',
      effectiveQuery: 'portfolio model',
      results: [],
      sources: ['/raw/portfolio.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [{ pageId: '20240101_portfolio-model', title: 'Portfolio Model', sourceReferences: ['/raw/portfolio.md'] }],
        supportingFacts: [],
        sourceReferences: ['/raw/portfolio.md'],
        coverageAssessment: 'complete',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'Portfolio model baseline found.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'supported',
      },
    };

    const proposal = builder.buildProposal(selection, queryResult);

    expect(proposal.changeSummary[0]).toContain('Rename portfolio_name to portfolio_label');
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'portfolio_label' && attribute.status === 'renamed')).toBe(true);
    expect(proposal.placementDecisions?.[0]).toEqual(expect.objectContaining({
      attributeName: 'portfolio_label',
      action: 'rename',
      targetAnchor: 'portfolio_name',
    }));
  });

  it('should turn coverage gaps and evidence conflicts into review output', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'Add settlement_status to the transaction model',
        normalizedRequest: 'Add settlement_status to the transaction model',
        requestedChanges: ['settlement status'],
        inferredEntityName: 'transaction',
      },
      candidates: [],
      baselineCandidate: {
        pageId: '20240101_transaction-model',
        title: 'Transaction Model',
        relevanceScore: 0.82,
        matchType: 'title',
        sourceReferences: ['/raw/transaction.md'],
        contentExcerpt: '- transaction_id\n- amount',
        plaintext: 'Transaction Model\ntransaction_id\namount',
      },
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'transaction model',
      effectiveQuery: 'transaction model',
      results: [],
      sources: ['/raw/transaction.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [{ pageId: '20240101_transaction-model', title: 'Transaction Model', sourceReferences: ['/raw/transaction.md'] }],
        supportingFacts: [],
        sourceReferences: ['/raw/transaction.md'],
        coverageAssessment: 'conflicted',
        conflicts: [{
          topic: 'settlement status',
          summary: 'One source describes it as optional while another requires it before posting.',
          supportingPages: ['Transaction Model'],
          supportingSources: ['/raw/transaction.md'],
        }],
        coverageGaps: [{
          missingTopic: 'settlement status validation logic',
          reason: 'The wiki does not define an authoritative validation rule.',
          suggestedFollowUp: 'Confirm the rule with the operations source documents.',
        }],
      },
      answer: {
        directAnswer: 'Transaction model baseline found.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: ['settlement status: One source describes it as optional while another requires it before posting.'],
        coverageGaps: ['settlement status validation logic'],
        confidenceLabel: 'partially-supported',
      },
    };

    const proposal = builder.buildProposal(selection, queryResult);

    expect(proposal.assumptions.some((item) => item.includes('settlement status validation logic'))).toBe(true);
    expect(proposal.conflicts.some((item) => item.includes('settlement status'))).toBe(true);
    expect(proposal.evidence.some((evidence) => evidence.title === 'Transaction Model' && evidence.conflicted)).toBe(true);
    expect(proposal.rationale).toContain('conflict');
  });

  it('should infer a conflict from contradictory optional-versus-required evidence statements', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'Add settlement status validation logic to the transaction model',
        normalizedRequest: 'Add settlement status validation logic to the transaction model',
        requestedChanges: ['settlement status validation logic'],
        inferredEntityName: 'transaction',
      },
      candidates: [],
      baselineCandidate: {
        pageId: '20240101_transaction-model',
        title: 'Transaction Model',
        relevanceScore: 0.82,
        matchType: 'title',
        sourceReferences: ['/raw/transaction.md'],
        contentExcerpt: '- transaction_id\n- settlement_status',
        plaintext: 'Transaction Model\ntransaction_id\nsettlement_status',
      },
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'transaction model',
      effectiveQuery: 'transaction model',
      results: [],
      sources: ['/raw/transaction.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [],
        supportingFacts: [
          {
            pageId: '20240101_transaction-model',
            title: 'Transaction Model',
            statement: 'Settlement status is optional before posting.',
            sourceReferences: ['/raw/transaction-optional.md'],
          },
          {
            pageId: '20240102_transaction-model',
            title: 'Transaction Model',
            statement: 'Settlement status is required before posting.',
            sourceReferences: ['/raw/transaction-required.md'],
          },
        ],
        sourceReferences: ['/raw/transaction-optional.md', '/raw/transaction-required.md'],
        coverageAssessment: 'conflicted',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'Transaction model baseline found.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'partially-supported',
      },
    };

    const proposal = builder.buildProposal(selection, queryResult);

    expect(proposal.conflicts.some((item) => item.includes('settlement status'))).toBe(true);
    expect(proposal.evidence.some((evidence) => evidence.conflicted)).toBe(true);
  });

  it('should not infer a conflict when optional and required statements refer to different fields', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'Add settlement status validation logic to the transaction model',
        normalizedRequest: 'Add settlement status validation logic to the transaction model',
        requestedChanges: ['settlement status validation logic'],
        inferredEntityName: 'transaction',
      },
      candidates: [],
      baselineCandidate: {
        pageId: '20240101_transaction-model',
        title: 'Transaction Model',
        relevanceScore: 0.82,
        matchType: 'title',
        sourceReferences: ['/raw/transaction.md'],
        contentExcerpt: '- transaction_id\n- settlement_status\n- approval_flag',
        plaintext: 'Transaction Model\ntransaction_id\nsettlement_status\napproval_flag',
      },
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'transaction model',
      effectiveQuery: 'transaction model',
      results: [],
      sources: ['/raw/transaction.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [],
        supportingFacts: [
          {
            pageId: '20240101_transaction-model',
            title: 'Transaction Model',
            statement: 'Settlement status is optional before posting.',
            sourceReferences: ['/raw/transaction-optional.md'],
          },
          {
            pageId: '20240102_transaction-model',
            title: 'Transaction Model',
            statement: 'Approval flag is required before posting.',
            sourceReferences: ['/raw/transaction-required.md'],
          },
        ],
        sourceReferences: ['/raw/transaction-optional.md', '/raw/transaction-required.md'],
        coverageAssessment: 'partial',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'Transaction model baseline found.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'partially-supported',
      },
    };

    const proposal = builder.buildProposal(selection, queryResult);

    expect(proposal.conflicts).toHaveLength(0);
  });

  it('should infer data type and requiredness from evidence text when available', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'Add review frequency and approval flag to the portfolio model',
        normalizedRequest: 'Add review frequency and approval flag to the portfolio model',
        requestedChanges: ['review frequency', 'approval flag'],
        inferredEntityName: 'portfolio',
      },
      candidates: [],
      baselineCandidate: {
        pageId: '20240101_portfolio-model',
        title: 'Portfolio Model',
        relevanceScore: 0.88,
        matchType: 'title',
        sourceReferences: ['/raw/portfolio.md'],
        contentExcerpt: '- portfolio_id\n- review_frequency\n- approval_flag',
        plaintext: 'Portfolio Model\nportfolio_id\nreview_frequency\napproval_flag',
      },
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'portfolio model',
      effectiveQuery: 'portfolio model',
      results: [],
      sources: ['/raw/portfolio.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [{ pageId: '20240101_portfolio-model', title: 'Portfolio Model', sourceReferences: ['/raw/portfolio.md'] }],
        supportingFacts: [
          {
            pageId: '20240101_portfolio-model',
            title: 'Portfolio Model',
            statement: 'Review frequency is measured in days and is required before approval.',
            sourceReferences: ['/raw/portfolio-rules.md'],
          },
          {
            pageId: '20240101_portfolio-model',
            title: 'Portfolio Model',
            statement: 'Approval flag is optional and stores true or false when present.',
            sourceReferences: ['/raw/portfolio-rules.md'],
          },
        ],
        sourceReferences: ['/raw/portfolio.md', '/raw/portfolio-rules.md'],
        coverageAssessment: 'complete',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'Portfolio model baseline found.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'supported',
      },
    };

    const proposal = builder.buildProposal(selection, queryResult);

    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'review_frequency' && attribute.dataType === 'number' && attribute.required)).toBe(true);
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'approval_flag' && attribute.dataType === 'boolean' && attribute.required === false)).toBe(true);
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'review_frequency' && attribute.sourceReferences.includes('/raw/portfolio-rules.md'))).toBe(true);
  });

  it('should ignore descriptive prose when extracting baseline attributes', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'Add review date to the portfolio model',
        normalizedRequest: 'Add review date to the portfolio model',
        requestedChanges: ['review date'],
        inferredEntityName: 'portfolio',
      },
      candidates: [],
      baselineCandidate: {
        pageId: '20240101_portfolio-model',
        title: 'Portfolio Model',
        relevanceScore: 0.88,
        matchType: 'title',
        sourceReferences: ['/raw/portfolio.md'],
        contentExcerpt: '# Portfolio Model\n\n- portfolio_id\n- portfolio_name\n\nPortfolio captures identity and lifecycle information.',
        plaintext: '# Portfolio Model\n\n- portfolio_id\n- portfolio_name\n\nPortfolio captures identity and lifecycle information.',
      },
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'portfolio model',
      effectiveQuery: 'portfolio model',
      results: [],
      sources: ['/raw/portfolio.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [{ pageId: '20240101_portfolio-model', title: 'Portfolio Model', sourceReferences: ['/raw/portfolio.md'] }],
        supportingFacts: [],
        sourceReferences: ['/raw/portfolio.md'],
        coverageAssessment: 'complete',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'Portfolio model baseline found.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'supported',
      },
    };

    const proposal = builder.buildProposal(selection, queryResult);

    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'portfolio_captures_identity_and_lifecycle_information')).toBe(false);
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'portfolio_id')).toBe(true);
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'portfolio_name')).toBe(true);
  });

  it('should disclose a baseline extraction gap instead of inventing a placeholder baseline attribute', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'Add review date to the narrative portfolio model',
        normalizedRequest: 'Add review date to the narrative portfolio model',
        requestedChanges: ['review date'],
        inferredEntityName: 'narrative portfolio',
      },
      candidates: [],
      baselineCandidate: {
        pageId: '20240101_narrative-portfolio-model',
        title: 'Narrative Portfolio Model',
        relevanceScore: 0.88,
        matchType: 'title',
        sourceReferences: ['/raw/narrative-portfolio.md'],
        contentExcerpt: '# Narrative Portfolio Model\n\nThis page explains portfolio lifecycle and governance.',
        plaintext: '# Narrative Portfolio Model\n\nThis page explains portfolio lifecycle and governance.',
      },
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'narrative portfolio model',
      effectiveQuery: 'narrative portfolio model',
      results: [],
      sources: ['/raw/narrative-portfolio.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [{ pageId: '20240101_narrative-portfolio-model', title: 'Narrative Portfolio Model', sourceReferences: ['/raw/narrative-portfolio.md'] }],
        supportingFacts: [],
        sourceReferences: ['/raw/narrative-portfolio.md'],
        coverageAssessment: 'partial',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'Narrative portfolio model baseline found.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'partially-supported',
      },
    };

    const proposal = builder.buildProposal(selection, queryResult);

    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'narrative_portfolio_model')).toBe(false);
    expect(proposal.assumptions.some((item) => item.includes('could not be extracted'))).toBe(true);
  });

  it('should use supporting facts beyond the first three when classifying requested attributes', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'Add review frequency to the portfolio model',
        normalizedRequest: 'Add review frequency to the portfolio model',
        requestedChanges: ['review frequency'],
        inferredEntityName: 'portfolio',
      },
      candidates: [],
      baselineCandidate: {
        pageId: '20240101_portfolio-model',
        title: 'Portfolio Model',
        relevanceScore: 0.88,
        matchType: 'title',
        sourceReferences: ['/raw/portfolio.md'],
        contentExcerpt: '- portfolio_id\n- portfolio_name',
        plaintext: 'Portfolio Model\nportfolio_id\nportfolio_name',
      },
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'portfolio model',
      effectiveQuery: 'portfolio model',
      results: [],
      sources: ['/raw/portfolio.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [{ pageId: '20240101_portfolio-model', title: 'Portfolio Model', sourceReferences: ['/raw/portfolio.md'] }],
        supportingFacts: [
          { pageId: '20240101_portfolio-model', title: 'Portfolio Model', statement: 'Portfolio captures identity.', sourceReferences: ['/raw/portfolio.md'] },
          { pageId: '20240101_portfolio-model', title: 'Portfolio Model', statement: 'Portfolio name is customer-facing.', sourceReferences: ['/raw/portfolio.md'] },
          { pageId: '20240101_portfolio-model', title: 'Portfolio Model', statement: 'Inception date records when the portfolio starts.', sourceReferences: ['/raw/portfolio.md'] },
          { pageId: '20240101_portfolio-model', title: 'Portfolio Model', statement: 'Review frequency is measured in days and is required before approval.', sourceReferences: ['/raw/portfolio-rules.md'] },
        ],
        sourceReferences: ['/raw/portfolio.md', '/raw/portfolio-rules.md'],
        coverageAssessment: 'complete',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'Portfolio model baseline found.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'supported',
      },
    };

    const proposal = builder.buildProposal(selection, queryResult);

    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'review_frequency' && attribute.status === 'proposed')).toBe(true);
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'review_frequency' && attribute.sourceReferences.includes('/raw/portfolio-rules.md'))).toBe(true);
  });

  it('should not treat substring matches as evidence for a requested attribute', () => {
    const selection: ModelSelectionResult = {
      requirement: {
        rawRequest: 'Add id to the portfolio model',
        normalizedRequest: 'Add id to the portfolio model',
        requestedChanges: ['id'],
        inferredEntityName: 'portfolio',
      },
      candidates: [],
      baselineCandidate: {
        pageId: '20240101_portfolio-model',
        title: 'Portfolio Model',
        relevanceScore: 0.88,
        matchType: 'title',
        sourceReferences: ['/raw/portfolio.md'],
        contentExcerpt: '- portfolio_name',
        plaintext: 'Portfolio Model\nportfolio_name',
      },
      needsRefinement: false,
    };
    const queryResult: QueryResult = {
      query: 'portfolio model',
      effectiveQuery: 'portfolio model',
      results: [],
      sources: ['/raw/portfolio.md'],
      usedFallback: false,
      executionTime: 5,
      evidenceBundle: {
        supportingPages: [{ pageId: '20240101_portfolio-model', title: 'Portfolio Model', sourceReferences: ['/raw/portfolio.md'] }],
        supportingFacts: [
          {
            pageId: '20240101_portfolio-model',
            title: 'Portfolio Model',
            statement: 'Portfolio captures identity and lifecycle information.',
            sourceReferences: ['/raw/portfolio.md'],
          },
        ],
        sourceReferences: ['/raw/portfolio.md'],
        coverageAssessment: 'partial',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'Portfolio model baseline found.',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'partially-supported',
      },
    };

    const proposal = builder.buildProposal(selection, queryResult);

    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'id' && attribute.status === 'assumed')).toBe(true);
  });
});