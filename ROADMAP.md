# Product Roadmap

Vision and roadmap for the Personal Wiki Extension through Phase 3 and beyond.

---

## Vision Statement

Transform how developers learn and retain knowledge by creating a **searchable, intelligent personal wiki integrated with GitHub Copilot Chat** that automatically extracts, organizes, and connects insights from conversations.

---

## Phase Overview

```
Q2 2026          Q3 2026          Q4 2026        Q1 2027+
   │                 │                │              │
   ├─ MVP        ├─ Phase 2    ├─ Phase 3   ├─ Growth
   │             │             │           │
   v             v             v           v

[Core Features] → [Enhanced UI] → [Intelligence] → [Expansion]
31/31 Tests ✓    Visualization   Embeddings      Multi-user
```

---

## Phase 1: MVP (✅ COMPLETE - April 2026)

**Status**: Production Ready  
**Timeline**: 6 weeks  
**Tests**: 31/31 passing

### Completed Features

- ✅ Wiki page creation with YAML metadata
- ✅ BM25 search with keyword fallback
- ✅ Document ingest from `/raw` folder
- ✅ Copilot Chat integration (@wiki commands)
- ✅ Decision archiving from conversations
- ✅ Backlink detection and graph construction
- ✅ Quality analysis (orphan detection, quality scoring)
- ✅ Glossary auto-generation
- ✅ Index rebuilding
- ✅ Unit & integration tests
- ✅ TypeScript + ESLint validation
- ✅ 28.14% code coverage (MVP threshold)

### Known Limitations

- Basic BM25 ranking (no embeddings)
- Keyword-only fallback search
- No UI visualization (CLI/terminal only)
- Single-user, local-only
- No cloud sync
- Limited to ~500 pages for optimal performance

### Metrics

- 50-500ms search queries
- <2s deep lint analysis
- 31 automated tests
- 0 critical bugs
- Marketplace ready

---

## Phase 2: Enhanced UI & UX (Planned - Q3 2026)

**Target**: July-September 2026  
**Goal**: Make wiki more discoverable with visual tools  
**Focus**: User experience, visualization

### Features

#### 1. Knowledge Graph Visualization

**Timeline**: 1-2 weeks  
**Complexity**: Medium

```
Capabilities:
- Interactive graph showing all pages and connections
- Node size = incoming link count (importance)
- Color-coded by tag
- Click to navigate to page
- Pan, zoom, search within graph
```

**Implementation**:
- Use D3.js or Vis.js for visualization
- Add WebView panel in VS Code
- Sync with backlink data

**Success Criteria**:
- Render 50+ nodes without lag
- <500ms load time
- Responsive pan/zoom

#### 2. Quick Search Panel

**Timeline**: 1 week  
**Complexity**: Low

```
Widget:
- Cmd+Shift+W = Open search
- Type query → instant results
- Enter = Open page
- Hover = Preview content
```

**Implementation**:
- VS Code QuickPick API
- Debounced search (150ms)
- Keyword highlighting

#### 3. Page Preview on Hover

**Timeline**: 3-5 days  
**Complexity**: Low

```
Behavior:
- Hover over WikiLink [[Page]] → Show preview
- Display: Title + excerpt (100 chars)
- Timeout: 500ms hover
- Dismisses on click
```

**Implementation**:
- HTML provider for hovers
- Markdown rendering

#### 4. Breadcrumb Navigation

**Timeline**: 3-5 days  
**Complexity**: Low

```
Shows:
- Root → Category → Current Page
- Clickable breadcrumbs
- Based on tag hierarchy
- Helps understand context
```

### Success Metrics

- 100+ GitHub stars
- 5k+ downloads
- 4.5+ marketplace rating
- <1% bug report rate

---

## Phase 3: Intelligence & Semantics (Planned - Q4 2026)

**Target**: October-December 2026  
**Goal**: Add semantic search with embeddings  
**Focus**: Smart recommendations, better relevance

### Features

#### 1. Local Embeddings

**Timeline**: 2-3 weeks  
**Complexity**: High

```
Technology:
- Sentence Transformers (all-MiniLM-L6-v2)
- Local computation (no cloud)
- ~100MB model size
- <300ms embedding time
```

**Capabilities**:
- Semantic similarity search
- "Find papers about X" understanding
- Better relevance ranking
- Reduce keyword dependency

**Implementation**:
1. Download embedding model on first use
2. Embed pages incrementally
3. Store embeddings in cache/
4. Use cosine similarity for search

**Success Criteria**:
- Relevance improvement 20%+
- <1s search time even with embeddings
- Zero network dependency
- Model cache <500MB

