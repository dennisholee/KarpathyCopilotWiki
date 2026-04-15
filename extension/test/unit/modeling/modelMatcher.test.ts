import { ModelMatcher } from '../../../src/modeling/modelMatcher';
import { QueryResult } from '../../../src/query/queryCommand';

describe('ModelMatcher', () => {
  const matcher = new ModelMatcher();

  function createQueryResult(overrides: Partial<QueryResult> = {}): QueryResult {
    return {
      query: 'portfolio model',
      effectiveQuery: 'portfolio model',
      results: [],
      sources: [],
      usedFallback: false,
      executionTime: 10,
      evidenceBundle: {
        supportingPages: [],
        supportingFacts: [],
        sourceReferences: [],
        coverageAssessment: 'partial',
        conflicts: [],
        coverageGaps: [],
      },
      answer: {
        directAnswer: 'answer',
        keyDetails: [],
        supportingReferences: [],
        conflicts: [],
        coverageGaps: [],
        confidenceLabel: 'supported',
      },
      ...overrides,
    };
  }

  it('should select a strong baseline candidate and normalize requested changes', () => {
    const result = matcher.selectBaseline(
      'Add risk rating and review date to the portfolio model',
      createQueryResult({
        results: [
          {
            pageId: '20240101_portfolio-model',
            title: 'Portfolio Model',
            excerpt: '- portfolio_id\n- portfolio_name',
            relevanceScore: 0.81,
            matchType: 'title',
            sourceReferences: ['/raw/portfolio.md'],
            plaintext: 'Portfolio model content',
          },
        ],
      })
    );

    expect(result.needsRefinement).toBe(false);
    expect(result.baselineCandidate?.title).toBe('Portfolio Model');
    expect(result.requirement.requestedChanges).toContain('risk rating');
    expect(result.requirement.requestedChanges).toContain('review date');
    expect(result.baselineCandidate?.plaintext).toBe('Portfolio model content');
  });

  it('should ask for refinement when no credible match exists', () => {
    const result = matcher.selectBaseline('Track zqxjv fracture taxonomy', createQueryResult());

    expect(result.needsRefinement).toBe(true);
    expect(result.baselineCandidate).toBeUndefined();
    expect(result.refinementReason).toContain('No sufficiently credible existing model matched');
  });

  it('should prefer a candidate whose title matches the inferred entity over a slightly higher generic score', () => {
    const result = matcher.selectBaseline(
      'Add settlement status to the transaction model',
      createQueryResult({
        results: [
          {
            pageId: '20240101_operations-model',
            title: 'Operations Model Overview',
            excerpt: 'Covers several business domains including transactions.',
            relevanceScore: 0.9,
            matchType: 'content',
            sourceReferences: ['/raw/operations.md'],
            plaintext: 'Operations overview with transaction references.',
          },
          {
            pageId: '20240102_transaction-model',
            title: 'Transaction Model',
            excerpt: '- transaction_id\n- settlement_status',
            relevanceScore: 0.62,
            matchType: 'content',
            sourceReferences: ['/raw/transaction.md'],
            plaintext: 'Transaction Model\ntransaction_id\nsettlement_status',
          },
        ],
      })
    );

    expect(result.needsRefinement).toBe(false);
    expect(result.baselineCandidate?.title).toBe('Transaction Model');
  });

  it('should accept a reranked entity-specific candidate even when its raw score is below the base threshold', () => {
    const result = matcher.selectBaseline(
      'Add settlement status to the transaction model',
      createQueryResult({
        results: [
          {
            pageId: '20240101_generic-ops',
            title: 'Operations Overview',
            excerpt: 'Operations guidance with broad references.',
            relevanceScore: 0.18,
            matchType: 'content',
            sourceReferences: ['/raw/operations.md'],
            plaintext: 'Operations overview text.',
          },
          {
            pageId: '20240102_transaction-model',
            title: 'Transaction Model',
            excerpt: '- transaction_id\n- settlement_status',
            relevanceScore: 0.05,
            matchType: 'content',
            sourceReferences: ['/raw/transaction.md'],
            plaintext: 'Transaction Model\ntransaction_id\nsettlement_status',
          },
        ],
      })
    );

    expect(result.needsRefinement).toBe(false);
    expect(result.baselineCandidate?.title).toBe('Transaction Model');
  });

  it('should extract only requested fields from extend-with model phrasing', () => {
    const requirement = matcher.buildRequirement(
      'Extend the transaction entity with settlement status and validation rules'
    );

    expect(requirement.inferredEntityName).toBe('transaction');
    expect(requirement.requestedChanges).toContain('settlement status');
    expect(requirement.requestedChanges).toContain('validation rules');
    expect(requirement.requestedChanges).not.toContain('transaction entity with settlement status');
  });

  it('should infer the named business entity instead of the generic word model', () => {
    const requirement = matcher.buildRequirement(
      'Add approval threshold to the suitability model'
    );

    expect(requirement.inferredEntityName).toBe('suitability');
  });

  it('should skip request verbs when falling back to the first meaningful token', () => {
    const requirement = matcher.buildRequirement(
      'Track suitability scoring rules'
    );

    expect(requirement.inferredEntityName).toBe('suitability');
  });

  it('should strip residual verbs from mixed rename and add requests', () => {
    const requirement = matcher.buildRequirement(
      'Rename portfolio name to portfolio label and add review date to the portfolio model'
    );

    expect(requirement.requestedChanges).toContain('portfolio name to portfolio label');
    expect(requirement.requestedChanges).toContain('review date');
    expect(requirement.requestedChanges).not.toContain('add review date');
  });

  it('should strip target model context from requests phrased with in-the-model', () => {
    const requirement = matcher.buildRequirement(
      'Add review date in the portfolio model'
    );

    expect(requirement.requestedChanges).toContain('review date');
    expect(requirement.requestedChanges).not.toContain('review date in the portfolio model');
  });

  it('should rerank candidates using inferred entities that are not in the hardcoded hint list', () => {
    const result = matcher.selectBaseline(
      'Add approval threshold to the suitability model',
      createQueryResult({
        results: [
          {
            pageId: '20240101_policy-overview',
            title: 'Policy Overview',
            excerpt: 'General policy guidance with broad references.',
            relevanceScore: 0.64,
            matchType: 'content',
            sourceReferences: ['/raw/policy.md'],
            plaintext: 'Policy overview text.',
          },
          {
            pageId: '20240102_suitability-model',
            title: 'Suitability Model',
            excerpt: '- approval_threshold\n- suitability_score',
            relevanceScore: 0.21,
            matchType: 'content',
            sourceReferences: ['/raw/suitability.md'],
            plaintext: 'Suitability Model\napproval_threshold\nsuitability_score',
          },
        ],
      })
    );

    expect(result.needsRefinement).toBe(false);
    expect(result.baselineCandidate?.title).toBe('Suitability Model');
    expect(result.candidates[0].effectiveScore).toBeGreaterThan(result.candidates[1].effectiveScore ?? 0);
  });

  it('should preserve multi-word entities when the prompt names a model explicitly', () => {
    const requirement = matcher.buildRequirement(
      'Add approval threshold to the credit risk model'
    );

    expect(requirement.inferredEntityName).toBe('credit risk');
  });

  it('should rerank candidates using a multi-word inferred entity', () => {
    const result = matcher.selectBaseline(
      'Add approval threshold to the credit risk model',
      createQueryResult({
        results: [
          {
            pageId: '20240101_risk-overview',
            title: 'Risk Overview',
            excerpt: 'General risk guidance across domains.',
            relevanceScore: 0.66,
            matchType: 'content',
            sourceReferences: ['/raw/risk.md'],
            plaintext: 'Risk overview text.',
          },
          {
            pageId: '20240102_credit-risk-model',
            title: 'Credit Risk Model',
            excerpt: '- approval_threshold\n- risk_grade',
            relevanceScore: 0.24,
            matchType: 'content',
            sourceReferences: ['/raw/credit-risk.md'],
            plaintext: 'Credit Risk Model\napproval_threshold\nrisk_grade',
          },
        ],
      })
    );

    expect(result.needsRefinement).toBe(false);
    expect(result.baselineCandidate?.title).toBe('Credit Risk Model');
  });

  it('should rerank candidates when the matching model title uses punctuation between entity words', () => {
    const result = matcher.selectBaseline(
      'Add approval threshold to the credit risk model',
      createQueryResult({
        results: [
          {
            pageId: '20240101_risk-overview',
            title: 'Risk Overview',
            excerpt: 'General risk guidance across domains.',
            relevanceScore: 0.66,
            matchType: 'content',
            sourceReferences: ['/raw/risk.md'],
            plaintext: 'Risk overview text.',
          },
          {
            pageId: '20240102_credit-risk-model',
            title: 'Credit-Risk Model',
            excerpt: '- approval_threshold\n- risk_grade',
            relevanceScore: 0.24,
            matchType: 'content',
            sourceReferences: ['/raw/credit-risk.md'],
            plaintext: 'Credit-Risk Model\napproval_threshold\nrisk_grade',
          },
        ],
      })
    );

    expect(result.needsRefinement).toBe(false);
    expect(result.baselineCandidate?.title).toBe('Credit-Risk Model');
  });
});