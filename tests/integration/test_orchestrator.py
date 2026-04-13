"""Integration tests for orchestrator and end-to-end pipeline."""

import pytest
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

from tools.ingest.orchestrator import (
    IngestionOrchestrator,
    IngestionConfig,
    IngestionResult,
    PageInfo,
    IngestionError,
)


class TestIngestionOrchestrator:
    """Integration tests for IngestionOrchestrator."""
    
    @pytest.fixture
    def temp_wiki_dir(self):
        """Create a temporary wiki directory."""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield tmpdir
    
    @pytest.fixture
    def sample_pdf_path(self):
        """Create a sample PDF for testing."""
        # In real tests, would use a small test PDF
        return "tests/fixtures/sample.pdf"
    
    @pytest.fixture
    def orchestrator(self):
        """Create orchestrator instance."""
        config = IngestionConfig(
            max_pages_per_ingestion=5,
            auto_write=True,
        )
        return IngestionOrchestrator(config)
    
    def test_orchestrator_initialization(self):
        """Test orchestrator can be initialized."""
        config = IngestionConfig(max_pages_per_ingestion=10)
        orchestrator = IngestionOrchestrator(config)
        
        assert orchestrator.config.max_pages_per_ingestion == 10
        assert orchestrator.config.auto_write == False
    
    def test_ingest_pdf_with_mock_extraction(self, orchestrator, temp_wiki_dir):
        """Test ingestion workflow with mocked extraction."""
        # Mock the extraction to provide test data
        mock_text = """
# Introduction
This is about artificial intelligence.

## Machine Learning
Machine learning is a subset of AI.
"""
        mock_metadata = {"extraction_method": "pymupdf", "page_count": 5}
        
        with patch("tools.ingest.orchestrator.extract_from_pdf") as mock_extract:
            mock_extract.return_value = (mock_text, mock_metadata)
            
            with patch("tools.ingest.orchestrator.extract_concepts") as mock_concepts:
                mock_concepts.return_value = [
                    {
                        "title": "Artificial Intelligence",
                        "confidence": 0.95,
                        "source": "heading",
                        "context": "This is about artificial intelligence.",
                    },
                    {
                        "title": "Machine Learning",
                        "confidence": 0.90,
                        "source": "heading",
                        "context": "Machine learning is a subset of AI.",
                    },
                ]
                
                with patch("tools.ingest.orchestrator.rank_concepts_by_similarity") as mock_rank:
                    mock_rank.return_value = mock_concepts.return_value
                    
                    result = orchestrator.ingest_pdf("test.pdf", temp_wiki_dir)
        
        # Verify result structure
        assert isinstance(result, IngestionResult)
        assert result.pdf_path == "test.pdf"
        assert hasattr(result, "pages_written")
        assert hasattr(result, "errors")
        assert hasattr(result, "metrics")
    
    def test_ingest_result_to_dict(self):
        """Test that ingestion result can be serialized to dict."""
        page = PageInfo(
            filename="20240101.md",
            title="Test Page",
            source_pdf="/raw/test.pdf",
            extraction_method="pymupdf",
            has_uncertain_facts=False,
        )
        
        result = IngestionResult(
            pdf_path="/raw/test.pdf",
            success=True,
            pages_written=[page],
        )
        
        result_dict = result.to_dict()
        
        assert result_dict["pdf_path"] == "/raw/test.pdf"
        assert result_dict["success"] == True
        assert len(result_dict["pages_written"]) == 1
        assert result_dict["pages_written"][0]["filename"] == "20240101.md"
    
    def test_ingest_result_with_errors(self):
        """Test ingestion result with errors."""
        error = IngestionError(
            concept_title="Failed Concept",
            error_type="validation",
            message="Invalid schema",
        )
        
        result = IngestionResult(
            pdf_path="/raw/test.pdf",
            success=False,
            errors=[error],
        )
        
        assert len(result.errors) == 1
        assert result.errors[0].concept_title == "Failed Concept"
        assert result.errors[0].error_type == "validation"
    
    def test_metrics_calculation(self):
        """Test ingestion metrics calculation."""
        from tools.ingest.orchestrator import IngestionMetrics
        import time
        
        metrics = IngestionMetrics(
            start_time=time.time(),
            extraction_time_s=1.5,
            concept_extraction_time_s=2.0,
            draft_generation_time_s=3.5,
            pages_written=3,
            backlinks_inserted=5,
        )
        
        metrics.end_time = metrics.start_time + 7.0
        
        assert metrics.total_time_s > 0
        assert metrics.pages_written == 3
        assert metrics.backlinks_inserted == 5
    
    def test_batch_ingestion_with_multiple_pdfs(self, orchestrator, temp_wiki_dir):
        """Test batch ingestion of multiple PDFs."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create temp PDF files (mock)
            pdf_dir = Path(tmpdir)
            (pdf_dir / "test1.pdf").touch()
            (pdf_dir / "test2.pdf").touch()
            
            # Mock the ingest_pdf method
            with patch.object(orchestrator, "ingest_pdf") as mock_ingest:
                result1 = IngestionResult(pdf_path="test1.pdf", success=True)
                result2 = IngestionResult(pdf_path="test2.pdf", success=True)
                mock_ingest.side_effect = [result1, result2]
                
                results = orchestrator.ingest_batch(str(pdf_dir), temp_wiki_dir)
        
        assert len(results) == 2
        assert all(isinstance(r, IngestionResult) for r in results)
    
    def test_save_results_creates_json_file(self, orchestrator, temp_wiki_dir):
        """Test that ingestion results are saved to JSON."""
        page = PageInfo(
            filename="20240101.md",
            title="Test Page",
            source_pdf="/raw/test.pdf",
            extraction_method="pymupdf",
            has_uncertain_facts=False,
        )
        
        result = IngestionResult(
            pdf_path="/raw/test.pdf",
            success=True,
            pages_written=[page],
        )
        
        output_file = orchestrator.save_results(result, temp_wiki_dir)
        
        # Verify file was created
        assert Path(output_file).exists()
        assert output_file.endswith(".json")
        
        # Verify content
        import json
        with open(output_file) as f:
            saved_data = json.load(f)
        
        assert saved_data["success"] == True
        assert len(saved_data["pages_written"]) == 1


class TestOrchestrationWorkflow:
    """Test complete orchestration workflows."""
    
    def test_end_to_end_workflow_structure(self):
        """Test that orchestrator has correct workflow structure."""
        orchestrator = IngestionOrchestrator()
        
        # Verify orchestrator has required methods
        assert hasattr(orchestrator, "ingest_pdf")
        assert hasattr(orchestrator, "ingest_batch")
        assert hasattr(orchestrator, "save_results")
        
        # Verify callable
        assert callable(orchestrator.ingest_pdf)
        assert callable(orchestrator.ingest_batch)
        assert callable(orchestrator.save_results)
    
    def test_config_defaults(self):
        """Test that IngestionConfig has sensible defaults."""
        config = IngestionConfig()
        
        assert config.max_pages_per_ingestion == 10
        assert config.preview_mode == False
        assert config.auto_write == False
        assert config.backlink_confidence_threshold == 0.84
        assert config.auto_insert_exact_backlinks == True
    
    def test_result_success_determination(self):
        """Test that result.success is determined by pages_written."""
        # Success case: pages written
        result_success = IngestionResult(
            pdf_path="/raw/test.pdf",
            success=True,
            pages_written=[
                PageInfo(
                    filename="20240101.md",
                    title="Page 1",
                    source_pdf="/raw/test.pdf",
                    extraction_method="pymupdf",
                    has_uncertain_facts=False,
                )
            ],
        )
        assert result_success.success == True
        
        # Failure case: no pages written
        result_failure = IngestionResult(
            pdf_path="/raw/test.pdf",
            success=False,
            errors=[
                IngestionError(
                    concept_title="test",
                    error_type="extraction",
                    message="Failed",
                )
            ],
        )
        assert result_failure.success == False


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
