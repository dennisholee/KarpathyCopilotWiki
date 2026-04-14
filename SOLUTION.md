# Personal Wiki Extension MVP - Complete Solution
Last Updated: January 2025

## Overview

A VS Code extension that transforms Copilot Chat into a **persistent, searchable wiki** for managing personal knowledge from extended conversations. The system captures key decisions, insights, and topics discussed with Copilot, organizing them into interconnected wiki pages with full-text search capability.

**Key Achievement**: End-to-end workflow from raw source documents → wiki pages → full-text search → archived decisions.

---

## Architecture

### Core Components

```
extension/
├── src/
│   ├── copilot/              # Copilot Chat integration participant
│   ├── ingest/               # Document → Wiki page pipeline
│   ├── lint/                 # Wiki quality & consistency analysis
│   ├── query/                # Full-text search & archival
│   ├── search/               # Search engine with embeddings
│   ├── index/                # Page indexing & retrieval
│   ├── wiki/                 # Wiki graph management
│   ├── models/               # Data models & contracts
│   └── utils/                # Logger, error handling
└── e2e-validation.ts         # End-to-end test suite

tools/
├── ingest/                   # Python document ingestion pipeline
├── lint/                     # Python lint analysis tools
└── query/                    # Python query & archival backend
```

### Data Flow

```
Raw Documents (raw/*.txt)
  ↓
[Ingest Orchestrator]
  • Parse documents
  • Extract concepts & entities
  • Generate YAML frontmatter
  ↓
Wiki Pages (/wiki/*.md)
  • YAML frontmatter (metadata)
  • WikiLinks (backlinks)
  • Indexed content
  ↓
[Lint Orchestrator]
  • Detect orphaned pages
  • Find contradictions
  • Compute quality metrics
  ↓
Quality Report
  ↓
[Query Handler]
  • Full-text search
  • Relevance ranking
  • Filter by metadata
  ↓
Search Results
  ↓
[Decision Archiver]
  • Capture conversation context
  • Link supporting pages
  • Archive as decision node
  ↓
Decision Pages (/wiki/decisions/*.md)
```

---

## Component Specifications

### 1. Ingest Orchestrator (`src/ingest/ingestCommand.ts`)

**Purpose**: Convert raw documents into structured wiki pages with metadata.

**Workflow**:
```
Source Document
  ↓ [Parser]
  → Extract topics & entities
  ↓ [Frontmatter Generator]
  → Create YAML metadata
  ↓ [Pages Generator]
  → Split into sub-pages
  ↓ [Backlink Inserter]
  → Insert [[WikiLink]] references
  ↓
Created Wiki Pages
```

**Key Operations**:
- `ingest(sourceFile, skipBacklinks, maxPages)`: Main ingest pipeline
  - **Inputs**: Raw text file, configuration flags
  - **Outputs**: `IngestResult { pagesCreated, backlinksInserted, duration }`
  - **Time**: ~200-500ms per document
  
- `createPages(document, maxPages)`: Extract topics and create individual pages
  - Uses Python parser to identify semantic boundaries
  - Creates `/wiki/{slug}.md` files
  - Generates YAML frontmatter with tags, entities, source reference

- `insertBacklinks(text, pages)`: Create [[WikiLink]] connections
  - Identifies cross-page concept references
  - Inserts backlinks using Obsidian/Foam syntax
  - Returns count of links inserted

**Data Model**:
```typescript
interface IngestResult {
  pagesCreated: Array<{ slug: string; title: string; size: number }>;
  backlinksInserted: number;
  duration: number;
  errors?: string[];
}
```

### 2. Lint Orchestrator (`src/lint/lintCommand.ts`)

**Purpose**: Analyze wiki quality, detect structural issues, and surface inconsistencies.

**Quality Metrics**:
- **Orphaned Pages**: Pages with no backlinks or frontmatter links
- **Contradictions**: Conflicting claims across related pages
- **Unused Terms**: Defined in metadata but not referenced
- **Dangling Links**: WikiLinks pointing to non-existent pages
- **Coverage**: How well topics are interconnected

**Workflows**:

1. **Quick Lint** (primary workflow):
   ```
   /wiki pages
     ↓
   [Orphan Detector]
   - Find pages with no backlinks
   - Flag pages with orphaned subtopics
     ↓
   Orphan Report
   ```
   - **Time**: ~50-100ms for ~50 pages
   - **Output**: Orphaned page list with severity scores

