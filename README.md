# Karpathy Copilot Wiki - Personal Knowledge Extension

[![Tests](https://img.shields.io/badge/tests-31%2F31%20passing-brightgreen)](https://github.com/user/karpathy-copilot-wiki)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen)](README.md)

## 📚 Overview

Transform your GitHub Copilot conversations into a **persistent, searchable personal knowledge base** with the Karpathy Copilot Wiki Extension.

Every conversation can become a permanent wiki entry—indexed, categorized, and discoverable 6 months later.

### Key Features

- 🔍 **Smart Search**: BM25-ranked full-text search with keyword fallback (50-500ms)
- 💾 **Archive Conversations**: Save Copilot Chat discussions as permanent wiki decisions  
- 🏷️ **Auto-Organization**: Generate glossaries, tags, and backlinks automatically
- 📊 **Quality Analysis**: Identify orphaned pages and wiki structure insights
- 🔗 **Interconnected**: Automatic WikiLink detection creates knowledge graphs
- ⚡ **Local & Fast**: No cloud dependency, runs entirely in VS Code

## 🚀 Quick Start

```bash
# 1. Install
git clone https://github.com/user/karpathy-copilot-wiki
cd karpathy-copilot-wiki/extension
npm install && npm run compile

# 2. Load in VS Code
# Command Palette → Developer: Install Extension from Location
# Select: /extension folder

# 3. Create first page
echo "# Neural Networks" > ../raw/neural-networks.txt

# 4. Ingest
# VS Code Command Palette: @wiki ingest

# 5. Search
# VS Code Command Palette: @wiki search neural networks
```

✅ **Done!** Your wiki is ready. See [QUICKSTART.md](QUICKSTART.md) for 5-minute setup.

## 📖 Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [README_COMPLETE.md](README_COMPLETE.md) | Full project overview | Everyone |
| [QUICKSTART.md](QUICKSTART.md) | 5-minute setup | New users |
| [USER_GUIDE.md](USER_GUIDE.md) | Feature documentation | End users |
| [API_REFERENCE.md](API_REFERENCE.md) | Developer API | Developers |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Publishing guide | DevOps |
| [FAQ_TROUBLESHOOTING.md](FAQ_TROUBLESHOOTING.md) | Common issues | Users |
| [ROADMAP.md](ROADMAP.md) | Future vision | Product managers |
| [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) | Navigation hub | Everyone |
| [SOLUTION.md](SOLUTION.md) | Architecture | Developers |
| [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) | Status report | Team |

**Start here**: [README_COMPLETE.md](README_COMPLETE.md)

## ✨ Core Commands

```bash
# Ingest documents from /raw into wiki
@wiki ingest

# Search the wiki
@wiki search [topic]

# Check wiki quality and structure  
@wiki lint

# Rebuild index and glossaries
@wiki indexRebuild
```

## 📊 Project Status

| Metric | Status |
|--------|--------|
| Tests | ✅ 31/31 passing |
| TypeScript | ✅ 0 errors |
| Coverage | 28.14% (MVP threshold) |
| Build | ✅ 57 KB production bundle |
| Marketplace | ✅ Ready to publish |

## 🏗️ Project Structure

```
karpathy-copilot-wiki/
├── extension/              # VS Code extension (TypeScript)
│   ├── src/
│   │   ├── wiki/          # WikiManager (page operations)
│   │   ├── search/        # SearchEngine (BM25 ranking)
│   │   ├── query/         # Query handler + archiving
│   │   ├── copilot/       # Copilot Chat integration
│   │   ├── ingest/        # Document ingestion
│   │   ├── lint/          # Quality analysis
│   │   ├── index/         # Index operations
│   │   ├── models/        # TypeScript interfaces
│   │   └── utils/         # Utilities & logging
│   └── tests/             # Unit & integration tests
├── tools/                 # Python CLI tools (legacy)
├── wiki/                  # Generated wiki pages (local)
│   ├── decisions/         # Archived conversations
│   ├── INDEX.md          # Page index
│   └── GLOSSARY.md       # Auto-generated glossary
├── raw/                   # Drop source documents here
├── tests/                 # Python tests
├── docs/                  # Additional documentation
└── README.md             # This file
```

## 🎮 Usage Examples

### Example 1: Ingest Documents
```bash
# Add documents to /raw
cp my_notes/*.md raw/
cp research_papers/*.txt raw/

# Ingest all
@wiki ingest

# Search results
@wiki search "machine learning"
```

### Example 2: Archive a Copilot Conversation  
```
1. Have conversation with Copilot
2. Click: "📌 Archive this conversation"  
3. Decision is now in /wiki/decisions/
4. Automatically linked to related pages
```

### Example 3: Check Wiki Quality
```bash
@wiki lint

# Output shows:
# - Orphaned pages (no links)
# - Quality score (0-100)
# - Improvement suggestions
```

## 🔧 Development

### Setup
```bash
cd extension
npm install
npm run compile
```

### Tests
```bash
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npm run check-types    # TypeScript check
```

### Build
```bash
npm run compile        # TypeScript → JavaScript
npm run watch         # Watch changes
npm run package       # Create VSIX for distribution
```

## 📚 API Overview

### WikiManager
- `createPage()` - Create wiki page
- `updatePage()` - Update page
- `getPage()` - Retrieve page
- `listPages()` - List all pages
- `getBacklinkGraph()` - Get page relationships
- `ingestFromRaw()` - Process raw documents
- `lint()` - Analyze wiki quality

### SearchEngine
- `initialize()` - Build BM25 index
- `search()` - Search pages
- `findSimilar()` - Find related pages
- `suggestTerms()` - Autocomplete

### QueryHandler
- `query()` - Execute query with fallbacks
- `formatContextMessage()` - Format for Copilot Chat

### DecisionArchiver
- `archiveConversation()` - Save decision
- `listDecisions()` - List archived conversations
- `getDecision()` - Retrieve decision

See [API_REFERENCE.md](API_REFERENCE.md) for complete documentation.

## 🚀 Deployment

### Local Installation
```bash
# VS Code Command Palette
Developer: Install Extension from Location
→ Select: /extension folder
```

### VS Code Marketplace
```bash
cd extension
npm install -g vsce
vsce login karpathy  # Enter your PAT
vsce publish patch   # Publish version
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for full deployment details.

## 🆘 Troubleshooting

**Extension doesn't activate?**
- Check: `View → Output → @wiki`
- Rebuild: `npm run compile && reload window`

**Search returns no results?**
- Rebuild index: `@wiki indexRebuild`
- Try simpler query (fewer words)

**High orphan count?**
- Add cross-links between related pages
- Review page titles for clarity
- Target: 40-60% graph density

See [FAQ_TROUBLESHOOTING.md](FAQ_TROUBLESHOOTING.md) for more issues and solutions.

## 🗺️ Roadmap

### Phase 1 ✅ Complete (April 2026)
- MVP with search, archiving, quality analysis
- 31/31 tests passing

### Phase 2 (Q3 2026)  
- Knowledge graph visualization
- Quick search panel
- UI improvements

### Phase 3 (Q4 2026)
- Local embeddings for semantic search
- Smart auto-tagging
- Contradiction detection

### Phase 4 (Q1 2027+)
- Multi-user collaboration
- Cloud sync
- Team wikis

See [ROADMAP.md](ROADMAP.md) for full vision.

## 📊 Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **UI** | VS Code Extension API | Native integration |
| **Runtime** | Node.js 18+, TypeScript 5.0+ | Type-safe |
| **Search** | BM25 (bm25-wasm) | Fast ranking |
| **Testing** | Jest 29+ | Comprehensive |
| **Storage** | Markdown + YAML | Human-readable |
| **Tools** | Python 3.10+ | CLI utilities |

## 📋 Requirements

### To Use
- VS Code 1.90+
- GitHub Copilot extension
- 50MB disk space

### To Develop
- Node.js 18+ LTS
- Python 3.10+ (optional)
- npm 9.0+
- TypeScript 5.0+

## 🤝 Contributing

### Report Issues
1. Search existing issues
2. Create issue with:
   - VS Code version
   - OS
   - Steps to reproduce
   - Error logs

### Suggest Features
1. Describe use case
2. Vote on existing ideas
3. Provide feedback

### Submit Code
1. Fork repository
2. Create feature branch
3. Write tests
4. Submit PR

## 📄 License

MIT License - Use freely for personal and commercial projects.

See [LICENSE](LICENSE) file for details.

---

## 🌟 Quick Links

- 📖 **[Full Documentation](DOCUMENTATION_INDEX.md)** - Navigation hub
- 🚀 **[Quick Start](QUICKSTART.md)** - 5-minute setup
- 📚 **[User Guide](USER_GUIDE.md)** - All features
- 👨‍💻 **[API Reference](API_REFERENCE.md)** - Developer docs
- 🗺️ **[Roadmap](ROADMAP.md)** - Future plans
- 🆘 **[FAQ](FAQ_TROUBLESHOOTING.md)** - Common issues

---

## 📈 Metrics

- **Lines of TypeScript**: 3,500+
- **Test Cases**: 31 (all passing)
- **Documentation**: 10 comprehensive guides
- **API Methods**: 40+
- **Bundle Size**: 57 KB (production)
- **Performance**: 50-500ms per search (50-page wiki)

---

## 👥 Authors

Built with ❤️ for developers who want to remember everything they learn.

---

## 📞 Support

- 📖 Check [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) for all guides
- 🆘 See [FAQ_TROUBLESHOOTING.md](FAQ_TROUBLESHOOTING.md) for common issues
- 🐛 Report issues on GitHub
- 💬 Join community discussions

---

**Ready to build your personal wiki?** Start with [QUICKSTART.md](QUICKSTART.md) 🚀

**Status**: ✅ Production Ready | Tests: 31/31 ✅ | Last Updated: April 14, 2026
