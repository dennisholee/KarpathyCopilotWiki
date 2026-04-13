"""Unit tests for ingest module."""

import pytest
from pathlib import Path
from tools.ingest.filename import generate_filename, ensure_unique_filename
from tools.ingest.validator import validate_wiki_page, extract_page_metadata_from_markdown
from tools.ingest.backlink import extract_existing_links, _normalize_title


class TestFilenameGenerator:
    """Tests for filename generation (T009)."""
    
    def test_generate_filename_format(self, tmp_path):
        """Test that generated filename follows YYYYMMDDNN pattern."""
        wiki_dir = tmp_path / "wiki"
        wiki_dir.mkdir()
        
        filename = generate_filename(str(wiki_dir))
        
        # Should be 10 characters: YYYYMMDDNN
        assert len(filename) == 13  # Including .md
        assert filename.endswith(".md")
        
        # Should match pattern
        base = filename[:-3]
        assert len(base) == 10
        assert base[:8].isdigit()  # YYYYMMDD
        assert base[8:10].isdigit()  # NN
    
    def test_generate_filename_sequence(self, tmp_path):
        """Test that sequence increments correctly."""
        wiki_dir = tmp_path / "wiki"
        wiki_dir.mkdir()
        
        # Create a file with today's date
        today_prefix = "20240101"
        existing = Path(wiki_dir) / f"{today_prefix}01.md"
        existing.touch()
        
        # Generate new filename - should be 02
        import datetime
        from unittest.mock import patch
        
        mock_date = datetime.date(2024, 1, 1)
        with patch('tools.ingest.filename.datetime') as mock_datetime:
            mock_datetime.date.today.return_value = mock_date
            filename = generate_filename(str(wiki_dir), date=mock_date)
        
        # Should be next sequence
        assert "0102.md" in filename  # Second file for today
    
    def test_ensure_unique_filename_no_collision(self, tmp_path):
        """Test ensure_unique_filename when no collision exists."""
        wiki_dir = tmp_path / "wiki"
        wiki_dir.mkdir()
        
        base_filename = "20240101.md"
        result = ensure_unique_filename(str(wiki_dir), base_filename)
        
        # Should return as-is if no collision
        assert result == base_filename
    
    def test_ensure_unique_filename_with_collision(self, tmp_path):
        """Test ensure_unique_filename when file exists."""
        wiki_dir = tmp_path / "wiki"
        wiki_dir.mkdir()
        
        base_filename = "20240101.md"
        
        # Create existing file
        existing = wiki_dir / base_filename
        existing.touch()
        
        result = ensure_unique_filename(str(wiki_dir), base_filename)
        
        # Should add version suffix
        assert result.startswith("20240101_v")
        assert result.endswith(".md")


class TestSchemaValidator:
    """Tests for schema validation (T008)."""
    
    def test_valid_page(self):
        """Test validation of a valid page."""
        page = {
            "title": "Test Page",
            "summary": "A test page",
            "tags": ["test", "example"],
            "links": ["/raw/source.pdf"],
            "content": "Some content",
            "filename": "2024010101.md",
        }
        
        is_valid, errors = validate_wiki_page(page)
        assert is_valid
        assert len(errors) == 0
    
    def test_missing_required_field(self):
        """Test validation fails with missing required field."""
        page = {
            "title": "Test Page",
            "summary": "A test page",
            "tags": ["test"],
            # Missing 'links' and 'content'
            "filename": "2024010101.md",
        }
        
        is_valid, errors = validate_wiki_page(page)
        assert not is_valid
        assert any("Missing required field: links" in e for e in errors)
    
    def test_invalid_filename_format(self):
        """Test validation fails with invalid filename."""
        page = {
            "title": "Test Page",
            "summary": "A test page",
            "tags": ["test"],
            "links": ["/raw/source.pdf"],
            "content": "Content",
            "filename": "invalid-name.md",  # Wrong format
        }
        
        is_valid, errors = validate_wiki_page(page)
        assert not is_valid
        assert any("does not match pattern" in e for e in errors)
    
    def test_missing_raw_link_requires_needs_source(self):
        """Test that pages without /raw link must have needs_source=true."""
        page = {
            "title": "Test Page",
            "summary": "A test page",
            "tags": ["test"],
            "links": ["/wiki/other.md"],  # No /raw link
            "content": "Content",
            "filename": "2024010101.md",
        }
        
        is_valid, errors = validate_wiki_page(page)
        assert not is_valid
        assert any("/raw" in e for e in errors)
        
        # Should be valid with needs_source flag
        page["needs_source"] = True
        is_valid, errors = validate_wiki_page(page)
        assert is_valid
    
    def test_extract_metadata_from_markdown(self):
        """Test extracting page metadata from Markdown."""
        markdown = """# My Page Title

Summary: This is a summary.

Tags: concept,important

Links:
- /raw/document.pdf
- /wiki/related.md

Content:

This is the main body content
with multiple lines."""
        
        metadata = extract_page_metadata_from_markdown(markdown)
        
        assert metadata["title"] == "My Page Title"
        assert metadata["summary"] == "This is a summary."
        assert "concept" in metadata["tags"]
        assert "/raw/document.pdf" in metadata["links"]


class TestBacklinks:
    """Tests for backlink reconciliation (T011)."""
    
    def test_extract_wikilinks(self):
        """Test extracting [[WikiLink]] references."""
        content = """
# Test Page

This mentions [[Related Concept]] and [[Another Page]].
"""
        links = extract_existing_links(content)
        
        assert "Related Concept" in links
        assert "Another Page" in links
        assert len(links) == 2
    
    def test_wikilink_with_display_text(self):
        """Test extracting links with display text."""
        content = "See [[Related Concept|a related concept]]."
        links = extract_existing_links(content)
        
        # Should extract the target, not display text
        assert "Related Concept" in links
    
    def test_normalize_title(self):
        """Test title normalization."""
        title = "Django's REST API Framework"
        normalized = _normalize_title(title)
        
        # Should be lowercase and without punctuation
        assert normalized == "django rest api framework"
    
    def test_backlink_idempotency(self):
        """Test that backlinks are not duplicated on repeated reconciliation."""
        from tools.ingest.backlink import reconcile_backlinks
        
        original_content = """# Test Page

Some content here.

## Related

"""
        
        # First reconciliation (simulated with exact match)
        updated, _ = reconcile_backlinks(
            original_content,
            page_title="Test Page",
            page_filename="20240101.md",
            wiki_dir=".",
            auto_insert_exact=False,
            preview_fuzzy=False
        )
        
        # links should not be duplicated even if called again
        updated2, _ = reconcile_backlinks(
            updated,
            page_title="Test Page",
            page_filename="20240101.md",
            wiki_dir=".",
            auto_insert_exact=False,
            preview_fuzzy=False
        )
        
        # Should not grow
        assert updated == updated2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
