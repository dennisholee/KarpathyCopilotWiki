import { ProposalBuilder } from '../../../src/modeling/proposalBuilder';
import { ModelSelectionResult } from '../../../src/models/types';
import { QueryResult } from '../../../src/query/queryCommand';

describe('ProposalBuilder', () => {
  const builder = new ProposalBuilder();

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
    expect(proposal.contract.id).toBe('proposal_20240101_portfolio-model');
    expect(proposal.contract.name).toBe('Portfolio Model');
    expect(proposal.contract.domain).toBe('portfolio');
    expect(proposal.contract.sourceModel).toBe('Portfolio Model');
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'risk_rating')).toBe(true);
    expect(proposal.evidence.length).toBeGreaterThan(0);
    expect(proposal.evidence.some((evidence) => evidence.usage === 'Portfolio captures portfolio identity.')).toBe(true);
    expect(proposal.evidence.every((evidence) => typeof evidence.conflicted === 'boolean')).toBe(true);
    expect(proposal.changeSummary[0]).toContain('risk_rating');
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'portfolio_id')).toBe(true);
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'risk_rating' && attribute.dataType === 'number')).toBe(true);
    expect(proposal.contract.attributes.some((attribute) => attribute.name === 'risk_rating' && attribute.status === 'proposed')).toBe(true);
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