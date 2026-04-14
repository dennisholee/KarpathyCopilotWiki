# API Reference

Complete API documentation for the Personal Wiki Extension MVP.

---

## WikiManager

Central interface for wiki operations.

### Constructor

```typescript
constructor(workspacePath: string, logger: Logger)
```

### Methods

#### createPage()

Create a new wiki page.

```typescript
async createPage(
  title: string,
  content: string,
  metadata?: {
    aliases?: string[];
    tags?: string[];
    entities?: Array<{ concept: string; confidence: number }>;
    source?: string;
  }
): Promise<{ pageId: string; filepath: string; created: Date }>
```

**Example**:
```typescript
const page = await wiki.createPage(
  "Attention Mechanisms",
  "# Attention Mechanisms\n\nAttention allows...",
  {
    aliases: ["Attention", "Softmax Weighting"],
    tags: ["neural-networks", "transformers"],
    entities: [
      { concept: "Multi-Head Attention", confidence: 0.92 }
    ]
  }
);
```

#### updatePage()

Update existing page content or metadata.

```typescript
async updatePage(
  pageId: string,
  updates: {
    title?: string;
    content?: string;
    tags?: string[];
    aliases?: string[];
  }
): Promise<{ updated: Date; pageId: string }>
```

#### deletePage()

Delete a page from wiki.

```typescript
async deletePage(pageId: string): Promise<{ deleted: boolean }>
```

#### getPage()

Retrieve a page by ID.

```typescript
async getPage(pageId: string): Promise<{
  pageId: string;
  title: string;
  content: string;
  metadata: {
    created: Date;
    modified: Date;
    tags: string[];
    aliases: string[];
  };
  backlinks: string[]; // Page IDs that link to this
  forwardlinks: string[]; // Page IDs this links to
}>
```

#### listPages()

List all pages with summary.

```typescript
async listPages(): Promise<Array<{
  pageId: string;
  title: string;
  created: Date;
  modified: Date;
  tags: string[];
  incomingLinks: number;
  outgoingLinks: number;
}>>
```

#### getBacklinkGraph()

Get graph of all page relationships.

```typescript
async getBacklinkGraph(): Promise<{
  [pageId: string]: {
    incoming: string[]; // Pages linking to this
    outgoing: string[]; // Pages this links to
    depth: number; // Max distance to nodes
  }
}>
```

#### ingestFromRaw()

Parse documents from `/raw` folder and create pages.

```typescript
async ingestFromRaw(
  rawDir?: string
): Promise<{
  processed: number;
  created: number;
  failed: number;
  pages: Array<{ title: string; pageId: string }>;
  errors: Array<{ file: string; error: string }>;
}>
```

#### lint()

Analyze wiki quality.

```typescript
async lint(quickMode: boolean = true): Promise<{
  orphanCount: number; // Pages with no links
  orphanPages: string[]; // Page IDs
  qualityScore: number; // 0-100
  suggestions: string[];
  executionTime: number; // ms
  graphDensity: number; // 0-1
  averageLinksPerPage: number;
}>
```

---

## SearchEngine

BM25-ranked search with fallback strategies.

### Constructor

```typescript
constructor(wikiManager: WikiManager, logger: Logger)
```

### Methods

#### initialize()

Build BM25 index from current pages.

```typescript
async initialize(): Promise<{
  pageCount: number;
  indexSize: number; // bytes
  buildTime: number; // ms
  ready: boolean;
}>
```

#### search()

Search pages by BM25 ranking.

```typescript
async search(
  query: string,
  limit: number = 10,
  options?: {
    minScore?: number; // default: 0.1
    includeContent?: boolean; // default: false
    searchMode?: 'bm25' | 'keyword' | 'both'; // default: 'both'
  }
): Promise<Array<{
  pageId: string;
  title: string;
  relevanceScore: number; // 0-1
  excerpt?: string; // if includeContent: true
  matchType: 'title' | 'alias' | 'tag' | 'content';
  sourceFile?: string;
}>>
```

