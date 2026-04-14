/**
 * Backlink Manager
 * Handles finding related pages and inserting bidirectional wiki links
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { WikiPage } from '../models/types';

export interface LinkInsertionResult {
  pageFile: string;
  linksAdded: string[];
  linksRemoved: string[];
  hasChanges: boolean;
}

export class BacklinkManager {
  private logger: Logger;
  private wikiDir: string;

  constructor(wikiDir: string, logger: Logger) {
    this.wikiDir = wikiDir;
    this.logger = logger;
  }

  /**
   * Find related pages by title similarity and content matching
   */
  findRelatedPages(candidateTitle: string, excludeFile?: string): string[] {
    try {
      const normalized = this.normalizeTitle(candidateTitle);
      const related: string[] = [];

      // List all wiki page files
      const files = fs.readdirSync(this.wikiDir).filter((f) => f.endsWith('.md'));

      for (const file of files) {
        if (excludeFile && file === excludeFile) {
          continue;
        }

        const filePath = path.join(this.wikiDir, file);

        try {
          const content = fs.readFileSync(filePath, 'utf-8');

          // Extract title from markdown
          const titleMatch = content.match(/^# (.+?)$/m);
          if (titleMatch) {
            const pageTitle = titleMatch[1];
            const pageNormalized = this.normalizeTitle(pageTitle);

            // Check title similarity (exact match or partial)
            if (this.isSimilar(normalized, pageNormalized)) {
              related.push(file);
            }
          }
        } catch (error) {
          this.logger.warn(`Failed to read ${file}: ${String(error)}`);
        }
      }

      return related;
    } catch (error) {
      this.logger.error(`Finding related pages failed: ${String(error)}`);
      return [];
    }
  }

  /**
   * Insert bidirectional backlinks between pages
   * Idempotent: running twice won't create duplicates
   */
  async insertBacklinks(
    sourcePage: WikiPage,
    targetTitles: string[],
    sourceFile: string
  ): Promise<LinkInsertionResult> {
    const result: LinkInsertionResult = {
      pageFile: sourceFile,
      linksAdded: [],
      linksRemoved: [],
      hasChanges: false,
    };

    try {
      const sourcePath = path.join(this.wikiDir, sourceFile);

      // Read source page content
      let sourceContent = fs.readFileSync(sourcePath, 'utf-8');

      // Insert forward links in source page
      for (const targetTitle of targetTitles) {
        const wikiLink = this.createWikiLink(targetTitle);

        if (!sourceContent.includes(wikiLink)) {
          // Find insertion point (end of content before related concepts)
          const insertPoint = sourceContent.lastIndexOf('\n## Related Concepts');
          if (insertPoint > 0) {
            sourceContent = sourceContent.slice(0, insertPoint) + `\n- ${wikiLink}` + sourceContent.slice(insertPoint);
            result.linksAdded.push(targetTitle);
            result.hasChanges = true;
          }
        }
      }

      // Write back source page if changed
      if (result.hasChanges) {
        fs.writeFileSync(sourcePath, sourceContent, 'utf-8');
        this.logger.debug(`Updated backlinks in ${sourceFile}: added ${result.linksAdded.join(', ')}`);
      }

      // Update targeted pages with reverse links (idempotent)
      for (const targetTitle of targetTitles) {
        const targetFiles = this.findPagesByTitle(targetTitle);

        for (const targetFile of targetFiles) {
          const targetPath = path.join(this.wikiDir, targetFile);

          try {
            let targetContent = fs.readFileSync(targetPath, 'utf-8');
            const backlink = this.createWikiLink(sourcePage.title);

            if (!targetContent.includes(backlink)) {
              // Insert backlink at end of Related Concepts section
              const insertPoint = targetContent.lastIndexOf('\n## Related Concepts');
              if (insertPoint > 0) {
                targetContent = targetContent.slice(0, insertPoint) + `\n- ${backlink}` + targetContent.slice(insertPoint);
                fs.writeFileSync(targetPath, targetContent, 'utf-8');
                this.logger.debug(`Updated reverse backlink in ${targetFile}: added [[${sourcePage.title}]]`);
              }
            }
          } catch (error) {
            this.logger.warn(`Failed to update backlinks in ${targetFile}: ${String(error)}`);
          }
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Backlink insertion failed: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Find all files that mention a page title
   */
  private findPagesByTitle(title: string): string[] {
    try {
      const normalized = this.normalizeTitle(title);
      const files: string[] = [];

      const allFiles = fs.readdirSync(this.wikiDir).filter((f) => f.endsWith('.md'));

      for (const file of allFiles) {
        const filePath = path.join(this.wikiDir, file);

        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const titleMatch = content.match(/^# (.+?)$/m);

          if (titleMatch && this.normalizeTitle(titleMatch[1]) === normalized) {
            files.push(file);
          }
        } catch (error) {
          this.logger.warn(`Failed to read ${file}: ${String(error)}`);
        }
      }

      return files;
    } catch (error) {
      this.logger.error(`Finding pages by title failed: ${String(error)}`);
      return [];
    }
  }

  /**
   * Create a Foam-compatible wiki link [[Title]]
   */
  private createWikiLink(title: string): string {
    return `[[${title}]]`;
  }

  /**
   * Normalize title for comparison
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if two titles are similar (for linking decisions)
   * Uses substring matching and Levenshtein distance for fuzzy matching
   */
  private isSimilar(normalized1: string, normalized2: string, threshold = 0.8): boolean {
    // Exact match
    if (normalized1 === normalized2) {
      return true;
    }

    // Substring match (e.g., "decision tree" contains "decision")
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return true;
    }

    // Levenshtein distance-based fuzzy matching
    const distance = this.levenshteinDistance(normalized1, normalized2);
    const maxLen = Math.max(normalized1.length, normalized2.length);
    const similarity = 1 - distance / maxLen;

    return similarity >= threshold;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Used for fuzzy matching of page titles
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        const cost = s1[j - 1] === s2[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i][j - 1] + 1, // Insertion
          matrix[i - 1][j] + 1, // Deletion
          matrix[i - 1][j - 1] + cost // Substitution
        );
      }
    }

    return matrix[len2][len1];
  }
}
