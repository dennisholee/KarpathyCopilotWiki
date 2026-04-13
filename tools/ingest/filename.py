"""Filename generator for wiki pages using YYYYMMDDNN convention."""

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional


def generate_filename(wiki_dir: str = "wiki", date: Optional[datetime] = None) -> str:
    """
    Generate a unique filename using the YYYYMMDDNN convention.
    
    Args:
        wiki_dir: Directory path where wiki pages are stored.
        date: Date to use for the YYYYMMDD prefix. Defaults to today (UTC).
    
    Returns:
        Filename like "20260413XX.md" where XX is the sequence number.
    """
    if date is None:
        date = datetime.now(timezone.utc)
    
    day_prefix = date.strftime("%Y%m%d")
    wiki_path = Path(wiki_dir)
    
    # Find all existing files for today and extract sequence numbers
    existing_numbers = []
    if wiki_path.exists():
        for file_path in wiki_path.glob(f"{day_prefix}*.md"):
            # Extract sequence number from filename like 20260413XX.md
            filename = file_path.name
            if filename.startswith(day_prefix) and filename.endswith(".md"):
                seq_part = filename[len(day_prefix):-3]  # Remove prefix and .md
                if seq_part.isdigit() and len(seq_part) == 2:
                    existing_numbers.append(int(seq_part))
    
    # Determine next sequence number
    next_seq = max(existing_numbers) + 1 if existing_numbers else 1
    sequence = f"{next_seq:02d}"
    
    return f"{day_prefix}{sequence}.md"


def ensure_unique_filename(
    wiki_dir: str, base_filename: str, max_attempts: int = 10
) -> str:
    """
    Ensure a filename is unique by checking for collisions and retrying if needed.
    
    Args:
        wiki_dir: Directory path.
        base_filename: Filename to check.
        max_attempts: Max retries if collision detected.
    
    Returns:
        A unique filename (may be the same as base_filename if no collision).
    """
    candidate = base_filename
    wiki_path = Path(wiki_dir)
    attempt = 0
    
    while (wiki_path / candidate).exists() and attempt < max_attempts:
        attempt += 1
        # Try with a collision-avoidance suffix
        name, ext = candidate.rsplit(".", 1)
        candidate = f"{name}_v{attempt}.{ext}"
    
    return candidate
