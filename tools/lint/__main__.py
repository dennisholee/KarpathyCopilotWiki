"""CLI entry point for wiki linting tools."""

import argparse
import json
import logging
import sys
from pathlib import Path

from tools.lint.orphan_check import OrphanDetector, generate_orphan_report
from tools.lint.claim_diff import ClaimDiffAnalyzer, generate_conflict_report
from tools.lint.remediation_report import generate_full_remediation_report, RemediationReporter

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
  python -m tools.lint orphans --wiki-dir ./wiki
    Find orphaned pages (no inbound links)

  python -m tools.lint conflicts --wiki-dir ./wiki
    Find conflicting claims from different sources

  python -m tools.lint remediate --wiki-dir ./wiki
    Generate remediation suggestions

  python -m tools.lint full --wiki-dir ./wiki
    Run all linting checks and generate reports
        """,
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # 'orphans' command
    orphan_parser = subparsers.add_parser("orphans", help="Find orphaned pages")
    orphan_parser.add_argument(
        "--wiki-dir",
        default="wiki",
        help="Wiki directory (default: ./wiki)"
    )
    orphan_parser.add_argument(
        "--min-age-days",
        type=int,
        default=7,
        help="Minimum page age in days (default: 7)"
    )
    orphan_parser.add_argument(
        "--output",
        choices=["text", "json", "file"],
        default="text",
        help="Output format (default: text)"
    )
    orphan_parser.add_argument(
        "--output-dir",
        default="reports",
        help="Output directory for reports (default: ./reports)"
    )
    
    # 'conflicts' command
    conflict_parser = subparsers.add_parser("conflicts", help="Find conflicting claims")
    conflict_parser.add_argument(
        "--wiki-dir",
        default="wiki",
        help="Wiki directory (default: ./wiki)"
    )
    conflict_parser.add_argument(
        "--output",
        choices=["text", "json", "file"],
        default="text",
        help="Output format (default: text)"
    )
    conflict_parser.add_argument(
        "--output-dir",
        default="reports",
        help="Output directory for reports (default: ./reports)"
    )
    
    # 'remediate' command
    remediate_parser = subparsers.add_parser("remediate", help="Generate remediation suggestions")
    remediate_parser.add_argument(
        "--wiki-dir",
        default="wiki",
        help="Wiki directory (default: ./wiki)"
    )
    remediate_parser.add_argument(
        "--output",
        choices=["text", "json", "file", "patch"],
        default="text",
        help="Output format (default: text)"
    )
    remediate_parser.add_argument(
        "--output-dir",
        default="reports",
        help="Output directory for reports (default: ./reports)"
    )
    
    # 'full' command
    full_parser = subparsers.add_parser("full", help="Run all linting checks")
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
    
    if not args.command:
        parser.print_help()
        return 0
    
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
            return 1
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        return 1


def handle_orphans(args) -> int:
    """Handle orphans command."""
    logger.info(f"Scanning for orphaned pages in {args.wiki_dir}")
    
    detector = OrphanDetector(args.wiki_dir)
    orphans = detector.find_orphans(min_age_days=args.min_age_days)
    
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
    elif args.output == "file":
        report_file = generate_orphan_report(args.wiki_dir, args.output_dir)
        print(f"✓ Orphan report saved to: {report_file}")
    else:
        if not orphans:
            print("No orphaned pages found.")
            return 0
        
        print(f"\nFound {len(orphans)} orphaned page(s):\n")
        for orphan in orphans:
            print(f"  📄 {orphan.title}")
            print(f"     File: {orphan.filename}")
            print(f"     Age: {orphan.age_days} days")
            if orphan.tags:
                print(f"     Tags: {', '.join(orphan.tags)}")
            print()
    
    return 0


def handle_conflicts(args) -> int:
    """Handle conflicts command."""
    logger.info(f"Scanning for conflicting claims in {args.wiki_dir}")
    
    analyzer = ClaimDiffAnalyzer(args.wiki_dir)
    conflicts = analyzer.find_conflicts()
    
    if args.output == "json":
        output = [
            {
                "claim1": {
                    "text": c.claim1.text,
                    "page": c.claim1.page_title,
                    "sources": c.claim1.sources,
                },
                "claim2": {
                    "text": c.claim2.text,
                    "page": c.claim2.page_title,
                    "sources": c.claim2.sources,
                },
                "suggested_action": c.suggested_action,
            }
            for c in conflicts
        ]
        print(json.dumps(output, indent=2))
    elif args.output == "file":
        report_file = generate_conflict_report(args.wiki_dir, args.output_dir)
        print(f"✓ Conflict report saved to: {report_file}")
    else:
        if not conflicts:
            print("No conflicting claims detected.")
            return 0
        
        print(f"\nFound {len(conflicts)} conflicting claim(s):\n")
        for i, conflict in enumerate(conflicts, 1):
            print(f"{i}. {conflict.claim1.page_title} vs {conflict.claim2.page_title}")
            print(f"   Claim 1: {conflict.claim1.text[:60]}...")
            print(f"   Claim 2: {conflict.claim2.text[:60]}...")
            print(f"   Action: {conflict.suggested_action}")
            print()
    
    return 0


def handle_remediate(args) -> int:
    """Handle remediate command."""
    logger.info(f"Generating remediation suggestions for {args.wiki_dir}")
    
    reporter = RemediationReporter(args.wiki_dir)
    suggestions = reporter.analyze_wiki()
    
    if args.output == "json":
        output = [
            {
                "page": s.page,
                "issue_type": s.issue_type,
                "severity": s.severity,
                "description": s.description,
                "actions": s.actions,
            }
            for s in suggestions
        ]
        print(json.dumps(output, indent=2))
    elif args.output == "file":
        report_file = reporter.generate_report(args.output_dir)
        print(f"✓ Remediation report saved to: {report_file}")
    elif args.output == "patch":
        patch_file = reporter.generate_patch(args.output_dir)
        print(f"✓ Remediation patch saved to: {patch_file}")
    else:
        if not suggestions:
            print("No remediations needed. Wiki is healthy!")
            return 0
        
        print(f"\n{len(suggestions)} remediation suggestion(s):\n")
        by_severity = {}
        for s in suggestions:
            if s.severity not in by_severity:
                by_severity[s.severity] = []
            by_severity[s.severity].append(s)
        
        for severity in ["high", "medium", "low"]:
            if severity in by_severity:
                print(f"\n{severity.upper()} PRIORITY ({len(by_severity[severity])}):")
                for s in by_severity[severity]:
                    print(f"  - {s.page}: {s.description}")
    
    return 0


def handle_full(args) -> int:
    """Handle full command - run all checks."""
    logger.info(f"Running full wiki lint on {args.wiki_dir}")
    
    result = generate_full_remediation_report(args.wiki_dir, args.output_dir)
    
    print(f"\n✓ Linting complete!")
    print(f"  - Report: {result['report']}")
    print(f"  - Patch: {result['patch']}")
    print(f"  - Suggestions: {result['suggestions_count']}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
