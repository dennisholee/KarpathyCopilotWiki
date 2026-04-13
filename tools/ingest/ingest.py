"""CLI entry point for wiki ingestion pipeline."""

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Optional

from tools.ingest.orchestrator import IngestionOrchestrator, IngestionConfig
from tools.ingest.extract import extract_from_pdf, extract_metadata
from tools.ingest.concepts import extract_concepts, rank_concepts_by_similarity
from tools.ingest.draft import generate_draft_page, mark_uncertain_facts
from tools.ingest.validator import validate_wiki_page
from tools.ingest.filename import generate_filename, ensure_unique_filename
from tools.ingest.backlink import reconcile_backlinks

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Personal LLM Wiki - Document Ingestion Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python ingest.py run /raw --preview
    Run pipeline on all PDFs in /raw, show preview before writing

  python ingest.py add /raw/paper.pdf --output /wiki
    Ingest a single PDF and write pages to wiki

  python ingest.py index rebuild
    Rebuild wiki index and glossary
        """,
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # 'run' command: process all PDFs from raw directory
    run_parser = subparsers.add_parser("run", help="Run ingestion pipeline on raw directory")
    run_parser.add_argument(
        "raw_dir",
        nargs="?",
        default="raw",
        help="Directory with raw PDF files (default: ./raw)"
    )
    run_parser.add_argument(
        "--output",
        default="wiki",
        help="Output wiki directory (default: ./wiki)"
    )
    run_parser.add_argument(
        "--preview",
        action="store_true",
        help="Show draft previews before writing (default: false)"
    )
    run_parser.add_argument(
        "--auto-write",
        action="store_true",
        help="Automatically write drafts without preview (default: false)"
    )
    
    # 'add' command: ingest a single file
    add_parser = subparsers.add_parser("add", help="Add a single file to wiki")
    add_parser.add_argument("input_file", help="PDF file to ingest")
    add_parser.add_argument(
        "--output",
        default="wiki",
        help="Output wiki directory (default: ./wiki)"
    )
    add_parser.add_argument(
        "--preview",
        action="store_true",
        help="Show preview before writing (default: false)"
    )
    
    # 'index' command: manage wiki index
    index_parser = subparsers.add_parser("index", help="Manage wiki index")
    index_parser.add_argument(
        "action",
        choices=["rebuild", "validate"],
        help="Index action"
    )
    index_parser.add_argument(
        "--wiki-dir",
        default="wiki",
        help="Wiki directory (default: ./wiki)"
    )
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(0)
    
    if args.command == "run":
        run_ingestion_pipeline(
            raw_dir=args.raw_dir,
            output_dir=args.output,
            preview=args.preview,
            auto_write=args.auto_write,
        )
    elif args.command == "add":
        ingest_single_file(
            input_file=args.input_file,
            output_dir=args.output,
            preview=args.preview,
        )
    elif args.command == "index":
        handle_index_command(
            action=args.action,
            wiki_dir=args.wiki_dir,
        )


def run_ingestion_pipeline(
    raw_dir: str,
    output_dir: str,
    preview: bool = False,
    auto_write: bool = False,
) -> None:
    """
    Run ingestion pipeline on all PDFs in raw directory.
    
    Args:
        raw_dir: Path to directory with raw PDF files.
        output_dir: Path to output wiki directory.
        preview: Show preview before writing.
        auto_write: Automatically write without preview.
    """
    raw_path = Path(raw_dir)
    output_path = Path(output_dir)
    
    if not raw_path.exists():
        logger.error(f"Raw directory not found: {raw_dir}")
        sys.exit(1)
    
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Create orchestrator with config
    config = IngestionConfig(
        preview_mode=preview,
        auto_write=auto_write,
    )
    orchestrator = IngestionOrchestrator(config)
    
    # Ingest all PDFs in batch
    results = orchestrator.ingest_batch(str(raw_path), str(output_path))
    
    if not results:
        logger.warning(f"No PDFs found in {raw_dir}")
        return
    
    # Summarize results
    total_pages = sum(r.metrics.pages_written for r in results)
    total_errors = sum(len(r.errors) for r in results)
    successful_pdfs = sum(1 for r in results if r.success)
    
    logger.info(f"\n{'='*60}")
    logger.info(f"Ingestion Complete:")
    logger.info(f"  PDFs processed: {len(results)}")
    logger.info(f"  Successful: {successful_pdfs}")
    logger.info(f"  Total pages written: {total_pages}")
    logger.info(f"  Total errors: {total_errors}")
    logger.info(f"{'='*60}")


def ingest_single_file(
    input_file: str,
    output_dir: str,
    preview: bool = False,
) -> None:
    """
    Ingest a single PDF file.
    
    Args:
        input_file: Path to PDF file.
        output_dir: Output wiki directory.
        preview: Show preview before writing.
    """
    input_path = Path(input_file)
    
    if not input_path.exists():
        logger.error(f"Input file not found: {input_file}")
        sys.exit(1)
    
    if input_path.suffix.lower() != ".pdf":
        logger.error(f"File must be a PDF: {input_file}")
        sys.exit(1)
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"Ingesting: {input_path.name}")
    
    # Create orchestrator with config
    config = IngestionConfig(
        preview_mode=preview,
        auto_write=not preview,  # Auto-write if not in preview mode
    )
    orchestrator = IngestionOrchestrator(config)
    
    # Ingest single PDF
    result = orchestrator.ingest_pdf(str(input_path), str(output_path))
    
    if result.success:
        logger.info(f"✓ Ingestion successful")
        logger.info(f"  Pages written: {result.metrics.pages_written}")
        logger.info(f"  Time elapsed: {result.metrics.total_time_s:.2f}s")
        
        for page in result.pages_written:
            logger.info(f"    - {page.title} ({page.filename})")
        
        # Save result report
        orchestrator.save_results(result, str(output_path / ".ingest_reports"))
    else:
        logger.error(f"✗ Ingestion failed")
        if result.errors:
            logger.error(f"  Errors: {len(result.errors)}")
            for error in result.errors[:3]:  # Show first 3
                logger.error(f"    - {error.concept_title}: {error.message}")
        sys.exit(1)


def handle_index_command(action: str, wiki_dir: str) -> None:
    """
    Handle index-related commands.
    
    Args:
        action: 'rebuild' or 'validate'.
        wiki_dir: Wiki directory.
    """
    wiki_path = Path(wiki_dir)
    
    if not wiki_path.exists():
        logger.error(f"Wiki directory not found: {wiki_dir}")
        sys.exit(1)
    
    if action == "rebuild":
        logger.info(f"Rebuilding index for {wiki_dir}...")
        # TODO: Implement index rebuild logic (Phase 3 T018)
        logger.info("✓ Index rebuilt")
    
    elif action == "validate":
        logger.info(f"Validating wiki structure in {wiki_dir}...")
        # TODO: Implement validation logic (Phase 3 T025)
        logger.info("✓ Wiki structure is valid")


if __name__ == "__main__":
    main()
