import { SearchEngine } from '../../../src/search/search-engine';
import { Logger } from '../../../src/utils/logger';
import { WikiManager } from '../../../src/wiki/wiki-manager';
import { WikiPage } from '../../../src/models/types';

describe('SearchEngine', () => {
  let logger: Logger;
  let wikiManager: jest.Mocked<Pick<WikiManager, 'listPages' | 'getPage' | 'getRelatedPages'>>;
  let pages: WikiPage[];

  beforeEach(() => {
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;

    pages = [
      {
        id: 'neural-networks',
        title: 'Neural Networks Basics',
        aliases: ['NN Basics'],
        content: '# Neural Networks Basics',
        plaintext: 'Neural networks use backpropagation and training data to learn patterns.',
        tags: ['ml', 'neural-networks'],
        links: ['deep-learning'],
        sourceReferences: ['/raw/ml/neural.md'],
      },
      {
        id: 'deep-learning',
        title: 'Deep Learning Overview',
        aliases: ['Deep Nets'],
        content: '# Deep Learning Overview',
        plaintext: 'Deep learning stacks neural network layers and uses representation learning.',
        tags: ['ml', 'deep-learning'],
        links: [],
        sourceReferences: ['/raw/ml/deep.md'],
      },
      {
        id: 'risk-controls',
        title: 'Risk Controls',
        aliases: ['Control Policy'],
        content: '# Risk Controls',
        plaintext: 'Risk controls define thresholds and exception workflows.',
        tags: ['risk', 'controls'],
        links: [],
        sourceReferences: ['/raw/risk/controls.md'],
      },
    ] as WikiPage[];

    wikiManager = {
      listPages: jest.fn().mockResolvedValue(pages),
      getPage: jest.fn(async (pageId: string) => pages.find((page) => page.id === pageId) || null),
      getRelatedPages: jest.fn().mockImplementation(async (pageId: string) => {
        if (pageId === 'neural-networks') {
          return ['deep-learning', 'missing-page'];
        }
        return [];
      }),
    };
  });

  it('initializes and warns when there are no pages to index', async () => {
    wikiManager.listPages.mockResolvedValueOnce([]);
    const searchEngine = new SearchEngine(wikiManager as unknown as WikiManager, logger);

    await searchEngine.initialize();

    expect(logger.info).toHaveBeenCalledWith('Initializing search engine...');
    expect(logger.warn).toHaveBeenCalledWith('No pages found for indexing');
  });

  it('searches and ranks pages using title, alias, tag, and content signals', async () => {
    const searchEngine = new SearchEngine(wikiManager as unknown as WikiManager, logger);

    const results = await searchEngine.search('neural networks', 2);

    expect(results).toHaveLength(2);
    expect(results[0]?.page.id).toBe('neural-networks');
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score || 0);
    expect(logger.info).toHaveBeenCalledWith('Initializing search engine...');
  });

  it('returns no results when query tokens do not match indexed content', async () => {
    const searchEngine = new SearchEngine(wikiManager as unknown as WikiManager, logger);

    const results = await searchEngine.search('unmapped phrase', 10);

    expect(results).toEqual([]);
  });

  it('finds similar pages using related ids, shared tags, and direct links', async () => {
    const searchEngine = new SearchEngine(wikiManager as unknown as WikiManager, logger);

    const results = await searchEngine.findSimilar('neural-networks', 5);

    expect(results).toEqual([
      expect.objectContaining({
        page: expect.objectContaining({ id: 'deep-learning' }),
        score: 15,
        matchType: 'tag',
      }),
    ]);
  });

  it('returns no similar pages when the source page is missing', async () => {
    const searchEngine = new SearchEngine(wikiManager as unknown as WikiManager, logger);

    const results = await searchEngine.findSimilar('missing-page');

    expect(results).toEqual([]);
  });

  it('suggests page titles and tags by prefix frequency', async () => {
    const searchEngine = new SearchEngine(wikiManager as unknown as WikiManager, logger);

    const suggestions = await searchEngine.suggestTerms('de', 5);

    expect(suggestions).toEqual(expect.arrayContaining(['Deep Learning Overview', 'deep-learning']));
  });

  it('builds related-page searches and excludes the original page from results', async () => {
    const searchEngine = new SearchEngine(wikiManager as unknown as WikiManager, logger);

    const relatedResults = await searchEngine.getRelatedPages('neural-networks', 5);

    expect(relatedResults.some((result) => result.page.id === 'neural-networks')).toBe(false);
    expect(relatedResults.some((result) => result.page.id === 'deep-learning')).toBe(true);
  });

  it('returns no related pages when the source page is missing', async () => {
    const searchEngine = new SearchEngine(wikiManager as unknown as WikiManager, logger);

    const relatedResults = await searchEngine.getRelatedPages('missing-page', 5);

    expect(relatedResults).toEqual([]);
  });

  it('logs and rethrows errors from listPages during search', async () => {
    const searchEngine = new SearchEngine(wikiManager as unknown as WikiManager, logger);
    wikiManager.listPages.mockRejectedValueOnce(new Error('index unavailable'));

    await expect(searchEngine.search('neural')).rejects.toThrow('index unavailable');
    expect(logger.error).toHaveBeenCalledWith('Search failed: Error: index unavailable');
  });

  it('logs and rethrows suggestion errors', async () => {
    const searchEngine = new SearchEngine(wikiManager as unknown as WikiManager, logger);
    wikiManager.listPages.mockRejectedValueOnce(new Error('cannot list pages'));

    await expect(searchEngine.suggestTerms('ne')).rejects.toThrow('cannot list pages');
    expect(logger.error).toHaveBeenCalledWith('Failed to suggest terms: Error: cannot list pages');
  });
});