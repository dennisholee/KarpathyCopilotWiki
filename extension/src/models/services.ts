/**
 * Index Service Interface
 *
 * Defines the contract for wiki index operations (search, update, rebuild).
 */

import { WikiIndex, WikiPage, SearchResult, IndexRequest, IndexerConfig, IndexStats } from './types';

/**
 * Main contract for wiki indexing operations
 */
export interface IIndexService {
  /**
   * Initialize the index service (load from cache or rebuild)
   */
  initialize(config: IndexerConfig): Promise<void>;

  /**
   * Search wiki by text query (full-text or semantic)
   * @param query Search text
   * @param options Search options (limit, matchType)
   * @returns Array of search results sorted by relevance
   */
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;

  /**
   * Get a wiki page by ID
   * @param pageId Page identifier
   * @returns Full page content or null if not found
   */
  getPageById(pageId: string): Promise<WikiPage | null>;

  /**
   * Update index after file changes
   * @param request Update request with file URIs and action
   */
  updateIndex(request: IndexRequest): Promise<void>;

  /**
   * Rebuild entire index from /raw documents
   */
  rebuildIndex(): Promise<void>;

  /**
   * Get index statistics
   */
  getStats(): Promise<IndexStats>;

  /**
   * Dispose resources (save cache, cleanup)
   */
  dispose(): Promise<void>;
}

export interface SearchOptions {
  /** Maximum results to return */
  limit?: number;

  /** Type of search: "full-text" or "semantic" */
  matchType?: "full-text" | "semantic";

  /** Restrict to specific tags */
  tags?: string[];

  /** Minimum relevance score (0-1) */
  minScore?: number;
}

/**
 * Document extraction service interface
 */
export interface IExtractionService {
  /**
   * Extract text from a PDF file
   * @param filePath Path to PDF file
   * @returns Extracted plain text
   */
  extractFromPdf(filePath: string): Promise<string>;

  /**
   * Extract text from markdown file
   * @param filePath Path to markdown file
   * @returns File content as markdown
   */
  extractFromMarkdown(filePath: string): Promise<string>;

  /**
   * Parse markdown and extract metadata
   * @param markdown Markdown content
   * @returns Parsed metadata (title, tags, etc.) and content
   */
  parseMarkdown(markdown: string): Promise<ParsedMarkdown>;
}

export interface ParsedMarkdown {
  title: string;
  tags: string[];
  aliases: string[];
  content: string;
  plaintext: string;
}

/**
 * File watcher service for /raw document changes
 */
export interface IFileWatcherService {
  /**
   * Start watching /raw folder for changes
   */
  start(): Promise<void>;

  /**
   * Stop watching (dispose resources)
   */
  stop(): Promise<void>;

  /**
   * Event emitted when files change
   */
  onFilesChanged: (callback: (request: IndexRequest) => void) => void;
}

/**
 * Embedding service for semantic search
 */
export interface IEmbeddingService {
  /**
   * Load embedding model
   */
  initialize(): Promise<void>;

  /**
   * Generate embedding for text
   * @param text Text to embed
   * @returns Embedding vector
   */
  embed(text: string): Promise<number[]>;

  /**
   * Compute similarity between two embeddings
   * @param embedding1 First embedding
   * @param embedding2 Second embedding
   * @returns Similarity score (0-1)
   */
  similarity(embedding1: number[], embedding2: number[]): number;

  /**
   * Find semantically similar pages
   * @param embedding Query embedding
   * @param limit Number of results
   * @returns Page IDs sorted by similarity
   */
  findSimilar(embedding: number[], limit: number): Promise<string[]>;

  /**
   * Dispose resources
   */
  dispose(): Promise<void>;
}

/**
 * Copilot Chat participant handler
 */
export interface ICopilotChatHandler {
  /**
   * Process user query and return response
   * @param userQuery User's natural language input
   * @param command Slash command (if any)
   * @returns Markdown response
   */
  handleQuery(userQuery: string, command?: string): Promise<string>;

  /**
   * Get follow-up suggestions for conversation
   * @param lastResponse Last response from handler
   * @returns List of suggested follow-up questions
   */
  getFollowups(lastResponse: string): Promise<string[]>;
}
