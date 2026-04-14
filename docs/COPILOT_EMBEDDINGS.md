# GitHub Copilot Embeddings Integration

## Overview

The Personal LLM Wiki now supports **optional** GitHub Copilot API for semantic embeddings, enabling more powerful semantic search capabilities beyond local models.

## Architecture Decision

Updated [Constitution](../.specify/memory/constitution.md) now allows **Local-First with Optional Remote** services:

- **Local by Default**: Uses `sentence-transformers` (all-MiniLM-L6-v2) for all embeddings and search
- **Opt-in Remote**: Users can explicitly enable GitHub Copilot API via `--use-copilot` CLI flag
- **Graceful Degradation**: Falls back to local embeddings if remote service is unavailable
- **Transparency**: Users are informed via logging when remote services are used

## Usage

### Enable Copilot Embeddings for Query

Set the `GITHUB_COPILOT_API_KEY` environment variable, then use the `--use-copilot` flag:

```bash
export GITHUB_COPILOT_API_KEY="your-api-key"

# Query with Copilot embeddings
python -m tools.query "What frameworks should I use?" --use-copilot

# Search with Copilot embeddings
python -m tools.query search "machine learning" --use-copilot --top-k 10
```

### Default Behavior (Local)

Without the `--use-copilot` flag, all operations use local embeddings:

```bash
# Query with local embeddings (default)
python -m tools.query "What frameworks should I use?"

# Search with local embeddings
python -m tools.query search "machine learning" --top-k 10
```

## Configuration

| Component | Local Default | Remote (Copilot) |
|-----------|---------------|-----------------|
| Embedding Model | `all-MiniLM-L6-v2` (150MB) | `text-embedding-3-small` |
| Compute Location | Local GPU/CPU | GitHub Copilot servers |
| Privacy | No data sent externally | Sends search text to Copilot API |
| Setup Required | None (auto-download) | GitHub Copilot API key |
| Speed | Slower on first run (model download) | Faster after API call |
| Cost | Free (local) | Pay-per-use (Copilot API) |

## Implementation Details

### Embedding Providers

Two provider classes handle embeddings:

1. **`LocalEmbeddingProvider`**: Uses `sentence-transformers` library
   - Model: `all-MiniLM-L6-v2` (384-d embeddings)
   - Completely offline and free
   - Deterministic results

2. **`CopilotEmbeddingProvider`**: Uses GitHub Copilot API
   - Model: `text-embedding-3-small`
   - Requires `GITHUB_COPILOT_API_KEY` environment variable
   - Remote computation with higher-quality embeddings
   - Falls back to local on API error

### Query Engine

`WikiQueryEngine` now accepts embedding provider parameters:

```python
# Use local embeddings (default)
engine = WikiQueryEngine(
    wiki_dir="wiki",
    use_embeddings=True,
    embedding_provider="local"
)

# Use Copilot embeddings (remote)
engine = WikiQueryEngine(
    wiki_dir="wiki",
    use_embeddings=True,
    embedding_provider="copilot",
    copilot_api_key="your-api-key"  # or uses env var
)

# Use keyword search only
engine = WikiQueryEngine(
    wiki_dir="wiki",
    use_embeddings=False
)
```

## Constitution Compliance

Updated constraint in [Constitution v1.1](../.specify/memory/constitution.md):

> **Local-First with Optional Remote**: By default, all operations use local models. Remote services may be used **only** when:
> 1. Explicitly enabled by users via CLI flag (`--use-copilot`)
> 2. The feature gracefully degrades to local-only if unavailable
> 3. Users are informed via logging
> 4. No sensitive content is sent without disclosure
> 5. Users maintain control over credentials

## Future Enhancements

- [ ] Configuration file (`~/.wiki/config.yaml`) for persistent provider settings
- [ ] Caching of Copilot embeddings to reduce API calls
- [ ] Multi-provider strategy (hybrid local + remote)
- [ ] Cost tracking for Copilot API usage
- [ ] Fallback chains (Copilot → Local → Keyword)

## Troubleshooting

**Error: "GITHUB_COPILOT_API_KEY not set"**
- Set the environment variable: `export GITHUB_COPILOT_API_KEY="your-key"`
- Or use `--use-copilot` without the env var to get the warning

**Error: "openai package required"**
- Install optional dependency: `pip install openai>=1.0.0`

**Copilot API call fails, falls back to local**
- Check network connectivity
- Verify API key is valid
- Check Copilot service status
- Local embeddings will be used automatically as fallback

## References

- [GitHub Copilot API Documentation](https://docs.github.com/en/copilot/using-github-copilot/getting-started-with-github-copilot)
- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [sentence-transformers](https://www.sbert.net/)
