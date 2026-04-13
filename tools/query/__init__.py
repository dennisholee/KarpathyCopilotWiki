"""CLI entry point for wiki query and decision archiving."""

import argparse
import json
import logging
import sys
from pathlib import Path

from tools.query.query import query_wiki, WikiQueryEngine
from tools.query.archive_decision import archive_query_as_decision

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    """Main CLI entry point for query commands."""
    parser = argparse.ArgumentParser(
        description="Personal LLM Wiki - Query and Decision Archive",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m tools.query "What is in my recent papers?"
    Query the wiki and display results

  python -m tools.query "What frameworks should I use?" --archive
    Query and archive as decision page

  python -m tools.query search "machine learning" --wiki-dir /path/to/wiki
    Search wiki with keyword/embedding search
        """,
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # 'query' command (default if not specified)
    query_parser = subparsers.add_parser("query", help="Ask a question about the wiki")
    query_parser.add_argument("question", help="Question to ask")
    query_parser.add_argument(
        "--wiki-dir",
        default="wiki",
        help="Wiki directory (default: ./wiki)"
    )
    query_parser.add_argument(
        "--archive",
        action="store_true",
        help="Archive query as decision page (default: false)"
    )
    query_parser.add_argument(
        "--tags",
        default="query,automated",
        help="Comma-separated tags for decision page"
    )
    query_parser.add_argument(
        "--output",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)"
    )
    
    # 'search' command
    search_parser = subparsers.add_parser("search", help="Search wiki")
    search_parser.add_argument("query", help="Search query")
    search_parser.add_argument(
        "--wiki-dir",
        default="wiki",
        help="Wiki directory (default: ./wiki)"
    )
    search_parser.add_argument(
        "--top-k",
        type=int,
        default=5,
        help="Number of results to return (default: 5)"
    )
    search_parser.add_argument(
        "--min-score",
        type=float,
        default=0.2,
        help="Minimum relevance score threshold (default: 0.2)"
    )
    search_parser.add_argument(
        "--output",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)"
    )
    
    # 'decisions' command
    decisions_parser = subparsers.add_parser("decisions", help="Manage decisions")
    decisions_parser.add_argument(
        "action",
        choices=["recent", "list"],
        help="Action to perform"
    )
    decisions_parser.add_argument(
        "--wiki-dir",
        default="wiki",
        help="Wiki directory (default: ./wiki)"
    )
    decisions_parser.add_argument(
        "--limit",
        type=int,
        default=10,
        help="Number of decisions to list (default: 10)"
    )
    
    args = parser.parse_args()
    
    # If no subcommand, treat as query
    if not args.command:
        if len(sys.argv) > 1:
            # Try to treat entire command line as query
            query_text = " ".join(sys.argv[1:])
            if query_text.startswith("--"):
                parser.print_help()
                return 1
            
            args.command = "default_query"
            args.question = query_text
            args.wiki_dir = "wiki"
            args.archive = False
            args.tags = "query,automated"
            args.output = "text"
        else:
            parser.print_help()
            return 0
    
    # Handle commands
    try:
        if args.command in ["query", "default_query"]:
            return handle_query(args)
        elif args.command == "search":
            return handle_search(args)
        elif args.command == "decisions":
            return handle_decisions(args)
        else:
            parser.print_help()
            return 1
    except Exception as e:
        logger.error(f"Error: {e}")
        return 1


def handle_query(args) -> int:
    """Handle query command."""
    logger.info(f"Querying wiki: {args.question}")
    
    # Query the wiki
    result = query_wiki(args.question, args.wiki_dir)
    
    # Output results
    if args.output == "json":
        output = {
            "query": result.query,
            "answer": result.answer,
            "supporting_pages": [
                {
                    "filepath": r.filepath,
                    "title": r.title,
                    "excerpt": r.excerpt,
                    "score": float(r.score),
                }
                for r in result.supporting_pages
            ],
            "model": result.model_used,
        }
        print(json.dumps(output, indent=2))
    else:
        print(f"\n{'='*60}")
        print(f"Query: {result.query}")
        print(f"{'='*60}\n")
        print(f"Answer:\n{result.answer}\n")
        
        if result.supporting_pages:
            print(f"Supporting Pages (using {result.model_used} search):")
            for page in result.supporting_pages:
                print(f"\n  📄 {page.title} (score: {page.score:.2f})")
                print(f"     {page.filepath}")
                print(f"     {page.excerpt[:100]}...")
    
    # Archive if requested
    if args.archive:
        tags = [t.strip() for t in args.tags.split(",")]
        decision_path = archive_query_as_decision(
            question=args.question,
            answer=result.answer,
            supporting_pages=[p.filepath for p in result.supporting_pages],
            tags=tags,
            wiki_dir=args.wiki_dir
        )
        print(f"\n✓ Decision archived to: {decision_path}")
    
    return 0


def handle_search(args) -> int:
    """Handle search command."""
    logger.info(f"Searching wiki: {args.query}")
    
    engine = WikiQueryEngine(args.wiki_dir, use_embeddings=True)
    results = engine.search(args.query, top_k=args.top_k, min_score=args.min_score)
    
    if args.output == "json":
        output = [
            {
                "filepath": r.filepath,
                "title": r.title,
                "excerpt": r.excerpt,
                "score": float(r.score),
                "links": r.links,
            }
            for r in results
        ]
        print(json.dumps(output, indent=2))
    else:
        if not results:
            print(f"No results found for: {args.query}")
            return 0
        
        print(f"\nSearch results for: {args.query}\n")
        for i, result in enumerate(results, 1):
            print(f"{i}. {result.title}")
            print(f"   Score: {result.score:.2f}")
            print(f"   Path: {result.filepath}")
            print(f"   {result.excerpt[:80]}...")
            if result.links:
                print(f"   Links: {', '.join(result.links[:3])}")
            print()
    
    return 0


def handle_decisions(args) -> int:
    """Handle decisions command."""
    from tools.query.archive_decision import DecisionArchiver
    
    archiver = DecisionArchiver(args.wiki_dir)
    
    if args.action in ["recent", "list"]:
        decisions = archiver.get_recent_decisions(args.limit)
        
        if not decisions:
            print("No decisions found.")
            return 0
        
        if args.output == "json":
            print(json.dumps({"decisions": decisions}, indent=2))
        else:
            print(f"\nRecent decisions (up to {args.limit}):\n")
            for i, decision_path in enumerate(decisions, 1):
                filename = Path(decision_path).name
                print(f"{i}. {filename}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
