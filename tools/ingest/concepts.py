"""Concept extraction from raw text using spaCy NER and embeddings."""

import logging
from typing import Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)


def extract_concepts(
    text: str, 
    spacy_model: str = "en_core_web_sm",
    max_candidates: int = 50,
) -> List[Dict]:
    """
    Extract candidate concepts from text using:
    1. Heuristics (section headings, emphasized text)
    2. spaCy Named Entity Recognition (NER)
    3. Keyphrase extraction (noun chunks)
    
    Args:
        text: Extracted document text.
        spacy_model: spaCy model to use (must be installed).
        max_candidates: Maximum candidates to return.
    
    Returns:
        List of concept dictionaries with:
        - title: Candidate title
        - confidence: Score 0.0-1.0
        - source: How it was extracted (ner_person, ner_org, ner_product, etc.)
        - context: Brief surrounding text
    """
    candidates = []
    seen_titles: Set[str] = set()
    
    # Stage 1: Extract from headings (heuristics)
    candidates.extend(_extract_from_headings(text))
    for cand in candidates:
        seen_titles.add(cand["title"].lower())
    
    # Stage 2: spaCy NER
    try:
        import spacy
        try:
            nlp = spacy.load(spacy_model)
        except OSError:
            logger.warning(f"spaCy model {spacy_model} not found. Run: python -m spacy download {spacy_model}")
            return candidates
        
        ner_candidates = _extract_with_spacy_ner(text, nlp)
        for cand in ner_candidates:
            if cand["title"].lower() not in seen_titles:
                candidates.append(cand)
                seen_titles.add(cand["title"].lower())
    except ImportError:
        logger.warning("spaCy not installed, skipping NER extraction")
    
    # Stage 3: Keyphrase extraction (noun chunks)
    try:
        import spacy
        try:
            nlp = spacy.load(spacy_model)
            keyphrase_candidates = _extract_noun_chunks(text, nlp)
            for cand in keyphrase_candidates:
                if cand["title"].lower() not in seen_titles:
                    candidates.append(cand)
                    seen_titles.add(cand["title"].lower())
        except OSError:
            pass
    except ImportError:
        pass
    
    # Sort by confidence and limit
    candidates.sort(key=lambda x: x.get("confidence", 0.0), reverse=True)
    return candidates[:max_candidates]


def _extract_from_headings(text: str) -> List[Dict]:
    """Extract candidates from Markdown headings.
    
    Args:
        text: Document text.
    
    Returns:
        List of concept candidates from headings.
    """
    candidates = []
    lines = text.split("\n")
    
    for line in lines:
        # Match Markdown headings (##, ###, etc.)
        if line.startswith("##") and not line.startswith("###"):
            heading = line.lstrip("#").strip()
            if len(heading) > 2:  # Skip very short headings
                candidates.append({
                    "title": heading,
                    "confidence": 0.95,  # High confidence for explicit headings
                    "source": "heading",
                    "context": heading,
                })
        elif line.startswith("###") and not line.startswith("####"):
            heading = line.lstrip("#").strip()
            if len(heading) > 2:
                candidates.append({
                    "title": heading,
                    "confidence": 0.85,
                    "source": "subheading",
                    "context": heading,
                })
    
    return candidates


def _extract_with_spacy_ner(text: str, nlp) -> List[Dict]:
    """Extract candidates using spaCy Named Entity Recognition.
    
    Args:
        text: Document text.
        nlp: spaCy Language model.
    
    Returns:
        List of concept candidates from NER.
    """
    candidates = []
    doc = nlp(text)
    seen_entities: Set[str] = set()
    
    # Map entity labels to confidence scores
    entity_confidence = {
        "PERSON": 0.9,
        "ORG": 0.85,
        "GPE": 0.8,  # Geopolitical entity
        "PRODUCT": 0.8,
        "EVENT": 0.75,
        "LAW": 0.75,
    }
    
    for ent in doc.ents:
        if ent.text.lower() in seen_entities:
            continue
        
        confidence = entity_confidence.get(ent.label_, 0.7)
        
        # Extract surrounding context (1 sentence before and after)
        sent_start = max(0, ent.sent.start)
        sent_end = min(len(doc), ent.sent.end)
        context = doc[sent_start:sent_end].text
        
        candidates.append({
            "title": ent.text,
            "confidence": confidence,
            "source": f"ner_{ent.label_.lower()}",
            "context": context,
        })
        seen_entities.add(ent.text.lower())
    
    return candidates