2. **Deep Lint** (comprehensive):
   ```
   /wiki pages
     ↓
   [Contradiction Detector]
   - Compare conflicting claims
   - Extract version history
     ↓
   [Quality Scorer]
   - Interconnection density
   - Link coverage
     ↓
   Quality Report
   ```
   - **Time**: ~1-2 seconds for ~50 pages
   - **Output**: Detailed quality metrics + remediation guides

**Key Operations**:
- `lint(quickMode)`: Execute lint analysis
  - **Returns**: `LintResult { orphanCount, contradictionCount, qualityScore }`
  
- `detectOrphans()`: Find disconnected pages
  - Identifies pages with no backlinks
  - Surfaces pages with only self-references
  - **Returns**: Array of orphan pages with remediation suggestions

- `findContradictions()`: Detect conflicting information
  - Parses page relationships
  - Compares claims across versions
  - **Returns**: Array of contradiction reports

**Data Model**:
```typescript
interface LintResult {
  orphanCount: number;
  contradictionCount: number;
  qualityScore: number; // 0-100
  issues: Array<{
    page: string;
    type: 'orphan' | 'contradiction' | 'unused-term' | 'dangling-link';
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
}
```

### 3. Search Engine (`src/search/search-engine.ts`)

**Purpose**: Provide fast, relevant full-text search across wiki pages.

**Search Strategy**:
```
Query: "attention mechanisms"
  ↓
[Embedding Generation (optional)]
- If embeddings available: Generate query embedding
- Compute cosine similarity to page embeddings
  ↓
[Fallback: BM25 Full-Text Search]
- Parse query into terms
- Match against page content
- Rank by term frequency & page importance
  ↓
[Result Ranking]
- Combine embedding scores (if used) + BM25 scores
- Sort by relevance
  ↓
Ranked Results (max 10)
```

**Key Operations**:
- `search(query, options)`: Main search endpoint
  - **Input**: `query: string`, `options: { maxResults, useLocalEmbeddings }`
  - **Output**: `SearchResult { results, executionTime, usedFallback }`
  - **Time**: 50-500ms depending on page count and embedding availability

- `buildIndex()`: Create search index
  - Called on wiki initialization
  - Indexes page titles, content, frontmatter
  - Caches BM25 term frequencies

- `computeRelevance(query, pages)`: Calculate relevance scores
  - **Embedding-based** (if available): Cosine similarity
  - **Fallback**: BM25 algorithm
  - **Returns**: Array of `{ page, score }`

**Data Model**:
```typescript
interface SearchResult {
  results: Array<{
    title: string;
    description: string;
    relevanceScore: number; // 0-1
    pageUrl: string;
    highlights?: Array<{ line: string; context: string }>;
  }>;
  executionTime: number;
  usedFallback: boolean;
  totalMatches: number;
}
```

### 4. Query Handler (`src/query/queryCommand.ts`)

**Purpose**: Handle user queries from Copilot Chat and return contextual wiki pages.

**Workflow**:
```
User Query (via Copilot Chat)
  ↓
[Query Parser]
- Extract intent & entities
- Determine search scope
  ↓
[Search Execution]
- Call search engine
- Rank & filter by relevance
  ↓
[Context Assembly]
- Fetch related pages
- Build reference context
  ↓
Response to Copilot Chat
```

**Key Operations**:
- `query(userQuery, options)`: Process query and return results
  - **Input**: `userQuery: string`, `options: { maxResults, includeMetadata }`
  - **Output**: `QueryResult { results, recommendedPages, sources }`
  - **Time**: <500ms typical

- `getContext(page)`: Fetch full context for a page
  - Returns page content + backlinks + related pages
  - Used for chat message composition

- `suggestFollowUp(currentResults)`: Recommend next queries
  - Based on result entity relationships
  - Suggests related topics

**Data Model**:
```typescript
interface QueryResult {
  results: SearchResult['results'];
  recommendedPages: Array<{ title: string; reason: string }>;
  sources: Array<{ page: string; relevance: number }>;
  conversationContext?: string;
}
```

### 5. Decision Archiver (`src/query/decisionArchiver.ts`)

**Purpose**: Capture Copilot Chat conversations as permanent wiki decisions with supporting references.

**Workflow**:
```
Conversation Turn (multiple messages)
  ↓
[Transcript Extractor]
- Capture user message + assistant response
- Preserve conversation flow
  ↓
[Supporting Page Linker]
- Extract topic mentions
- Link to related wiki pages
  ↓
[Decision Formatter]
- Create /wiki/decisions/{id}.md
- Add YAML frontmatter with metadata
  ↓
Archived Decision
```

