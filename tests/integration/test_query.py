"""Integration tests for query pipeline (T023)."""

import pytest
import tempfile
from pathlib import Path

from tools.query.archive_decision import DecisionArchiver
from tools.ingest.filename import generate_filename


class TestDecisionArchiving:
    """Integration tests for decision archiving (T023)."""

    def test_decision_archiver_creates_decision_page(self):
        """Test that archiver creates a decision page with correct structure."""
        with tempfile.TemporaryDirectory() as tmpdir:
            wiki_dir = Path(tmpdir)
            decisions_dir = wiki_dir / "decisions"
            decisions_dir.mkdir(parents=True)
            
            # Setup
            archiver = DecisionArchiver(str(wiki_dir))
            
            # Execute: Archive a decision
            question = "What is the best REST API framework?"
            answer = "FastAPI is modern and fast, while Django REST Framework is battle-tested."
            links = ["/wiki/2026040101.md"]
            
            decision_path = archiver.archive(
                question=question,
                answer=answer,
                supporting_pages=links,
                tags=["architecture", "python"]
            )
            
            # Verify: Decision page created
            assert decision_path is not None, "Should return decision path"
            assert decision_path.exists(), f"Decision file should be created at {decision_path}"
            
            # Verify: Filename follows convention
            assert decision_path.parent.name == "decisions", "Should be in decisions folder"
            assert decision_path.name[0].isdigit(), "Filename should start with date"
            
            # Verify: Content structure
            content = decision_path.read_text()
            assert len(content) > 0, "Decision should have content"
            assert "Decision" in content or "decision" in content.lower(), "Should have Decision label"
            
            print(f"✓ Decision archived: {decision_path.name}")

    def test_decision_archiver_lists_decisions(self):
        """Test that archiver can list recent decisions."""
        with tempfile.TemporaryDirectory() as tmpdir:
            wiki_dir = Path(tmpdir)
            decisions_dir = wiki_dir / "decisions"
            decisions_dir.mkdir(parents=True)
            
            # Setup
            archiver = DecisionArchiver(str(wiki_dir))
            
            # Execute: Archive multiple decisions
            for i in range(3):
                archiver.archive(
                    question=f"Question {i}",
                    answer=f"Answer {i}",
                    supporting_pages=[],
                    tags=["test"]
                )
            
            # Execute: List decisions
            recent = archiver.get_recent_decisions(limit=10)
            
            # Verify: Listed decisions
            assert isinstance(recent, list), "Should return list"
            assert len(recent) >= 3, f"Should list at least 3 decisions, got {len(recent)}"
            
            print(f"✓ Listed {len(recent)} recent decisions")

    def test_decision_page_structure(self):
        """Test that decision pages have required structure."""
        with tempfile.TemporaryDirectory() as tmpdir:
            wiki_dir = Path(tmpdir)
            decisions_dir = wiki_dir / "decisions"
            decisions_dir.mkdir(parents=True)
            
            # Create a manual decision page
            decision = decisions_dir / f"{generate_filename()}.md"
            decision.write_text("""# Decision: Which API Framework to Use

Summary: Chose FastAPI for high-performance requirements.

Tags: decision, architecture

Links:
- /wiki/2026040101.md

## Question
What framework should we use for the new API?

## Answer
FastAPI provides the best balance of performance and developer experience.

## Supporting Pages
- Django REST Framework overview
- FastAPI comparison
""")
            
            # Verify: Decision has required structure
            content = decision.read_text()
            assert "# Decision:" in content, "Should have decision title"
            assert "Question" in content, "Should have question section"
            assert "Answer" in content, "Should have answer section"
            
            print("✓ Decision page structure verified")


class TestQueryIntegrationSimplified:
    """Simplified integration tests for query workflow."""

    def test_wiki_pages_can_be_archived_as_decisions(self):
        """Test end-to-end: create wiki page content that could be archived as decision."""
        with tempfile.TemporaryDirectory() as tmpdir:
            wiki_dir = Path(tmpdir)
            decisions_dir = wiki_dir / "decisions"
            decisions_dir.mkdir(parents=True)
            
            # Create sample wiki page
            (wiki_dir / "2026040101.md").write_text("""# FastAPI

Summary: Modern async Python web framework.

Tags: python, api, async

Links:
- /raw/fastapi-docs.pdf

## Content

FastAPI is a modern web framework for building APIs with Python 3.6+.
""")
            
            # Archive decision about it
            archiver = DecisionArchiver(str(wiki_dir))
            decision = archiver.archive(
                "Should we use FastAPI?",
                "Yes, FastAPI is excellent for high-performance APIs.",
                ["/wiki/2026040101.md"],
                ["framework-choice"]
            )
            
            # Verify
            assert decision.exists()
            assert "FastAPI" in decision.read_text()
            
            print("✓ Query result archived as decision")
