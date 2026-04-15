import { ContractValidator } from '../../../src/modeling/contractValidator';

describe('ContractValidator', () => {
  const validator = new ContractValidator();

  it('should reject a contract with missing required business fields', () => {
    const result = validator.validate(
      {
        id: 'proposal_portfolio',
        name: 'Portfolio',
        entityName: 'portfolio',
        displayName: 'Portfolio',
        version: '1.0.0-proposal',
        domain: 'portfolio',
        description: 'desc',
        sourceModel: 'Portfolio Model',
        attributes: [
          {
            name: 'risk_rating',
            description: 'desc',
            dataType: 'string',
            required: false,
            businessRules: [],
            validationLogic: [],
            sourceReferences: [],
            status: 'proposed',
          },
        ],
        tags: [],
      },
      'rationale',
      1
    );

    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.field.includes('businessRules'))).toBe(true);
    expect(result.issues.some((issue) => issue.field.includes('validationLogic'))).toBe(true);
  });
});