---
description: "Wiki entity data model with ERD and JSON schema"
---

# Data Model: Wiki Entities

**Status**: Phase 1 Design  
**Date**: April 14, 2026  

---

## Entity Relationship Diagram

```
┌─────────────────┐
│    WikiPage     │
├─────────────────┤
│ id (PK)         │
│ title           │
│ aliases[]       │
│ content         │
│ plaintext       │
│ created         │
│ modified        │
│ tags[]          │
│ links[] ────┐   │
└─────────────┼───┘
              │ (1-to-many)
              │
        ┌─────▼──────────────┐
        │  BacklinkRef       │
        ├────────────────────┤
        │ sourcePageId (FK)  │
        │ targetPageId (FK)  │
        │ context (excerpt)  │
        "---────────────────"

┌────────────────────────┐
│   WikiIndex (Cache)    │
├────────────────────────┤
│ version                │──┐
│ lastBuilt              │  │ (1-to-1)
│ pages{}                │──┼─→ WikiPage[]
│ invertedIndex{}        │  │
│ titleIndex{}           │  │
│ stats{}                │  │
└────────────────────────┘  │
                            │
┌───────────────────────────┴──┐
│   EmbeddingCache            │
├─────────────────────────────┤
│ modelVersion                │
│ embeddings{pageId → vec}    │
│ created                     │
│ pending[]                   │
└─────────────────────────────┘

┌────────────────────┐
│   RawDocument      │
├────────────────────┤
│ uri                │
│ name               │
│ type (pdf|md|txt)  │
│ size               │
│ modified           │
│ extractedTitle     │
│ status             │
│ error              │
└────────────────────┘

┌────────────────────┐
│    Decision        │
├────────────────────┤
│ id                 │
│ title              │
│ status             │
│ context            │
│ consequence        │
│ date               │
│ pageId (FK)────────┼──→ WikiPage
└────────────────────┘
```

---

## Core Entities

### 1. WikiPage

**Purpose**: A single wiki article/note with metadata and links.

**JSON Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "WikiPage",
  "required": ["id", "title", "content"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier (relative file path, normalized)",
      "example": "decision-trees-v1"
    },
    "title": {
      "type": "string",
      "description": "Display title",
      "minLength": 1,
      "maxLength": 200,
      "example": "Decision Trees"
    },
    "aliases": {
      "type": "array",
      "description": "Alternative names for fuzzy matching",
      "items": { "type": "string" },
      "example": ["DT", "Decision Tree algorithm", "CART"]
    },
    "content": {
      "type": "string",
      "description": "Full markdown content"
    },
    "plaintext": {
      "type": "string",
      "description": "Text extracted from content (for search)"
    },
    "created": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 creation timestamp"
    },
    "modified": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 modification timestamp"
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "example": ["machine-learning", "supervised-learning", "algorithms"]
    },
    "links": {
      "type": "array",
      "description": "List of wiki page IDs this page links to",
      "items": { "type": "string" },
      "example": ["entropy-calculation", "information-gain"]
    },
    "embedding": {
      "type": "array",
      "description": "Embedding vector (stored in cache, not in page index)",
      "items": { "type": "number" }
    },
    "sourceUri": {
      "type": "string",
      "description": "VS Code file URI for opening in editor"
    }
  }
}
```

**Validation Rules**:
- `id`: Must be kebab-case, unique across wiki
- `title`: Non-empty, max 200 chars
- `aliases`: Each max 100 chars, no duplicates
- `tags`: Lowercase, kebab-case
- `links`: Must reference existing page IDs (checked during indexing)

---

### 2. WikiIndex

**Purpose**: In-memory searchable index (persisted to cache).

**JSON Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "WikiIndex",
  "properties": {
    "version": {
      "type": "string",
      "description": "Index format version for migration",
      "example": "1.0"
    },
    "lastBuilt": {
      "type": "string",
      "format": "date-time"
    },
    "pages": {
      "type": "object",
      "description": "Map of page ID → minimal metadata (full content not cached)",
      "additionalProperties": {
        "$ref": "#/definitions/WikiPageMetadata"
      }
    },
    "invertedIndex": {
      "type": "object",
      "description": "Term → List of page IDs containing term",
      "additionalProperties": {
        "type": "array",
        "items": { "type": "string" }
      },
      "example": {
        "decision": ["decision-trees-v1", "decision-forest"],
        "tree": ["decision-trees-v1"]
      }
    },
    "titleIndex": {
      "type": "object",
      "description": "Normalized title → Page ID mapping",
      "additionalProperties": { "type": "string" },
      "example": {
        "decision trees": "decision-trees-v1",
        "dt": "decision-trees-v1"
      }
    },
    "stats": {
      "$ref": "#/definitions/IndexStats"
    }
  },
  "definitions": {
    "WikiPageMetadata": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "title": { "type": "string" },
        "aliases": { "type": "array", "items": { "type": "string" } },
        "tags": { "type": "array", "items": { "type": "string" } },
        "links": { "type": "array", "items": { "type": "string" } },
        "created": { "type": "string" },
        "modified": { "type": "string" }
      }
    },
    "IndexStats": {
      "type": "object",
      "properties": {
        "totalPages": { "type": "integer" },
        "totalLinks": { "type": "integer" },
        "totalTags": { "type": "integer" },
        "avgLinksPerPage": { "type": "number" },
        "lastUpdated": { "type": "string" }
      }
    }
  }
}
```