**Example**:
```typescript
const results = await search.search("neural networks", 5, {
  minScore: 0.3,
  includeContent: true
});
```

#### findSimilar()

Find pages related to a given page.

```typescript
async findSimilar(
  pageId: string,
  limit: number = 5
): Promise<Array<{
  pageId: string;
  title: string;
  similarityScore: number;
  commonTags: number;
  commonBacklinks: number;
}>>
```

#### suggestTerms()

Get autocomplete suggestions.

```typescript
async suggestTerms(
  partialQuery: string,
  limit: number = 5
): Promise<string[]>
```

---

## QueryHandler

User-facing query interface with Copilot fallbacks.

### Constructor

```typescript
constructor(
  searchEngine: SearchEngine,
  wikiManager: WikiManager,
  logger: Logger
)
```

### Methods

#### query()

Execute query with automatic fallback strategies.

```typescript
async query(
  userQuery: string,
  options?: {
    maxResults?: number; // default: 5
    useLocalEmbeddings?: boolean; // default: false (Phase 3+)
    fallbackToKeyword?: boolean; // default: true
    fallbackToTopic?: boolean; // default: true
  }
): Promise<{
  results: Array<{
    pageId: string;
    title: string;
    relevanceScore: number;
    excerpt: string;
  }>;
  executionTime: number; // ms
  usedFallback: boolean;
  fallbackReason?: string;
  query: string;
}>
```

**Fallback Chain**:
1. **BM25 Search**: Fast, reliable
2. **Keyword Search**: If BM25 fails or low scores
3. **Topic Mapping**: If keywords not found (Phase 3+)
4. **Empty Result**: If no matches after all fallbacks

#### formatContextMessage()

Format search results for Copilot Chat.

```typescript
async formatContextMessage(
  queryResult: QueryResult,
  options?: {
    includeExcerpts?: boolean;
    maxExcerptLength?: number; // default: 200
  }
): Promise<string>
```

**Output Example**:
```
5 relevant pages found (45ms):

1. [[Attention Mechanisms]] - Score: 0.92
   "Attention allows neural networks to focus..."

2. [[Transformer Architecture]] - Score: 0.87
   "Transformers use multi-head attention..."
```

---

## DecisionArchiver

Archive conversations as permanent wiki decisions.

### Constructor

```typescript
constructor(wikiDir: string, logger: Logger)
```

### Methods

#### archiveConversation()

Save conversation to wiki as decision.

```typescript
async archiveConversation(
  title: string,
  turns: Array<{
    speaker: 'user' | 'assistant';
    message: string;
    timestamp?: Date;
  }>,
  relatedPages?: string[] // Page titles to link
): Promise<{
  filename: string;
  title: string;
  pageId: string;
  created: Date;
  backlinksCreated: number;
}>
```

**Example**:
```typescript
const result = await archiver.archiveConversation(
  "Understanding Attention Mechanisms",
  [
    {
      speaker: 'user',
      message: 'What is attention?',
      timestamp: new Date()
    },
    {
      speaker: 'assistant',
      message: 'Attention is a mechanism that...',
      timestamp: new Date()
    }
  ],
  ['Neural Networks', 'Transformers']
);
```

#### listDecisions()

List all archived decisions.

```typescript
async listDecisions(): Promise<Array<{
  filename: string;
  title: string;
  created: Date;
  pageCount: number;
  relatedPages: number;
}>>
```

#### getDecision()

Retrieve archived decision.

```typescript
async getDecision(filename: string): Promise<{
  title: string;
  created: Date;
  conversation: Array<{
    speaker: 'user' | 'assistant';
    message: string;
    timestamp: Date;
  }>;
  relatedPages: string[];
  content: string; // Full markdown
}>
```

#### deleteDecision()

Delete archived decision.

