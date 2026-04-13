"""Idempotent backlink reconciliation for wiki pages."""

import logging
import re
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)


def extract_existing_links(page_content: str) -> Set[str]:
    """
    Extract all [[WikiLink]] references from a page.
    
    Args:
        page_content: Markdown page content.
    
    Returns:
        Set of link targets (without brackets).
    """
    # Match [[Link]] or [[Link|Display Text]]
    pattern = r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]"
    matches = re.findall(pattern, page_content)
    return set(matches)


def find_backlink_candidates(
    page_title: str,
    wiki_dir: str = "wiki",
    similarity_threshold: float = 0.84,
    use_embeddings: bool = True,
) -> List[Dict]:
    """
    Find candidate pages to backlink to based on title matching and embeddings.
    
    Three-tier matching:
    1. Exact title match
    2. Normalized title match (lowercase, punctuation removed)
    3. Embedding similarity (optional, if sentence-transformers available)
    
    Args:
        page_title: Title of the current page.
        wiki_dir: Path to wiki directory.
        similarity_threshold: Threshold for embedding similarity (0.0-1.0).
        use_embeddings: Whether to use embedding-based fuzzy matching.
    
    Returns:
        List of candidate backlink targets:
        [
            {
                "title": "Target Page Title",
                "filename": "20240101xx.md",
                "match_type": "exact|normalized|fuzzy",
                "confidence": 0.95,
            }
        ]
    """
    candidates = []
    wiki_path = Path(wiki_dir)
    
    if not wiki_path.exists():
        logger.warning(f"Wiki directory not found: {wiki_dir}")
        return candidates
    
    # Collect all existing pages
    existing_pages = _load_existing_pages(wiki_path)
    
    if not existing_pages:
        return candidates
    
    # Normalize the target title
    normalized_target = _normalize_title(page_title)
    
    # Tier 1: Exact title match
    for page_info in existing_pages:
        if page_info["title"] == page_title:
            candidates.append({
                "title": page_info["title"],
                "filename": page_info["filename"],
                "match_type": "exact",
                "confidence": 1.0,
            })
    
    # Tier 2: Normalized title match
    for page_info in existing_pages:
        normalized_existing = _normalize_title(page_info["title"])
        if normalized_existing == normalized_target and not any(
            c["filename"] == page_info["filename"] for c in candidates
        ):
            candidates.append({
                "title": page_info["title"],
                "filename": page_info["filename"],
                "match_type": "normalized",
                "confidence": 0.9,
            })
    
    # Tier 3: Embedding similarity (optional)
    if use_embeddings and len(existing_pages) > 0:
        fuzzy_candidates = _find_embedding_matches(
            page_title, 
            existing_pages, 
            similarity_threshold
        )
        for cand in fuzzy_candidates:
            if not any(c["filename"] == cand["filename"] for c in candidates):
                candidates.append(cand)
    
    return candidates


def reconcile_backlinks(
    page_content: str,
    page_title: str,
    page_filename: str,
    wiki_dir: str = "wiki",
    auto_insert_exact: bool = True,
    preview_fuzzy: bool = True,
) -> Tuple[str, List[Dict]]:
    """
    Idempotent backlink reconciliation.
    
    Procedure:
    1. Extract existing [[WikiLinks]] from page
    2. Find new candidate backlinks
    3. Auto-insert exact matches (if auto_insert_exact=True)
    4. Return updated content + list of fuzzy suggestions
    
    Args:
        page_content: Markdown page content.
        page_title: Page title.
        page_filename: Page filename (for deduplication).
        wiki_dir: Wiki directory path.
        auto_insert_exact: Auto-insert exact title matches.
        preview_fuzzy: Return fuzzy candidates for manual review.
    
    Returns:
        Tuple of (updated_content, fuzzy_suggestions).
    """
    
    # Get existing links to avoid duplicates
    existing_links = extract_existing_links(page_content)
    
    # Find all candidates
    candidates = find_backlink_candidates(page_title, wiki_dir)
    
    # Separate by match type
    exact_matches = [c for c in candidates if c["match_type"] == "exact"]
    fuzzy_matches = [c for c in candidates if c["match_type"] in ("normalized", "fuzzy")]
    
    updated_content = page_content
    fuzzy_suggestions = []
    
    # Auto-insert exact matches (idempotent: skip if already present)
    if auto_insert_exact:
        for candidate in exact_matches:
            # Check if link already exists
            if candidate["title"] not in existing_links:
                # Insert at sensible location (end of related section or first mention in content)
                updated_content = _insert_backlink(
                    updated_content, 
                    candidate["title"],
                    can_auto_insert=True
                )
    
    # Collect fuzzy candidates for preview
    if preview_fuzzy:
        fuzzy_suggestions = fuzzy_matches
    
    return updated_content, fuzzy_suggestions


