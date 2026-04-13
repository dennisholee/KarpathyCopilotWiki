# Research: Runtime, Libraries, and Copilot Integration Policy

Date: 2026-04-13

## Summary

This research note recommends a conservative, local-first stack for extracting text from `/raw` artifacts, deriving candidate concepts, and producing Foam-compatible, atomic Markdown drafts in `/wiki`. The default recommendation is to build the pipeline in Python (3.11) using local extraction + NLP tooling, and to treat Copilot as an editor-assist rather than an unattended, programmatic drafting service unless explicit approval is granted.

## Goals for Phase 0

- Validate extraction libraries for common PDF types (born-digital, layout-rich, scanned/OCR).
- Identify reliable keyphrase / concept extraction methods that support title/alias detection.
- Define a safe Copilot integration policy consistent with the constitution (Local Only by default).
- Produce a short test harness to measure extraction latency and fidelity on representative inputs.

## Recommended Runtime

- Recommendation: Python 3.11 (mature ecosystem, rich PDF and NLP libraries).  
- Rationale: cross-platform, easy packaging, wide availability of extraction and NLP tools, straightforward testing with `pytest`.

If you prefer a different runtime (Node.js, Rust), I can adapt recommendations — tell me which and I will re-run Phase 0.

## Extraction Libraries (evaluation & recommendation)

Candidate approaches and tradeoffs:

- PyMuPDF (fitz): robust, fast extraction of text and layout; good for born-digital PDFs. Recommended as primary extractor for text-first docs.
- pdfplumber / pdfminer.six: fine-grained control over layout and text boxes; useful when PyMuPDF yields noisy segmentation. Use when layout preservation matters.
- Tesseract via `pytesseract`: required for scanned/OCR inputs. Add an OCR step when a PDF has no extractable text.
- `pypdf` (PyPDF2) or `pikepdf`: useful for metadata and basic page handling (merging/splitting) but not a replacement for text extraction.

Plan: implement a lightweight extractor wrapper that attempts (in order): 1) direct text extraction (PyMuPDF), 2) fallback to pdfplumber, 3) fallback to OCR with Tesseract when no text found.

## Concept Extraction & Linking

Approaches:

- Heuristic rules: headings, section titles, and phrase frequency (fast, deterministic). Good for initial pass.
- Statistical keyphrase extractors: YAKE, RAKE (fast, no external models). Good for quick candidate lists.
- Embedding-based similarity: `sentence-transformers` (local models like `all-MiniLM-*`) to deduplicate candidates and find near-matches for backlinking. Useful for fuzzy match of existing `WikiPage` titles/aliases.
- NER / syntactic cues: `spaCy` for named entities and chunking to surface concept candidates.

Recommendation: combine heuristics + spaCy NER for candidate generation, then use lightweight embeddings (sentence-transformers) for alias matching and backlink suggestions.

## Draft Generation Options (Copilot policy)

Modes:

- Editor-Assist (Default, Recommended): pipeline writes a draft stub (metadata + extracted snippets + suggested summary) and opens it in the user's VS Code editor. The user may then invoke Copilot interactively to polish content. This preserves traceability and human review and does not automatically send source material to remote services.

- Local-LLM Automation (Opt-in): if you can host a local LLM (e.g., Llama-family via `llama.cpp`, `ggml`, or a local HF model), programmatic summarization/drafting can run without sending data off-host. This requires hardware and licensing checks. Use only if you accept the operational cost and verify model licenses.

- Remote LLM / Copilot Automation (Require explicit approval): automating drafts using GitHub Copilot or other cloud LLMs may transmit wiki or raw content to third-party services. Per the constitution, this is disallowed by default. If you want automated remote drafting, you must explicitly approve the exception, document the privacy/risk tradeoffs, and add this exception to the constitution governance logs.

Copilot Integration Policy (short):

1. Default: Editor-Assist Mode. Drafts are generated locally; human reviews and triggers Copilot ad-hoc inside VS Code. No pipeline data is sent automatically to Copilot.
2. Local LLMs: Allowed with documented hardware/ops plan and license review.
3. Remote Copilot/LLM automation: Disallowed unless explicitly approved. Approval requires: explicit user consent, documented data classification (no sensitive/PII), and a PR updating the constitution’s exceptions with reviewer approval.

## Backlinking & Indexing

Design notes:

- Maintain a small SQLite index mapping normalized titles and aliases → file paths for quick resolution.
- Use exact title matches first; if none, use embedding similarity (cosine) with a conservative threshold to propose backlinks rather than auto-insert them (let user confirm proposed backlinks during preview).
- Keep backlink insertion idempotent: update both source and target pages without duplicating links.

## Performance & Test Harness

Test methodology:

- Select representative PDFs: (A) born-digital research paper (10–20 pages); (B) scanned paper (10–20 pages); (C) long report (100+ pages).
- Measure: extraction time, concept candidate count, draft generation time. Goal: typical 10–20 page research PDF processed end-to-end (extraction + candidate generation + draft stub) under 120 seconds on a modern dev machine (8 cores, 16GB RAM). Adjust goals after empirical runs.

Add integration tests that run the pipeline on the three representative inputs and assert: correct number of candidate stubs, `Links` field present in each stub, and no unattended remote calls are made.

## Privacy, Licensing, and Risk Notes

- Do NOT send sensitive or private raw documents to remote services (Copilot, cloud LLMs) unless the data is scrubbed and explicit approval is recorded.
- Verify third-party library licenses for compatibility with your project's distribution and company policy before wide adoption.
- Keep an audit log (local) of all automated drafting operations and decisions to maintain traceability.

## Recommended Minimal Stack (starter)

Python 3.11 + the following (local-first):

```bash
python -m pip install pymupdf pdfplumber pytesseract spacy sentence-transformers jinja2 pytest
# optional (OCR runtime): install tesseract-ocr via system package manager
```

Suggested models/tools to download during Phase 0 tests:

- `spaCy` English model (small) for NER and sentence segmentation
- `sentence-transformers/all-MiniLM-L6-v2` for compact embeddings (local)

## Decision / Recommendation (Phase 0 outcome)

- Default implementation: Python 3.11, PyMuPDF primary extractor, fallback to pdfplumber and Tesseract OCR; spaCy + YAKE/spaCy heuristics for candidate extraction; sentence-transformers for alias/backlink matching; Jinja2 for Markdown page templating.
- Copilot: Use Editor-Assist Mode by default. Do not enable automated remote Copilot drafting without explicit approval and documented exception.

## Next Steps (deliverables for Phase 0)

1. Prototype extractor wrapper that runs the three-stage extract (PyMuPDF → pdfplumber → Tesseract) and produce a raw-text output for a sample PDF. (Task: `T006`)
2. Prototype concept extractor combining spaCy NER + YAKE and produce candidate titles for the same PDF. (Task: `T007`)
3. Measure end-to-end processing time on sample PDFs and record results in `specs/001-vscode-native-wiki/research.md` and `specs/001-vscode-native-wiki/research-results.md`.
4. If you confirm Python 3.11 and the above stack, I will generate `data-model.md` and a `quickstart.md` next.

---

If you approve this recommended stack and the Copilot Editor-Assist policy, I will (a) finalize `research.md` (this file), (b) add a test harness and sample input, and (c) produce `data-model.md` next. Otherwise tell me any constraints or an alternate runtime and I will adapt.
