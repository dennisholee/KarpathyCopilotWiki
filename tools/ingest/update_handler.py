"""Idempotent update handler - manages deduplication and merging."""

import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from tools.ingest.backlink import _normalize_title

logger = logging.getLogger(__name__)


class UpdateHandler:
    """
    Handles detection and merging of duplicate pages during re-ingestion.
    
    Deduplication logic:
    - Exact title match: mark as duplicate (merge vs. replace)
    - Normalized title match: propose merge  
    - Embedding similarity > 0.84: propose merge
    - Otherwise: create new page
    """
    
    def __init__(self, wiki_dir: str = "wiki"):
        """Initialize handler.
        
        Args:
            wiki_dir: Path to wiki directory.
        """
        self.wiki_dir = Path(wiki_dir)
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def check_existing_page(
        self,
        concept_title: str,
        wiki_dir: Optional[str] = None,
    ) -> Optional[str]:
        """
        Check if a page with matching title already exists.
        
        Uses three-tier matching:
        1. Exact title match
        2. Normalized title match
        3. Embedding similarity (optional)
        
        Args:
            concept_title: Title of concept to check.
            wiki_dir: Wiki directory (uses self.wiki_dir if not provided).
        
        Returns:
            Filename of existing page or None if no match found.
        """
        if wiki_dir:
            wiki_path = Path(wiki_dir)
        else:
            wiki_path = self.wiki_dir
        
        if not wiki_path.exists():
            return None
        
        normalized_target = _normalize_title(concept_title)
        
        # Tier 1: Exact match
        for page_file in wiki_path.glob("*.md"):
            page_title = self._extract_title(page_file)
            if page_title == concept_title:
                return page_file.name
        
        # Tier 2: Normalized match
        for page_file in wiki_path.glob("*.md"):
            page_title = self._extract_title(page_file)
            normalized_existing = _normalize_title(page_title)
            if normalized_existing == normalized_target:
                return page_file.name
        
        # Tier 3: Embedding similarity (optional, requires sentence-transformers)
        try:
            from sentence_transformers import SentenceTransformer, util
            
            model = SentenceTransformer("all-MiniLM-L6-v2")
            target_embedding = model.encode(concept_title, convert_to_tensor=True)
            
            for page_file in wiki_path.glob("*.md"):
                page_title = self._extract_title(page_file)
                page_embedding = model.encode(page_title, convert_to_tensor=True)
                
                similarity = util.pytorch_cos_sim(target_embedding, page_embedding)[0][0].item()
                
                if similarity >= 0.84:  # Per spec threshold
                    return page_file.name
        except ImportError:
            pass
        
        return None
    
    def update_existing_page(
        self,
        existing_filename: str,
        new_content: str,
        raw_source: str,
    ) -> Tuple[str, List[str]]:
        """
        Merge new content into existing page.
        
        Strategy:
        - Extract existing frontmatter (title, tags, links, etc.)
        - Append new content snippets with date marker
        - Merge source links (remove duplicates)
        - Update last_updated timestamp
        
        Args:
            existing_filename: Filename of existing page.
            new_content: New content to merge (Markdown format).
            raw_source: Raw source path for this ingestion.
        
        Returns:
            Tuple of (updated_content, merge_notes).
        """
        existing_path = self.wiki_dir / existing_filename
        
        if not existing_path.exists():
            raise FileNotFoundError(f"Page not found: {existing_filename}")
        
        existing_content = existing_path.read_text(encoding="utf-8")
        merge_notes = []
        
        # Extract sections from existing and new
        existing_frontmatter = self._extract_frontmatter(existing_content)
        new_frontmatter = self._extract_frontmatter(new_content)
        
        existing_body = self._extract_body(existing_content)
        new_body = self._extract_body(new_content)
        
        # Merge frontmatter
        merged_title = existing_frontmatter.get("title", new_frontmatter.get("title", "Unknown"))
        merged_tags = list(set(
            existing_frontmatter.get("tags", []) + new_frontmatter.get("tags", [])
        ))
        merged_links = list(set(
            existing_frontmatter.get("links", []) + new_frontmatter.get("links", [])
        ))
        
        # Add new source if not already present
        if raw_source not in merged_links:
            merged_links.append(raw_source)
        
        # Rebuild frontmatter
        timestamp = datetime.now().isoformat()
        merged_frontmatter = f"""# {merged_title}

**Summary:** {existing_frontmatter.get("summary", "See content")}

**Tags:** {", ".join(merged_tags)}

**Sources:**
{chr(10).join(f"- {link}" for link in merged_links)}

**Last Updated:** {timestamp}
"""
        
        # Merge body: append new content with separator
        merged_body = f"""{existing_body}

---
## New Content From {raw_source} ({datetime.now().strftime("%Y-%m-%d")})

{new_body}
"""
        
        merged_content = f"{merged_frontmatter}\n{merged_body}".strip()
        
        # Track what was merged
        merge_notes.append(f"Merged new content from {raw_source}")
        merge_notes.append(f"Added {len(new_frontmatter.get('tags', []))} tags")
        merge_notes.append(f"Added source link: {raw_source}")
        
        self.logger.info(f"Merged into {existing_filename}: {'; '.join(merge_notes)}")
        
        return merged_content, merge_notes
    
    def should_replace_vs_merge(
        self,
        existing_filename: str,
        new_concept_title: str,
        raw_source: str,
    ) -> str:
        """
        Heuristic to decide: merge into existing or replace?
        
        Logic:
        - Same source PDF: always merge
        - Different source: merge (accumulate knowledge)
        - Return "merge" or "replace"
        
        Args:
            existing_filename: Filename of existing page.
            new_concept_title: New concept title.
            raw_source: Source of new content.
        
        Returns:
            "merge" or "replace".
        """
        # For now, always merge; preserves knowledge from multiple sources
        return "merge"
    
    def _extract_title(self, page_file: Path) -> str:
        """Extract title from Markdown file."""
        try:
            content = page_file.read_text(encoding="utf-8")
            for line in content.split("\n"):
                if line.startswith("# "):
                    return line[2:].strip()
        except Exception:
            pass
        return "Unknown"
    
    def _extract_frontmatter(self, content: str) -> Dict:
        """Extract frontmatter fields from Markdown."""
        result = {
            "title": "",
            "summary": "",
            "tags": [],
            "links": [],
        }
        
        lines = content.split("\n")
        for i, line in enumerate(lines):
            if line.startswith("# "):
                result["title"] = line[2:].strip()
            elif line.startswith("**Summary:**"):
                result["summary"] = line.replace("**Summary:**", "").strip()
            elif line.startswith("**Tags:**"):
                tags_str = line.replace("**Tags:**", "").strip()
                result["tags"] = [t.strip() for t in tags_str.split(",") if t.strip()]
            elif line.startswith("**Sources:**") or line.startswith("**Source:**"):
                # Extract links following the Sources: tag
                j = i + 1
                while j < len(lines):
                    link_line = lines[j].strip()
                    if link_line.startswith("-"):
                        link = link_line[1:].strip()
                        result["links"].append(link)
                        j += 1
                    elif link_line.startswith("**") or link_line.startswith("#"):
                        break
                    else:
                        j += 1
        
        return result
    
    def _extract_body(self, content: str) -> str:
        """Extract body content (after frontmatter)."""
        # Simple: everything after the first body section marker
        lines = content.split("\n")
        
        # Find where body starts (after first section)
        body_start = 0
        for i, line in enumerate(lines):
            if line.startswith("## Content") or line.startswith("## Related"):
                body_start = i
                break
        
        if body_start > 0:
            return "\n".join(lines[body_start:]).strip()
        
        # Fallback: return everything after title and frontmatter
        return "\n".join(lines[10:]).strip() if len(lines) > 10 else ""
