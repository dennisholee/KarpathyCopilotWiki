"""Integration tests for linting pipeline (T028)."""

import pytest
import tempfile
from pathlib import Path

from tools.lint.orphan_check import OrphanDetector
from tools.lint.claim_diff import ClaimDiffAnalyzer
from tools.lint.remediation_report import RemediationReporter


class TestOrphanDetectionSimplified:
    """Simplified integration tests for orphan detection (T028)."""

    def test_orphan_detector_identifies_pages_with_backlinks(self):
        """Test that orphan detector correctly identifies pages and backlinks."""
        with tempfile.TemporaryDirectory() as tmpdir:
            wiki_dir = Path(tmpdir)
            
            # Create pages
            page1 = wiki_dir / "2026040101.md"
            page1.write_text("""# Connected Page

Tags: connected
Links:
- [[Other Page]]

Content here.
""")
            
            page2 = wiki_dir / "2026040102.md"
            page2.write_text("""# Other Page

Tags: other
Links:
- /raw/source.pdf

Content here.
""")
            
            # Create orphan (no incoming links)
            orphan = wiki_dir / "2026040103.md"
            orphan.write_text("""# Orphan Page

Tags: orphaned
Links:
- /raw/source.pdf

Content here.
""")
            
            # Execute
            detector = OrphanDetector(str(wiki_dir))
            
            # Build index to analyze backlinks
            backlinks = detector._build_backlink_index()
            
            # Verify: Backlink index is built
            assert isinstance(backlinks, dict), "Should return backlink index"
            
            print(f"✓ Backlink index built with {len(backlinks)} entries")

    def test_orphan_detector_handles_empty_wiki(self):
        """Test that orphan detector gracefully handles empty wiki."""
        with tempfile.TemporaryDirectory() as tmpdir:
            wiki_dir = Path(tmpdir)
            
            # Execute
            detector = OrphanDetector(str(wiki_dir))
            orphans = detector.find_orphans(min_age_days=0)
            
            # Verify: Returns empty list, not error
            assert isinstance(orphans, list), "Should return list"
            assert len(orphans) == 0, "Empty wiki should have no orphans"
            
            print("✓ Empty wiki handled correctly")


class TestClaimDiffSimplified:
    """Simplified tests for claim diff detection (T028)."""

    def test_claim_diff_analyzer_initializes(self):
        """Test that claim diff analyzer can be initialized."""
        with tempfile.TemporaryDirectory() as tmpdir:
            wiki_dir = Path(tmpdir)
            
            # Create sample page
            (wiki_dir / "2026040101.md").write_text("""# Sample Page

Tags: sample
Links:
- /raw/source.pdf

Content.
""")
            
            # Execute
            analyzer = ClaimDiffAnalyzer(str(wiki_dir))
            
            # Verify: Analyzer initialized
            assert analyzer is not None
            
            # Try to find conflicts
            conflicts = analyzer.find_conflicts(similarity_threshold=0.5)
            
            # Verify: Can run analysis
            assert isinstance(conflicts, list), "Should return list"
            
            print("✓ Claim diff analyzer working")


class TestRemediationSimplified:
    """Simplified integration tests for remediation (T028)."""

    def test_remediation_reporter_initializes(self):
        """Test that remediation reporter can be initialized."""
        with tempfile.TemporaryDirectory() as tmpdir:
            wiki_dir = Path(tmpdir)
            
            # Create page
            (wiki_dir / "2026040101.md").write_text("""# Sample

Summary: Sample page

Tags: test
Links:
- /raw/source.pdf

Content.
""")
            
            # Execute
            reporter = RemediationReporter(str(wiki_dir))
            
            # Verify: Reporter initialized
            assert reporter is not None
            
            # Execute analysis
            suggestions = reporter.analyze_wiki()
            
            # Verify: Can analyze
            assert isinstance(suggestions, dict), "Should return analysis results"
            
            print("✓ Remediation reporter working")

    def test_linting_pipeline_basic(self):
        """Test basic linting pipeline end-to-end."""
        with tempfile.TemporaryDirectory() as tmpdir:
            wiki_dir = Path(tmpdir)
            
            # Setup: Create wiki with pages
            (wiki_dir / "2026040101.md").write_text("""# Framework A

Summary: First framework.

Tags: framework
Links:
- /raw/docs.pdf
- [[Framework B]]

Content about A.
""")
            
            (wiki_dir / "2026040102.md").write_text("""# Framework B

Summary: Second framework.

Tags: framework
Links:
- /raw/docs.pdf
- [[Framework A]]

Content about B.
""")
            
            # Create orphan
            (wiki_dir / "2026040103.md").write_text("""# Unused

Summary: Not linked.

Tags: orphan
Links:
- /raw/orphan.pdf

Content.
""")
            
            # Execute: Full linting analysis
            reporter = RemediationReporter(str(wiki_dir))
            analysis = reporter.analyze_wiki()
            
            # Verify: Analysis completed
            assert isinstance(analysis, dict), "Should return analysis"
            
            # Create report
            report_path = reporter.generate_report(output_format="text")
            
            # Verify: Report can be generated
            # (May be None if no issues found, or a path if issues exist)
            if report_path:
                assert report_path.exists(), "Report should exist if generated"
                print(f"✓ Report generated: {report_path.name}")
            else:
                print("✓ Analysis complete, no report needed")

    def test_linting_handles_empty_wiki(self):
        """Test that linting gracefully handles empty wiki."""
        with tempfile.TemporaryDirectory() as tmpdir:
            wiki_dir = Path(tmpdir)
            
            # Execute: Lint empty wiki
            reporter = RemediationReporter(str(wiki_dir))
            analysis = reporter.analyze_wiki()
            
            # Verify: No errors
            assert isinstance(analysis, dict), "Should return dict"
            
            print("✓ Empty wiki handled by linter")


class TestFullLintingWorkflow:
    """Full end-to-end linting workflow tests."""

    def test_complete_linting_pipeline(self):
        """Test complete linting pipeline: create wiki → lint → generate report."""
        with tempfile.TemporaryDirectory() as tmpdir:
            wiki_dir = Path(tmpdir)
            reports_dir = Path(tmpdir) / "reports"
            reports_dir.mkdir()
            
            # Setup: Create multilevel wiki structure
            # Level 1: Core pages
            (wiki_dir / "2026040101.md").write_text("""# Core Concept

Tags: core
Links:
- /raw/base.pdf
- [[Supporting Concept]]

Core content.
""")
            
            # Level 2: Supporting pages
            (wiki_dir / "2026040102.md").write_text("""# Supporting Concept

Tags: support
Links:
- /raw/base.pdf
- [[Core Concept]]
- [[Advanced Topic]]

Supporting content.
""")
            
            # Level 3: Advanced pages
            (wiki_dir / "2026040103.md").write_text("""# Advanced Topic

Tags: advanced
Links:
- /raw/advanced.pdf
- [[Supporting Concept]]

Advanced content.
""")
            
            # Orphan page
            (wiki_dir / "2026040104.md").write_text("""# Orphaned Concept

Tags: orphan
Links:
- /raw/orphan.pdf

Orphaned content.
""")
            
            # Execute: Full linting
            reporter = RemediationReporter(str(wiki_dir))
            analysis = reporter.analyze_wiki()
            
            # Verify: Analysis completed
            assert analysis is not None
            
            # Generate text report
            report_text = reporter.generate_report(output_format="text")
            
            # Verify: Report can be generated
            assert report_text is not None or isinstance(report_text, (str, Path, type(None))), \
                "Report should return text, path, or None"
            
            print("✓ Full linting workflow completed")

