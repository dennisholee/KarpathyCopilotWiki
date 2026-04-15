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
      name: 'portfolio_model',
      entityName: 'portfolio',
      displayName: "Portfolio Model: Client's View",
      version: '1.0.0-proposal',
      domain: 'portfolio',
      description: "Grounded proposal: client's canonical view",
      status: 'Draft',
      owner: null,
      targetEntity: {
        name: "Portfolio Model: Client's View",
        type: 'modeled-entity',
        sourceKind: 'logical' as const,
      },
      schemaText: [
        'fields:',
        '  - name: risk_rating',
        '    dataType: string',
        '    required: false',
      ].join('\n'),
      resources: [],
      incidentManagement: null,
      guidelineSources: [],
      fallbackStrategy: 'Default the full contract shape to OpenMetadata because no named guideline was supplied.',
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
    placementDecisions: [
      {
        attributeName: 'risk_rating',
        action: 'add' as const,
        targetAnchor: 'portfolio_label',
        rationale: 'Add risk_rating after portfolio_label because it is the closest grounded baseline field with compatible semantics.',
        supportingSources: ['/raw/portfolio.md'],
      },
    ],
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
    expect(markdown).toContain("name: 'portfolio_model'");
    expect(markdown).toContain("status: 'Draft'");
    expect(markdown).toContain('owner: null');
    expect(markdown).toContain('targetEntity:');
    expect(markdown).toContain("type: 'modeled-entity'");
    expect(markdown).toContain('schemaText: |');
    expect(markdown).toContain('resources: []');
    expect(markdown).toContain('incidentManagement: null');
    expect(markdown).toContain('### Placement Decisions');
    expect(markdown).toContain('risk_rating: add after portfolio_label');
    expect(markdown).toContain('### Wiki Evidence Used');
    expect(markdown).toContain("[sources: /raw/portfolio.md]");
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
      placementDecisions: [],
    }, { isValid: true, issues: [] });

    expect(markdown).not.toContain('### Conflicts');
    expect(markdown).not.toContain('### Assumptions / Gaps');
    expect(markdown).toContain('### Wiki Evidence Used');
  });

  it('should render derived model context and guideline handling for derive requests', () => {
    const markdown = formatter.formatProposal({
      ...baseProposal,
      requirement: {
        ...baseProposal.requirement,
        intent: 'derive',
      },
      contract: {
        ...baseProposal.contract,
        sourceModel: 'Derived from grounded wiki evidence',
        sourceModelId: undefined,
        displayName: 'CDMS Tax model',
        name: 'cdms_tax',
        guidelineSources: ['open metadata guideline'],
        fallbackStrategy: 'Named guideline evidence fully governs the emitted contract sections.',
      },
      guidelineResolution: {
        requestedGuidelines: [
          { name: 'open metadata guideline', normalizedName: 'open metadata guideline' },
        ],
        appliesDefaultOpenMetadata: false,
        rationale: 'Named guideline evidence governs the derived contract structure.',
      },
      placementDecisions: [],
    }, { isValid: true, issues: [] });

    expect(markdown).toContain('### Derived Model Context');
    expect(markdown).not.toContain('### Preferred Baseline Model');
    expect(markdown).toContain('### Guideline Handling');
    expect(markdown).toContain('Derived from grounded wiki evidence');
    expect(markdown).toContain("name: 'cdms_tax'");
  });

  it('should render a definition summary without contract sections', () => {
    const markdown = formatter.formatDefinitionSummary({
      requirement: {
        rawRequest: 'what is the relationship model',
        normalizedRequest: 'what is the relationship model',
        intent: 'define',
        requestedChanges: [],
        targetModelName: 'relationship',
        inferredEntityName: 'relationship',
        requestedGuidelines: [],
      },
      targetModel: {
        pageId: '20240101_relationship-model',
        title: 'Relationship Model',
        relevanceScore: 0.8,
        matchType: 'title',
        sourceReferences: ['/raw/relationship.md'],
        contentExcerpt: 'Relationship model excerpt',
        plaintext: 'Relationship model excerpt',
      },
      summary: 'Relationship Model links party and account records through role-based associations.',
      keyEntities: ['Relationship Model links party and account records through role-based associations.'],
      keyRelationships: ['Relationship model references party and account records.'],
      rationale: 'Summarized the model from grounded evidence without generating a contract.',
      assumptions: [],
      conflicts: [],
      evidence: [
        {
          pageId: '20240101_relationship-model',
          title: 'Relationship Model',
          sourceReferences: ['/raw/relationship.md'],
          usage: 'Primary grounded page used to explain the requested model definition.',
          conflicted: false,
        },
      ],
    });

    expect(markdown).toContain('## Model Definition');
    expect(markdown).toContain('### Key Entities / Relationships');
    expect(markdown).toContain('### Raw Source Traceability');
    expect(markdown).not.toContain('### Proposed Contract');
  });
});