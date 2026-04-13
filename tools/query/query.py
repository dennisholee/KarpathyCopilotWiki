"""Query handler for wiki semantic search and QA."""

import logging
import re
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, field
from datetime import datetime

try:
    from sentence_transformers import SentenceTransformer
    HAS_EMBEDDINGS = True
except ImportError:
    HAS_EMBEDDINGS = False
    logging.warning("sentence_transformers not available; keyword search only")

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    """Result from wiki search."""
    filepath: str
    title: str
    excerpt: str
    score: float
    links: List[str] = field(default_factory=list)


@dataclass
class QueryResult:
    """Result from query execution."""
    query: str
    answer: str
    supporting_pages: List[SearchResult] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)
    model_used: str = ""  # e.g., "keyword", "embedding"


class WikiQueryEngine:
    """Query engine for wiki semantic search."""
    
    def __init__(self, wiki_dir: str = "wiki", use_embeddings: bool = True):
        """
        Initialize wiki query engine.
        
        Args:
            wiki_dir: Path to wiki directory
            use_embeddings: Whether to use embedding-based search (requires sentence-transformers)
        """
        self.wiki_dir = Path(wiki_dir)
        self.use_embeddings = use_embeddings and HAS_EMBEDDINGS
        self.embedding_model = None
        
        if self.use_embeddings:
            try:
                self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
                logger.info("Loaded embedding model: all-MiniLM-L6-v2")
            except Exception as e:
                logger.warning(f"Failed to load embedding model: {e}")
                self.use_embeddings = False
    
    def search(
        self,
        query: str,
        top_k: int = 5,
        min_score: float = 0.3
    ) -> List[SearchResult]:
        """
        Search wiki for relevant pages.
        
        Args:
            query: Search query string
            top_k: Number of top results to return
            min_score: Minimum relevance score threshold (0.0-1.0)
        
        Returns:
            List of SearchResult objects ranked by relevance
        """
        if not self.wiki_dir.exists():
            logger.warning(f"Wiki directory not found: {self.wiki_dir}")
            return []
        
        # Load all wiki pages
        pages = self._load_wiki_pages()
        if not pages:
            logger.warning("No wiki pages found")
            return []
        
        # Score pages
        scored_pages = []
        
        if self.use_embeddings:
            scored_pages = self._score_with_embeddings(query, pages)
        else:
            scored_pages = self._score_with_keywords(query, pages)
        
        # Filter by minimum score and return top-k
        results = [p for p in scored_pages if p.score >= min_score]
        return sorted(results, key=lambda x: x.score, reverse=True)[:top_k]
    
    def _load_wiki_pages(self) -> List[Dict]:
        """Load all wiki pages from disk.
        
        Returns:
            List of page dictionaries with metadata and content
        """
        pages = []
        
        for page_file in self.wiki_dir.glob("*.md"):
            if page_file.name in ["index.md", "glossary.md"]:
                continue
            
            try:
                with open(page_file, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Extract page metadata
                metadata = self._extract_page_metadata(content)
                metadata["filepath"] = str(page_file)
                metadata["content"] = content
                pages.append(metadata)
            except Exception as e:
                logger.warning(f"Failed to load page {page_file}: {e}")
        
        return pages
    
    def _extract_page_metadata(self, content: str) -> Dict:
        """Extract metadata from page content.
        
        Args:
            content: Page markdown content
        
        Returns:
            Dictionary with extracted metadata
        """
        metadata = {
            "title": "",
            "summary": "",
            "tags": [],
            "links": [],
            "content": content
        }
        
        lines = content.split("\n")
        
        # Extract title from first heading
        for line in lines:
            if line.startswith("# "):
                metadata["title"] = line.replace("#", "").strip()
                break
        
        # Extract summary (look for Summary: label)
        for line in lines:
            if line.startswith("Summary:"):
                metadata["summary"] = line.replace("Summary:", "").strip()
                break
        
        # Extract tags (look for Tags: label)
        for i, line in enumerate(lines):
            if line.startswith("Tags:"):
                tags_str = line.replace("Tags:", "").strip()
                metadata["tags"] = [t.strip() for t in tags_str.split(",") if t.strip()]
                break
        
        # Extract links (look for Links: section)
        for i, line in enumerate(lines):
            if line.startswith("Links:"):
                i += 1
                while i < len(lines):
                    link_line = lines[i].strip()
                    if link_line.startswith("-"):
                        link = link_line[1:].strip()
                        if link:
                            metadata["links"].append(link)
                    elif link_line and not link_line.startswith("-"):
                        break
                    i += 1
                break
        
        return metadata
    
    def _score_with_keywords(
        self,
        query: str,
        pages: List[Dict]
    ) -> List[SearchResult]:
        """Score pages using keyword matching.
        
        Args:
            query: Search query
            pages: List of pages to score
        
        Returns:
            List of SearchResult objects with scores
        """
        import math
        
        query_terms = query.lower().split()
        results = []
        
        for page in pages:
            # Combine title, summary, and content for scoring
            text = (page.get("title", "") + " " + 
                   page.get("summary", "") + " " + 
                   page.get("content", "")).lower()
            
            # Count term matches
            matches = sum(text.count(term) for term in query_terms)
            
            # TF-IDF-like scoring: penalize very common terms
            if matches > 0:
                # Normalize by text length
                score = matches / (1.0 + math.log(len(text)))
            else:
                score = 0.0
            
            if score > 0:
                excerpt = self._extract_excerpt(page.get("content", ""), query_terms, max_len=200)
                results.append(SearchResult(
                    filepath=page["filepath"],
                    title=page.get("title", "Untitled"),
                    excerpt=excerpt,
                    score=score,
                    links=page.get("links", [])
                ))
        
        return sorted(results, key=lambda x: x.score, reverse=True)
    
    def _score_with_embeddings(
        self,
        query: str,
        pages: List[Dict]
    ) -> List[SearchResult]:
        """Score pages using semantic embeddings.
        
        Args:
            query: Search query
            pages: List of pages to score
        
        Returns:
            List of SearchResult objects with scores
        """
        if not self.embedding_model:
            return self._score_with_keywords(query, pages)
        
        try:
            results = []
            
            # Embed query
            query_embedding = self.embedding_model.encode(query, convert_to_tensor=False)
            
            for page in pages:
                # Use title and summary for scoring
                text_to_score = page.get("title", "") + " " + page.get("summary", "")
                if not text_to_score.strip():
                    text_to_score = page.get("content", "")[:500]  # Fallback to content
                
                # Embed page text
                page_embedding = self.embedding_model.encode(text_to_score, convert_to_tensor=False)
                
                # Compute cosine similarity
                score = self._cosine_similarity(query_embedding, page_embedding)
                
                if score > 0.1:  # Only include pages with reasonable similarity
                    excerpt = self._extract_excerpt(
                        page.get("content", ""),
                        query.lower().split(),
                        max_len=200
                    )
                    results.append(SearchResult(
                        filepath=page["filepath"],
                        title=page.get("title", "Untitled"),
                        excerpt=excerpt,
                        score=score,
                        links=page.get("links", [])
                    ))
            
            return sorted(results, key=lambda x: x.score, reverse=True)
        
        except Exception as e:
            logger.warning(f"Embedding-based search failed, falling back to keywords: {e}")
            return self._score_with_keywords(query, pages)
    
    def _cosine_similarity(self, vec1, vec2) -> float:
        """Compute cosine similarity between two vectors."""
        import numpy as np
        
        try:
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            return float(dot_product / (norm1 * norm2))
        except Exception:
            return 0.0
    
    def _extract_excerpt(
        self,
        content: str,
        query_terms: List[str],
        max_len: int = 200
    ) -> str:
        """Extract relevant excerpt from content.
        
        Args:
            content: Full page content
            query_terms: Query terms to find in content
            max_len: Maximum excerpt length
        
        Returns:
            Relevant excerpt from the content
        """
        # Find first occurrence of any query term
        content_lower = content.lower()
        
        for term in query_terms:
            idx = content_lower.find(term)
            if idx >= 0:
                # Extract surrounding context
                start = max(0, idx - 50)
                end = min(len(content), idx + max_len)
                excerpt = content[start:end].strip()
                
                # Clean up
                excerpt = re.sub(r'\s+', ' ', excerpt)
                if len(excerpt) > max_len:
                    excerpt = excerpt[:max_len] + "..."
                
                return excerpt
        
        # Fallback: return first max_len characters
        excerpt = re.sub(r'\s+', ' ', content[:max_len]).strip()
        if len(content) > max_len:
            excerpt += "..."
        
        return excerpt


def query_wiki(query_text: str, wiki_dir: str = "wiki") -> QueryResult:
    """
    User-facing function to query the wiki.
    
    Args:
        query_text: Natural language query
        wiki_dir: Path to wiki directory
    
    Returns:
        QueryResult with answer and supporting pages
    """
    engine = WikiQueryEngine(wiki_dir, use_embeddings=True)
    
    # Search for relevant pages
    search_results = engine.search(query_text, top_k=5, min_score=0.2)
    
    # Generate answer from search results
    answer = _generate_answer(query_text, search_results)
    
    result = QueryResult(
        query=query_text,
        answer=answer,
        supporting_pages=search_results,
        model_used="embedding" if engine.use_embeddings else "keyword"
    )
    
    return result


def _generate_answer(query: str, results: List[SearchResult]) -> str:
    """Generate a natural language answer from search results.
    
    Args:
        query: The user's query
        results: Search results
    
    Returns:
        Generated answer text
    """
    if not results:
        return f"I could not find information about '{query}' in the wiki."
    
    # Build answer from top result
    top_result = results[0]
    
    answer = f"Based on the wiki page '{top_result.title}':\n\n{top_result.excerpt}"
    
    if len(results) > 1:
        answer += "\n\nRelated pages:\n"
        for result in results[1:4]:  # Include up to 3 related pages
            answer += f"- {result.title}\n"
    
    return answer
