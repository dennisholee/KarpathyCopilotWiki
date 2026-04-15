import { ContractValidator } from '../../../src/modeling/contractValidator';

describe('ContractValidator', () => {
  const validator = new ContractValidator();
  const validContract = {
    id: 'proposal_portfolio',
    name: 'portfolio',
    entityName: 'portfolio',
    displayName: 'Portfolio',
    version: '1.0.0-proposal',
    domain: 'portfolio',
    description: 'desc',
    status: 'Draft',
    owner: null,
    targetEntity: {
      name: 'Portfolio',
      type: 'modeled-entity',
      sourceKind: 'logical' as const,
    },
    schemaText: 'fields:\n  - name: risk_rating\n    dataType: string\n    required: false',
    resources: [],
    incidentManagement: null,
    sourceModel: 'Portfolio Model',
    attributes: [
      {
        name: 'risk_rating',
        description: 'desc',
        dataType: 'string',
        required: false,
        businessRules: ['Risk rating must match the approved scale.'],
        validationLogic: ['Validate against the rating lookup table.'],
        sourceReferences: ['/raw/portfolio.md'],
        status: 'proposed' as const,
      },
    ],
    tags: [],
  };

  it('should accept a valid contract with evidence and rationale', () => {
    const result = validator.validate(validContract, 'rationale', 2);

    expect(result.isValid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('should reject a contract with missing required business fields', () => {
    const result = validator.validate(
      {
        ...validContract,
        attributes: [
          {
            ...validContract.attributes[0],
            name: 'risk_rating',
            businessRules: [],
            validationLogic: [],
            sourceReferences: [],
          },
        ],
      },
      'rationale',
      1
    );

    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field.includes('businessRules'))).toBe(true);
    expect(result.issues.some((issue) => issue.field.includes('validationLogic'))).toBe(true);
  });

  it('should reject missing top-level fields and evidence', () => {
    const result = validator.validate(
      {
        ...validContract,
        id: '   ',
        name: '   ',
        displayName: '   ',
        description: '   ',
        status: '   ',
        targetEntity: { ...validContract.targetEntity, name: '   ', type: '   ' },
        schemaText: '   ',
      },
      '   ',
      0
    );

    expect(result.isValid).toBe(false);
    expect(result.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining([
        'id',
        'name',
        'displayName',
        'description',
        'status',
        'targetEntity.name',
        'targetEntity.type',
        'schemaText',
        'rationale',
        'evidence',
      ])
    );
  });

  it('should emit warnings without invalidating an otherwise valid contract', () => {
    const result = validator.validate(
      {
        ...validContract,
        attributes: [
          {
            ...validContract.attributes[0],
            sourceReferences: [],
          },
        ],
      },
      'rationale',
      1
    );

    expect(result.isValid).toBe(true);
    expect(result.issues).toEqual([
      expect.objectContaining({
        field: 'attributes[0].sourceReferences',
        severity: 'warning',
      }),
    ]);
  });

  it('should accept a derived contract without an owner or incident details', () => {
    const result = validator.validate(
      {
        ...validContract,
        sourceModel: 'Derived from grounded wiki evidence',
      },
      'Derived from grounded wiki evidence.',
      2
    );

    expect(result.isValid).toBe(true);
  });

  it('should reject malformed attribute entries', () => {
    const result = validator.validate(
      {
        ...validContract,
        resources: [
          {
            type: '   ',
            name: '   ',
            description: '   ',
            properties: {},
            sourceReferences: [],
            isResolved: true,
          },
        ],
      },
      'rationale',
      1
    );

    expect(result.isValid).toBe(false);
    expect(result.issues.map((issue) => issue.field)).toEqual(
      expect.arrayContaining([
        'resources[0].type',
        'resources[0].name',
        'resources[0].description',
      ])
    );
  });
});