#### 2. Smart Auto-Tagging

**Timeline**: 1-2 weeks  
**Complexity**: Medium

```
Process:
- Extract key concepts from content
- Map to existing tags
- Suggest new tags
- User review + confirm
```

**Implementation**:
- extractEntities() from content
- TF-IDF for term scoring
- Cosine similarity to existing tags
- Interactive UI for acceptance

#### 3. Contradiction Detection

**Timeline**: 2-3 weeks  
**Complexity**: High

```
Detect:
- Pages making conflicting claims
- Similar concepts with different definitions
- Deprecated information
- Alert user to inconsistencies
```

**Implementation**:
- Embedding similarity between pages
- NLI (Natural Language Inference) for contradiction
- Multi-pair comparison
- Report generation

#### 4. Content Recommendations

**Timeline**: 1-2 weeks  
**Complexity**: Medium

```
Suggest:
- "You might also want to read: X"
- Based on currently viewed page
- Ranked by relevance
- Link from search results
```

**Implementation**:
- Find K similar pages (embeddings)
- Filter out already linked
- Return top 3-5
- Display in sidebar

### Success Metrics

- 60%+ improved search relevance
- 10k+ downloads
- 4.7+ marketplace rating
- Enterprise interest

---

## Phase 4: Collaboration & Cloud (Planned - Q1 2027+)

**Target**: January-March 2027+  
**Goal**: Multi-user wiki with sync  
**Focus**: Sharing, collaboration, cloud backup

### Features

#### 1. Git-Based Sync

**Timeline**: 2-3 weeks  
**Complexity**: Medium

```
Workflow:
- Auto-commit changes to git
- Push to GitHub/GitLab
- Pull updates from remote
- 3-way merge conflict resolution
```

**Implementation**:
- Nodegit or git CLI
- Commit on page create/update
- Fetch on init
- Merge strategy: keep local + remote

#### 2. Cloud Backup

**Timeline**: 1-2 weeks  
**Complexity**: Low

```
Options:
1. iCloud Drive (Mac native)
2. OneDrive (Windows)
3. Google Drive (cross-platform)
4. S3 bucket (enterprise)
```

**Implementation**:
- Monitor wiki/ folder
- Sync changes every 5 min
- Conflict resolution: latest wins
- User chooses sync backend

#### 3. Team Wiki

**Timeline**: 3-4 weeks  
**Complexity**: High

```
Features:
- Shared wiki for team
- Permission system (read/write)
- Comments on pages
- Change history/diff
- Slack/Teams integration
```

**Implementation**:
- Central backend server
- User authentication
- Database (PostgreSQL)
- REST API

#### 4. Advanced Analytics

**Timeline**: 2-3 weeks  
**Complexity**: Medium

```
Metrics:
- Most-read pages
- Search trends
- Knowledge gaps
- Contributor metrics
```

**Implementation**:
- Event logging (read, search, create)
- Analytics dashboard
- Query patterns analysis
- Heatmaps

### Success Metrics

- 50k+ downloads
- 10+ enterprise customers
- 4.9+ marketplace rating
- Self-sustaining revenue

---

## Phase 5: Enterprise & Scaling (2027+)

**Long-term vision beyond Q1**

### Planned Features

1. **Multi-Language Support**
   - Support wikis in 10+ languages
   - Translation assistance
   - Multi-language search

2. **Advanced Security**
   - End-to-end encryption
   - RBAC (role-based access control)
   - SAML/OAuth integration
   - Audit trails

3. **Mobile App**
   - iOS/Android reader
   - Offline sync
   - Mobile search

4. **Knowledge Intelligence**
   - ML-powered insights
   - Auto-summary generation
   - Question answering
   - Fact verification

5. **Integration Ecosystem**
   - Notion, Roam Research import
   - Obsidian plugin
   - Slack bot
   - IDE plugins (JetBrains, etc.)

---

## Technical Roadmap

### Infrastructure Improvements

```
Q2 2026
├─ TypeScript strict mode
├─ ESLint full compliance
└─ 100% test coverage (stretch goal)

Q3 2026
├─ Performance optimization
├─ Caching layer
├─ Database abstraction
└─ Plugin architecture

Q4 2026
├─ Local embeddings integration
├─ Vector search implementation
├─ Model caching
└─ Inference optimization

Q1 2027+
├─ Microservices architecture
├─ Kubernetes deployment
├─ Cloud provider SDKs
└─ Enterprise auth system
```

### Dependencies to Monitor

