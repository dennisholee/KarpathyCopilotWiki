import { TraceabilityValidator } from '../../../src/ingest/validator';

describe('TraceabilityValidator', () => {
  test('valid when sourceReferences contains /raw path', () => {
    const page: any = {
      sourceReferences: ['/raw/guidelines/example.md'],
      links: [],
    };

    const result = TraceabilityValidator.validate(page);
    expect(result.valid).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  test('invalid when no sources present', () => {
    const page: any = {
      sourceReferences: [],
      links: [],
    };

    const result = TraceabilityValidator.validate(page);
    expect(result.valid).toBe(false);
    expect(result.missingFields).toContain('sourceReferences or links');
  });

  test('invalid when sources do not include /raw', () => {
    const page: any = {
      sourceReferences: ['http://example.com'],
      links: ['docs/other.md'],
    };

    const result = TraceabilityValidator.validate(page);
    expect(result.valid).toBe(false);
    expect(result.missingFields).toContain('no /raw/ source referenced');
  });
});
