# Karpathy Copilot Wiki

Transform your GitHub Copilot Chat conversations into a **searchable, intelligent personal knowledge base**.

> **Status**: ✅ MVP Production Ready | 31/31 Tests Passing | Marketplace Compatible

---

## 🎯 What is This?

The **Personal Wiki Extension** seamlessly integrates with your Copilot Chat to:

- 📝 **Create** wiki pages from conversations with automatic metadata
- 🔍 **Search** with BM25 ranking across all pages (50-500ms queries)
- 🏷️ **Organize** with auto-generated glossaries and tags
- 💾 **Archive** conversations as permanent decisions
- 🔗 **Connect** pages automatically via backlink detection
- ✅ **Analyze** wiki quality with orphan detection and scoring

**Key Insight**: Every AI conversation can become permanent knowledge, searchable 6 months later.

---

## 🚀 Quick Start (5 Minutes)

### 1. Install
```bash
git clone https://github.com/user/karpathy-copilot-wiki
cd karpathy-copilot-wiki/extension
npm install && npm run compile
```

### 2. Load in VS Code
1. Open Command Palette: `Cmd+Shift+P`
2. Run: `Developer: Install Extension from Location`
3. Select `extension/` folder

### 3. Create Your First Page
```bash
# Add a document to /raw folder
echo "# Neural Networks
Neural networks are computational models inspired by biological neurons.
" > ../raw/neural-networks.txt

# Run ingest
@wiki ingest
```

### 4. Search It
```
@wiki search neural networks
```

✅ **Done!** Your wiki is running.

---

## 📚 Documentation

| Doc | Purpose |
|-----|---------|
| [QUICKSTART.md](QUICKSTART.md) | 5-minute setup guide |
| [USER_GUIDE.md](USER_GUIDE.md) | Complete feature documentation |
| [API_REFERENCE.md](API_REFERENCE.md) | Developer API docs |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Deployment & publishing |
| [FAQ_TROUBLESHOOTING.md](FAQ_TROUBLESHOOTING.md) | Common issues & solutions |
| [ROADMAP.md](ROADMAP.md) | Product vision & timeline |
| [SOLUTION.md](./docs/SOLUTION.md) | Architecture & design |

---

## ✨ Core Features

### 🔍 Search
- **BM25 Ranking**: Fast, relevance-ranked full-text search
- **Keyword Fallback**: Automatic fallback if semantic search fails
- **50-500ms**: Typical query time for 50-page wiki
- **Autocomplete**: Search term suggestions

**Example**:
```typescript
const results = await queryHandler.query("attention mechanisms", {
  maxResults: 5
});
// Results: [{pageId, title, relevanceScore, excerpt}, ...]
```

### 📝 Page Management
- **YAML Frontmatter**: Metadata for title, tags, aliases, entities
- **WikiLinks**: Reference pages with `[[Page Name]]`
- **Auto-Backlinks**: Detect and index all incoming/outgoing links
- **Import/Export**: Markdown format for GitHub/Obsidian

**Example**:
```markdown
---
title: "Attention Mechanisms"
aliases: ["Attention", "Softmax Weighting"]
tags: [neural-networks, transformers]
created: 2026-04-14T10:30:00Z
entities:
  - concept: "Multi-Head Attention"
    confidence: 0.92
---

# Attention Mechanisms

Attention allows [[Neural Networks]] to focus on relevant parts...
```

### 💾 Conversation Archiving
- **One-Click Archive**: Save conversations as decisions
- **Auto-Linking**: Link to supporting wiki pages
- **Full History**: Keep conversation turn-by-turn in metadata

### 🏷️ Quality Analysis
- **Orphan Detection**: Find pages with no incoming/outgoing links
- **Quality Score**: 0-100 metric for wiki structure
- **Graph Density**: Measure interconnectedness
- **Suggestions**: Recommendations to improve wiki

---

## 🎮 Usage Examples

### Example 1: Create Wiki from Documents

```bash
# Add multiple documents to /raw
cp my_notes/*.md raw/
cp research_papers/*.txt raw/

# Ingest all at once
npm run wiki.ingest

# Rebuild index
npm run wiki.indexRebuild
```

### Example 2: Archive a Copilot Conversation

```
1. Have conversation with Copilot
2. Click: "📌 Archive this conversation"
3. Decision saved to /wiki/decisions/2026-04-14_topic.md
4. Automatically linked to relevant pages
```

### Example 3: Search and Preview

```bash
# In VS Code Command Palette
@wiki search "transformer architecture"

# Results:
# 1. Transformer Basics - Score: 0.92
# 2. Multi-Head Attention - Score: 0.87
# 3. Self-Attention Mechanism - Score: 0.81

# Click result → Open page with full content
```

### Example 4: Check Wiki Health

