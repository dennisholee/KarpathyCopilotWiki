---
description: "Copilot Chat message flow diagrams and interaction patterns"
---

# Copilot Chat Message Flows

**Status**: Phase 1 Design  
**Date**: April 14, 2026  

---

## Flow 1: Search Query

```
User Input: "@wiki search for decision tree concepts"
    ↓
VS Code: Extract user prompt & command
    ↓
Extension Handler (handleCopilotQuery):
  1. Detect command: "search"
  2. Extract query: "decision tree concepts"
  3. Call indexService.search(query)
  4. Get results: [
       { pageId: "dt-v1", title: "Decision Trees", score: 0.95 },
       { pageId: "ml-overview", title: "ML Concepts", score: 0.72 }
     ]
  5. Format response:
       stream.progress('Found 2 results')
       for each result:
         stream.markdown(`**${result.title}**`)
         stream.reference(wikipageUri)
  6. Return ChatResult
    ↓
Copilot Chat: Display response to user
    ↓
User: (Can click reference to open in editor or ask follow-up)
```

**Code Implementation**:
```typescript
async function handleSearch(
  query: string,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<vscode.ChatResult> {
  stream.progress(`Searching for "${query}"...`);
  
  try {
    const results = await indexService.search(query, { limit: 10 });
    
    if (results.length === 0) {
      stream.markdown('No matching pages found.');
      return {};
    }
    
    stream.markdown(`# Search Results (${results.length} found)\n`);
    
    for (const result of results) {
      stream.markdown(`**[${result.title}](command:wiki.open?${encodeURIComponent(JSON.stringify([result.pageId]))})**`);
      stream.markdown(`_${result.matchType}_: ${result.excerpt}\n`);
      
      const pageUri = vscode.Uri.file(wikiDir + '/' + result.pageId + '.md');
      stream.reference(pageUri);
    }
    
    return { metadata: { command: 'search', resultCount: results.length } };
  } catch (error) {
    stream.markdown(`Error searching wiki: ${error instanceof Error ? error.message : 'unknown'}`);
    return {};
  }
}
```

---

## Flow 2: Rebuild Index Command

```
User Input: "@wiki /rebuild"
    ↓
VS Code: Detect slash command
    ↓
Extension Handler:
  1. stream.progress('Rebuilding index...')
  2. Call indexService.rebuildIndex()
     - Scans /raw folder
     - Extracts text from PDFs/markdown
     - Parses metadata
     - Builds inverted index
     - Generates embeddings
     - Saves cache
  3. Get result: { pagesProcessed: 42, embeddings: 42, errors: 0 }
  4. stream.markdown(`✓ Rebuilt ${result.pagesProcessed} pages`)
  5. Return ChatResult
    ↓
