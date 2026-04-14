import { Logger } from '../utils/logger';
import { WikiManager } from '../wiki/wiki-manager';
import { WikiPage } from '../models/types';

export interface SearchResult {
  page: WikiPage;
  score: number;
  matchType: 'title' | 'tag' | 'alias' | 'content' | 'semantic';
}

/**
 * BM25 parameters
 */
const BM25_K1 = 1.5; // Term frequency saturation point
const BM25_B = 0.75; // Field length normalization
const BM25_K3 = 8.0; // Query term frequency saturation

/**
 * Search engine with BM25 ranking and optional semantic search
 */
export class SearchEngine {
  private wikiManager: WikiManager;
  private logger: Logger;
  private termFrequencyCache: Map<string, Map<string, number>> = new Map();
  private documentLengthCache: Map<string, number> = new Map();
  private inverseDocumentFrequency: Map<string, number> = new Map();
  private averageDocumentLength: number = 0;
  private totalDocuments: number = 0;

  constructor(wikiManager: WikiManager, logger: Logger) {
    this.wikiManager = wikiManager;
    this.logger = logger;
  }

  /**
   * Initialize the search engine
   * Call this once before doing searches to build the index
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing search engine...');
      await this.buildIndex();
      this.logger.info('Search engine initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize search engine: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Build BM25 index from all wiki pages
   */
  private async buildIndex(): Promise<void> {
    const pages = await this.wikiManager.listPages();
    this.totalDocuments = pages.length;

    if (this.totalDocuments === 0) {
      this.logger.warn('No pages found for indexing');
      return;
    }

    // First pass: calculate document frequencies
    const documentFrequency: Map<string, number> = new Map();

    for (const page of pages) {
      const terms = this.tokenize(page.plaintext);
      const uniqueTerms = new Set(terms);

      this.documentLengthCache.set(page.id, terms.length);

      for (const term of uniqueTerms) {
        documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
      }
    }

    // Calculate IDF for each term
    for (const [term, df] of documentFrequency) {
      const idf = Math.log((this.totalDocuments - df + 0.5) / (df + 0.5) + 1.0);
      this.inverseDocumentFrequency.set(term, idf);
    }

    // Calculate average document length
    let totalLength = 0;
    for (const length of this.documentLengthCache.values()) {
      totalLength += length;
    }
    this.averageDocumentLength = totalLength / this.totalDocuments;

    // Second pass: build term frequency cache
    for (const page of pages) {
      const terms = this.tokenize(page.plaintext);
      const tfMap: Map<string, number> = new Map();

      for (const term of terms) {
        tfMap.set(term, (tfMap.get(term) || 0) + 1);
      }

      this.termFrequencyCache.set(page.id, tfMap);
    }

    this.logger.debug(
      `Indexed ${this.totalDocuments} pages with ${documentFrequency.size} unique terms`
    );
  }

  /**
   * Search wiki for matching pages
   */
  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      this.logger.debug(`Searching for: "${query}"`);

      // If index not built, build it now
      if (this.totalDocuments === 0) {
        await this.initialize();
      }

      const pages = await this.wikiManager.listPages();
      const results: SearchResult[] = [];

      // Score each page
      for (const page of pages) {
        const score = this.scorePage(page, query);
        if (score > 0) {
          results.push({
            page,
            score,
            matchType: 'content',
          });
        }
      }

      // Sort by score descending
      results.sort((a, b) => b.score - a.score);