```bash
npm run wiki.lint deep

# Output:
# ✓ Quality Score: 78/100 (Good)
# ℹ Graph Density: 0.42 (Healthy)
# ⚠ Orphaned Pages: 3
#   - Pages with no links: intro, glossary, archive
# 💡 Suggestions:
#   - Add links from intro to core concepts
#   - Connect glossary terms to topic pages
```

---

## 🧠 How It Works

### Architecture

```
                    ┌─────────────────┐
                    │  VS Code Chat   │
                    └────────┬────────┘
                             │
                    @wiki search "topic"
                             │
                    ┌────────▼────────┐
                    │ Wiki Extension  │
                    │────────────────│
                    │ - WikiManager   │
                    │ - SearchEngine  │
                    │ - QueryHandler  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼───┐          ┌─────▼──┐          ┌──────▼──┐
   │  BM25  │          │Keyword │          │Embedded │
   │ Search │          │ Search │          │ Search  │
   └────┬───┘          └─────┬──┘          └──────┬──┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Wiki Pages     │
                    │  (/wiki/*.md)   │
                    └─────────────────┘
```

### Data Flow

```
Raw Document
    ↓
[Ingest] → Parse structure → Extract entities → Generate glossary
    ↓
Wiki Page (Markdown + YAML)
    ↓
[Index] → Build BM25 index → Create backlink graph → Generate INDEX.md
    ↓
Ready for Search & Query
    ↓
[Query] → BM25 → Keyword Fallback → Return results
    ↓
Display in Copilot Chat
```

---

## 📊 Test Coverage

**Status**: ✅ All tests passing

```
Test Suite: 31/31 passing
├─ Unit Tests (12)
│  ├─ SearchEngine: 3 tests
│  ├─ WikiManager: 4 tests
│  ├─ QueryHandler: 3 tests
│  └─ Utils: 2 tests
├─ Integration Tests (15)
│  ├─ Ingest workflow: 3 tests
│  ├─ Search + query: 4 tests
│  ├─ Archiving: 3 tests
│  ├─ Lint analysis: 3 tests
│  └─ Index rebuild: 2 tests
└─ E2E Tests (4)
   ├─ Full ingest pipeline: 1 test
   ├─ Search quality: 1 test
   ├─ Archive + link: 1 test
   └─ Lint + scoring: 1 test

Coverage: 28.14% (MVP threshold)
TypeScript: 0 errors
ESLint: 0 violations
```

### Run Tests
```bash
npm test                    # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run check-types       # Type checking
```

---

## 🏗️ Project Structure

```
karpathy-copilot-wiki/
├── extension/                 # VS Code extension
│   ├── src/
│   │   ├── extension.ts       # Entry point
│   │   ├── copilot/           # Copilot Chat integration
│   │   ├── wiki/              # WikiManager class
│   │   ├── search/            # SearchEngine (BM25)
│   │   ├── models/            # Types & interfaces
│   │   ├── query/             # QueryHandler
│   │   └── utils/             # Logger, error handler
│   ├── tests/                 # Unit & integration tests
│   ├── package.json           # Dependencies
│   └── tsconfig.json          # TypeScript config
├── tools/                     # Python CLI tools
│   ├── ingest/                # Document ingestion
│   ├── query/                 # Search interface
│   └── lint/                  # Quality analysis
├── wiki/                      # Generated pages (local)
│   ├── decisions/             # Archived conversations
│   ├── INDEX.md               # Auto-generated index
│   └── GLOSSARY.md            # Auto-generated glossary
├── raw/                       # Source documents (drop here)
├── tests/                     # Python tests
├── docs/                      # Documentation
└── README.md                  # This file
```

---

## 🔧 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI** | VS Code Extension API | Chat integration |
| **Runtime** | Node.js 18+ | TypeScript execution |
| **Language** | TypeScript 5.x | Type safety |
| **Testing** | Jest 29+ | Unit & integration tests |
| **Search** | BM25 (bm25-wasm) | Full-text ranking |
| **Backend** | Python 3.10+ | Document parsing, CLI tools |
| **Storage** | Markdown + YAML | Human-readable, git-compatible |

---

## 📋 Requirements

### To Use
- **VS Code**: 1.90+ (latest recommended)
- **Disk**: 50MB for base setup
- **RAM**: 256MB minimum (1GB+ recommended)
- **OS**: macOS, Windows, Linux

### To Develop
- **Node.js**: 18+ LTS
- **Python**: 3.10+ (for tools)
- **TypeScript**: 5.0+
- **npm**: 9.0+

---

## 🚀 Getting Started Paths

### 👤 Personal User
1. [QUICKSTART.md](QUICKSTART.md) - 5 min setup
2. [USER_GUIDE.md](USER_GUIDE.md) - Learn features
3. Start creating pages!

### 👨‍💻 Developer
1. [SOLUTION.md](./docs/SOLUTION.md) - Architecture overview
2. [API_REFERENCE.md](API_REFERENCE.md) - API docs
3. `npm test` - Run test suite
4. Start implementing features!

