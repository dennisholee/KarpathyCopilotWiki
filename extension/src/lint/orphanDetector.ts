/**
 * Orphan Page Detector
 * Identifies wiki pages with no inbound backlinks
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';

export interface OrphanPage {
  filename: string;
  title: string;
  reason: string;
  age?: number; // days since created
}

export class OrphanDetector {
  private logger: Logger;
  private wikiDir: string;

  constructor(wikiDir: string, logger: Logger) {
    this.wikiDir = wikiDir;
    this.logger = logger;
  }

  /**
   * Find all orphaned pages (pages with zero inbound links)
   */
  findOrphans(): OrphanPage[] {
    try {
      this.logger.debug('Scanning for orphaned pages...');

      const orphans: OrphanPage[] = [];
      const files = fs.readdirSync(this.wikiDir).filter((f) => f.endsWith('.md'));

      // Build a map of all pages and their titles
      const pageMap = new Map<string, string>();

      for (const file of files) {
        const content = fs.readFileSync(path.join(this.wikiDir, file), 'utf-8');
        const titleMatch = content.match(/^# (.+?)$/m);
        if (titleMatch) {
          pageMap.set(file, titleMatch[1]);
        }
      }

      // For each page, check if it has inbound links
      for (const file of files) {
        const content = fs.readFileSync(path.join(this.wikiDir, file), 'utf-8');
        const title = pageMap.get(file) || file;
        const isLinkedTo = this.hasInboundLinks(file, content, files);

        if (!isLinkedTo) {
          // Exclude index.md and glossary.md
          if (file !== 'index.md' && file !== 'glossary.md') {
            orphans.push({
              filename: file,
              title,
              reason: 'No inbound wiki links found',
              age: this.getFileAge(path.join(this.wikiDir, file)),
            });
          }
        }
      }

      this.logger.debug(`Found ${orphans.length} orphaned pages`);
      return orphans;
    } catch (error) {
      this.logger.error(`Orphan detection failed: ${String(error)}`);
      return [];
    }
  }

  /**
   * Check if page has inbound links (other pages linking to it)
   */
  private hasInboundLinks(targetFile: string, targetContent: string, allFiles: string[]): boolean {
    // Extract title from target page
    const titleMatch = targetContent.match(/^# (.+?)$/m);
    if (!titleMatch) {
      return false;
    }

    const targetTitle = titleMatch[1];
    const wikiLink = `[[${targetTitle}]]`;

    // Check other pages for links to this page
    for (const file of allFiles) {
      if (file === targetFile) {
        continue;
      }

      try {
        const otherContent = fs.readFileSync(path.join(this.wikiDir, file), 'utf-8');

        // Check for exact wiki link
        if (otherContent.includes(wikiLink)) {
          return true;
        }

        // Check for relative links in Links section
        if (otherContent.includes(targetFile)) {
          return true;
        }
      } catch (error) {
        this.logger.warn(`Failed to check ${file}: ${String(error)}`);
      }
    }

    return false;
  }

  /**
   * Get file age in days
   */
  private getFileAge(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      const now = Date.now();
      const created = stats.birthtimeMs || stats.ctimeMs;
      const ageMs = now - created;
      return Math.floor(ageMs / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }
}