```
Current Stack:
- VS Code 1.90+
- Node.js 18+
- TypeScript 5.x
- Jest 29+
- Sentence Transformers (Phase 3)

Future:
- PostgreSQL (Phase 4)
- Redis (Phase 4, caching)
- OpenTelemetry (Phase 4, observability)
- gRPC (Phase 5, microservices)
```

---

## Success Criteria by Phase

### Phase 1 (✅ Complete)
- [x] 31 tests passing
- [x] 0 TypeScript errors
- [x] Marketplace ready
- [x] User documentation complete
- [x] All core features working

### Phase 2 (In Progress)
- [ ] UI visualization complete
- [ ] 100+ GitHub stars
- [ ] 5k+ downloads
- [ ] Positive user feedback
- [ ] < 1% bug report rate

### Phase 3
- [ ] Local embeddings fully integrated
- [ ] 20%+ relevance improvement
- [ ] 10k+ downloads
- [ ] 4.7+ marketplace rating
- [ ] Enterprise pilots launched

### Phase 4
- [ ] Multi-user collaboration working
- [ ] Git sync fully tested
- [ ] Cloud backup integrated
- [ ] 50k+ downloads
- [ ] 10+ paying enterprise customers

### Phase 5+
- [ ] 100k+ downloads
- [ ] 10+ language support
- [ ] Mobile apps available
- [ ] Industry recognition
- [ ] Sustainable revenue model

---

## Resource Requirements

### By Phase

| Phase | Duration | Team | Infrastructure |
|-------|----------|------|-----------------|
| 1 | 6 weeks | 1 FTE | Laptop + GitHub |
| 2 | 8 weeks | 1-2 FTE | Laptop + CDN |
| 3 | 10 weeks | 2 FTE | Laptop + GPU |
| 4 | 12 weeks | 3-4 FTE | AWS + DB |
| 5 | Ongoing | 5+ FTE | Enterprise infra |

### Budget Estimate (USD)

```
Phase 1: $0 (hobby project)
Phase 2: $2k-5k (hosting, CDN)
Phase 3: $5k-10k (GPU compute, infra)
Phase 4: $10k-20k (backend, DB)
Phase 5: $50k+/year (team, enterprise)
```

---

## Communication & Feedback

### Updates Schedule

- **Weekly**: GitHub discussions
- **Bi-weekly**: User community call
- **Monthly**: Release + changelog
- **Quarterly**: Strategic planning

### Feedback Channels

1. **GitHub Issues** - Feature requests, bugs
2. **Marketplace Reviews** - User satisfaction
3. **User Interviews** - Deep feedback (Phase 2+)
4. **Usage Analytics** - Feature adoption
5. **Community Discord** - Real-time discussion

### User Groups

1. **Early Adopters** (Phase 1) - MVP testers
2. **Power Users** (Phase 2) - Visual tools
3. **Enterprise** (Phase 4+) - Team collaboration
4. **Academic** (Phase 5+) - Research use

---

## Risk Mitigation

### Key Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Slow adoption | Revenue delay | Early user interviews |
| Technical debt | Maintenance burden | Code review, testing |
| Competitor tools | Market pressure | Differentiation, features |
| VS Code changes | Compatibility issues | Rapid testing after updates |
| API limitations | Feature constraints | Alternative implementations |

### Contingency Plans

- If VS Code API limits search: Implement server-based backend
- If embeddings too slow: Use lightweight model or fallback
- If adoption low: Pivot to Obsidian/Roam plugin
- If team unavailable: Open-source community takeover

---

## Success Metrics Dashboard

### Phase 1 (MVP)
```
Tests:      31/31 ✓
Coverage:   28.14% ✓
GitHub:     0 issues ✓
Marketplace: Ready ✓
```

### Phase 2 Targets
```
Stars:      100+
Downloads:  5k+
Rating:     4.5+/5
Bugs:       <1%
```

### Phase 3 Targets
```
Relevance:  +20%
Downloads:  10k+
Rating:     4.7+/5
Time/Query: <1s
```

### Phase 4 Targets
```
Downloads:  50k+
Customers:  10+ enterprise
MRR:        $1k+
Retention:  90%+
```

---

## How to Contribute

### Ideas Welcome

- Comment on GitHub issues
- Open feature requests
- Share use cases
- Suggest integrations

### Roadmap Vote

Each release, users vote on next features:
- 🎯 High priority (implement next)
- ❤️ Medium priority (consider)
- 💭 Low priority (backlog)

---

**Last Updated**: April 14, 2026  
**Next Review**: May 15, 2026  
**Status**: On track for Phase 1 completion