```typescript
async deleteDecision(filename: string): Promise<{ deleted: boolean }>
```

---

## Logger

Structured logging for debugging.

### Constructor

```typescript
constructor(namespace: string, level?: 'debug' | 'info' | 'warn' | 'error')
```

### Methods

#### debug()
```typescript
debug(message: string, data?: any): void
```

#### info()
```typescript
info(message: string, data?: any): void
```

#### warn()
```typescript
warn(message: string, data?: any): void
```

#### error()
```typescript
error(message: string, error?: Error | string, data?: any): void
```

---

## Type Definitions

### PageMetadata

```typescript
interface PageMetadata {
  title: string;
  aliases?: string[];
  tags?: string[];
  created?: Date;
  modified?: Date;
  entities?: Array<{
    concept: string;
    confidence: number; // 0-1
  }>;
  source?: string;
  incomingLinks?: number;
  outgoingLinks?: number;
  importance?: number; // 0-1, calculated
}
```

### QueryResult

```typescript
interface QueryResult {
  results: Array<{
    pageId: string;
    title: string;
    relevanceScore: number;
    excerpt: string;
    matchType: 'title' | 'alias' | 'tag' | 'content';
  }>;
  executionTime: number;
  usedFallback: boolean;
  fallbackReason?: string;
  query: string;
}
```

### LintResult

```typescript
interface LintResult {
  orphanCount: number;
  orphanPages: string[];
  qualityScore: number; // 0-100
  suggestions: string[];
  executionTime: number;
  graphDensity: number; // 0-1
  averageLinksPerPage: number;
}
```

---

## Error Handling

All methods may throw `WikiError` with structured messages:

```typescript
try {
  const results = await search.search("query");
} catch (error) {
  if (error instanceof WikiError) {
    console.error(error.message);
    console.error(error.code); // 'INDEX_NOT_READY', 'PAGE_NOT_FOUND', etc.
    console.error(error.context); // Additional details
  }
}
```

**Common Error Codes**:
- `INDEX_NOT_READY` - Call `searchEngine.initialize()` first
- `PAGE_NOT_FOUND` - Page doesn't exist
- `INVALID_METADATA` - Metadata validation failed
- `INGEST_FAILED` - Document parsing failed
- `LINT_FAILED` - Quality analysis error
- `DISK_ERROR` - File I/O failed

---

## Performance Benchmarks

**Measured on MacBook Pro M2 with 50-page wiki**:

| Operation | Time | Notes |
|-----------|------|-------|
| `createPage()` | 15-25ms | Single page creation |
| `getPage()` | 2-5ms | Memory lookup |
| `listPages()` | 20-40ms | File enumeration |
| `search()` | 50-500ms | BM25 ranking |
| `findSimilar()` | 30-100ms | Graph traversal |
| `lint()` | 50-150ms (quick) / 1-2s (deep) | Quality analysis |
| `archiveConversation()` | 100-200ms | File I/O + backlinks |
| `initialize()` (index) | <1s | BM25 index build |

---

## Integration Examples

### With Express Server

```typescript
import express from 'express';
import { WikiManager } from './wiki/wiki-manager';

const app = express();
const wiki = new WikiManager(process.cwd(), logger);

app.get('/pages', async (req, res) => {
  const pages = await wiki.listPages();
  res.json(pages);
});

app.get('/search/:query', async (req, res) => {
  const results = await searchEngine.search(req.params.query);
  res.json(results);
});
```

### With Copilot Chat

```typescript
import * as vscode from 'vscode';

const queryHandler = new QueryHandler(searchEngine, wiki, logger);

// In chat participant
async handle(request) {
  if (request.prompt.includes('@wiki')) {
    const query = request.prompt.replace('@wiki', '').trim();
    const result = await queryHandler.query(query);
    const message = await queryHandler.formatContextMessage(result);
    response.markdown(message);
  }
}
```

---

**For full integration examples, see `tests/` directory.**
