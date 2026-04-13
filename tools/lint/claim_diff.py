"""Detect contradictory claims in wiki pages."""

import logging
import re
from pathlib import Path
from collections import defaultdict
from dataclasses import dataclass
from typing import List, Dict, Set, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class Claim:
    """Represents an extracted claim from a page."""
    text: str
    page_title: str
    page_file: str
    sources: List[str]  # /raw/ links cited
    confidence: float = 0.7


@dataclass
class ClaimConflict:
    """Represents a conflict between claims."""
    claim1: Claim
    claim2: Claim
    related_pages: List[str]
    suggested_action: str


class ClaimDiffAnalyzer:
    """Analyze and detect conflicting claims in wiki."""
    
    def __init__(self, wiki_dir: str = "wiki"):
        """
        Initialize claim diff analyzer.
        
        Args:
            wiki_dir: Path to wiki directory
        """
        self.wiki_dir = Path(wiki_dir)
    
    def find_conflicts(self, similarity_threshold: float = 0.80) -> List[ClaimConflict]:
        """
        Find conflicting claims in wiki pages.
        
        Args:
            similarity_threshold: Threshold for claim similarity (0.0-1.0)
        
        Returns:
            List of ClaimConflict objects
        """
        if not self.wiki_dir.exists():
            logger.warning(f"Wiki directory not found: {self.wiki_dir}")
            return []
        
        # Extract claims from all pages
        all_claims = []
        for page_file in self.wiki_dir.glob("*.md"):
            if page_file.name in ["index.md", "glossary.md"]:
                continue
            
            try:
                page_claims = self._extract_claims_from_page(page_file)
                all_claims.extend(page_claims)
            except Exception as e:
                logger.warning(f"Failed to extract claims from {page_file}: {e}")
        
        # Find conflicts
        conflicts = []
        for i, claim1 in enumerate(all_claims):
            for claim2 in all_claims[i+1:]:
                if self._are_conflicting(claim1, claim2, similarity_threshold):
                    conflict = ClaimConflict(
                        claim1=claim1,
                        claim2=claim2,
                        related_pages=[claim1.page_file, claim2.page_file],
                        suggested_action=self._suggest_action(claim1, claim2)
                    )
                    conflicts.append(conflict)
        
        return conflicts
    
    def _extract_claims_from_page(self, page_file: Path) -> List[Claim]:
        """Extract potential claims from a page.
        
        Args:
            page_file: Path to page file
        
        Returns:
            List of Claim objects
        """
        claims = []
        
        try:
            with open(page_file, "r", encoding="utf-8") as f:
                content = f.read()
            
            lines = content.split("\n")
            page_title = ""
            page_sources = []
            
            # Extract page metadata
            for line in lines:
                if line.startswith("# "):
                    page_title = line.replace("#", "").strip()
                elif line.startswith("Links:"):
                    idx = lines.index(line)
                    idx += 1
                    while idx < len(lines) and lines[idx].startswith("-"):
                        link = lines[idx].replace("-", "").strip()
                        if link.startswith("/raw/"):
                            page_sources.append(link)
                        idx += 1
            
            # Extract sentences that look like potential claims
            # (sentences with a subject and predicate, mentioning sources)
            sentences = re.split(r'[.!?]\s+', content)
            
            for sentence in sentences:
                sentence = sentence.strip()
                if len(sentence) > 10 and "/" in sentence:  # Likely mentions a file
                    # Extract any /raw/ links mentioned in this sentence
                    raw_links = re.findall(r'/raw/\S+', sentence)
                    
                    if raw_links:
                        claims.append(Claim(
                            text=sentence[:100],
                            page_title=page_title,
                            page_file=str(page_file),
                            sources=raw_links,
                            confidence=0.6
                        ))
        
        except Exception as e:
            logger.warning(f"Failed to extract claims from {page_file}: {e}")
        
        return claims
    
    def _are_conflicting(
        self,
        claim1: Claim,
        claim2: Claim,
        similarity_threshold: float
    ) -> bool:
        """Check if two claims are conflicting.
        
        Args:
            claim1: First claim
            claim2: Second claim
            similarity_threshold: Similarity threshold
        
        Returns:
            True if claims conflict
        """
        # Claims conflict if:
        # 1. They reference different sources
        # 2. They have similar wording but contradictory content
        
        sources1 = set(claim1.sources)
        sources2 = set(claim2.sources)
        
        # If completely different sources, might be conflicting
        if sources1 and sources2 and not sources1.intersection(sources2):
            # Extract key terms and check for contradiction
            if self._text_similarity(claim1.text, claim2.text) > similarity_threshold:
                # Similar wording but different sources - potential conflict
                return self._has_contradiction(claim1.text, claim2.text)
        
        return False
    
    def _text_similarity(self, text1: str, text2: str) -> float:
        """Compute simple text similarity (0.0-1.0).
        
        Args:
            text1: First text
            text2: Second text
        
        Returns:
            Similarity score
        """
        # Simple implementation: count matching words
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        return intersection / union if union > 0 else 0.0
    
    def _has_contradiction(self, text1: str, text2: str) -> bool:
        """Check if two texts have contradictions.
        
        Args:
            text1: First text
            text2: Second text
        
        Returns:
            True if contradiction detected
        """
        # Look for explicit contradiction patterns
        contradictions = [
            (r"always", r"never"),
            (r"is", r"is not"),
            (r"recommends", r"recommends against"),
            (r"supports", r"opposes"),
            (r"agrees", r"disagrees"),
        ]
        
        text1_lower = text1.lower()
        text2_lower = text2.lower()
        
        for pattern1, pattern2 in contradictions:
            if re.search(pattern1, text1_lower) and re.search(pattern2, text2_lower):
                return True
            if re.search(pattern1, text2_lower) and re.search(pattern2, text1_lower):
                return True
        
        return False
    
    def _suggest_action(self, claim1: Claim, claim2: Claim) -> str:
        """Suggest remediation action for conflict.
        
        Args:
            claim1: First conflicting claim
            claim2: Second conflicting claim
        
        Returns:
            Suggested action
        """
        sources1 = set(claim1.sources)
        sources2 = set(claim2.sources)
        
        if not sources1 or not sources2:
            return "REVIEW: Check source citations and update if needed"
        
        if sources1 == sources2:
            return "MERGE: Claims cite same sources but contradict; consolidate"
        else:
            return "INVESTIGATE: Claims contradict and cite different sources; verify which is correct"


