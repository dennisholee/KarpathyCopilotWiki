import { ConceptExtractor } from '../../../src/ingest/conceptExtractor';
import { Logger } from '../../../src/utils/logger';

describe('ConceptExtractor', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  it('filters stopword-only and structural-noise concepts while retaining domain concepts', async () => {
    const extractor = new ConceptExtractor(logger);
    const text = [
      '# The',
      '## Section',
      '## Overview',
      '## Party Model',
      'The party model stores tax identifiers and relationship details.',
      'Party data is joined with tax data and relationship context.',
      'Party governance keeps the customer record trusted.',
    ].join('\n');

    const concepts = await extractor.extractConcepts(text, { maxConcepts: 20, minConfidence: 0.3 });
    const conceptTexts = concepts.map((concept) => concept.text);

    expect(conceptTexts).toContain('party model');
    expect(conceptTexts).not.toContain('the');
    expect(conceptTexts).not.toContain('section');
    expect(conceptTexts).not.toContain('overview');
  });
});