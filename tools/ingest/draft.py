"""Draft wiki page generation from extracted content and concepts."""

import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


def generate_draft_page(
    title: str,
    summary: str,
    tags: List[str],
    content_snippets: List[str],
    raw_source_path: str,
    concepts: Optional[List[Dict]] = None,
    has_uncertain_facts: bool = False,
) -> str:
    """
    Generate a Markdown draft wiki page.
    
    Args:
        title: Page title (concept name).
        summary: 1-2 sentence summary of the concept.
        tags: List of tags for categorization.
        content_snippets: Extracted text excerpts related to the concept.
        raw_source_path: Path to raw source document (e.g., /raw/paper.pdf).
        concepts: Optional list of related concepts for backlink suggestions.
        has_uncertain_facts: Whether the page contains [[Needs Source]] markers.
    
    Returns:
        Rendered Markdown page string.
    """
    
    # Build front matter
    frontmatter = _build_frontmatter(
        title=title,
        summary=summary,
        tags=tags,
        raw_source_path=raw_source_path,
        has_uncertain_facts=has_uncertain_facts,
    )
    
    # Build content section with snippets
    content_section = _build_content_section(content_snippets)
    
    # Build related concepts/backlink suggestions (comment for user preview)
    related_section = _build_related_section(concepts)
    
    # Assemble page
    page = f"""{frontmatter}

{content_section}

{related_section}"""
    
    return page.strip()


def _build_frontmatter(
    title: str,
    summary: str,
    tags: List[str],
    raw_source_path: str,
    has_uncertain_facts: bool,
) -> str:
    """Build YAML-style front matter section."""
    
    tags_str = ", ".join(tags) if tags else "uncategorized"
    
    frontmatter = f"""# {title}

**Summary:** {summary}

**Tags:** {tags_str}

**Source:** [{raw_source_path}]({raw_source_path})"""
    
    if has_uncertain_facts:
        frontmatter += "\n\n> ⚠️ This draft contains [[Needs Source]] markers where facts require verification."
    
    return frontmatter


def _build_content_section(content_snippets: List[str]) -> str:
    """Build body content from extracted snippets."""
    
    if not content_snippets:
        return "## Content\n\n_No content extracted. Please review raw source and add manually._"
    
    content = "## Content\n\n"
    
    for i, snippet in enumerate(content_snippets, 1):
        # Clean snippet: remove excessive whitespace
        snippet = snippet.strip()
        if len(snippet) > 500:
            snippet = snippet[:500] + "..."
        
        content += f"> {snippet}\n\n"
    
    return content


def _build_related_section(concepts: Optional[List[Dict]]) -> str:
    """Build related concepts/backlink suggestions."""
    
    if not concepts or len(concepts) == 0:
        return ""
    
    section = "## Related Concepts\n\n"
    section += "<!-- These are candidate related concepts extracted from the source.\n"
    section += "   Review and add [[WikiLink]] references to existing pages as appropriate.\n"
    section += "   Leave this comment and uncommented links for manual review. -->\n\n"
    
    # Group by confidence tier
    high_conf = [c for c in concepts if c.get("confidence", 0.0) >= 0.8]
    med_conf = [c for c in concepts if 0.6 <= c.get("confidence", 0.0) < 0.8]
    
    if high_conf:
        section += "### Likely Related\n\n"
        for concept in high_conf[:5]:  # Limit to top 5
            section += f"- {concept['title']} (confidence: {concept.get('confidence', 0.0):.2f})\n"
        section += "\n"
    
    if med_conf:
        section += "### Possibly Related\n\n"
        for concept in med_conf[:5]:
            section += f"- {concept['title']} (confidence: {concept.get('confidence', 0.0):.2f})\n"
        section += "\n"
    
    return section.strip()


def mark_uncertain_facts(
    text: str,
    confidence_threshold: float = 0.7,
) -> Tuple[str, bool]:
    """
    Mark facts in text that may need source verification.
    
    Simple heuristic: phrases with uncertain language markers.
    
    Args:
        text: Content text.
        confidence_threshold: Not used in simple version; for future ML models.
    
    Returns:
        Tuple of (marked_text, has_uncertain_facts).
    """
    uncertain_markers = [
        "presumably",
        "allegedly",
        "reportedly",
        "supposedly",
        "apparently",
        "seemingly",
        "arguably",
        "it appears",
        "it seems",
        "it is claimed",
        "possibly",
        "maybe",
    ]
    
    has_uncertain = False
    marked_text = text
    
    for marker in uncertain_markers:
        if marker.lower() in text.lower():
            # Mark with [[Needs Source]] on the sentence
            sentences = text.split(". ")
            for i, sent in enumerate(sentences):
                if marker.lower() in sent.lower():
                    sentences[i] = sent + " [[Needs Source]]"
                    has_uncertain = True
            marked_text = ". ".join(sentences)
    
    return marked_text, has_uncertain


from typing import Tuple
