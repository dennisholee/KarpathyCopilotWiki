import { ProposalFormatter } from '../../../src/modeling/proposalFormatter';

describe('ProposalFormatter', () => {
  const formatter = new ProposalFormatter();
  const baseProposal = {
    requirement: {
      rawRequest: 'Add risk rating',
      normalizedRequest: 'Add risk rating',
      requestedChanges: ['risk rating'],
      inferredEntityName: 'portfolio',
    },
    baselineModel: {
      pageId: '20240101_portfolio-model',
      title: 'Portfolio Model',
      relevanceScore: 0.9,
      matchType: 'title' as const,
      sourceReferences: ['/raw/portfolio.md'],
      contentExcerpt: 'portfolio model excerpt',
      plaintext: 'Portfolio Model\nportfolio_id\nportfolio_name',
    },
    contract: {
      id: 'proposal_portfolio_model',
      name: "Portfolio Model: Client's View",
      entityName: 'portfolio',
      displayName: "Portfolio Model: Client's View",
      version: '1.0.0-proposal',
      domain: 'portfolio',
      description: "Grounded proposal: client's canonical view",
      sourceModel: "Portfolio Model: Client's View",
      sourceModelId: '20240101_portfolio-model',
      tags: ['proposal'],
      attributes: [
        {
          name: 'risk_rating',
          description: "Risk rating field: client's scale",
          dataType: 'string',
          required: false,
          businessRules: ["Populate from approved risk scale: client's 1-5 band."],
          validationLogic: ["Reject empty values: don't allow blanks."],
          sourceReferences: ['/raw/portfolio.md'],
          status: 'proposed' as const,
        },
        {
          name: 'portfolio_label',
          description: 'Rename of the existing portfolio_name field.',
          dataType: 'string',
          required: true,
          businessRules: ['Preserve the original naming semantics for portfolio display.'],
          validationLogic: ['Keep the renamed field non-empty.'],
          sourceReferences: ['/raw/portfolio.md'],
          status: 'renamed' as const,
          renameOf: 'portfolio_name',
        },
      ],
    },
    rationale: "Selected the portfolio model as the best grounded match: client's current canonical baseline.",
    changeSummary: ["Add risk_rating on top of Portfolio Model: Client's View."],
    assumptions: ["Confirm the source threshold for risk_rating: client's preferred scale."],
    conflicts: ["risk_rating: One source uses a 1-5 scale while another uses 1-10."],
    evidence: [
      {
        pageId: '20240101_portfolio-model',
        title: "Portfolio Model: Client's View",
        sourceReferences: ['/raw/portfolio.md'],
        statement: "Portfolio captures identity and lifecycle information: client's reference definition.",
        usage: "Portfolio captures identity and lifecycle information: client's reference definition.",
        conflicted: true,
      },
    ],
  };

  it('should render the proposal sections in markdown', () => {
    const markdown = formatter.formatProposal(baseProposal, { isValid: true, issues: [] });

    expect(markdown).toContain('## Model Proposal');
    expect(markdown).toContain('### Preferred Baseline Model');
    expect(markdown).toContain('### Proposed Contract');
    expect(markdown).toContain('risk_rating');
    expect(markdown).toContain("domain: 'portfolio'");
    expect(markdown).toContain("name: 'Portfolio Model: Client''s View'");
    expect(markdown).toContain("rationale: 'Selected the portfolio model as the best grounded match: client''s current canonical baseline.'");
    expect(markdown).toContain('changeSummary:');
    expect(markdown).toContain('conflicts:');
    expect(markdown).toContain('assumptions:');
    expect(markdown).toContain('evidence:');
    expect(markdown).toContain("wikiPage: 'Portfolio Model: Client''s View'");
    expect(markdown).toContain("usage: 'Portfolio captures identity and lifecycle information: client''s reference definition.'");
    expect(markdown).toContain('conflicted: true');
    expect(markdown).toContain("businessRules:\n    - 'Populate from approved risk scale: client''s 1-5 band.'");
    expect(markdown).toContain("validationLogic:\n    - 'Reject empty values: don''t allow blanks.'");
    expect(markdown).toContain("sourceMappings:\n    - '/raw/portfolio.md'");
    expect(markdown).toContain("- name: 'portfolio_label'");
    expect(markdown).toContain("renameOf: 'portfolio_name'");
    expect(markdown).toContain("rawSources:\n      - '/raw/portfolio.md'");
    expect(markdown).toContain('### Wiki Evidence Used');
    expect(markdown).toContain('[conflicted]');
  });

  it('should render validation issues when compliance checks fail', () => {
    const markdown = formatter.formatProposal(baseProposal, {
      isValid: false,
      issues: [
        { field: 'attributes[0].businessRules', message: 'Business rules are required.', severity: 'error' },
        { field: 'attributes[0].sourceReferences', message: 'Source references should be supplied for traceability.', severity: 'warning' },
      ],
    });

    expect(markdown).toContain('### Compliance Validation');
    expect(markdown).toContain('- ERROR: attributes[0].businessRules - Business rules are required.');
    expect(markdown).toContain('- WARNING: attributes[0].sourceReferences - Source references should be supplied for traceability.');
  });

  it('should render refinement guidance with candidate scores when no credible baseline exists', () => {
    const markdown = formatter.formatRefinementGuidance({
      requirement: baseProposal.requirement,
      candidates: [
        {
          pageId: 'candidate-1',
          title: 'Portfolio Draft Model',
          relevanceScore: 0.19,
          matchType: 'content',
          sourceReferences: ['/raw/portfolio-draft.md'],
          contentExcerpt: 'portfolio draft excerpt',
          plaintext: 'Portfolio Draft Model',
        },
      ],
      needsRefinement: true,
      refinementReason: 'The strongest candidate did not meet the credibility threshold.',
    });

    expect(markdown).toContain('## Refinement Needed');
    expect(markdown).toContain('The strongest candidate did not meet the credibility threshold.');
    expect(markdown).toContain('### Closest Candidates');
    expect(markdown).toContain('- Portfolio Draft Model (content, score 0.19)');
  });

  it('should omit conflicts and assumptions sections when they are empty', () => {
    const markdown = formatter.formatProposal({
      ...baseProposal,
      assumptions: [],
      conflicts: [],
    }, { isValid: true, issues: [] });

    expect(markdown).not.toContain('### Conflicts');
    expect(markdown).not.toContain('### Assumptions / Gaps');
    expect(markdown).toContain('### Wiki Evidence Used');
  });
});