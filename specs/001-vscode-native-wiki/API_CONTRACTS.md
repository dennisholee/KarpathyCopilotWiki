---
description: "Service layer API contracts (request/response signatures)"
---

# Service Layer API Contracts

**Status**: Phase 1 Design  
**Date**: April 14, 2026  

---

## IndexService API

### search(query: string, options?: SearchOptions): Promise\<SearchResult[]\>

**Request**:
```typescript
{
  query: "decision tree algorithm",
  options: {
    limit: 10,
    matchType: "semantic",  // or "full-text"
    tags: ["machine-learning"],
    minScore: 0.5
  }
}
```

**Response**:
```typescript
[
  {
    pageId: "dt-v1",
    title: "Decision Trees",
    score: 0.92,
    matchType: "semantic",
    excerpt: "A decision tree is a supervised learning algorithm that..."
  },
  ... // up to limit results
]
```

**Error Cases**:
- `IndexNotInitializedError`: Index empty, must rebuild
- `QueryTooShortError`: Query < 2 characters
- `TimeoutError`: Search > 5s (index corrupted?)

---

### getPageById(pageId: string): Promise\<WikiPage | null\>

**Request**:
```typescript
"decision-trees-v1"
```

**Response**:
```typescript
{
  id: "decision-trees-v1",
  title: "Decision Trees",
  aliases: ["DT", "CART algorithm"],
  content: "# Decision Trees\n\n...",
  plaintext: "Decision Trees A decision tree is...",
  created: "2026-04-10T08:00:00Z",
  modified: "2026-04-14T12:30:00Z",
  tags: ["ml", "supervised"],
  links: ["entropy", "information-gain"],
  sourceUri: "file:///workspace/wiki/decision-trees-v1.md"
}
```

**Error Cases**:
- `PageNotFoundError`: pageId doesn't exist
- `CorruptedPageError`: Page file unreadable

---

### updateIndex(request: IndexRequest): Promise\<IndexStats\>

**Request**:
```typescript
{
  action: "update",
  fileUris: [
    "file:///workspace/raw/research-paper.pdf",
    "file:///workspace/wiki/decision-trees.md"
  ],
  reason: "File change detected by watcher"
}
```

**Response**:
```typescript
{
  totalPages: 42,
  totalLinks: 156,
  embeddedPages: 40,
  cacheSize: 52428800,  // 50MB
  lastRebuild: "2026-04-14T13:45:00Z"
}
```

**Error Cases**:
- `FileNotFoundError`: One of fileUris doesn't exist
- `ExtractionFailedError`: PDF corrupted, extraction failed
- `RebuildInProgressError`: Another rebuild running

---

### rebuildIndex(): Promise\<IndexStats\>

**Trigger**: User command, file watcher timeout, startup

**Process**:
```
1. Scan /raw folder for changes
2. For each file:
   - Extract text (PDF → text or MD → text)
   - Parse metadata (title, aliases, tags)
   - Create WikiPage object
3. Build inverted index
4. Generate embeddings (if enabled)
5. Save cache to .vscode/wiki-cache/
6. Return stats
```

**Response**:
```typescript
{
  totalPages: 42,
  totalLinks: 156,
  embeddedPages: 40,
  cacheSize: 52428800,
  lastRebuild: "2026-04-14T14:00:00Z"
}
```

**Progress Events** (streamed via callback):
```typescript
onProgress: (event: ProgressEvent) => {
  event.type: "scanning" | "extracting" | "indexing" | "embedding" | "saving"
  event.message: "Extracting text from document 3 of 15"
  event.progress: 0.2  // 0-1
}
```

**Error Cases**:
- `NoRawDocumentsError`: /raw folder empty
- `ExtractionBatchFailedError`: Multiple files failed, details in response
- `DiskSpaceError`: Not enough space for embeddings cache

---

## ExtractionService API

### extractFromPdf(filePath: string): Promise\<string\>

**Request**:
```typescript
"/workspace/raw/research-paper.pdf"
```

**Response**:
```
"Abstract\nThis paper explores decision trees...\n\n1. Introduction\n..."
```

**Error Cases**:
- `FileNotFoundError`: File doesn't exist
- `InvalidPdfError`: File is corrupted or not a PDF
- `FileTooLargeError`: File > 100MB
- `ExtractionTimeoutError`: Extraction > 30s

---

