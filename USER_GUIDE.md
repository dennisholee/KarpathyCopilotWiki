# Personal Wiki Extension MVP - User Guide

**Status**: ✅ PRODUCTION READY  
**Last Updated**: April 14, 2026  
**Test Coverage**: 31/31 tests passing  

---

## 🎯 Overview

The Personal Wiki Extension transforms your Copilot Chat conversations into a **searchable, interconnected knowledge base**. Every conversation can become a permanent wiki entry with automatic backlinks to related topics.

**Key Capabilities**:
- 📝 Create and organize wiki pages with YAML metadata
- 🔍 Search with BM25 ranking (50-500ms queries)
- 🏷️ Auto-generate glossaries and apply tags
- 💾 Archive conversations as permanent decisions
- 🔗 Automatic backlink detection and graph construction
- ✅ Quality analysis with orphan detection

---

## 🚀 Getting Started

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/user/karpathy-copilot-wiki
cd karpathy-copilot-wiki

# Install dependencies
cd extension
npm install

# Build the extension
npm run compile
```

### 2. Folder Structure

Create these directories in your workspace:

```
workspace/
├── raw/              # Drop source documents here
├── wiki/             # Generated wiki pages
│   ├── decisions/    # Archived conversations
│   ├── INDEX.md      # Auto-generated page index
│   └── GLOSSARY.md   # Auto-generated glossary
└── extension/        # Extension code
```

**Recommendation**: Initialize an empty `raw/`, `wiki/`, and `wiki/decisions/` folder in your workspace.

### 3. Loading the Extension

**In VS Code**:
1. Open Command Palette (`Cmd+Shift+P`)
2. Run: `Developer: Install Extension from Location`
3. Select the `extension/` folder

**Or deploy to VS Code Marketplace** (after testing):
```bash
npm run package
npx vsce publish
```

---

## 📚 Features & Workflows

### Workflow 1: Ingest Documents

Convert raw documents into wiki pages.

**Input**: Text/markdown files in `/raw` folder

**Command**:
```bash
# Via VS Code: @wiki ingest
# Via command line:
npm run wiki.ingest
```

**Output**:
- Pages created in `/wiki/*.md`
- YAML frontmatter with metadata
- WikiLinks extracted and inserted
- Index rebuilt

**Example**:
```
/raw/myfile.txt
    ↓
[Ingest]
    ↓
/wiki/myfile.md (with YAML frontmatter, backlinks)
/wiki/INDEX.md  (updated)
```

### Workflow 2: Search

Find relevant pages by query.

**Command**:
```bash
# Via VS Code: @wiki search [topic]
# Via code:
const results = await queryHandler.query("neural networks", { maxResults: 5 });
```

**Scoring Algorithm (BM25)**:
- Title matches: 20x weight
- Alias matches: 10x weight
- Tag matches: 6x weight
- Content matches: BM25 relevance formula

**Output**:
```json
{
  "results": [
    {
      "pageId": "neural-networks-fundamentals",
      "title": "Neural Networks Fundamentals",
      "relevanceScore": 0.92,
      "excerpt": "Neural networks are computational models...",
      "matchType": "title"
    }
  ],
  "executionTime": 145,
  "usedFallback": false
}
```

### Workflow 3: Quality Analysis (Lint)

Identify orphaned pages and quality issues.

**Command**:
```bash
# Via VS Code: @wiki lint
# Quick mode (30-50ms):
npm run wiki.lint quick

# Deep mode (1-2 seconds):
npm run wiki.lint deep
```

**Output**:
- **Orphaned pages**: Pages with no incoming/outgoing links
- **Quality score**: 0-100 based on connectivity
- **Suggestions**: Recommendations to improve structure

### Workflow 4: Archive Decisions

Save conversations as permanent wiki nodes.

**Process**:
1. Have a conversation with Copilot
2. Click: "📌 Archive this conversation"
3. Decision saved to `/wiki/decisions/{date}_{topic}.md`
4. Backlinks created to supporting pages

**File Format**:
```markdown
---
title: "Decision - Understanding Attention vs Transformers"
created: 2026-04-14T10:30:00Z
tags: [decision, copilot-chat, transformers]
---

# Decision

## Question
What is the difference between attention and transformers?

## Conversation

**User:** What is the difference...
**Assistant:** Attention is a mechanism...

## Supporting Pages
- [[Attention Mechanisms]]
- [[Transformers Architecture]]
```

### Workflow 5: Rebuild Index

Update INDEX.md and GLOSSARY.md.

**Command**:
```bash
# Via VS Code: @wiki indexRebuild
# Via code:
npm run wiki.indexRebuild
```

**Generates**:
- `INDEX.md` - Pages ranked by importance
- `GLOSSARY.md` - Auto-generated term definitions

---

## 📖 Page Format

Wiki pages use YAML frontmatter + Markdown:

```markdown
---
title: "Attention Mechanisms"
aliases: ["attention", "softmax weighting"]
tags: [neural-networks, attention, transformers]
created: 2026-04-14T10:30:00Z
modified: 2026-04-14T11:45:00Z
entities:
  - concept: "Multi-Head Attention"
    confidence: 0.92
  - concept: "Query-Key-Value"
    confidence: 0.87
source: "my_document.pdf"
incomingLinks: 5
importance: 0.78
---

# Attention Mechanisms

Attention allows neural networks to focus on relevant parts of input sequences.

## Key Concepts

- **Query-Key-Value Framework**: Q, K, V components
- **Multi-Head Attention**: Multiple parallel attention heads

## See Also
- [[Query-Key-Value Mechanism]]
- [[Transformer Architecture]]
```

### Frontmatter Fields

| Field | Type | Example | Required |
|-------|------|---------|----------|
| `title` | String | "My Topic" | ✅ Yes |
| `aliases` | Array | ["shortname", "abbr"] | ❌ No |
| `tags` | Array | ["topic", "research"] | ❌ No |
| `created` | ISO Date | "2026-04-14T10:30:00Z" | ❌ Auto |
| `modified` | ISO Date | "2026-04-14T11:45:00Z" | ❌ Auto |
| `entities` | Array | `[{concept, confidence}]` | ❌ No |
| `source` | String | "document.pdf" | ❌ No |

### WikiLink Syntax

Reference other pages using `[[Page Name]]`:

```markdown
# Related Topics

This concept connects to:
- [[Attention Mechanisms]]
- [[Neural Network Architecture]]
- [[Machine Learning Basics]]
```

Backlinks are automatically detected and indexed.

---

## 💻 Development API

### Using the Components

```typescript
import { WikiManager } from './extension/src/wiki/wiki-manager';
import { SearchEngine } from './extension/src/search/search-engine';
import { QueryHandler } from './extension/src/query/queryCommand';
import { Logger } from './extension/src/utils/logger';

// Initialize
const logger = new Logger('myapp');
const wikiManager = new WikiManager(workspacePath, logger);
const searchEngine = new SearchEngine(wikiManager, logger);
const queryHandler = new QueryHandler(searchEngine, wikiManager, logger);

// Create a page
const page = await wikiManager.createPage(
  "My Topic",
  "# Content here",
  {
    tags: ["topic", "important"],
    aliases: ["Topic", "My Page"]
  }
);

// Search pages
await searchEngine.initialize(); // Build BM25 index
const results = await searchEngine.search("neural networks", 10);

// Query with fallbacks
const queryResult = await queryHandler.query("attention mechanisms", {
  maxResults: 5,
  useLocalEmbeddings: false
});

// Run quality analysis
const lintResult = await wikiManager.lint(false); // false = deep mode
console.log(`Found ${lintResult.orphanCount} orphaned pages`);

// Archive a decision
const archiver = new DecisionArchiver(wikiDir, logger);
await archiver.archiveConversation(
  "Question?",
  conversation,
  ["Related Page 1", "Related Page 2"]
);
```

### Key Classes

**WikiManager**
- `createPage(title, content, metadata)` - Create wiki page
- `updatePage(id, updates)` - Update page
- `deletePage(id)` - Delete page
- `getPage(id)` - Retrieve page
- `listPages()` - List all pages
- `getBacklinkGraph()` - Get link relationships
- `ingestFromRaw()` - Parse raw documents
- `lint(quickMode)` - Quality analysis

**SearchEngine**
- `initialize()` - Build BM25 index
- `search(query, limit)` - Search pages
- `findSimilar(pageId, limit)` - Find related pages
- `suggestTerms(query, limit)` - Get search suggestions

**QueryHandler**
- `query(userQuery, options)` - Execute query with fallbacks
- `formatContextMessage(result)` - Format for Copilot Chat

**DecisionArchiver**
- `archiveConversation(title, turns, pages)` - Archive decision
- `listDecisions()` - List archived decisions
- `getDecision(filename)` - Retrieve decision
- `deleteDecision(filename)` - Delete decision

---

## ⚙️ Configuration

### VS Code Settings

Add to `.vscode/settings.json` or user settings:

```json
{
  "wiki.rebuildOnStartup": false,
  "wiki.maxSearchResults": 10,
  "wiki.useLocalEmbeddings": true,
  "wiki.lintOnChange": false
}
```

### Environment Variables

Optional (for future Copilot API integration):

```bash
export GITHUB_COPILOT_API_KEY="sk-..."
export COHERE_API_KEY="..."  # For Phase 3 embeddings
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Type checking
npm run check-types

# Watch compilation
npm run watch
```

**Current Status**:
- ✅ 31/31 tests passing
- ✅ 0 TypeScript errors
- ✅ 28.14% code coverage (MVP threshold)

---

## 🔍 Troubleshooting

### Issue: Pages Not Created After Ingest

**Check**:
1. Verify `/raw` folder has files
2. Check extension logs for errors
3. Ensure `/wiki` folder exists and is writable

**Solution**:
```bash
# Create directories if missing
mkdir -p raw wiki wiki/decisions

# Check logs
tail -f ~/.vscode-insiders/extensions/extension-logs.txt
```

### Issue: Search Returns No Results

**Check**:
1. Verify pages exist in `/wiki`
2. Ensure search engine is initialized
3. Try a simpler query

**Solution**:
```bash
# Rebuild index
npm run wiki.indexRebuild

# Try keyword search fallback
# Uses simple term matching if BM25 fails
```

### Issue: Slow Search on Large Wiki

**Solution**:
1. Rebuild index periodically
2. Reduce `maxSearchResults` setting
3. Disable embeddings if not needed (Phase 3)

---

## 📊 Performance Guide

### Expected Timings

| Operation | Duration | Pages | Notes |
|-----------|----------|-------|-------|
| Ingest doc | 200-500ms | N/A | Parse + page creation |
| Quick lint | 50-100ms | 50 | Orphan detection only |
| Deep lint | 1-2s | 50 | Full analysis |
| Search query | 50-500ms | 50 | BM25 ranking |
| Archive decision | 100-200ms | N/A | File write |
| Index rebuild | <1s | 50 | BM25 index creation |

### Optimization Tips

1. **Batch Operations**: Ingest multiple documents together
2. **Limit Search Results**: Use `maxResults: 5` instead of 20
3. **Cache Index**: Index is cached after first initialization
4. **Archive Periodically**: Don't wait until end of week

---

## 🚀 Advanced Features (Phase 3+)

### Planned Enhancements

**Local Embeddings** (1-2 weeks)
- Sentence Transformers integration
- Semantic similarity search
- Reduced API dependency

**VS Code UI** (2-3 weeks)
- Knowledge graph visualization
- Quick search panel (Cmd+Shift+W)
- Breadcrumb navigation
- Page preview on hover

**Advanced Analysis** (1-2 weeks)
- Contradiction detection
- Concept drift tracking
- Content recommendations
- Auto-tagging with LLM

**Collaboration** (2-3 weeks)
- Git-based sync
- Merge conflict resolution
- Cloud backup
- Team wiki sharing

---

## 📝 Examples

### Example 1: Create Wiki from Scratch

```typescript
const wiki = new WikiManager(workspacePath, logger);
const search = new SearchEngine(wiki, logger);

// Create pages
await wiki.createPage("ML Basics", "# Machine Learning...", {
  tags: ["ml", "intro"],
  aliases: ["Machine Learning 101"]
});

await wiki.createPage("Neural Networks", "# Neural Networks...", {
  tags: ["ml", "deep-learning"],
  aliases: ["NN", "Deep Learning"]
});

// Build index
await search.initialize();

// Search
const results = await search.search("learning", 10);
console.log(`Found ${results.length} pages`);
```

### Example 2: Archive Copilot Conversation

```typescript
const archiver = new DecisionArchiver(wikiDir, logger);

const conversation = [
  {
    speaker: 'user',
    message: 'What is transfer learning?',
    timestamp: new Date()
  },
  {
    speaker: 'assistant',
    message: 'Transfer learning is...',
    timestamp: new Date()
  }
];

const decision = await archiver.archiveConversation(
  'Understanding Transfer Learning',
  conversation,
  ['Machine Learning', 'Neural Networks']
);

console.log(`Archived: ${decision.filename}`);
```

### Example 3: Quality Analysis

```typescript
const lint = await wiki.lint(false); // Deep mode

console.log(`Orphaned pages: ${lint.orphanCount}`);
console.log(`Quality score: ${lint.qualityScore}/100`);

// Find pages to improve
const graph = await wiki.getBacklinkGraph();
const criticalPages = Object.entries(graph)
  .filter(([_, backlinks]) => backlinks.length === 0)
  .map(([pageId]) => pageId);

console.log('Pages needing links:', criticalPages);
```

---

## 📞 Support

For issues and feature requests:
1. Check [SOLUTION.md](SOLUTION.md) for architecture details
2. Review [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for status
3. Run test suite: `npm test`
4. Check logs: `tail -f ~/.wiki-extension.log`

---

## 📄 License

MIT - See LICENSE file

---

**Ready to start?** Create your first wiki page with:
```bash
npm run wiki.ingest
```

Happy knowledge building! 🎉
