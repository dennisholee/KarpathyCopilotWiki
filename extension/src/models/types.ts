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

  /** References to raw source documents associated with this page */
  sourceReferences?: string[];
}

export type QueryCoverageAssessment = 'complete' | 'partial' | 'insufficient' | 'conflicted';

export type StructuredAnswerConfidence = 'supported' | 'partially-supported' | 'insufficient-support';

export type GroundTruthMode = 'strict' | 'flexible';

export interface GroundTruthModeSetting {
  key: 'wiki.groundTruthMode';
  mode: GroundTruthMode;
  defaultMode: GroundTruthMode;
  scope: 'workspace';
}

export interface AnsweringPolicy {
  mode: GroundTruthMode;
  wikiOnly: boolean;
  allowSupplementalSources: boolean;
  showModeIndicator: boolean;
}

export interface WikiAnswerEnvelope {
  query: string;
  effectiveQuery: string;
  mode: GroundTruthMode;
  directAnswer: string;
  supportingReferences: string[];
  coverageGaps: string[];
  usedSupplementalKnowledge: boolean;
}

export interface PreviousWikiTurn {
  query: string;
  answer: string;
}

export interface SupportingFact {
  pageId: string;
  title: string;
  statement: string;
  sourceReferences: string[];
}

export interface ConflictItem {
  topic: string;
  summary: string;
  supportingPages: string[];
  supportingSources: string[];
}

export interface CoverageGap {
  missingTopic: string;
  reason: string;
  suggestedFollowUp: string;
}

export interface EvidenceBundle {
  supportingPages: Array<{
    pageId: string;
    title: string;
    sourceReferences: string[];
  }>;
  supportingFacts: SupportingFact[];
  sourceReferences: string[];
  coverageAssessment: QueryCoverageAssessment;
  conflicts: ConflictItem[];
  coverageGaps: CoverageGap[];
}

export interface StructuredAnswer {
  mode?: GroundTruthMode;
  directAnswer: string;
  keyDetails: string[];
  supportingReferences: string[];
  conflicts: string[];
  coverageGaps: string[];
  confidenceLabel: StructuredAnswerConfidence;
  usedSupplementalKnowledge?: boolean;
}

export type ModelIntent = 'derive' | 'enhance' | 'define';

export interface GuidelineReference {
  name: string;
  normalizedName: string;
}

export interface GuidelineResolution {
  requestedGuidelines: GuidelineReference[];
  appliesDefaultOpenMetadata: boolean;
  rationale: string;
}

export interface ModelingRequirement {
  rawRequest: string;
  normalizedRequest: string;
  intent?: ModelIntent;
  requestedChanges: string[];
  targetModelName?: string;
  inferredEntityName: string;
  requestedGuidelines?: GuidelineReference[];
}

export interface ExistingModelCandidate {
  pageId: string;
  title: string;
  relevanceScore: number;
  effectiveScore?: number;
  matchType: 'title' | 'content' | 'semantic';
  sourceReferences: string[];
  contentExcerpt: string;
  plaintext: string;
}

export interface EvidenceReference {
  pageId: string;
  title: string;
  sourceReferences: string[];
  statement?: string;
  usage: string;
  conflicted: boolean;
}

export interface ContractAttribute {
  name: string;
  description: string;
  dataType: string;
  required: boolean;
  businessRules: string[];
  validationLogic: string[];
  sourceReferences: string[];
  status: 'existing' | 'proposed' | 'assumed' | 'renamed';
  renameOf?: string;
}

export interface ContractOwner {
  id: string;
  type: string;
}

export interface TargetEntityReference {
  name: string;
  type: string;
  sourceKind: 'logical' | 'physical';
}

export interface SchemaEntry {
  name: string;
  dataType: string;
  description?: string;
  required: boolean;
  validationRules: string[];
  sourceReferences: string[];
  isAssumed: boolean;
}

export interface ContractResource {
  type: string;
  name: string;
  description: string;
  properties: Record<string, string>;
  sourceReferences: string[];
  isResolved: boolean;
}

export interface IncidentManagementDefinition {
  type: string;
  severity?: string;
  description?: string;
  sourceReferences: string[];
  isResolved: boolean;
}

export interface OpenMetadataModelContract {
  name: string;
  displayName: string;
  description: string;
  status: string;
  owner?: ContractOwner | null;
  targetEntity: TargetEntityReference;
  schemaText: string;
  resources: ContractResource[];
  incidentManagement?: IncidentManagementDefinition | null;

  // Transitional compatibility fields retained while the implementation moves
  // from the old proposal representation to the aligned contract shape.
  id: string;
  entityName: string;
  version: string;
  domain: string;
  guidelineSources?: string[];
  fallbackStrategy?: string;
  sourceModel?: string;
  sourceModelId?: string;
  attributes: ContractAttribute[];
  tags: string[];
}

export interface PlacementDecision {
  attributeName: string;
  action: 'add' | 'refine' | 'rename';
  targetAnchor: string;
  rationale: string;
  supportingSources: string[];
}

export interface ModelProposal {
  requirement: ModelingRequirement;
  baselineModel?: ExistingModelCandidate;
  contract: OpenMetadataModelContract;
  guidelineResolution?: GuidelineResolution;
  placementDecisions?: PlacementDecision[];
  rationale: string;
  changeSummary: string[];
  assumptions: string[];
  conflicts: string[];
  evidence: EvidenceReference[];
}

export interface ModelDefinitionSummary {
  requirement: ModelingRequirement;
  targetModel?: ExistingModelCandidate;
  summary: string;
  keyEntities: string[];
  keyRelationships: string[];
  rationale: string;
  assumptions: string[];
  conflicts: string[];
  evidence: EvidenceReference[];
}

export interface ModelSelectionResult {
  requirement: ModelingRequirement;
  candidates: ExistingModelCandidate[];
  baselineCandidate?: ExistingModelCandidate;
  needsRefinement: boolean;
  refinementReason?: string;
}

export interface ContractValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ContractValidationResult {
  isValid: boolean;
  issues: ContractValidationIssue[];
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