def _normalize_title(title: str) -> str:
    """
    Normalize title for matching: lowercase, remove punctuation, handle possessives.
    
    Steps:
    1. Strip whitespace and normalize Unicode
    2. Handle possessives and contractions ('s, 't patterns)
    3. Convert to lowercase
    4. Remove punctuation
    5. Remove common English stopwords
    6. Collapse multiple spaces
    """
    import unicodedata
    
    # Common English stopwords to remove during matching
    STOPWORDS = {
        "a", "an", "and", "are", "as", "at", "be", "but", "by", "for",
        "if", "in", "is", "it", "of", "or", "the", "to", "was", "will", "with"
    }
    
    # Remove leading/trailing whitespace and normalize Unicode
    normalized = title.strip()
    normalized = unicodedata.normalize("NFKC", normalized)
    
    # Handle possessives and contractions: remove 's and 't at word boundaries
    # This converts "Django's" -> "Django", "don't" -> "dont"
    normalized = re.sub(r"'[st]\b", "", normalized)
    
    # Convert to lowercase
    normalized = normalized.lower()
    
    # Remove common punctuation but keep spaces and internal hyphens
    normalized = re.sub(r"[^\w\s-]", "", normalized)
    
    # Remove standalone stopword tokens
    words = normalized.split()
    filtered_words = [w for w in words if w not in STOPWORDS and len(w) > 0]
    
    # Collapse multiple spaces
    normalized = " ".join(filtered_words)
    
    return normalized


def _load_existing_pages(wiki_path: Path) -> List[Dict]:
    """Load metadata from all existing wiki pages.
    
    Args:
        wiki_path: Path to wiki directory.
    
    Returns:
        List of page info: [{"filename": "...", "title": "..."}]
    """
    pages = []
    
    for page_file in wiki_path.glob("*.md"):
        if page_file.name == "index.md":
            continue  # Skip index
        
        try:
            content = page_file.read_text(encoding="utf-8")
            title = _extract_title_from_markdown(content)
            if title:
                pages.append({
                    "filename": page_file.name,
                    "title": title,
                })
        except Exception as e:
            logger.warning(f"Failed to read {page_file}: {e}")
    
    return pages


def _extract_title_from_markdown(content: str) -> Optional[str]:
    """Extract title from Markdown heading.
    
    Args:
        content: Markdown content.
    
    Returns:
        Title string or None if not found.
    """
    lines = content.split("\n")
    for line in lines:
        if line.startswith("# "):
            return line[2:].strip()
    return None


def _find_embedding_matches(
    target_title: str,
    existing_pages: List[Dict],
    similarity_threshold: float,
) -> List[Dict]:
    """Find pages with matching embeddings.
    
    Uses sentence-transformers if available for semantic similarity.
    
    Args:
        target_title: Title to match.
        existing_pages: List of existing pages with titles.
        similarity_threshold: Match threshold (0.84 default per spec).
    
    Returns:
        List of fuzzy match candidates.
    """
    try:
        from sentence_transformers import SentenceTransformer, util
        
        model = SentenceTransformer("all-MiniLM-L6-v2")
        
        # Encode target and existing titles
        target_embedding = model.encode(target_title, convert_to_tensor=True)
        existing_titles = [p["title"] for p in existing_pages]
        existing_embeddings = model.encode(existing_titles, convert_to_tensor=True)
        
        # Compute similarities
        similarities = util.pytorch_cos_sim(target_embedding, existing_embeddings)[0]
        
        candidates = []
        for i, (sim, page) in enumerate(zip(similarities, existing_pages)):
            sim_score = sim.item()
            if sim_score >= similarity_threshold:
                candidates.append({
                    "title": page["title"],
                    "filename": page["filename"],
                    "match_type": "fuzzy",
                    "confidence": float(sim_score),
                })
        
        # Sort by confidence
        candidates.sort(key=lambda x: x["confidence"], reverse=True)
        return candidates
        
    except ImportError:
        logger.info("sentence-transformers not available for embedding matching")
        return []


def _insert_backlink(
    content: str,
    link_target: str,
    can_auto_insert: bool = False,
) -> str:
    """
    Insert a [[WikiLink]] into page content.
    
    Tries to find a sensible location:
    1. In a "Related" or "See Also" section (end)
    2. At end of first content paragraph
    3. Appends to end
    
    Args:
        content: Markdown content.
        link_target: Link target title.
        can_auto_insert: If False, return content unchanged.
    
    Returns:
        Updated content with backlink inserted.
    """
    if not can_auto_insert:
        return content
    
    wikilink = f"[[{link_target}]]"
    
    # Try to insert in "Related" section or at end of content
    if "## Related" in content or "## See Also" in content:
        # Insert before the comment marker in related section
        pattern = r"(## Related[^\n]*\n.*?)(\n\n|$)"
        replacement = r"\1 " + wikilink + r"\2"
        return re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    # Otherwise append to end
    return content + f"\n\n[[See also: {link_target}]]"