### 🚢 Deployer
1. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Local/marketplace
2. Create marketplace account
3. Publish to VS Code Marketplace

### 🤔 Troubleshooter
1. [FAQ_TROUBLESHOOTING.md](FAQ_TROUBLESHOOTING.md) - Common issues
2. Check GitHub issues
3. Run debug mode with logs

---

## 💡 Real-World Examples

### Use Case 1: Learning & Retention
```
┌─ Read article on transformers
├─ Ask Copilot questions
├─ Archive conversation → "Understanding Transformers"
│  (Auto-links to attention, neural networks pages)
├─ Search later: "how do transformers work?" → finds archived convo
└─ Reference consistently reduces forgetting curve
```

### Use Case 2: Research Organization
```
┌─ Ingest 50 research papers
├─ Auto-extracted concepts and entities
├─ Search: "applications of attention" → relevant papers
├─ Graph visualization shows paper relationships
└─ Build comprehensive research database
```

### Use Case 3: Team Knowledge Base
```
┌─ Shared wiki with team decisions
├─ Archive architectural decisions
├─ Search: "why did we choose this pattern?"
├─ Onboard new team members with context
└─ Reduces duplicate knowledge sharing
```

---

## 🌟 Key Differentiators

| Feature | This Extension | Obsidian | Roam Research | Notion |
|---------|---|---|---|---|
| Copilot Integration | ✅ Native | ❌ Plugin | ❌ No | ❌ No |
| BM25 Search | ✅ Fast | ✅ Yes | ✅ Yes | ✅ Yes |
| Local First | ✅ Yes | ✅ Yes | ❌ Cloud | ❌ Cloud |
| Open Source | ✅ MIT | ❌ Proprietary | ❌ Proprietary | ❌ Proprietary |
| Free | ✅ Yes | ✅ Yes | ❌ Limited | ❌ Limited |
| Conversation Archiving | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| Auto-Backlinks | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| Quality Analysis | ✅ Yes | ❌ No | ❌ No | ❌ No |

---

## 📈 Roadmap

### Phase 1 (✅ Complete - April 2026)
- MVP with search, archiving, quality analysis
- 31/31 tests passing
- Production ready

### Phase 2 (Planned - Q3 2026)
- Knowledge graph visualization
- Quick search panel
- UI improvements
- Target: 100+ stars, 5k+ downloads

### Phase 3 (Planned - Q4 2026)
- Local embeddings integration
- Semantic search
- Smart auto-tagging
- Target: 20%+ relevance improvement

### Phase 4 (Planned - Q1 2027+)
- Multi-user collaboration
- Cloud sync
- Team wikis
- Target: Enterprise customers

See [ROADMAP.md](ROADMAP.md) for full details.

---

## 🤝 Contributing

### Ways to Help
1. **Use it**: Report bugs, share feedback
2. **Code**: PRs for features/fixes
3. **Docs**: Improve documentation
4. **Share**: Tell others about it

### Bug Reports
1. Search existing issues
2. Include: OS, version, steps to reproduce
3. Attach logs from `View → Output → @wiki`

### Feature Requests
1. Describe use case
2. Vote on existing ideas
3. Comment with feedback

---

## 📞 Support

- **Questions**: Check [FAQ_TROUBLESHOOTING.md](FAQ_TROUBLESHOOTING.md)
- **Issues**: GitHub issues tracker
- **Docs**: See documentation section above
- **Logs**: `View → Output → @wiki` in VS Code

---

## 📄 License

MIT License - See LICENSE file for details.

Free for personal and commercial use.

---

## 🎉 Getting Started Now

```bash
# Clone
git clone https://github.com/user/karpathy-copilot-wiki
cd karpathy-copilot-wiki

# Install
cd extension && npm install

# Compile
npm run compile

# Load in VS Code
# Cmd+Shift+P → Developer: Install Extension from Location
# Select /extension folder

# Create first wiki page
cd ..
echo "# My First Page
This is my personal wiki." > raw/first-page.txt

# Ingest
# In VS Code: @wiki ingest

# Search
# In VS Code: @wiki search knowledge
```

**Questions?** Check [QUICKSTART.md](QUICKSTART.md) for detailed 5-minute setup.

---

**Transform your Copilot conversations into permanent knowledge. Start building your personal wiki today! 🚀**

---

## Statistics

- **Tests**: 31/31 ✅
- **TypeScript Errors**: 0 ✅
- **Code Coverage**: 28.14% 📊
- **Size**: ~250KB compiled
- **Performance**: 50-500ms searches 🚀
- **Marketplace**: Ready ✅

---

*Made with ❤️ for developers who want to remember everything they learn.*

**Last Updated**: April 14, 2026  
**Status**: Production Ready