**Key Operations**:
- `archiveConversation(title, conversationTurns, supportingPages)`: Archive decision
  - **Input**: Decision title, conversation transcript, list of supporting pages
  - **Output**: `DecisionRecord { filename, title, created, conversationLength }`
  - Creates `/wiki/decisions/{date}_{slug}.md`

- `extractRationale(conversation)`: Extract key decision points
  - Identifies consensus points
  - Extracts supporting arguments
  - Returns structured rationale

- `linkSupportingPages(decision, pages)`: Create backlinks
  - Inserts `[[Page Name]]` references
  - Creates bidirectional links in supporting pages
  - **Returns**: Count of links created

**Data Model**:
```typescript
interface DecisionRecord {
  filename: string;
  title: string;
  created: Date;
  updated?: Date;
  conversationLength: number;
  supportingPages: string[];
  tags: string[];
}

interface ConversationTurn {
  speaker: 'user' | 'assistant';
  message: string;
  timestamp: Date;
  confidence?: number; // For LLM-extracted facts
}
```

### 6. Wiki Manager (`src/wiki/wiki-manager.ts`)

**Purpose**: Manage wiki graph structure, page relationships, and navigation.

**Core Responsibilities**:
- Maintain page filesystem structure
- Track backlink relationships
- Compute graph metrics (connectivity, centrality)
- Resolve page references
- Generate graph visualizations

**Key Operations**:
- `getPageGraph(depth)`: Get wiki graph structure
  - **Returns**: Graph with nodes (pages) and edges (backlinks)
  - Used by Foam graph visualizer
  
- `getRelatedPages(page, depth)`: Find conceptually related pages
  - Traverses backlink graph
  - Filters by relevance
  - **Returns**: Ordered list of related pages

- `computePageImportance(page)`: Calculate page centrality
  - Uses PageRank-like algorithm
  - Heavily linked pages rank higher
  - Used for search relevance

**Data Model**:
```typescript
interface WikiGraph {
  nodes: Array<{
    id: string;
    title: string;
    content: string;
    lastModified: Date;
    incomingLinks: number;
    outgoingLinks: number;
    importance: number; // 0-1
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: 'backlink' | 'related' | 'mentions';
  }>;
  metrics: {
    totalPages: number;
    totalLinks: number;
    density: number; // 0-1
    averageOutdegree: number;
  };
}
```

### 7. Index Manager (`src/index/index-manager.ts`)

**Purpose**: Maintain efficient page indexes for fast retrieval and search.

**Index Types**:
1. **TitleIndex**: Map of page slugs to titles
2. **ContentIndex**: Full-text inverted index (BM25)
3. **MetadataIndex**: YAML frontmatter attributes
4. **BacklinkIndex**: Reverse backlink map

**Key Operations**:
- `indexPage(page)`: Add/update page index
  - Extracts title, content, metadata
  - Updates all index types
  - **Time**: <10ms per page

- `search(term)`: Query indexes
  - Returns matching pages with scores
  - Fast O(1) or O(log n) lookups

- `rebuild()`: Rebuild all indexes from scratch
  - Called on startup or after major updates
  - **Time**: ~500ms for ~50 pages

---

## Common Workflows

### Workflow 1: Document Ingest

**Goal**: Convert a Copilot conversation into wiki pages

**Steps**:
1. Save conversation to `/raw/{date}_{topic}.txt`
2. Run ingest: `python -m tools.ingest.ingest add /raw/...`
3. Pages created in `/wiki/`
4. Backlinks automatically inserted

**Expected Result**:
- 3-8 wiki pages created
- 5-15 backlinks inserted
- Each page has YAML frontmatter with `tags`, `entities`, `source`

### Workflow 2: Quality Check

**Goal**: Identify issues in wiki structure

**Steps**:
1. Run orbhan check: `python -m tools.lint orphans`
2. Review orphaned pages
3. Run full lint: `python -m tools.lint full`
4. Create improvement plan

**Expected Result**:
- Orphaned page list
- Contradiction report
- Quality score with specific suggestions

### Workflow 3: Search & Context

**Goal**: Find relevant wiki pages for a Copilot query

**Steps**:
1. User types question in Copilot Chat
2. Extension calls `searchEngine.search(query)`
3. Returns top 3-5 most relevant pages
4. Extension inserts page summaries into chat context

**Expected Result**:
- 50-200ms search latency
- Top result matches user intent
- Context provided to Copilot for grounding

### Workflow 4: Archive Decision

**Goal**: Save a multi-turn Copilot conversation as a permanent decision

**Steps**:
1. User selects "Archive as Decision" in Copilot Chat
2. Extension captures conversation turns
3. Extracts supporting wiki pages mentioned
4. Creates `/wiki/decisions/{date}_{topic}.md`
5. Updates links in supporting pages

