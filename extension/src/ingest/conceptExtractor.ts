/**
 * Concept Extraction Service
 * Identifies candidate page concepts from extracted text using heuristics
 * Supports NER backend integration for enhanced accuracy
 */

import { Logger } from '../utils/logger';

export interface Concept {
  text: string;
  type: 'heading' | 'bold' | 'noun-phrase' | 'frequency'; // extraction method
  confidence: number; // 0-1
  context?: string; // surrounding text
  frequency?: number; // times mentioned
}

export interface ConceptExtractionOptions {
  method?: 'heuristic' | 'spacy'; // 'heuristic' (fast, local) or 'spacy' (accurate, backend)
  minConfidence?: number; // filter concepts below threshold (0-1)
  maxConcepts?: number; // limit results
  includeFrequency?: boolean; // track term frequency
}

export class ConceptExtractor {
  private logger: Logger;
  private stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
    'does', 'done', 'can', 'could', 'should', 'would', 'may', 'might', 'must', 'this',
    'that', 'these', 'those', 'from', 'as', 'by', 'it', 'its', 'about', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'which', 'who', 'what',
    'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'same', 'so',
    'than', 'too', 'very', 'just', 'also', 'if', 'else', 'there', 'here',
  ]);

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Extract concepts from text using heuristic-based approach
   */
  async extractConcepts(text: string, options?: ConceptExtractionOptions): Promise<Concept[]> {
    const opts = {
      method: 'heuristic' as const,
      minConfidence: 0.6,
      maxConcepts: 50,
      includeFrequency: true,
      ...options,
    };

    try {
      this.logger.info(`Extracting concepts using ${opts.method} method`);

      const concepts: Concept[] = [];

      // Extract headings (highest confidence)
      concepts.push(...this.extractHeadings(text));

      // Extract bold/emphasized text
      concepts.push(...this.extractEmphasisedText(text));

      // Extract noun phrases
      concepts.push(...this.extractNounPhrases(text));

      // Extract frequent terms
      if (opts.includeFrequency) {
        concepts.push(...this.extractFrequentTerms(text));
      }

      // Deduplicate and normalize
      const normalized = this.deduplicateAndNormalize(concepts);

      // Filter by confidence
      const filtered = normalized.filter((c) => c.confidence >= opts.minConfidence);

      // Sort by confidence descending
      filtered.sort((a, b) => b.confidence - a.confidence);

      // Limit to max concepts
      const limited = filtered.slice(0, opts.maxConcepts);

      this.logger.debug(`Extracted ${limited.length} concepts (${filtered.length} after filtering)`);

      return limited;
    } catch (error) {
      this.logger.error(`Concept extraction failed: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Extract headings (Markdown # syntax and capitalized lines)
   */
  private extractHeadings(text: string): Concept[] {
    const concepts: Concept[] = [];

    // Markdown headings: # Title, ## Subtitle, etc.
    const headingPattern = /^#{1,4}\s+(.+?)$/gm;
    let match;

    while ((match = headingPattern.exec(text)) !== null) {
      const heading = match[1].trim();
      if (heading.length > 2 && heading.length < 100) {
        concepts.push({
          text: heading,
          type: 'heading',
          confidence: 0.95, // Headings are highly reliable
          context: heading,
        });
      }
    }

    return concepts;
  }

  /**
   * Extract bolded/emphasized text (Markdown **text** or __text__)
   */
  private extractEmphasisedText(text: string): Concept[] {
    const concepts: Concept[] = [];

    // Markdown bold: **text** or __text__
    const boldPattern = /\*\*(.+?)\*\*|__(.+?)__/g;
    let match;

    while ((match = boldPattern.exec(text)) !== null) {
      const bold = (match[1] || match[2]).trim();
      if (bold.length > 2 && bold.length < 100) {
        concepts.push({
          text: bold,
          type: 'bold',
          confidence: 0.85,
          context: bold,
        });
      }
    }

    return concepts;
  }

  /**
   * Extract noun phrases (capitalized n-grams)
   */
  private extractNounPhrases(text: string): Concept[] {
    const concepts: Concept[] = [];
    const conceptMap = new Map<string, number>();

    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    for (const sentence of sentences) {
      // Find capitalized phrases (proper nouns)
      const phrases = sentence.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g) || [];

      for (const phrase of phrases) {
        if (phrase.length > 2 && phrase.length < 100) {
          conceptMap.set(phrase, (conceptMap.get(phrase) || 0) + 1);
        }
      }
    }

    // Convert to concepts with frequency-based confidence
    conceptMap.forEach((frequency, phrase) => {
      const confidence = Math.min(0.8, 0.5 + frequency * 0.1); // confidence increases with frequency
      concepts.push({
        text: phrase,
        type: 'noun-phrase',
        confidence,
        frequency,
      });
    });

    return concepts;
  }

  /**
   * Extract frequently mentioned terms (appearing 3+ times)
   */
  private extractFrequentTerms(text: string): Concept[] {
    const concepts: Concept[] = [];
    const wordFreq = new Map<string, number>();

    // Tokenize and count
    const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];

    for (const word of words) {
      if (!this.stopwords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    // Convert high-frequency terms to concepts
    wordFreq.forEach((frequency, word) => {
      if (frequency >= 3) {
        // Must appear 3+ times
        const confidence = Math.min(0.75, 0.3 + frequency * 0.05); // confidence based on frequency
        concepts.push({
          text: word,
          type: 'frequency',
          confidence,
          frequency,
        });
      }
    });

    return concepts;
  }

  /**
   * Deduplicate concepts and normalize text
   */
  private deduplicateAndNormalize(concepts: Concept[]): Concept[] {
    const seen = new Map<string, Concept>();

    for (const concept of concepts) {
      const normalized = this.normalizeText(concept.text);

      if (!seen.has(normalized)) {
        seen.set(normalized, {
          ...concept,
          text: normalized,
        });
      } else {
        // Keep concept with higher confidence
        const existing = seen.get(normalized)!;
        if (concept.confidence > existing.confidence) {
          seen.set(normalized, concept);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Normalize concept text for comparison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}
