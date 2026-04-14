/**
 * Core Types: Personal LLM Wiki Extension
 *
 * Type definitions for indices, pages, and embeddings used throughout the extension.
 */

export interface WikiPage {
  /** Unique identifier (file path relative to workspace root) */
  id: string;

  /** Display title (from YAML metadata or derived from filename) */
  title: string;

  /** Alternative titles/aliases for fuzzy matching */
  aliases: string[];

  /** Full markdown content */
  content: string;

  /** Plain text extracted from content (for search) */
  plaintext: string;

  /** Metadata: creation date (ISO 8601) */
  created?: string;

  /** Metadata: last modified date (ISO 8601) */
  modified?: string;

  /** Category/tags for hierarchical organization */
  tags: string[];

  /** List of wiki page IDs this page links to */
  links: string[];

  /** Embedding vector for semantic search (stored separately in cache) */
  embedding?: number[];

  /** Source file URI (for opening in editor) */
  sourceUri?: string;
}

export interface WikiIndex {
  /** Version of index format (for migration compatibility) */
  version: string;

  /** Timestamp of last index rebuild (ISO 8601) */
  lastBuilt: string;

  /** Map of page ID → WikiPage metadata (minimal, without full content) */
  pages: Record<string, WikiPageMetadata>;

  /** Inverted index: term → list of page IDs containing term */
  invertedIndex: Record<string, string[]>;

  /** Title → ID mapping for fast lookup */
  titleIndex: Record<string, string>;

  /** Statistics: total pages, total links, etc. */
  stats: IndexStats;
}

export interface WikiPageMetadata {
  id: string;
  title: string;
  aliases: string[];
  tags: string[];
  links: string[];
  created?: string;
  modified?: string;
}

export interface IndexStats {
  totalPages: number;
  totalLinks: number;
  embeddedPages: number;
  cacheSize: number;
  lastRebuild: string;
}

export interface SearchResult {
  /** WikiPage ID */
  pageId: string;

  /** Page title */
  title: string;

  /** Relevance score (0-1, for ranking results) */
  score: number;

  /** Type of match: "title", "content", "backlink", "semantic" */
  matchType: "title" | "content" | "backlink" | "semantic";

  /** Excerpt from page (first 200 chars) */
  excerpt: string;
}

export interface IndexRequest {
  /** Command: "rebuild", "update", "delete" */
  action: "rebuild" | "update" | "delete";

  /** File URI triggering request */
  fileUri?: string;

  /** List of URIs for batch update */
  fileUris?: string[];

  /** Reason (for logging) */
  reason?: string;
}

export interface EmbeddingCache {
  /** Version of embedding model used */
  modelVersion: string;

  /** Map of page ID → embedding vector */
  embeddings: Record<string, number[]>;

  /** Timestamp of cache (ISO 8601) */
  created: string;

  /** List of page IDs not yet embedded */
  pending: string[];
}

export interface RawDocument {
  /** File URI within /raw folder */
  uri: string;

  /** File name */
  name: string;

  /** File type (pdf, txt, md, etc.) */
  type: string;

  /** File size in bytes */
  size: number;

  /** Last modified date (ISO 8601) */
  modified: string;

  /** Metadata: title extracted from file or PDF metadata */
  extractedTitle?: string;

  /** Extraction status: "pending", "success", "failed" */
  status: "pending" | "success" | "failed";

  /** Error message if extraction failed */
  error?: string;
}

export interface Decision {
  /** Unique identifier */
  id: string;

  /** Title of the decision */
  title: string;

  /** Decision status: "proposed", "accepted", "rejected", "superseded" */
  status: "proposed" | "accepted" | "rejected" | "superseded";

  /** Context: why this decision was made */
  context: string;

  /** Decision consequence: what we're committing to */
  consequence: string;

  /** Date decision was made (ISO 8601) */
  date: string;

  /** Wiki page ID that records this decision */
  pageId: string;
}

export interface CopilotChatRequest {
  /** User's natural language query */
  prompt: string;

  /** Slash command (if any): "search", "rebuild", etc. */
  command?: string;

  /** Chat context: previous messages in conversation */
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;

  /** Location: "chat", "quick-chat", "inline" */
  location?: "chat" | "quick-chat" | "inline";
}

export interface CopilotChatResponse {
  /** Response text (markdown) */
  markdown: string;

  /** List of wiki file references in response */
  references?: string[];

  /** List of follow-up suggestions for user */
  followups?: string[];

  /** Metadata about response generation */
  metadata?: Record<string, unknown>;
}

export interface IndexerConfig {
  /** Maximum file size to process (bytes) */
  maxFileSize: number;

  /** Debounce delay for file watcher (ms) */
  debounceMs: number;

  /** Enable automatic cache rebuild on startup */
  rebuildOnStartup: boolean;

  /** Cache location (relative to workspace) */
  cacheDir: string;

  /** Raw document folder (relative to workspace) */
  rawDir: string;

  /** Wiki folder (relative to workspace) */
  wikiDir: string;
}