def generate_conflict_report(wiki_dir: str = "wiki", output_dir: str = "reports") -> str:
    """
    Generate conflict report and save to file.
    
    Args:
        wiki_dir: Wiki directory path
        output_dir: Output directory for report
    
    Returns:
        Path to generated report file
    """
    analyzer = ClaimDiffAnalyzer(wiki_dir)
    conflicts = analyzer.find_conflicts()
    
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Generate filename
    from datetime import date
    report_filename = f"conflicts-{date.today().isoformat()}.md"
    report_file = output_path / report_filename
    
    # Generate report content
    content = _generate_conflicts_markdown(conflicts)
    
    # Write report
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(content)
    
    logger.info(f"Conflict report saved to {report_file}")
    return str(report_file)


def _generate_conflicts_markdown(conflicts: List[ClaimConflict]) -> str:
    """Generate markdown report of conflicts.
    
    Args:
        conflicts: List of claim conflicts
    
    Returns:
        Markdown report content
    """
    from datetime import datetime
    
    if not conflicts:
        return "# Claim Conflicts Report\n\nNo conflicting claims detected.\n"
    
    lines = [
        "# Claim Conflicts Report\n",
        f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
        f"Total conflicts found: {len(conflicts)}\n",
        "\nConflicting claims are assertions from different sources that contradict each other.\n",
        "\n---\n\n"
    ]
    
    for i, conflict in enumerate(conflicts, 1):
        lines.append(f"##  Conflict {i}\n\n")
        
        lines.append(f"### Claim 1 (from: {conflict.claim1.page_title})\n")
        lines.append(f"{conflict.claim1.text}\n\n")
        lines.append(f"**Sources**: {', '.join(conflict.claim1.sources)}\n\n")
        
        lines.append(f"### Claim 2 (from: {conflict.claim2.page_title})\n")
        lines.append(f"{conflict.claim2.text}\n\n")
        lines.append(f"**Sources**: {', '.join(conflict.claim2.sources)}\n\n")
        
        lines.append(f"### Suggested Action\n")
        lines.append(f"{conflict.suggested_action}\n\n")
        
        lines.append("---\n\n")
    
    return "".join(lines)
