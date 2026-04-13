"""Unit tests for IndexManager module (T018)."""

import pytest
import json
from pathlib import Path
from datetime import datetime
from tools.ingest.index_manager import (
    IndexManager, IndexEntry, GlossaryEntry, IndexMetadata,
    GlossaryBuilder, IndexValidator
)


class TestIndexEntry:
    """Tests for IndexEntry data class."""
    
    def test_entry_creation(self):
        """Test basic IndexEntry creation."""
        entry = IndexEntry(
            concept_name="Test Concept",
            concept_id="test-concept-001",
            description="A test concept"
        )
        assert entry.concept_name == "Test Concept"
        assert entry.concept_id == "test-concept-001"
        assert entry.pages == []
    
    def test_entry_to_dict(self):
        """Test IndexEntry serialization."""
        entry = IndexEntry(
            concept_name="Test",
            concept_id="test-001",
            pages=["page1.md", "page2.md"],
            related_concepts=["test-002"]
        )
        d = entry.to_dict()
        assert d['concept_name'] == "Test"
        assert d['pages'] == ["page1.md", "page2.md"]
    
    def test_entry_from_dict(self):
        """Test IndexEntry deserialization."""
        data = {
            'concept_name': 'Test',
            'concept_id': 'test-001',
            'description': 'Test concept',
            'pages': ['page1.md'],
            'related_concepts': [],
            'last_updated': '2024-01-01',
            'extraction_method': 'ai'
        }
        entry = IndexEntry.from_dict(data)
        assert entry.concept_name == 'Test'
        assert entry.description == 'Test concept'


class TestGlossaryBuilder:
    """Tests for GlossaryBuilder."""
    
    def test_build_glossary_from_entries(self):
        """Test glossary generation from entries."""
        entries = {
            'concept-001': IndexEntry(
                concept_name='Alpha',
                concept_id='concept-001',
                description='First concept'
            ),
            'concept-002': IndexEntry(
                concept_name='Beta',
                concept_id='concept-002',
                description='Second concept'
            )
        }
        
        glossary = GlossaryBuilder.build_glossary(entries)
        
        assert len(glossary) == 2
        assert glossary[0].term == 'Alpha'
        assert glossary[1].term == 'Beta'
    
    def test_glossary_sorted_alphabetically(self):
        """Test that glossary is sorted by term."""
        entries = {
            'c1': IndexEntry('Zebra', 'c1', 'Z concept'),
            'c2': IndexEntry('Apple', 'c2', 'A concept'),
            'c3': IndexEntry('Mango', 'c3', 'M concept'),
        }
        
        glossary = GlossaryBuilder.build_glossary(entries)
        
        terms = [e.term for e in glossary]
        assert terms == ['Apple', 'Mango', 'Zebra']
    
    def test_glossary_markdown_format(self):
        """Test markdown glossary formatting."""
        entries = [
            GlossaryEntry(
                term='Test Term',
                definition='A test definition',
                term_id='test-001',
                pages=['page1.md'],
                confidence=0.95
            )
        ]
        
        markdown = GlossaryBuilder.format_glossary_markdown(entries)
        
        assert '# Glossary' in markdown
        assert '## Test Term' in markdown
        assert 'A test definition' in markdown
        assert 'page1.md' in markdown
        assert '95%' in markdown