**Expected Result**:
- Decision node created in `/wiki/decisions/`
- Backlinks from supporting pages created
- Decision appears in graph visualization

---

## Data Models

### Wiki Page (Markdown with Frontmatter)

```markdown
---
title: "Attention Mechanisms"
entities:
  - concept: "Attention"
    confidence: 0.95
  - concept: "Query-Key-Value"
    confidence: 0.87
tags:
  - neural-networks
  - transformers
  - attention-mechanism
source: "20240414_transformer_architecture.txt"
created: 2024-04-14T09:30:00Z
updated: 2024-04-14T10:45:00Z
incomingLinks: 5
importance: 0.78
---

# Attention Mechanisms

Attention is a neural network mechanism that allows models to focus on relevant parts of input when processing sequences.

## Key Concepts

- **Scaled Dot-Product Attention**: Core attention operation
- **Multi-Head Attention**: Multiple attention heads running in parallel

## Related Topics
- [[Query-Key-Value Mechanism]]
- [[Transformer Architecture]]
- [[Multi-Head Attention]]
```

### Decision Node (Decision with Transcript)

```markdown
---
title: "Difference Between Attention and Transformers"
type: "decision"
created: 2024-04-14T10:00:00Z
conversationLength: 4
supportingPages:
  - "Attention Mechanisms"
  - "Transformer Architecture"
  - "Data Quality"
tags:
  - decision
  - transformers
  - attention
---

# Difference Between Attention and Transformers

## Conversation

**User**: "@copilot Explain the difference between attention and transformers"

**Assistant**: Attention is a mechanism for focusing on relevant parts of input. Transformers are a neural network architecture built on multi-head attention, enabling parallel processing of sequences.

**User**: "How does this relate to data quality?"

**Assistant**: Transformers process sequences of data. High-quality training data (completeness, accuracy, consistency) is essential for effective model training.

## Key Decision Points

- Attention is a mechanism; Transformers are an architecture
- Transformers are built on multi-head attention
- Data quality directly impacts transformer training

## Supporting Pages
- [[Attention Mechanisms]]
- [[Transformer Architecture]]
- [[Data Quality]]
```

---

## Performance Characteristics

| Operation | Time | Scalability | Notes |
|-----------|------|-------------|-------|
| Ingest (1 doc) | 200-500ms | O(n) per doc | Parallelizable |
| Lint (quick) | 50-100ms | O(p) pages | Linear scan |
| Lint (deep) | 1-2s | O(p²) pages | Pairwise comparisons |
| Search query | 50-500ms | O(log p) with index | Depends on embeddings |
| Archive decision | 100-200ms | O(p) | Page link traversal |
| Graph generation | 200-300ms | O(p²) edges | But rarely needed |

**Scaling Notes**:
- 50 pages: All operations <1s
- 100 pages: Deep lint may approach 2s
- 500+ pages: Consider pagination & caching

---

## Integration with Copilot Chat

### Copilot Chat Participant

**File**: `src/copilot/wiki-participant.ts`

**Capabilities**:
1. `@wiki search [topic]` - Search wiki for topic
2. `@wiki archive` - Archive conversation as decision
3. `@wiki graph` - Show knowledge graph
4. `@wiki suggest` - Get topic suggestions

**Implementation Pattern**:
```typescript
vscode.chat.createChatParticipant('wiki', {
  async onDidReceiveMessage(message, context, stream) {
    const query = message.prompt;
    const results = await searchEngine.search(query);
    
    stream.markdown(`Found ${results.results.length} pages:\n`);
    results.results.forEach(r => {
      stream.markdown(`- [${r.title}](vscode://open/${r.pageUrl})\n`);
    });
  }
});
```

---

## Testing

### Run Validation Suite

```bash
# End-to-end validation with sample documents
npm run validate:e2e

# Component tests
npm test

# Integration tests
npm run test:integration