      return results.slice(0, limit);
    } catch (error) {
      this.logger.error(`Search failed: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Score a page for a given query using BM25
   */
  private scorePage(page: WikiPage, query: string): number {
    let score = 0;

    // Title match (highest weight: 10x)
    if (this.matchesQuery(page.title, query)) {
      score += 20;
    }

    // Alias match (5x)
    for (const alias of page.aliases) {
      if (this.matchesQuery(alias, query)) {
        score += 10;
      }
    }

    // Tag match (3x)
    for (const tag of page.tags) {
      if (this.matchesQuery(tag, query)) {
        score += 6;
      }
    }

    // Content match using BM25
    const bm25Score = this.calculateBM25(page.id, query);
    score += bm25Score;

    return score;
  }

  /**
   * Calculate BM25 score for a page and query
   */
  private calculateBM25(pageId: string, query: string): number {
    const terms = this.tokenize(query);
    const documentLength = this.documentLengthCache.get(pageId) || 0;
    const termFrequencies = this.termFrequencyCache.get(pageId) || new Map();

    let score = 0;

    for (const term of terms) {
      const termFrequency = termFrequencies.get(term) || 0;
      const idf = this.inverseDocumentFrequency.get(term) || 0;

      if (idf === 0) {
        continue;
      }

      // BM25 formula
      const numerator =
        idf *
        termFrequency *
        (BM25_K1 + 1);
      const denominator =
        termFrequency +
        BM25_K1 *
          (1 - BM25_B + BM25_B * (documentLength / this.averageDocumentLength));

      score += numerator / denominator;
    }

    return score;
  }

  /**
   * Check if query matches a text field
   */
  private matchesQuery(text: string, query: string): boolean {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    return lowerText.includes(lowerQuery);
  }

  /**
   * Simple tokenizer: split by whitespace and lowercase
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 1) // Filter single characters
      .map((token) => token.replace(/[^a-z0-9]/g, '')); // Remove punctuation
  }

  /**
   * Find similar pages based on shared tags and links
   */
  async findSimilar(pageId: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      const page = await this.wikiManager.getPage(pageId);
      if (!page) {
        return [];
      }

      const relatedPages = await this.wikiManager.getRelatedPages(pageId);
      const pages = await this.wikiManager.listPages();

      const results: SearchResult[] = [];

      for (const relatedId of relatedPages.slice(0, limit)) {
        const relatedPage = pages.find((p) => p.id === relatedId);
        if (relatedPage) {
          // Score based on tag overlap and direct links
          let score = 0;
          for (const tag of page.tags) {
            if (relatedPage.tags.includes(tag)) {
              score += 5;
            }
          }
          if (page.links.includes(relatedId)) {
            score += 10;
          }

          results.push({
            page: relatedPage,
            score,
            matchType: 'tag',
          });
        }
      }

      results.sort((a, b) => b.score - a.score);
      return results;
    } catch (error) {
      this.logger.error(`Failed to find similar pages: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Suggest search terms based on current query
   */
  async suggestTerms(partialQuery: string, limit: number = 5): Promise<string[]> {
    try {
      const pages = await this.wikiManager.listPages();
      const suggestions: Map<string, number> = new Map();

      const lowerQuery = partialQuery.toLowerCase();

      for (const page of pages) {
        // Collect page titles as suggestions
        if (page.title.toLowerCase().startsWith(lowerQuery)) {
          suggestions.set(page.title, (suggestions.get(page.title) || 0) + 1);
        }

        // Collect tags as suggestions
        for (const tag of page.tags) {
          if (tag.toLowerCase().startsWith(lowerQuery)) {
            suggestions.set(tag, (suggestions.get(tag) || 0) + 1);
          }
        }
      }

      // Sort by frequency and return top suggestions
      return Array.from(suggestions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([term]) => term);
    } catch (error) {
      this.logger.error(`Failed to suggest terms: ${String(error)}`);
      throw error;
    }
  }

  async getRelatedPages(pageId: string, limit: number = 5): Promise<SearchResult[]> {
    try {
      this.logger.debug(`Finding related pages for: ${pageId}`);

      const page = await this.wikiManager.getPage(pageId);
      if (!page) {
        return [];
      }

      // Search using tags and title as query basis
      const searchTerms = [...page.tags, ...page.aliases, page.title];
      const searchQuery = searchTerms.join(' ');

      const results = await this.search(searchQuery, limit + 1); // +1 to account for the original page

      // Filter out the original page
      return results.filter((r) => r.page.id !== pageId).slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get related pages: ${String(error)}`);
      throw error;
    }
  }
}