**Cache Location**: `.vscode/wiki-cache/index.json` (3–5MB typical for 100 pages)

---

### 3. EmbeddingCache

**Purpose**: Store pre-computed embeddings for semantic search (separate from index).

**JSON Schema**:
```json
{
  "type": "object",
  "title": "EmbeddingCache",
  "properties": {
    "modelVersion": {
      "type": "string",
      "description": "Version of embedding model",
      "example": "universal-sentence-encoder-v4"
    },
    "embeddings": {
      "type": "object",
      "description": "Map of page ID → 512-dim embedding",
      "additionalProperties": {
        "type": "array",
        "items": { "type": "number" }
      }
    },
    "created": { "type": "string", "format": "date-time" },
    "pending": {
      "type": "array",
      "description": "Pages not yet embedded",
      "items": { "type": "string" }
    }
  }
}
```

**Cache Location**: `.vscode/wiki-cache/embeddings.json` (50–100MB for 100 pages @ 512 dims)

---

### 4. RawDocument (File System Metadata)

**Purpose**: Track extraction status of PDF/markdown files in `/raw`.

**JSON Schema**:
```json
{
  "type": "object",
  "title": "RawDocument",
  "properties": {
    "uri": {
      "type": "string",
      "description": "File path relative to workspace",
      "example": "raw/research-papers/dl-survey.pdf"
    },
    "name": { "type": "string", "example": "dl-survey.pdf" },
    "type": { "type": "string", "enum": ["pdf", "md", "txt"] },
    "size": { "type": "integer", "example": 2048576 },
    "modified": { "type": "string", "format": "date-time" },
    "extractedTitle": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["pending", "success", "failed"]
    },
    "error": { "type": "string" }
  }
}
```

---

### 5. Decision (ADR - Architecture Decision Record)

**Purpose**: Track architectural and design decisions.

**JSON Schema**:
```json
{
  "type": "object",
  "title": "Decision",
  "properties": {
    "id": {
      "type": "string",
      "description": "ADR number or timestamp",
      "example": "adr-20260414-001"
    },
    "title": { "type": "string", "example": "Use TypeScript for VS Code extension" },
    "status": {
      "type": "string",
      "enum": ["proposed", "accepted", "rejected", "superseded"]
    },
    "context": { "type": "string", "description": "Why this decision was needed" },
    "consequence": { "type": "string", "description": "What we're committing to" },
    "date": { "type": "string", "format": "date-time" },
    "pageId": { "type": "string", "description": "Links to wiki page documenting this" }
  }
}
```

---

## Storage Strategy

### In-Memory During Session
- `WikiPage[]`: Loaded from cache on startup
- `WikiIndex`: Used for all search operations
- `EmbeddingCache.embeddings{}`: Loaded on first semantic search

### Persistent Cache (`.vscode/wiki-cache/`)
```
.vscode/
├── wiki-cache/
│   ├── index.json (500KB–5MB)
│   ├── embeddings.json (50–100MB)
│   └── metadata.json (stats, last rebuild time)
```

### Invalidation Rules
```typescript
// Cache invalidates when:
1. Any file in /raw changes (watcher detects)
2. Extension version changes (check package.json)
3. Embedding model version changes
4. User manually triggers rebuild

// On invalidation:
1. Delete embeddings.json (can regenerate)
2. Keep index.json, mark as stale
3. Trigger rebuild on next search (if stale)
```

---

## Normalization Rules

### Page ID Normalization
```typescript
// Input: "My Decision Tree Page"
// Output: "my-decision-tree-page"

function normalizeId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
    .replace(/\s+/g, '-')           // Space → dash
    .replace(/-+/g, '-');           // Multiple dashes → single
}
```

### Title Normalization (for search)
```typescript
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim();
}
```

### Tag Normalization
```typescript
// Tags are always lowercase, kebab-case
"machine learning" → "machine-learning"
"ML" → "ml"
```

---

## Relationships & Constraints

### WikiPage → WikiPage (Links)
- Forward links stored in `WikiPage.links[]`
- Backlinks derived during indexing
- Link validation: Referenced pages must exist
- Circular references allowed (e.g., AI ↔ Machine Learning)

### WikiPage → Decision
- N decisions can reference a single wiki page
- Decision recorded in separate registry (phase 3)
- Traceability: Each page change traceable to a decision

### Raw Files → WikiPage
- 1-to-1 mapping after extraction
- File change triggers re-extraction
- Failed extractions don't block index rebuild

---

## Success Criteria (Phase 1)

- [x] Entity models defined with JSON schema
- [x] Cache strategy documented
- [x] Normalization rules specified
- [x] Relationship constraints defined
- [ ] Data persistence layer implemented (Phase 2A)
- [ ] Index loading/saving functions (Phase 2A)

**Ready for Phase 2A**: Yes, scaffold can create persistence layer based on these schemas.

