"""Archive decisions from queries as wiki pages."""

import logging
from datetime import datetime, timezone
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional
from tools.ingest.filename import generate_filename
from tools.ingest.validator import validate_wiki_page

logger = logging.getLogger(__name__)


@dataclass
class Decision:
    """Represents a single decision to be archived."""
    question: str
    answer: str
    supporting_pages: List[str]  # paths to wiki pages
    timestamp: datetime
    tags: List[str]
    summary: Optional[str] = None
    outcome: str = "decided"  # decided | deferred | rejected


class DecisionArchiver:
    """Archive query results as decision pages."""
    
    def __init__(self, wiki_dir: str = "wiki"):
        """
        Initialize decision archiver.
        
        Args:
            wiki_dir: Path to wiki directory
        """
        self.wiki_dir = Path(wiki_dir)
        self.decisions_dir = self.wiki_dir / "decisions"
        
        # Create decisions directory if needed
        self.decisions_dir.mkdir(parents=True, exist_ok=True)
    
    def archive(self, decision: Decision) -> str:
        """
        Archive a decision as a wiki page.
        
        Args:
            decision: Decision object to archive
        
        Returns:
            Path to created decision page
        """
        # Generate filename
        filename = generate_filename(str(self.decisions_dir), decision.timestamp)
        filepath = self.decisions_dir / filename
        
        # Generate page content
        content = self._generate_decision_page(decision, filename)
        
        # Validate page
        page_data = {
            "title": f"Decision: {decision.question[:50]}",
            "summary": decision.summary or decision.answer[:100],
            "tags": decision.tags + ["decision"],
            "links": decision.supporting_pages,
            "content": content,
            "filename": filename,
        }
        
        is_valid, errors = validate_wiki_page(page_data)
        if not is_valid:
            logger.error(f"Decision page validation failed: {errors}")
            raise ValueError(f"Invalid decision page: {errors}")
        
        # Write to file
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            logger.info(f"Archived decision to {filepath}")
            return str(filepath)
        except Exception as e:
            logger.error(f"Failed to archive decision: {e}")
            raise
    
    def _generate_decision_page(self, decision: Decision, filename: str) -> str:
        """Generate decision page markdown.
        
        Args:
            decision: Decision object
            filename: Generated filename (YYYYMMDDNN.md)
        
        Returns:
            Markdown content for the decision page
        """
        # Format links (convert paths to wiki links if they're local)
        links_md = "\n".join(f"- {link}" for link in decision.supporting_pages)
        
        # Format tags
        tags_str = ", ".join(decision.tags + ["decision"])
        
        # Format timestamp
        timestamp_str = decision.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")
        
        # Build page content
        content = f"""Title: Decision: {decision.question}

Summary: {decision.summary or decision.answer[:100]}

Tags: {tags_str}

Links:
{links_md}

Content:

## Question

{decision.question}

## Answer

{decision.answer}

## Outcome

{decision.outcome}

## Archived At

{timestamp_str}

---

**Note**: This decision was auto-archived by the wiki query system.
If any information is inaccurate or needs updating, edit this page directly.
"""
        
        return content
    
    def get_recent_decisions(self, limit: int = 10) -> List[str]:
        """Get recent decision pages.
        
        Args:
            limit: Maximum number of decisions to return
        
        Returns:
            List of paths to recent decision pages
        """
        if not self.decisions_dir.exists():
            return []
        
        pages = sorted(
            self.decisions_dir.glob("*.md"),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )
        
        return [str(p) for p in pages[:limit]]


def archive_query_as_decision(
    question: str,
    answer: str,
    supporting_pages: List[str],
    tags: List[str],
    wiki_dir: str = "wiki"
) -> str:
    """
    Convenience function to archive a query as a decision.
    
    Args:
        question: The query question
        answer: The answer/response
        supporting_pages: List of supporting page paths
        tags: Tags for the decision
        wiki_dir: Wiki directory path
    
    Returns:
        Path to created decision page
    """
    decision = Decision(
        question=question,
        answer=answer,
        supporting_pages=supporting_pages,
        timestamp=datetime.now(timezone.utc),
        tags=tags,
        summary=None,
        outcome="decided"
    )
    
    archiver = DecisionArchiver(wiki_dir)
    return archiver.archive(decision)
