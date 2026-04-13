"""PDF/text extraction pipeline with three-stage fallback."""

import io
import logging
from pathlib import Path
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)


def extract_from_pdf(file_path: str) -> Tuple[str, Dict]:
    """
    Extract text and metadata from PDF using three-stage fallback pipeline.
    
    Stage 1 (Primary): PyMuPDF (fitz) - fast, handles born-digital PDFs well
    Stage 2 (Fallback): pdfplumber - better for layout-heavy or embedded text
    Stage 3 (OCR): Tesseract - for scanned/image-based PDFs
    
    Args:
        file_path: Path to PDF file.
    
    Returns:
        Tuple of (extracted_text, metadata).
        
    Raises:
        ValueError: If all extraction stages fail.
    """
    file_path_obj = Path(file_path)
    
    if not file_path_obj.exists():
        raise FileNotFoundError(f"PDF file not found: {file_path}")
    
    if not file_path_obj.suffix.lower() == ".pdf":
        raise ValueError(f"File must be a PDF: {file_path}")
    
    metadata = {
        "source_file": str(file_path),
        "file_size_bytes": file_path_obj.stat().st_size,
        "extraction_method": None,
        "page_count": 0,
        "ocr_applied": False,
    }
    
    # Stage 1: PyMuPDF (primary method)
    try:
        import fitz  # pymupdf
        text, meta = _extract_pymupdf(file_path, metadata)
        if text.strip():
            return text, meta
        logger.warning(f"PyMuPDF extraction produced no text for {file_path}, trying fallback")
    except ImportError:
        logger.warning("PyMuPDF not installed, skipping stage 1")
    except Exception as e:
        logger.warning(f"PyMuPDF extraction failed for {file_path}: {e}, trying fallback")
    
    # Stage 2: pdfplumber (fallback for layout-heavy)
    try:
        import pdfplumber
        text, meta = _extract_pdfplumber(file_path, metadata)
        if text.strip():
            return text, meta
        logger.warning(f"pdfplumber extraction produced no text for {file_path}, trying OCR")
    except ImportError:
        logger.warning("pdfplumber not installed, skipping stage 2")
    except Exception as e:
        logger.warning(f"pdfplumber extraction failed for {file_path}: {e}, trying OCR")
    
    # Stage 3: Tesseract OCR (fallback for scanned)
    try:
        import pytesseract
        from PIL import Image
        text, meta = _extract_tesseract(file_path, metadata, pytesseract, Image)
        if text.strip():
            return text, meta
        logger.error(f"Tesseract OCR produced no text for {file_path}")
    except ImportError:
        logger.error("pytesseract or PIL not installed, cannot perform OCR")
    except Exception as e:
        logger.error(f"Tesseract OCR failed for {file_path}: {e}")
    
    # All stages failed
    raise ValueError(f"All extraction stages failed for {file_path}")


def _extract_pymupdf(file_path: str, metadata: Dict) -> Tuple[str, Dict]:
    """Extract text using PyMuPDF (fitz).
    
    Args:
        file_path: Path to PDF.
        metadata: Metadata dict to update.
        
    Returns:
        Tuple of (extracted_text, updated_metadata).
    """
    import fitz  # pymupdf: pip install PyMuPDF
    
    doc = fitz.open(file_path)
    text_parts = []
    
    for page_num, page in enumerate(doc):
        page_text = page.get_text()
        if page_text.strip():
            # Add page marker for reference
            text_parts.append(f"--- Page {page_num + 1} ---\n{page_text}")
    
    doc.close()
    text = "\n\n".join(text_parts)
    
    metadata["extraction_method"] = "pymupdf"
    metadata["page_count"] = len(doc)
    
    return text, metadata


def _extract_pdfplumber(file_path: str, metadata: Dict) -> Tuple[str, Dict]:
    """Extract text using pdfplumber (better for layout-heavy PDFs).
    
    Args:
        file_path: Path to PDF.
        metadata: Metadata dict to update.
        
    Returns:
        Tuple of (extracted_text, updated_metadata).
    """
    import pdfplumber
    
    text_parts = []
    
    with pdfplumber.open(file_path) as pdf:
        metadata["page_count"] = len(pdf.pages)
        
        for page_num, page in enumerate(pdf.pages):
            page_text = page.extract_text()
            if page_text and page_text.strip():
                text_parts.append(f"--- Page {page_num + 1} ---\n{page_text}")
    
    text = "\n\n".join(text_parts)
    metadata["extraction_method"] = "pdfplumber"
    
    return text, metadata


def _extract_tesseract(
    file_path: str, 
    metadata: Dict, 
    pytesseract, 
    Image
) -> Tuple[str, Dict]:
    """Extract text using Tesseract OCR (for scanned PDFs).
    
    Args:
        file_path: Path to PDF.
        metadata: Metadata dict to update.
        pytesseract: Imported pytesseract module.
        Image: Imported PIL.Image module.
        
    Returns:
        Tuple of (extracted_text, updated_metadata).
    """
    import fitz  # Need to convert PDF to images first
    
    doc = fitz.open(file_path)
    text_parts = []
    
    for page_num, page in enumerate(doc):
        # Render page to image with higher zoom for better OCR
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
        image = Image.open(io.BytesIO(pix.tobytes("ppm")))
        
        # Run Tesseract
        page_text = pytesseract.image_to_string(image)
        if page_text.strip():
            text_parts.append(f"--- Page {page_num + 1} ---\n{page_text}")
    
    doc.close()
    text = "\n\n".join(text_parts)
    
    metadata["extraction_method"] = "tesseract_ocr"
    metadata["page_count"] = len(doc)
    metadata["ocr_applied"] = True
    
    return text, metadata


def extract_metadata(file_path: str) -> Dict:
    """Extract file-level metadata (size, date, etc).
    
    Args:
        file_path: Path to PDF file.
        
    Returns:
        Dictionary with metadata.
    """
    file_path_obj = Path(file_path)
    
    return {
        "filename": file_path_obj.name,
        "file_size_bytes": file_path_obj.stat().st_size,
        "modified_at": file_path_obj.stat().st_mtime,
    }