# Lint analysis
python -m tools.lint full
```

### Test Coverage

- **Ingest**: Document parsing, frontmatter generation, backlink insertion
- **Lint**: Orphan detection, contradiction finding, quality scoring
- **Search**: BM25 ranking, embedding similarity, result filtering
- **Archive**: Conversation capture, link extraction, decision creation

---

## Architecture Decisions

### 1. YAML Frontmatter + Markdown
- **Why**: Foam/Obsidian compatible, human-readable, easily parseable
- **Alternative**: JSON in separate metadata file (rejected: fragmented)
- **Trade-off**: Slightly larger file size, but better interoperability

### 2. Embedded Search (BM25 + Embeddings)
- **Why**: No external service dependency, privacy-preserving
- **Alternative**: Elasticsearch (rejected: operational overhead)
- **Trade-off**: Slower on large datasets, but suitable for personal wiki

### 3. Python Backend + TypeScript Frontend
- **Why**: Python excellent for NLP/parsing; TypeScript for UI/indexing
- **Integration**: Async subprocess calls via Node.js child_process
- **Trade-off**: Multi-language complexity, but clear separation of concerns

### 4. Backlink-Only Graph
- **Why**: Simpler to maintain than full bidirectional graph
- **How**: Reverse index enables "Related Pages" queries
- **Alternative**: Full graph with forward/backward edges (rejected: extra maintenance)

---

## Future Enhancements

### Phase 2: Embeddings & Semantic Search
- Generate embeddings for all pages on startup
- Cohere API or local Sentence Transformers
- Hybrid search combining BM25 + semantic similarity
- **Effort**: 1-2 weeks

### Phase 3: Multi-Modal Ingest
- Support for images, tables, code blocks
- Extract table content as structured data
- Embed images as attachments
- **Effort**: 2-3 weeks

### Phase 4: Collaboration & Sync
- Multi-device wiki sync (via Git or cloud storage)
- Shared wiki repositories
- Merge conflict resolution
- **Effort**: 2-3 weeks

### Phase 5: LLM-Powered Features
- Auto-tagging using LLM
- Contradiction detection with explanation
- Auto-generated summaries and table of contents
- **Effort**: 2-3 weeks

---

## Deployment

### VS Code Extension

**Package & Publish**:
```bash
# Build extension
npm run build

# Create VSIX package
npx vsce package

# Publish to marketplace
npx vsce publish
```

**Installation**:
1. Open VS Code Extensions
2. Search for "Personal Wiki"
3. Click Install
4. Reload VS Code

**Initial Setup**:
1. Create `/wiki` directory in workspace
2. Extension initializes on first use
3. Index builds automatically (500ms for startup)

### Development Setup

```bash
# Clone repo
git clone https://github.com/user/karpathy-copilot-wiki
cd karpathy-copilot-wiki

# Install dependencies
npm install
pip install -r requirements.txt

# Build extension
npm run build

# Start debug session
F5 in VS Code
```

---

## Troubleshooting

### Issue: Pages not created during ingest

**Diagnosis**:
- Check `/wiki` directory exists
- Verify raw file has content
- Check logs for Python errors

**Solution**:
```bash
# Enable verbose logging
export DEBUG=wiki:*

# Run ingest with detailed output
python -m tools.ingest.ingest add /raw/file.txt --verbose
```

### Issue: Search returning no results

**Diagnosis**:
- Check index is built
- Verify pages contain search terms
- Check for typos in query

**Solution**:
```bash
# Rebuild index
python -m tools.ingest.ingest index rebuild

# Run test query
python -m tools.query query "test" --verbose
```

### Issue: Slow search on large wiki

**Diagnosis**:
- Wiki has >500 pages
- Embeddings enabled but not pre-computed

**Solution**:
```bash
# Disable embeddings for now
# Update src/search/search-engine.ts:
useLocalEmbeddings: false

# Or pre-compute embeddings offline
python -m tools.search precompute-embeddings --output embeddings.json
```

---

## Project Status

**Completed** ✅
- Ingest pipeline (document → pages)
- Lint analysis (quality metrics)
- Full-text search (BM25 + embeddings)
- Decision archiver (conversation → wiki node)
- Copilot Chat integration framework
- End-to-end validation suite

**In Progress** 🔄
- VS Code UI/UX polish
- Performance optimization
- Documentation & tutorials

**Not Started** ⏸️
- Multi-device sync
- Collaboration features
- Advanced LLM features

---

## Contributing

To extend the system:

1. **Add new document format**: Extend `tools/ingest/parser.py`
2. **Add new lint analysis**: Add to `tools/lint/analysis.py`
3. **Extend search features**: Update `src/search/search-engine.ts`
4. **Add Copilot commands**: Register in `src/copilot/wiki-participant.ts`

---

## References

- [Foam Knowledge Graph](https://foambubble.github.io/)
- [Obsidian Documentation](https://obsidian.md/docs/)
- [BM25 Algorithm](https://en.wikipedia.org/wiki/Okapi_BM25)
- [VS Code Chat Participants API](https://code.visualstudio.com/api/references/chat-participant)
- [W3C PROV Data Model](https://www.w3.org/TR/prov-dm/)