class TestIndexValidator:
    """Tests for IndexValidator."""
    
    def test_validate_valid_index(self, tmp_path):
        """Test validation of valid index."""
        pages_dir = tmp_path / "pages"
        pages_dir.mkdir()
        
        # Create test pages
        (pages_dir / "page1.md").touch()
        (pages_dir / "page2.md").touch()
        
        entries = {
            'concept-1': IndexEntry(
                concept_name='Concept 1',
                concept_id='concept-1',
                pages=['page1.md', 'page2.md']
            )
        }
        
        is_valid, metadata = IndexValidator.validate(entries, pages_dir)
        
        assert is_valid is True
        assert metadata.total_concepts == 1
        assert metadata.total_pages == 2
        assert len(metadata.dangling_references) == 0
    
    def test_validate_detects_dangling_references(self, tmp_path):
        """Test detection of references to non-existent pages."""
        pages_dir = tmp_path / "pages"
        pages_dir.mkdir()
        
        entries = {
            'concept-1': IndexEntry(
                concept_name='Concept 1',
                concept_id='concept-1',
                pages=['nonexistent.md']
            )
        }
        
        is_valid, metadata = IndexValidator.validate(entries, pages_dir)
        
        assert is_valid is False
        assert 'nonexistent.md' in metadata.dangling_references
    
    def test_validate_detects_orphaned_concepts(self, tmp_path):
        """Test detection of concepts with no pages."""
        pages_dir = tmp_path / "pages"
        pages_dir.mkdir()
        
        entries = {
            'orphan': IndexEntry(
                concept_name='Orphan ',
                concept_id='orphan',
                pages=[]
            )
        }
        
        is_valid, metadata = IndexValidator.validate(entries, pages_dir)
        
        assert is_valid is False
        assert 'orphan' in metadata.orphaned_concepts


