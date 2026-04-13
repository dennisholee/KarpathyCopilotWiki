"""CLI entry point for wiki linting and maintenance."""

import argparse
import json
import logging
import sys
from pathlib import Path

from tools.lint.orphan_check import OrphanDetector, generate_orphan_report
from tools.lint.claim_diff import ClaimDiffAnalyzer, generate_conflict_report
from tools.lint.remediation_report import RemediationReporter, generate_full_remediation_report

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    """Main CLI entry point for lint commands."""
    parser = argparse.ArgumentParser(
        description="Personal LLM Wiki - Linting and Maintenance",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m tools.lint orphans
    Find orphaned pages

  python -m tools.lint conflicts
    Find conflicting claims

  python -m tools.lint remediate
    Generate remediation suggestions

  python -m tools.lint full --wiki-dir /path/to/wiki
    Run all checks and generate full report
        """,
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # 'orphans' command
    orphans_parser = subparsers.add_parser("orphans", help="Find orphaned pages")
    orphans_parser.add_argument(
        "--wiki-dir",
        default="wiki",
        help="Wiki directory (default: ./wiki)"
    )
    orphans_parser.add_argument(
        "--min-age",
        type=int,
        default=7,
        help="Minimum page age in days (default: 7)"
    )
    orphans_parser.add_argument(
        "--output",
        choices=["text", "json", "markdown"],
        default="text",
        help="Output format (default: text)"
    )
    orphans_parser.add_argument(
        "--save",
        action="store_true",
        help="Save report to file"
    )
    
    # 'conflicts' command
    conflicts_parser = subparsers.add_parser("conflicts", help="Find conflicting claims")
    conflicts_parser.add_argument(
        "--wiki-dir",
        default="wiki",
        help="Wiki directory (default: ./wiki)"
    )
    conflicts_parser.add_argument(
        "--similarity",
        type=float,
        default=0.80,
        help="Similarity threshold for detection (default: 0.80)"
    )
    conflicts_parser.add_argument(
        "--output",
        choices=["text", "json", "markdown"],
        default="text",
        help="Output format (default: text)"
    )
    conflicts_parser.add_argument(
        "--save",
        action="store_true",
        help="Save report to file"
    )
    
    # 'remediate' command
    remediate_parser = subparsers.add_parser("remediate", help="Generate remediation suggestions")
    remediate_parser.add_argument(
        "--wiki-dir",
        default="wiki",
        help="Wiki directory (default: ./wiki)"
    )
    remediate_parser.add_argument(
        "--output-dir",
        default="reports",
        help="Output directory for reports (default: ./reports)"
    )
    remediate_parser.add_argument(
        "--output-patch",
        action="store_true",
        help="Generate patch file"
    )
    
    # 'full' command
    full_parser = subparsers.add_parser("full", help="Run all checks")
    full_parser.add_argument(
        "--wiki-dir",
        default="wiki",
        help="Wiki directory (default: ./wiki)"
    )
    full_parser.add_argument(
        "--output-dir",
        default="reports",
        help="Output directory for reports (default: ./reports)"
    )
    
    args = parser.parse_args()
    
    try:
        if args.command == "orphans":
            return handle_orphans(args)
        elif args.command == "conflicts":
            return handle_conflicts(args)
        elif args.command == "remediate":
            return handle_remediate(args)
        elif args.command == "full":
            return handle_full(args)
        else:
            parser.print_help()
            return 0
    except Exception as e:
        logger.error(f"Error: {e}")
        return 1


def handle_orphans(args) -> int:
    """Handle orphans command."""
    logger.info(f"Finding orphaned pages in {args.wiki_dir}")
    
    detector = OrphanDetector(args.wiki_dir)
    orphans = detector.find_orphans(min_age_days=args.min_age)
    
    if args.output == "json":
        output = [
            {
                "filename": o.filename,
                "title": o.title,
                "age_days": o.age_days,
                "tags": o.tags,
            }
            for o in orphans
        ]
        print(json.dumps(output, indent=2))
    elif args.output == "markdown":
        from tools.lint.orphan_check import _generate_orphan_markdown
        print(_generate_orphan_markdown(orphans))
    else:
        if not orphans:
            print("✓ No orphaned pages found!")
            return 0
        
        print(f"\n Found {len(orphans)} orphaned page(s):\n")
        for orphan in orphans:
            print(f"  📄 {orphan.title}")
            print(f"     File: {orphan.filename}")
            print(f"     Age: {orphan.age_days} days")
            if orphan.tags:
                print(f"     Tags: {', '.join(orphan.tags)}")
            print()
    
    if args.save:
        report_path = generate_orphan_report(args.wiki_dir)
        print(f"✓ Report saved to: {report_path}")
    
    return 0


def handle_conflicts(args) -> int:
    """Handle conflicts command."""
    logger.info(f"Finding conflicting claims in {args.wiki_dir}")
    
    analyzer = ClaimDiffAnalyzer(args.wiki_dir)
    conflicts = analyzer.find_conflicts(similarity_threshold=args.similarity)
    
    if args.output == "json":
        output = [
            {
                "claim1": c.claim1.text[:100],
                "claim1_page": c.claim1.page_title,
                "claim1_sources": c.claim1.sources,
                "claim2": c.claim2.text[:100],
                "claim2_page": c.claim2.page_title,
                "claim2_sources": c.claim2.sources,
                "suggested_action": c.suggested_action,
            }
            for c in conflicts
        ]
        print(json.dumps(output, indent=2))
    elif args.output == "markdown":
        from tools.lint.claim_diff import _generate_conflicts_markdown
        print(_generate_conflicts_markdown(conflicts))
    else:
        if not conflicts:
            print("✓ No conflicting claims found!")
            return 0
        
        print(f"\n Found {len(conflicts)} potential conflict(s):\n")
        for i, conflict in enumerate(conflicts, 1):
            print(f"{i}. Claim Conflict")
            print(f"   Page 1: {conflict.claim1.page_title}")
            print(f"   Claim: {conflict.claim1.text[:80]}...")
            print(f"   Page 2: {conflict.claim2.page_title}")
            print(f"   Claim: {conflict.claim2.text[:80]}...")
            print(f"   Action: {conflict.suggested_action}")
            print()
    
    if args.save:
        report_path = generate_conflict_report(args.wiki_dir)
        print(f"✓ Report saved to: {report_path}")
    
    return 0


def handle_remediate(args) -> int:
    """Handle remediate command."""
    logger.info(f"Analyzing wiki for remediation suggestions")
    
    reporter = RemediationReporter(args.wiki_dir)
    suggestions = reporter.analyze_wiki()
    
    print(f"\nFound {len(suggestions)} remediation suggestion(s):\n")
    
    for i, suggestion in enumerate(suggestions, 1):
        print(f"{i}. [{suggestion.severity.upper()}] {suggestion.issue_type.upper()}")
        print(f"   Page: {suggestion.page}")
        print(f"   Issue: {suggestion.description}\n")
    
    report_path = reporter.generate_report(args.output_dir)
    print(f"✓ Report saved to: {report_path}")
    
    if args.output_patch:
        patch_path = reporter.generate_patch(args.output_dir)
        print(f"✓ Patch saved to: {patch_path}")
    
    return 0


def handle_full(args) -> int:
    """Handle full command."""
    logger.info(f"Running full wiki analysis")
    
    results = generate_full_remediation_report(
        args.wiki_dir,
        args.output_dir
    )
    
    print(f"\n✓ Wiki analysis complete!")
    print(f"  Suggestions: {results['suggestions_count']}")
    print(f"  Report: {results['report']}")
    print(f"  Patch: {results['patch']}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