Copilot Chat: Display confirmation
```

**Code Implementation**:
```typescript
async function handleRebuild(
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<vscode.ChatResult> {
  stream.progress('Rebuilding wiki index...');
  
  const progressReporter = {
    onProgress: (msg: string) => stream.progress(msg)
  };
  
  try {
    const stats = await indexService.rebuildIndex();
    
    stream.markdown(`
# Index Rebuilt ✓

- **Pages**: ${stats.totalPages}
- **Links**: ${stats.totalLinks}
- **Embedded**: ${stats.embeddedPages}
- **Time**: ${stats.lastRebuild}
    `);
    
    return { metadata: { command: 'rebuild', stats } };
  } catch (error) {
    stream.markdown(`Error rebuilding index: ${error instanceof Error ? error.message : 'unknown'}`);
    throw error;
  }
}
```

---

## Flow 3: Free-Form Query (Semantic Search)

```
User Input: "@wiki How do embeddings work in this wiki?"
    ↓
VS Code: No command detected (free-form)
    ↓
Extension Handler:
  1. stream.progress('Analyzing query...')
  2. Call embeddingService.embed(userQuery)
  3. Get embedding vector: [0.12, 0.34, -0.56, ...]
  4. Call indexService.search(query, { matchType: 'semantic' })
  5. Find semantically similar pages
  6. Format response with explanations
    ↓
Copilot Chat: Display semantic search results
```

**Code Implementation**:
```typescript
async function handleFreeForm(
  query: string,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<vscode.ChatResult> {
  stream.progress('Analyzing your question...');
  
  const results = await indexService.search(query, {
    matchType: 'semantic',
    limit: 5
  });
  
  if (results.length === 0) {
    stream.markdown('I couldn\'t find relevant pages to answer your question. Try:');
    stream.markdown('- `/search` for specific terms');
    stream.markdown('- `/rebuild` if the index might be stale');
    return {};
  }
  
  stream.markdown('# Potentially relevant pages:\n');
  
  for (const result of results) {
    stream.markdown(`- **${result.title}** (${(result.score * 100).toFixed(0)}% relevant)`);
    stream.markdown(`  ${result.excerpt}`);
  }
  
  return { metadata: { command: 'free-form', resultCount: results.length } };
}
```

---

## Flow 4: Conversation Context

```
User: "@wiki What is a decision tree?"
  ↓ (Extension searches and returns pages)
  ├─ Result: Links to Decision Tree page
  │
User: "Tell me more about the applications"
  ↓
VS Code: context.history includes previous @wiki message
  ↓
Extension Handler:
  1. Receive context.history
  2. Previous messages show user asked "What is a decision tree?"
  3. Use previous context to refine follow-up search
  4. Search for "decision tree applications" (combined context)
  5. Return more targeted results
    ↓
User: Conversation feels natural with context
```

**Code Implementation**:
```typescript
async function handleWithHistory(
  request: vscode.ChatRequest,
  context: vscode.ChatContext,
  stream: vscode.ChatResponseStream
): Promise<vscode.ChatResult> {
  // Extract previous @wiki messages
  const previousMessages = context.history.filter(msg => 
    msg instanceof vscode.ChatRequestTurn && 
    msg.request.command?.includes('wiki')
  );
  
  // Build context string from previous queries
  let contextStr = '';
  for (const prev of previousMessages.slice(-2)) { // last 2 messages
    contextStr += ((prev as vscode.ChatRequestTurn).request.prompt) + ' ';
  }
  
  // Combine with current query
  const combinedQuery = contextStr + request.prompt;
  
  // Search with richer context
  const results = await indexService.search(combinedQuery, { limit: 10 });
  
  // Format response
  return formatSearchResults(results, stream);
}
```

---

## Error Handling Flows

### Flow 5A: Index Not Found

```
User: "@wiki search for something"
  ↓
Extension: Tries to search but index is missing
  ↓
stream.progress('Index not found, rebuilding...')
→ Trigger index rebuild
→ Once complete, perform search
→ Return results
```

### Flow 5B: Extraction Failure

```
User: "@wiki /rebuild"
  ↓
Extension: Processes /raw folder
  ├─ document1.pdf → ✓ Success
  ├─ document2.pdf → ✗ Error (corrupted)
  └─ document3.md  → ✓ Success
  ↓
stream.markdown(`
**Index Rebuilt** (with warnings):
- ✓ 2 pages indexed successfully
- ⚠ 1 page failed to extract: document2.pdf
  Error: Invalid PDF structure
`)
```

---

## Follow-Up Suggestions

```typescript
export async function getFollowups(
  lastResponse: string,
  lastQuery: string
): Promise<vscode.ChatFollowup[]> {
  // Parse what was searched
  // Suggest related queries
  
  return [
    {
      prompt: 'Show related concepts',
      label: 'Related topics'
    },
    {
      prompt: 'How does this compare to...',
      label: 'Comparisons'
    }
  ];
}
```

---

## Response Types Examples

### Markdown Response
```typescript
stream.markdown(`# Title\n\nContent with **bold** and _italic_`);
```

### Progress Updates
```typescript
stream.progress('Step 1: Extracting text');
// ... do work ...
stream.progress('Step 2: Parsing markdown');
stream.progress('Step 3: Building index');
```

### References (clickable links to wiki files)
```typescript
const pageUri = vscode.Uri.file(wikiDir + '/decision-trees.md');
stream.reference(pageUri);  // Makes page clickable in response
```

### Multi-Step Response
```typescript
stream.progress('Searching...');
stream.markdown('# Results\n');
results.forEach(r => {
  stream.markdown(`## ${r.title}`);
  stream.markdown(r.excerpt);
  stream.reference(r.uri);
});
```

---

## Activation Event Flow

```
User opens VS Code workspace with /wiki folder
  ↓
VS Code: Matches activationEvent "workspaceContains:**/wiki/**"
  ↓
Extension: activate() called
  1. Initialize services
  2. Load from cache
  3. Set up file watcher
  4. Register commands
  5. Register Copilot Chat participant as @wiki
  ↓
Copilot Chat: @wiki now available in chat
  ↓
User can type: "@wiki " and @wiki participant shown
```

---

## Summary: Message  Flow Contracts

| Interaction | Trigger | Handler | Output |
|------------|---------|---------|--------|
| **Search** | `@wiki search term` | `handleSearch()` | Markdown list + references |
| **Rebuild** | `@wiki /rebuild` | `handleRebuild()` | Status markdown |
| **Free-form** | `@wiki question?` | `handleFreeForm()` | Semantic results |
| **Context** | Follow-up message | history-aware handler | Contextual results |
| **Error** | Any error | Error handler | User-facing error message |

**Phase 1 Status**: ✅ Design complete. Ready for Phase 2A implementation.

