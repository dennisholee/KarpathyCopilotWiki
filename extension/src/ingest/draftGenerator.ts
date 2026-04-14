/**
 * Draft Page Generator
 * Creates wiki page drafts from extracted concepts and content
 */

import { Logger } from '../utils/logger';
import { WikiPage } from '../models/types';
import { Concept } from './conceptExtractor';

export interface DraftOptions {
  sourceFile: string; // path to /raw file
  concepts: Concept[];
  extractedText: string;
}

export class DraftGenerator {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Generate a wiki page draft for a concept
   */
  generateDraft(concept: Concept, options: DraftOptions): WikiPage {
    try {
      this.logger.debug(`Generating draft for concept: ${concept.text}`);

      // Create title from concept
      const title = this.createTitle(concept.text);
      const normalizedTitle = this.normalizeTitle(title);

      // Extract relevant content
      const content = this.extractContent(concept, options.extractedText);

      // Generate summary
      const summary = this.generateSummary(content, title);

      // Generate tags
      const tags = this.generateTags(concept, options.concepts);

      // Identify assertions needing sources
      const needsSource = this.hasUnsupportedAssertions(content);

      // Create wiki page
      const page: WikiPage = {
        id: normalizedTitle, // Will be replaced with YYYYMMDDNN filename
        title,
        aliases: [concept.text],
        content: this.formatContent(content, title, options.sourceFile),
        plaintext: content,
        created: new Date().toISOString(),
        tags,
        links: [options.sourceFile], // Always cite source
        sourceUri: options.sourceFile,
      };

      // Mark with quality tracking
      (page as any).needsSource = needsSource;
      (page as any).nERMetadata = {
        extractedEntities: [concept],
        confidenceThreshold: 0.6,
        nerLibrary: 'heuristic',
      };

      return page;
    } catch (error) {
      this.logger.error(`Draft generation failed: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Create a human-readable title from concept text
   */
  private createTitle(conceptText: string): string {
    // Capitalize first letter of each word
    return conceptText
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Normalize title for use as page ID (lowercase, no punctuation)
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove punctuation
      .replace(/\s+/g, '-') // Spaces to hyphens
      .slice(0, 50); // Max 50 chars
  }

  /**
   * Extract relevant content snippets from text
   */
  private extractContent(concept: Concept, text: string): string {
    // Find sentences containing the concept
    const conceptLower = concept.text.toLowerCase();
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    const relevant: string[] = [];
    let contextCount = 0;

    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(conceptLower) && contextCount < 5) {
        relevant.push(sentence.trim());
        contextCount++;
      }
    }

    // If we didn't find sentences with concept, use first few sentences as context
    if (relevant.length === 0) {
      relevant.push(...sentences.slice(0, 3).map((s) => s.trim()));
    }

    return relevant.join(' ').slice(0, 1000); // Max 1000 chars content
  }

  /**
   * Generate a one-line summary
   */
  private generateSummary(content: string, title: string): string {
    // Use first sentence as summary
    const firstSentence = content.match(/^[^.!?]+[.!?]+/)?.[0];

    if (firstSentence) {
      const summary = firstSentence.trim().slice(0, 150);
      return summary;
    }

    return `Information about ${title}.`;
  }

  /**
   * Generate relevant tags
   */
  private generateTags(concept: Concept, allConcepts: Concept[]): string[] {
    const tags: Set<string> = new Set();

    // Add concept as tag
    tags.add(this.categoryizeTag(concept.text));

    // Add extraction method as tag
    tags.add(`extracted-${concept.type}`);

    // Add confidence level as tag
    if (concept.confidence >= 0.9) {
      tags.add('high-confidence');
    } else if (concept.confidence >= 0.7) {
      tags.add('medium-confidence');
    } else {
      tags.add('low-confidence');
    }

    // Find related concepts for tag suggestions
    const related = allConcepts
      .filter((c) => c.confidence > 0.7 && c.text !== concept.text)
      .slice(0, 3);

    for (const r of related) {
      tags.add(this.categoryizeTag(r.text));
    }

    return Array.from(tags);
  }

  /**
   * Categorize text into a tag-friendly form
   */
  private categoryizeTag(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30);
  }

  /**
   * Check if content contains unsupported assertions (needs extra vetting)
   */
  private hasUnsupportedAssertions(content: string): boolean {
    // Look for hedging language
    const hedgesPatterns = [
      /\b(may|might|could|possibly|arguably|allegedly|reportedly)\b/gi,
      /\b(is said to|is believed to|according to|seems to)\b/gi,
    ];

    for (const pattern of hedgesPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Format content as Markdown with wiki structure
   */
  private formatContent(content: string, title: string, sourceFile: string): string {
    const markdown = `# ${title}

## Summary
${content.slice(0, 200)}

## Context
${content}

## Sources
- [\`${sourceFile}\`](${sourceFile})

## Related Concepts
(To be filled by backlink insertion)
`;
    return markdown;
  }
}
