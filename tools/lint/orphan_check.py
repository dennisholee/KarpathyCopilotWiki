"""Orphan page discovery for wiki maintenance."""

import logging
import re
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass
from typing import List, Dict, Set
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class OrphanPage:
    """Represents an orphaned wiki page."""
    filename: str
    title: str
    path: Path
    age_days: int
    tags: List[str]
    inbound_link_count: int = 0
    creation_date: str = ""


class OrphanDetector:
    """Detect orphaned pages in the wiki."""
    
    def __init__(self, wiki_dir: str = "wiki"):
        """
        Initialize orphan detector.
        
        Args:
            wiki_dir: Path to wiki directory
        """
        self.wiki_dir = Path(wiki_dir)
    
    def find_orphans(self, min_age_days: int = 7) -> List[OrphanPage]:
        """
        Find orphaned pages (pages with no inbound links).
        
        Args:
            min_age_days: Minimum age in days to consider as orphan
        
        Returns:
            List of OrphanPage objects
        """
        if not self.wiki_dir.exists():
            logger.warning(f"Wiki directory not found: {self.wiki_dir}")
            return []
        
        # Build backlink index
        backlink_index = self._build_backlink_index()
        
        # Find pages with no inbound links
        orphans = []
        pages_dir = self.wiki_dir
        
        for page_file in pages_dir.glob("*.md"):
            if page_file.name in ["index.md", "glossary.md"]:
                continue
            
            # Skip decisions directory
            if page_file.parent.name == "decisions":
                continue
            
            # Get normalized page identifier
            page_identifier = page_file.stem  # filename without .md
            
            # Check for inbound links
            inbound_count = len(backlink_index.get(page_identifier, set()))
            
            if inbound_count == 0:
                # Extract metadata
                try:
                    metadata = self._extract_page_metadata(page_file)
                    age_days = self._get_page_age_days(page_file)
                    
                    if age_days >= min_age_days:
                        orphans.append(OrphanPage(
                            filename=page_file.name,
                            title=metadata.get("title", "Untitled"),
                            path=page_file,
                            age_days=age_days,
                            tags=metadata.get("tags", []),
                            inbound_link_count=0,
                            creation_date=metadata.get("created_at", "")
                        ))
                except Exception as e:
                    logger.warning(f"Failed to analyze page {page_file}: {e}")
        
        return sorted(orphans, key=lambda x: x.age_days, reverse=True)
    
    def _build_backlink_index(self) -> Dict[str, Set[str]]:
        """Build index of backlinks.
        
        Returns:
            Dict mapping page identifiers to sets of pages that link to them
        """
        backlink_index = defaultdict(set)
        
        for page_file in self.wiki_dir.glob("*.md"):
            if page_file.name in ["index.md", "glossary.md"]:
                continue
            
            try:
                with open(page_file, "r", encoding="utf-8") as f:
                    content = f.read()
                
                # Find all [[WikiLink]] references
                wikilinks = re.findall(r"\[\[([^\]]+)\]\]", content)
                for link in wikilinks:
                    # Normalize link target
                    link_target = link.lower().replace(" ", "").replace("-", "")
                    backlink_index[link_target].add(page_file.stem)
            except Exception as e:
                logger.warning(f"Failed to read page {page_file}: {e}")
        
        return backlink_index
    
    def _extract_page_metadata(self, page_file: Path) -> Dict:
        """Extract metadata from page.
        
        Args:
            page_file: Path to page file
        
        Returns:
            Dictionary with extracted metadata
        """
        metadata = {
            "title": "",
            "tags": [],
            "created_at": ""
        }
        
        try:
            with open(page_file, "r", encoding="utf-8") as f:
                lines = f.readlines()
            
            # Extract title (first line starting with #)
            for line in lines:
                if line.startswith("# "):
                    metadata["title"] = line.replace("#", "").strip()
                    break
            
            # Extract tags
            for line in lines:
                if line.startswith("Tags:"):
                    tags_str = line.replace("Tags:", "").strip()
                    metadata["tags"] = [t.strip() for t in tags_str.split(",")]
                    break
        
        except Exception as e:
            logger.warning(f"Failed to extract metadata from {page_file}: {e}")
        
        return metadata
    
    def _get_page_age_days(self, page_file: Path) -> int:
        """Get age of page in days.
        
        Args:
            page_file: Path to page file
        
        Returns:
            Number of days since file was created
        """
        try:
            from datetime import datetime, timezone
            stat = page_file.stat()
            creation_time = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
            age = (datetime.now(timezone.utc) - creation_time).days
            return age
        except Exception:
            return 0


def generate_orphan_report(wiki_dir: str = "wiki", output_dir: str = "reports") -> str:
    """
    Generate orphan report and save to file.
    
    Args:
        wiki_dir: Wiki directory path
        output_dir: Output directory for report
    
    Returns:
        Path to generated report file
    """
    detector = OrphanDetector(wiki_dir)
    orphans = detector.find_orphans(min_age_days=7)
    
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Generate filename
    from datetime import date
    report_filename = f"orphans-{date.today().isoformat()}.md"
    report_file = output_path / report_filename
    
    # Generate report content
    content = _generate_orphan_markdown(orphans)
    
    # Write report
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(content)
    
    logger.info(f"Orphan report saved to {report_file}")
    return str(report_file)


def _generate_orphan_markdown(orphans: List[OrphanPage]) -> str:
    """Generate markdown report of orphans.
    
    Args:
        orphans: List of orphan pages
    
    Returns:
        Markdown report content
    """
    from datetime import datetime
    
    if not orphans:
        return "# Orphan Pages Report\n\nNo orphaned pages found.\n"
    
    # Group by tags
    by_tags = defaultdict(list)
    for orphan in orphans:
        if orphan.tags:
            for tag in orphan.tags:
                by_tags[tag].append(orphan)
        else:
            by_tags["untagged"].append(orphan)
    
    # Build markdown
    lines = [
        "# Orphan Pages Report\n",
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
        f"Total orphaned pages: {len(orphans)}\n",
        "\nOrphaned pages are those with no inbound wiki links.\n",
        "Consider:\n",
        "- Adding links from other pages\n",
        "- Merging with existing pages\n",
        "- Deleting if no longer relevant\n",
        "\n---\n\n"
    ]
    
    for tag in sorted(by_tags.keys()):
        pages = by_tags[tag]
        lines.append(f"## {tag.upper()} ({len(pages)} pages)\n\n")
        
        for orphan in sorted(pages, key=lambda x: x.age_days, reverse=True):
            lines.append(f"### {orphan.title}\n")
            lines.append(f"- **File**: `{orphan.filename}`\n")
            lines.append(f"- **Age**: {orphan.age_days} days\n")
            lines.append(f"- **Path**: {orphan.path}\n\n")
    
    return "".join(lines)
