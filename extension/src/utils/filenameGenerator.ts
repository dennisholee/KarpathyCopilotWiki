/**
 * Wiki Page Filename Generator
 * Generates atomic YYYYMMDDNN filenames for wiki pages
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';

export class FilenameGenerator {
  private logger: Logger;
  private wikiDir: string;

  constructor(wikiDir: string, logger: Logger) {
    this.wikiDir = wikiDir;
    this.logger = logger;
  }

  /**
   * Generate next atomic filename in YYYYMMDDNN format
   * Idempotent: calling multiple times for the same date returns next available
   */
  generateFilename(baseName?: string): string {
    try {
      const today = new Date();
      const datePrefix = this.formatDatePrefix(today);

      // Find all files for today
      const todayPattern = new RegExp(`^${datePrefix}\\d{2}\\.md$`);
      const files = fs.readdirSync(this.wikiDir);
      const todayFiles = files.filter((f) => todayPattern.test(f));

      // Parse sequence numbers
      const sequences = todayFiles.map((f) => {
        const match = f.match(/(\d{2})\.md$/);
        return match ? parseInt(match[1], 10) : 0;
      });

      // Get next sequence number
      const maxSeq = sequences.length > 0 ? Math.max(...sequences) : 0;
      const nextSeq = maxSeq + 1;

      if (nextSeq > 99) {
        throw new Error(`Too many files for date ${datePrefix} (max 99 per day)`);
      }

      const filename = `${datePrefix}${String(nextSeq).padStart(2, '0')}.md`;

      this.logger.debug(`Generated filename: ${filename}`);

      return filename;
    } catch (error) {
      this.logger.error(`Filename generation failed: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Generate filename for a specific date
   */
  generateFilenameForDate(date: Date): string {
    const datePrefix = this.formatDatePrefix(date);
    const sequence = '01'; // First page for this date
    return `${datePrefix}${sequence}.md`;
  }

  /**
   * Validate that a filename follows YYYYMMDDNN.md format
   */
  isValidFilename(filename: string): boolean {
    const pattern = /^\d{8}\d{2}\.md$/;
    return pattern.test(filename);
  }

  /**
   * Extract date from filename
   */
  extractDateFromFilename(filename: string): Date | null {
    const match = filename.match(/^(\d{8})/);
    if (!match) {
      return null;
    }

    const dateStr = match[1];
    const year = parseInt(dateStr.slice(0, 4), 10);
    const month = parseInt(dateStr.slice(4, 6), 10);
    const day = parseInt(dateStr.slice(6, 8), 10);

    // Validate date
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    try {
      const date = new Date(year, month - 1, day);
      return date;
    } catch {
      return null;
    }
  }

  /**
   * Format date as YYYYMMDD prefix
   */
  private formatDatePrefix(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
  }
}