class TestIndexManager:
    """Tests for IndexManager."""
    
    def test_init_creates_paths(self, tmp_path):
        """Test IndexManager initialization."""
        wiki_dir = tmp_path / ".wiki"
        manager = IndexManager(wiki_dir)
        
        assert manager.wiki_dir == wiki_dir
        assert manager.pages_dir == wiki_dir / "pages"
    
    def test_load_index_missing_file(self, tmp_path):
        """Test loading when index file doesn't exist."""
        wiki_dir = tmp_path / ".wiki"
        wiki_dir.mkdir()
        
        manager = IndexManager(wiki_dir)
        result = manager.load_index()
        
        assert result is False
        assert len(manager.entries) == 0
    
    def test_load_index_existing_file(self, tmp_path):
        """Test loading existing index file."""
        wiki_dir = tmp_path / ".wiki"
        wiki_dir.mkdir()
        
        # Create index file
        index_data = {
            'concept-1': {
                'concept_name': 'Test',
                'concept_id': 'concept-1',
                'description': 'A test',
                'pages': ['page1.md'],
                'related_concepts': [],
                'last_updated': '',
                'extraction_method': 'ai'
            }
        }
        
        index_file = wiki_dir / "index.json"
        with open(index_file, 'w') as f:
            json.dump(index_data, f)
        
        manager = IndexManager(wiki_dir)
        result = manager.load_index()
        
        assert result is True
        assert len(manager.entries) == 1
        assert 'concept-1' in manager.entries
    
    def test_rebuild_from_pages(self, tmp_path):
        """Test rebuilding index from page directory."""
        wiki_dir = tmp_path / ".wiki"
        pages_dir = wiki_dir / "pages"
        pages_dir.mkdir(parents=True)
        
        # Create test pages with frontmatter
        page1_content = """---
concepts: concept-1, concept-2
description: Test page 1
---
Page content here."""
        
        page2_content = """---
concepts: concept-2
description: Test page 2
---
More content."""
        
        (pages_dir / "20240101001.md").write_text(page1_content)
        (pages_dir / "20240101002.md").write_text(page2_content)
        
        manager = IndexManager(wiki_dir)
        count = manager.rebuild_from_pages()
        
        assert count == 2
        assert 'concept-1' in manager.entries
        assert 'concept-2' in manager.entries
        assert '20240101001.md' in manager.entries['concept-1'].pages
        assert '20240101001.md' in manager.entries['concept-2'].pages
    
    def test_add_or_update_concept(self, tmp_path):
        """Test adding/updating concept entries."""
        wiki_dir = tmp_path / ".wiki"
        manager = IndexManager(wiki_dir)
        
        # Add new concept
        entry = manager.add_or_update_concept(
            concept_id='test-001',
            concept_name='Test Concept',
            description='A test',
            pages=['page1.md']
        )
        
        assert entry.concept_id == 'test-001'
        assert 'page1.md' in entry.pages
        assert 'test-001' in manager.entries
        
        # Update existing concept
        entry = manager.add_or_update_concept(
            concept_id='test-001',
            concept_name='Test Concept',
            pages=['page1.md', 'page2.md']
        )
        
        assert len(entry.pages) == 2
    
    def test_generate_glossary(self, tmp_path):
        """Test glossary generation."""
        wiki_dir = tmp_path / ".wiki"
        manager = IndexManager(wiki_dir)
        
        manager.add_or_update_concept(
            'c1', 'Alpha', description='First'
        )
        manager.add_or_update_concept(
            'c2', 'Beta', description='Second'
        )
        
        glossary = manager.generate_glossary()
        
        assert len(glossary) == 2
        assert glossary[0].term == 'Alpha'
    
    def test_persist_index(self, tmp_path):
        """Test persisting index to disk."""
        wiki_dir = tmp_path / ".wiki"
        wiki_dir.mkdir()
        
        manager = IndexManager(wiki_dir)
        manager.add_or_update_concept(
            'test-001', 'Test', description='A test', pages=['page1.md']
        )
        
        index_saved, glossary_saved = manager.persist()
        
        assert index_saved is True
        assert glossary_saved is True
        assert (wiki_dir / "index.json").exists()
        assert (wiki_dir / "glossary.json").exists()
        assert (wiki_dir / "GLOSSARY.md").exists()
    
    def test_persist_and_reload_integrity(self, tmp_path):
        """Test that persisted data can be reloaded correctly."""
        wiki_dir = tmp_path / ".wiki"
        wiki_dir.mkdir()
        
        # Create and persist
        manager1 = IndexManager(wiki_dir)
        manager1.add_or_update_concept(
            'c1', 'Concept 1', description='First concept', pages=['p1.md']
        )
        manager1.add_or_update_concept(
            'c2', 'Concept 2', description='Second concept', pages=['p2.md']
        )
        manager1.persist()
        
        # Reload and verify
        manager2 = IndexManager(wiki_dir)
        manager2.load_index()
        
        assert len(manager2.entries) == 2
        assert manager2.entries['c1'].concept_name == 'Concept 1'
        assert manager2.entries['c2'].description == 'Second concept'
    
    def test_get_concept_pages(self, tmp_path):
        """Test retrieving pages for a concept."""
        wiki_dir = tmp_path / ".wiki"
        manager = IndexManager(wiki_dir)
        
        manager.add_or_update_concept(
            'c1', 'Test', pages=['p1.md', 'p2.md']
        )
        
        pages = manager.get_concept_pages('c1')
        assert pages == ['p1.md', 'p2.md']
        
        pages = manager.get_concept_pages('nonexistent')
        assert pages == []
    
    def test_get_page_concepts(self, tmp_path):
        """Test retrieving concepts on a page."""
        wiki_dir = tmp_path / ".wiki"
        manager = IndexManager(wiki_dir)
        
        manager.add_or_update_concept('c1', 'Concept 1', pages=['p1.md'])
        manager.add_or_update_concept('c2', 'Concept 2', pages=['p1.md', 'p2.md'])
        
        concepts = manager.get_page_concepts('p1.md')
        assert set(concepts) == {'c1', 'c2'}
        
        concepts = manager.get_page_concepts('p2.md')
        assert concepts == ['c2']
    
    def test_stats(self, tmp_path):
        """Test statistics computation."""
        wiki_dir = tmp_path / ".wiki"
        manager = IndexManager(wiki_dir)
        
        manager.add_or_update_concept('c1', 'C1', description='Des1', pages=['p1.md'])
        manager.add_or_update_concept('c2', 'C2', pages=['p1.md', 'p2.md'])
        
        stats = manager.stats()
        
        assert stats['total_concepts'] == 2
        assert stats['total_pages'] == 2
        assert stats['concepts_with_description'] == 1
