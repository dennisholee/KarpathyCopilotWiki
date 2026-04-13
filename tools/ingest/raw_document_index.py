"""Raw document index - tracks provenance of ingested pages."""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class RawDocumentIndex:
    """
    Tracks bidirectional mapping between wiki pages and their raw source documents.
    
    Maps:
    - page_filename → (source_pdf, concept_title, ingestion_time)
    - source_pdf → [page_filenames]
    """
    
    INDEX_FILE = ".wiki/raw_index.json"
    
    def __init__(self, wiki_dir: str = "wiki"):
        """Initialize index.
        
        Args:
            wiki_dir: Path to wiki directory.
        """
        self.wiki_dir = Path(wiki_dir)
        self.index_file = self.wiki_dir / self.INDEX_FILE
        self.index = self._load_index()
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def add_page(self, page_filename: str, raw_source: str, concept_title: str) -> None:
        """
        Record that a wiki page was generated from a raw source.
        
        Args:
            page_filename: Wiki page filename (e.g., 20240101.md).
            raw_source: Path to raw source document (e.g., /raw/paper.pdf).
            concept_title: Concept title that was extracted.
        """
        entry = {
            "source": raw_source,
            "concept": concept_title,
            "ingested_at": datetime.now().isoformat(),
        }
        
        self.index[page_filename] = entry
        self.logger.debug(f"Added to index: {page_filename} ← {raw_source}")
    
    def get_pages_from_source(self, raw_source: str) -> List[str]:
        """
        Get all wiki pages generated from a specific raw source.
        
        Args:
            raw_source: Path to raw source document.
        
        Returns:
            List of page filenames.
        """
        return [
            page_filename
            for page_filename, entry in self.index.items()
            if entry.get("source") == raw_source
        ]
    
    def get_source_for_page(self, page_filename: str) -> Optional[str]:
        """
        Get the raw source for a wiki page.
        
        Args:
            page_filename: Wiki page filename.
        
        Returns:
            Path to raw source or None if not found.
        """
        entry = self.index.get(page_filename)
        return entry.get("source") if entry else None
    
    def get_concept_for_page(self, page_filename: str) -> Optional[str]:
        """
        Get the original concept title for a page.
        
        Args:
            page_filename: Wiki page filename.
        
        Returns:
            Original concept title or None if not found.
        """
        entry = self.index.get(page_filename)
        return entry.get("concept") if entry else None
    
    def page_exists_for_concept(self, raw_source: str, concept_title: str) -> Optional[str]:
        """
        Check if a page already exists for this concept from this source.
        
        Args:
            raw_source: Path to raw source.
            concept_title: Concept title to check.
        
        Returns:
            Page filename if exists, None otherwise.
        """
        for page_filename, entry in self.index.items():
            if (entry.get("source") == raw_source and
                entry.get("concept").lower() == concept_title.lower()):
                return page_filename
        return None
    
    def rebuild_from_page_metadata(self) -> None:
        """
        Scan all wiki pages and rebuild index from their metadata.
        
        Useful for recovering index if it's corrupted or missing.
        """
        self.logger.info(f"Rebuilding index from {self.wiki_dir}/*.md")
        self.index.clear()
        
        for page_file in self.wiki_dir.glob("*.md"):
            if page_file.name in (".index.md", ".glossary.md", "index.md", "glossary.md"):
                continue
            
            try:
                content = page_file.read_text(encoding="utf-8")
                
                # Extract metadata from frontmatter
                lines = content.split("\n")
                for i, line in enumerate(lines):
                    if line.startswith("**Source:**"):
                        source_link = line.replace("**Source:**", "").strip()
                        # Extract /raw/... path
                        if "/raw/" in source_link:
                            raw_path = source_link.split("(/raw/")[1].split(")")[0]
                            raw_path = "/raw/" + raw_path
                            
                            self.index[page_file.name] = {
                                "source": raw_path,
                                "concept": self._extract_title(content),
                                "ingested_at": datetime.fromtimestamp(page_file.stat().st_mtime).isoformat(),
                                "reconstructed": True,
                            }
                            break
            except Exception as e:
                self.logger.warning(f"Failed to read {page_file.name}: {e}")
        
        self.logger.info(f"Index rebuilt with {len(self.index)} entries")
        self.persist_to_disk()
    
    def persist_to_disk(self) -> None:
        """Save index to disk."""
        self.index_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(self.index_file, "w") as f:
            json.dump(self.index, f, indent=2)
        
        self.logger.debug(f"Index persisted to {self.index_file}")
    
    def _load_index(self) -> Dict:
        """Load index from disk or return empty if not found."""
        if self.index_file.exists():
            try:
                with open(self.index_file) as f:
                    return json.load(f)
            except Exception as e:
                self.logger.warning(f"Failed to load index: {e}")
                return {}
        return {}
    
    def _extract_title(self, content: str) -> str:
        """Extract page title from Markdown."""
        for line in content.split("\n"):
            if line.startswith("# "):
                return line[2:].strip()
        return "Unknown"
