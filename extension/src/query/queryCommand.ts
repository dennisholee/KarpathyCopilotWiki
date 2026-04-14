/**
 * Query Handler for Wiki Search
 * Implements search with Copilot-primary and local-fallback embeddings strategy
 */

import { Logger } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';
import { SearchEngine } from '../search/search-engine';
import { WikiManager } from '../wiki/wiki-manager';

export interface QueryOptions {
  maxResults?: number;
  useLocalEmbeddings?: boolean;
}

export interface QueryResult {
  query: string;
  results: SearchResultDetail[];
  sources: string[];
  usedFallback: boolean;
  executionTime: number;
}

export interface SearchResultDetail {
  pageId: string;
  title: string;
  excerpt: string;
  relevanceScore: number;
  matchType: 'title' | 'content' | 'semantic';
  sourceFile?: string;
}

export class QueryHandler {
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private searchEngine: SearchEngine;
  private wikiManager: WikiManager;

  constructor(searchEngine: SearchEngine, wikiManager: WikiManager, logger: Logger) {
    this.searchEngine = searchEngine;
    this.wikiManager = wikiManager;
    this.logger = logger;
    this.errorHandler = new ErrorHandler(logger);
  }

  /**
   * Execute search query with fallback strategy
   */
  async query(userQuery: string, options: QueryOptions = {}): Promise<QueryResult> {
    const startTime = Date.now();
    const maxResults = options.maxResults || 5;
    let usedFallback = false;

    try {
      this.logger.info(`Executing query: "${userQuery}"`);

      // Step 1: Try Copilot Chat primary search (if available from context)
      const primaryResults = await this.searchPrimary(userQuery, maxResults);

      if (primaryResults.length > 0) {
        this.logger.info(`Found ${primaryResults.length} results via primary search`);
        return {
          query: userQuery,
          results: primaryResults,
          sources: this.extractSources(primaryResults),
          usedFallback: false,
          executionTime: Date.now() - startTime,
        };
      }

      // Step 2: Fall back to local embeddings if available and enabled
      if (options.useLocalEmbeddings) {
        this.logger.info('Falling back to local embeddings search');
        const fallbackResults = await this.searchLocalFallback(userQuery, maxResults);

        if (fallbackResults.length > 0) {
          usedFallback = true;
          this.logger.info(`Found ${fallbackResults.length} results via fallback search`);
          return {
            query: userQuery,
            results: fallbackResults,
            sources: this.extractSources(fallbackResults),
            usedFallback: true,
            executionTime: Date.now() - startTime,
          };
        }
      }

      // Step 3: Basic keyword search fallback
      this.logger.info('Using basic keyword search fallback');
      const keywordResults = await this.searchKeywords(userQuery, maxResults);

      return {
        query: userQuery,
        results: keywordResults,
        sources: this.extractSources(keywordResults),
        usedFallback: keywordResults.length > 0 && primaryResults.length === 0,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`Query execution failed: ${String(error)}`);

      // Ultimate fallback: return empty results gracefully
      return {
        query: userQuery,
        results: [],
        sources: [],
        usedFallback: true,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Primary search using Copilot Chat API context
   * Returns semantic search results if configured
   */
  private async searchPrimary(query: string, maxResults: number): Promise<SearchResultDetail[]> {
    try {
      // Check if Copilot API is available
      const hasCopilotAPI = process.env.GITHUB_COPILOT_API_KEY && process.env.GITHUB_COPILOT_API_KEY.length > 0;

      if (!hasCopilotAPI) {
        this.logger.debug('Copilot API not configured, skipping primary search');
        return [];
      }

      // Use semantic search engine (assumes it has Copilot integration)
      const semanticResults = await this.searchEngine.search(query, maxResults);

      return semanticResults.map((result) => ({
        pageId: result.page.id,
        title: result.page.title,
        excerpt: result.page.plaintext.slice(0, 200),
        relevanceScore: result.score,
        matchType: result.matchType as 'title' | 'content' | 'semantic',
        sourceFile: result.page.sourceUri,
      }));
    } catch (error) {
      this.logger.warn(`Primary search failed: ${String(error)}`);
      return [];
    }
  }

  /**
   * Fallback search using local embeddings
   * Placeholder for sentence-transformers integration (Phase 3)
   */
  private async searchLocalFallback(query: string, maxResults: number): Promise<SearchResultDetail[]> {
    try {
      this.logger.debug('Attempting local embeddings search');

      // TODO: Implement with sentence-transformers in Phase 3
      // For now, return empty to allow keyword search fallback
      return [];
    } catch (error) {
      this.logger.debug(`Local fallback search failed: ${String(error)}`);
      return [];
    }
  }

  /**
   * Keyword-based search fallback
   * Searches page titles and content for query terms
   */
  private async searchKeywords(query: string, maxResults: number): Promise<SearchResultDetail[]> {
    try {
      const terms = query
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 2);

      if (terms.length === 0) {
        return [];
      }

      // Search all wiki pages
      const pages = await this.wikiManager.listPages();
      const scored: Array<SearchResultDetail & { score: number }> = [];

      for (const page of pages) {
        let score = 0;

        // Title matches score highest
        for (const term of terms) {
          if (page.title.toLowerCase().includes(term)) {
            score += 3;
          }
        }

        // Content matches score lower
        const plaintext = page.plaintext?.toLowerCase() || '';
        for (const term of terms) {
          const matches = (plaintext.match(new RegExp(term, 'g')) || []).length;
          score += matches * 0.5;
        }

        if (score > 0) {
          scored.push({
            pageId: page.id,
            title: page.title,
            excerpt: plaintext.slice(0, 200),
            relevanceScore: Math.min(score / 10, 1), // Normalize to 0-1
            matchType: 'title',
            score,
          });
        }
      }

      // Sort by score and return top results
      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(({ score, ...result }) => result);
    } catch (error) {
      this.logger.error(`Keyword search failed: ${String(error)}`);
      return [];
    }
  }

  /**
   * Extract source file references from results
   */
  private extractSources(results: SearchResultDetail[]): string[] {
    const sources = new Set<string>();

    for (const result of results) {
      if (result.sourceFile) {
        sources.add(result.sourceFile);
      }
    }

    return Array.from(sources);
  }

  /**
   * Format query results for context injection to Copilot Chat
   */
  formatContextMessage(queryResult: QueryResult): string {
    const lines: string[] = [];

    if (queryResult.results.length === 0) {
      return 'No wiki pages found matching your query.';
    }

    lines.push(`Found ${queryResult.results.length} relevant wiki pages:\n`);

    for (const result of queryResult.results) {
      lines.push(`**${result.title}**`);
      lines.push(`- Relevance: ${(result.relevanceScore * 100).toFixed(0)}%`);
      lines.push(`- Excerpt: ${result.excerpt.slice(0, 100)}...`);
      lines.push('');
    }

    if (queryResult.usedFallback) {
      lines.push('*Note: Search results generated using fallback method.*');
    }

    return lines.join('\n');
  }
}