### parseMarkdown(markdown: string): Promise\<ParsedMarkdown\>

**Request**:
```typescript
`# Decision Trees

tags: machine-learning, supervised
aliases: DT, CART

A decision tree is...

## Applications
- Classification
- Regression

[[See also: Random Forest]]
`
```

**Response**:
```typescript
{
  title: "Decision Trees",
  tags: ["machine-learning", "supervised"],
  aliases: ["DT", "CART"],
  content: "# Decision Trees\n\n...",
  plaintext: "Decision Trees A decision tree is..."
}
```

---

## FileWatcherService API

### start(): Promise\<void\>

**Action**: Start monitoring /raw folder

**Events**: Emits via `onFilesChanged` callback

---

### onFilesChanged(callback: (request: IndexRequest) => void): void

**Callback receives**:
```typescript
{
  action: "update",
  fileUris: ["file:///workspace/raw/new-document.pdf"],
  reason: "File created in /raw folder"
}
```

**Debouncing**: 500ms (coalescesmultiple changes)

---

## EmbeddingService API

### embed(text: string): Promise\<number[]\>

**Request**:
```typescript
"A decision tree is a supervised learning algorithm that performs classification and regression tasks."
```

**Response**:
```typescript
[0.12, -0.34, 0.56, ..., 0.78]  // 512-dimensional vector
```

**Error Cases**:
- `ModelNotLoadedError`: Call initialize() first
- `TextTooLongError`: Text > 10,000 characters
- `EmbeddingTimeoutError`: > 5s

---

### similarity(embedding1: number[], embedding2: number[]): number

**Request**:
```typescript
{
  embedding1: [0.12, -0.34, ...],
  embedding2: [0.15, -0.32, ...]
}
```

**Response**:
```typescript
0.87  // Cosine similarity (0-1)
```

---

### findSimilar(embedding: number[], limit: number): Promise\<string[]\>

**Request**:
```typescript
{
  embedding: [0.12, -0.34, ...],
  limit: 5
}
```

**Response**:
```typescript
[
  "decision-trees-v1",
  "random-forest",
  "ensemble-methods",
  "classification",
  "supervised-learning"
]  // Page IDs sorted by similarity
```

---

## CopilotChatHandler API

### handleQuery(userQuery: string, command?: string): Promise\<string\>

**Request**:
```typescript
{
  userQuery: "search for decision tree concepts",
  command: "search"
}
```

**Response**:
```typescript
`# Search Results
Found 3 matches:
- **Decision Trees** (0.95) - A decision tree is...
- **Random Forest** (0.88) - Ensemble method combining...
- **Classification** (0.72) - Task of assigning...
`
```

**Error Cases**:
- `IndexNotReadyError`: Index still loading
- `QueryParseError`: Malformed query
- `NoResultsError`: No matches (return friendly message)

---

### getFollowups(lastResponse: string): Promise\<string[]\>

**Request**:
```typescript
"Search returned 3 results about Decision Trees"
```

**Response**:
```typescript
[
  "Tell me about Random Forests",
  "How do I use this for regression?",
  "Compare with neural networks"
]
```

---

## Error Handling Patterns

All services use consistent error responses:

```typescript
class WikiError extends Error {
  code: string;        // "INDEX_NOT_INITIALIZED" | "EXTRACTION_FAILED" etc
  message: string;     // User-friendly message
  details?: Record<string, unknown>;
}

// Usage in catch blocks:
try {
  const results = await indexService.search(query);
} catch (error) {
  if (error instanceof WikiError) {
    vscode.window.showErrorMessage(`Wiki: ${error.message}`);
    console.error(`Error code: ${error.code}`, error.details);
  }
}
```

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| **search()** | < 200ms | Full-text; < 500ms for semantic |
| **getPageById()** | < 50ms | In-memory lookup |
| **rebuildIndex()** | < 120s | For 50 pages + embeddings |
| **embed()** | 50–100ms | Per page; cache on first run |
| **startWatcher()** | < 1s | Initialization |
| **handleQuery()** | < 1s | Copilot response |

---

## Success Criteria (Phase 1)

- [x] All service method signatures defined
- [x] Request/response types documented
- [x] Error cases enumerated
- [x] Performance targets set
- [ ] TypeScript implementation (Phase 2A)
- [ ] Integration tests (Phase 2B)

**Ready for Phase 2A**: Yes, service implementations can follow these contracts exactly.

