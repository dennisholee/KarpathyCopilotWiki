"""Handler for uncertain facts and needs_source marking."""

import logging
import re
from typing import Dict, List, Set, Tuple

logger = logging.getLogger(__name__)

# Words and phrases that indicate uncertainty
UNCERTAINTY_MARKERS = [
    "presumably",
    "allegedly",
    "reportedly",
    "supposedly",
    "apparently",
    "seemingly",
    "arguably",
    "may",
    "might",
    "could",
    "possibly",
    "perhaps",
    "it appears",
    "it seems",
    "it is claimed",
    "it is believed",
    "it is thought",
    "some say",
    "it is said",
    "according to",
]


class NeedsSourceHandler:
    """
    Tracks and marks uncertain facts requiring source verification.
    
    Strategies:
    1. Heuristic detection of uncertainty markers
    2. Mark with [[Needs Source]] inline for specific claims
    3. Set page-level needs_source flag if >50% uncertain
    4. Support backfill workflow: user adds sources → clear flag
    """
    
    def __init__(self):
        """Initialize handler."""
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def mark_uncertain_sections(
        self,
        text: str,
        confidence_threshold: float = 0.5,
    ) -> Tuple[str, bool]:
        """
        Mark uncertain sections of text with [[Needs Source]].
        
        Args:
            text: Content text to analyze.
            confidence_threshold: Threshold for overall uncertainty (0.0-1.0).
                                  If > threshold, set page-level flag.
        
        Returns:
            Tuple of (marked_text, should_set_needs_source_flag).
        """
        marked_text = text
        uncertain_count = 0
        total_sentences = 0
        
        # Split into sentences (simple heuristic)
        sentences = re.split(r"[.!?]\s+", text)
        
        for sentence in sentences:
            if not sentence.strip():
                continue
            
            total_sentences += 1
            
            # Check for uncertainty markers
            is_uncertain = False
            for marker in UNCERTAINTY_MARKERS:
                if re.search(r"\b" + re.escape(marker) + r"\b", sentence.lower()):
                    is_uncertain = True
                    uncertain_count += 1
                    
                    # Mark with [[Needs Source]]
                    if "[[Needs Source]]" not in sentence:
                        sentence = sentence.rstrip(".!?") + " [[Needs Source]]"
                    
                    marked_text = marked_text.replace(
                        sentence.replace(" [[Needs Source]]", ""),
                        sentence,
                        1
                    )
                    break
        
        # Determine if page-level flag should be set
        uncertainty_ratio = uncertain_count / max(total_sentences, 1)
        set_page_flag = uncertainty_ratio > confidence_threshold
        
        self.logger.debug(
            f"Marked {uncertain_count}/{total_sentences} sentences; "
            f"set page flag: {set_page_flag}"
        )
        
        return marked_text, set_page_flag
    
    def identify_unsourced_sections(self, page_content: str) -> List[Dict]:
        """
        Find all [[Needs Source]] markers and extract context.
        
        Args:
            page_content: Markdown page content.
        
        Returns:
            List of unsourced claims with context:
            [
                {
                    "line": "...",
                    "context": "...",
                    "line_num": 42,
                }
            ]
        """
        unsourced = []
        lines = page_content.split("\n")
        
        for i, line in enumerate(lines):
            if "[[Needs Source]]" in line:
                # Extract the claim (everything before [[Needs Source]])
                claim = line.replace("[[Needs Source]]", "").strip()
                
                # Get context (surrounding sentences)
                context_start = max(0, i - 1)
                context_end = min(len(lines), i + 2)
                context = "\n".join(lines[context_start:context_end])
                
                unsourced.append({
                    "line": claim,
                    "context": context,
                    "line_num": i + 1,
                })
        
        return unsourced
    
    def backfill_sources(
        self,
        page_filename: str,
        user_sources: List[str],
        wiki_dir: str,
    ) -> Tuple[str, int]:
        """
        User provides source links → update page, clear needs_source.
        
        Args:
            page_filename: Wiki page filename to update.
            user_sources: List of source links provided by user.
            wiki_dir: Wiki directory.
        
        Returns:
            Tuple of (updated_content, sources_added).
        """
        from pathlib import Path
        
        page_path = Path(wiki_dir) / page_filename
        
        if not page_path.exists():
            raise FileNotFoundError(f"Page not found: {page_filename}")
        
        content = page_path.read_text(encoding="utf-8")
        
        # Add sources to Links/Sources section
        for source in user_sources:
            if source not in content:
                # Find Sources section
                if "**Sources:**" in content:
                    content = content.replace(
                        "**Sources:**",
                        f"**Sources:**\n- {source}",
                        1
                    )
                elif "**Source:**" in content:
                    content = content.replace(
                        "**Source:**",
                        f"**Source:**\n- {source}",
                        1
                    )
        
        # Update metadata: clear page-level needs_source if enough sources
        unsourced = self.identify_unsourced_sections(content)
        
        # Clear page-level flag if user added sources
        if user_sources:
            remaining_unsourced = len(unsourced)
            total_claims = len(content.split("."))
            
            if remaining_unsourced < total_claims * 0.25:  # <25% unsourced
                # Remove needs_source: true flag
                content = content.replace("needs_source: true", "needs_source: false")
        
        # Write back
        page_path.write_text(content, encoding="utf-8")
        
        self.logger.info(f"Backfilled {len(user_sources)} sources for {page_filename}")
        
        return content, len(user_sources)
    
    def generate_unsourced_report(
        self,
        wiki_dir: str = "wiki",
    ) -> Dict:
        """
        Scan all wiki pages and generate report of unsourced claims.
        
        Args:
            wiki_dir: Wiki directory to scan.
        
        Returns:
            Report with summary and detailed findings.
        """
        from pathlib import Path
        
        wiki_path = Path(wiki_dir)
        
        report = {
            "total_pages": 0,
            "pages_with_unsourced": 0,
            "total_unsourced_claims": 0,
            "pages": [],
        }
        
        for page_file in wiki_path.glob("*.md"):
            if page_file.name.startswith("."):
                continue
            
            report["total_pages"] += 1
            
            try:
                content = page_file.read_text(encoding="utf-8")
                unsourced = self.identify_unsourced_sections(content)
                
                if unsourced:
                    report["pages_with_unsourced"] += 1
                    report["total_unsourced_claims"] += len(unsourced)
                    
                    report["pages"].append({
                        "filename": page_file.name,
                        "unsourced_count": len(unsourced),
                        "claims": unsourced,
                    })
            except Exception as e:
                self.logger.warning(f"Failed to analyze {page_file.name}: {e}")
        
        return report
    
    def filter_confidence_by_extraction_method(
        self,
        text: str,
        extraction_method: str,
    ) -> Tuple[str, bool]:
        """
        Adjust uncertainty based on extraction method.
        
        Strategy:
        - OCR (Tesseract): higher uncertainty (more errors)
        - pdfplumber: medium uncertainty (layout interpretation)
        - PyMuPDF: lower uncertainty (clean text)
        
        Args:
            text: Content text.
            extraction_method: Method used ("pymupdf", "pdfplumber", "tesseract_ocr").
        
        Returns:
            Tuple of (adjusted_text, set_needs_source_flag).
        """
        
        # More aggressive marking for OCR
        if extraction_method == "tesseract_ocr":
            threshold = 0.3  # Lower threshold = more aggressive marking
        elif extraction_method == "pdfplumber":
            threshold = 0.5
        else:  # pymupdf or unknown
            threshold = 0.7
        
        return self.mark_uncertain_sections(text, threshold)