def _extract_noun_chunks(text: str, nlp) -> List[Dict]:
    """Extract candidates using noun chunks (for general keyphrases).
    
    Args:
        text: Document text.
        nlp: spaCy Language model.
    
    Returns:
        List of concept candidates from noun chunks.
    """
    candidates = []
    doc = nlp(text)
    seen_chunks: Set[str] = set()
    
    for chunk in doc.noun_chunks:
        chunk_text = chunk.text.strip()
        
        # Filter short or common phrases
        if len(chunk_text) < 3 or len(chunk_text.split()) > 5:
            continue
        
        if chunk_text.lower() in seen_chunks:
            continue
        
        # Estimate confidence based on chunk properties
        # Chunks with proper nouns (POS tag PROPN) get higher confidence
        has_propn = any(token.pos_ == "PROPN" for token in chunk)
        confidence = 0.65 if has_propn else 0.55
        
        # Skip very common/generic phrases
        stopwords = {"the", "a", "and", "or", "is", "be", "but", "in", "of"}
        if chunk_text.lower() in stopwords:
            continue
        
        # Extract surrounding context
        sent = chunk.sent
        context = sent.text[:100]  # First 100 chars of context
        
        candidates.append({
            "title": chunk_text,
            "confidence": confidence,
            "source": "noun_chunk",
            "context": context,
        })
        seen_chunks.add(chunk_text.lower())
    
    return candidates


def rank_concepts_by_similarity(
    concepts: List[Dict],
    prefer_heading_source: bool = True,
) -> List[Dict]:
    """Rank and deduplicate concepts by semantic similarity.
    
    This function uses optional sentence-transformers if available
    to group semantically similar concepts.
    
    Args:
        concepts: List of concept candidates.
        prefer_heading_source: If True, prefer headings over NER.
    
    Returns:
        Ranked and deduplicated concept list.
    """
    if not concepts:
        return []
    
    # Try to use embeddings for similarity-based deduplication
    try:
        from sentence_transformers import SentenceTransformer, util
        
        model = SentenceTransformer("all-MiniLM-L6-v2")  # Lightweight model
        
        concept_titles = [c["title"] for c in concepts]
        embeddings = model.encode(concept_titles, convert_to_tensor=True)
        
        # Find duplicate/similar concepts (threshold 0.85 means 85% similar)
        similarity_threshold = 0.85
        
        # Keep track of which concepts to keep
        keep_indices = set(range(len(concepts)))
        
        for i in range(len(embeddings)):
            if i not in keep_indices:
                continue
            
            for j in range(i + 1, len(embeddings)):
                if j not in keep_indices:
                    continue
                
                similarity = util.pytorch_cos_sim(embeddings[i], embeddings[j])[0][0].item()
                
                if similarity >= similarity_threshold:
                    # Keep higher-confidence or heading-sourced concept
                    ci = concepts[i]
                    cj = concepts[j]
                    
                    # Prefer heading source
                    if prefer_heading_source:
                        if ci["source"] == "heading" and cj["source"] != "heading":
                            keep_indices.discard(j)
                            continue
                        elif cj["source"] == "heading" and ci["source"] != "heading":
                            keep_indices.discard(i)
                            continue
                    
                    # Otherwise prefer higher confidence
                    if ci.get("confidence", 0.0) >= cj.get("confidence", 0.0):
                        keep_indices.discard(j)
                    else:
                        keep_indices.discard(i)
        
        result = [concepts[i] for i in sorted(keep_indices)]
        result.sort(key=lambda x: x.get("confidence", 0.0), reverse=True)
        return result
        
    except ImportError:
        logger.info("sentence-transformers not available, skipping semantic deduplication")
        return sorted(concepts, key=lambda x: x.get("confidence", 0.0), reverse=True)
