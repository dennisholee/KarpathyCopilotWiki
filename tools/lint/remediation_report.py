"""Generate remediation suggestions for wiki maintenance."""

import logging
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict
from datetime import datetime

from tools.lint.orphan_check import OrphanDetector, OrphanPage
from tools.lint.claim_diff import ClaimDiffAnalyzer, ClaimConflict

logger = logging.getLogger(__name__)


@dataclass
class RemediationSuggestion:
    """A suggested remediation action."""
    page: str
    issue_type: str  # 'orphan', 'conflict', 'missing-source'
    severity: str  # 'high', 'medium', 'low'
    description: str
    actions: List[str]
    page_path: str = ""


class RemediationReporter:
    """Generate remediation suggestions for wiki issues."""
    
    def __init__(self, wiki_dir: str = "wiki"):
        """
        Initialize remediation reporter.
        
        Args:
            wiki_dir: Path to wiki directory
        """
        self.wiki_dir = wiki_dir
        self.suggestions = []
    
    def analyze_wiki(self, output_patch: bool = False) -> List[RemediationSuggestion]:
        """
        Analyze wiki and generate remediation suggestions.
        
        Args:
            output_patch: Whether to generate a patch file
        
        Returns:
            List of RemediationSuggestion objects
        """
        suggestions = []
        
        # Check for orphans
        orphan_detector = OrphanDetector(self.wiki_dir)
        orphans = orphan_detector.find_orphans(min_age_days=7)
        
        for orphan in orphans:
            suggestions.append(RemediationSuggestion(
                page=orphan.title,
                issue_type="orphan",
                severity="medium",
                description=f"Page '{orphan.title}' has no inbound links ({orphan.age_days} days old)",
                actions=[
                    "1. Add links from related pages using [[WikiLink]]",
                    "2. Merge with an existing page if content is similar",
                    "3. Delete if content is no longer relevant",
                    f"4. Contact page author to verify if still needs this content"
                ],
                page_path=str(orphan.path)
            ))
        
        # Check for conflicts
        conflict_analyzer = ClaimDiffAnalyzer(self.wiki_dir)
        conflicts = conflict_analyzer.find_conflicts()
        
        for conflict in conflicts:
            suggestions.append(RemediationSuggestion(
                page=f"{conflict.claim1.page_title} vs {conflict.claim2.page_title}",
                issue_type="conflict",
                severity="high",
                description=f"Conflicting claims from different sources",
                actions=[
                    conflict.suggested_action,
                    "1. Verify which claim is correct by checking sources",
                    "2. Update or merge pages to reflect correct information",
                    "3. Add clarification note if both are valid in different contexts"
                ],
                page_path=str(conflict.claim1.page_file)
            ))
        
        self.suggestions = suggestions
        return suggestions
    
    def generate_report(self, output_dir: str = "reports") -> str:
        """
        Generate remediation report file.
        
        Args:
            output_dir: Output directory for report
        
        Returns:
            Path to generated report file
        """
        if not self.suggestions:
            self.analyze_wiki()
        
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        from datetime import date
        report_filename = f"remediation-{date.today().isoformat()}.md"
        report_file = output_path / report_filename
        
        content = self._generate_markdown(self.suggestions)
        
        with open(report_file, "w", encoding="utf-8") as f:
            f.write(content)
        
        logger.info(f"Remediation report saved to {report_file}")
        return str(report_file)
    
    def generate_patch(self, output_dir: str = "reports") -> str:
        """
        Generate a patch file with suggested changes.
        
        Args:
            output_dir: Output directory for patch
        
        Returns:
            Path to generated patch file
        """
        if not self.suggestions:
            self.analyze_wiki()
        
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        from datetime import date
        patch_filename = f"remediation-{date.today().isoformat()}.patch"
        patch_file = output_path / patch_filename
        
        patch_content = self._generate_patch(self.suggestions)
        
        with open(patch_file, "w", encoding="utf-8") as f:
            f.write(patch_content)
        
        logger.info(f"Remediation patch saved to {patch_file}")
        return str(patch_file)
    
    def _generate_markdown(self, suggestions: List[RemediationSuggestion]) -> str:
        """Generate markdown report.
        
        Args:
            suggestions: List of suggestions
        
        Returns:
            Markdown report content
        """
        if not suggestions:
            return "# Remediation Report\n\nNo issues found. Wiki is in good shape!\n"
        
        lines = [
            "# Wiki Remediation Report\n",
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
            f"Total suggestions: {len(suggestions)}\n\n",
            "## Overview\n",
        ]
        
        # Count by severity
        by_severity = {}
        for suggestion in suggestions:
            by_severity[suggestion.severity] = by_severity.get(suggestion.severity, 0) + 1
        
        for severity in ["high", "medium", "low"]:
            if severity in by_severity:
                count = by_severity[severity]
                lines.append(f"- **{severity.upper()}**: {count} issue(s)\n")
        
        lines.append("\n---\n\n")
        
        # Group by severity
        for severity in ["high", "medium", "low"]:
            severity_suggestions = [s for s in suggestions if s.severity == severity]
            
            if severity_suggestions:
                lines.append(f"## {severity.upper()} Priority\n\n")
                
                for i, suggestion in enumerate(severity_suggestions, 1):
                    lines.append(f"### {i}. {suggestion.page}\n")
                    lines.append(f"**Type**: {suggestion.issue_type}\n")
                    lines.append(f"**Issue**: {suggestion.description}\n\n")
                    
                    lines.append("**Suggested Actions**:\n")
                    for action in suggestion.actions:
                        lines.append(f"{action}\n")
                    
                    lines.append("\n")
                
                lines.append("---\n\n")
        
        return "".join(lines)
    
    def _generate_patch(self, suggestions: List[RemediationSuggestion]) -> str:
        """Generate patch file content.
        
        Args:
            suggestions: List of suggestions
        
        Returns:
            Patch file content (showing before/after)
        """
        lines = [
            "# Remediation Patch\n",
            f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
            "# This patch shows suggested changes for wiki remediation\n",
            f"# Total suggestions: {len(suggestions)}\n\n",
        ]
        
        for suggestion in suggestions:
            lines.append(f"--- {suggestion.page_path}\n")
            lines.append(f"+++ {suggestion.page_path} (suggested)\n")
            lines.append(f"@@ Remediation for: {suggestion.issue_type} @@\n")
            lines.append(f" File: {suggestion.page_path}\n")
            lines.append(f" Issue: {suggestion.description}\n")
            lines.append(f" Actions:\n")
            for action in suggestion.actions:
                lines.append(f"   {action}\n")
            lines.append("\n")
        
        return "".join(lines)


def generate_full_remediation_report(
    wiki_dir: str = "wiki",
    output_dir: str = "reports"
) -> Dict[str, str]:
    """
    Generate complete remediation reports.
    
    Args:
        wiki_dir: Wiki directory path
        output_dir: Output directory for reports
    
    Returns:
        Dictionary with paths to generated reports
    """
    reporter = RemediationReporter(wiki_dir)
    
    report_file = reporter.generate_report(output_dir)
    patch_file = reporter.generate_patch(output_dir)
    
    return {
        "report": report_file,
        "patch": patch_file,
        "suggestions_count": len(reporter.suggestions)
    }
