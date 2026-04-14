/**
 * Lint Orchestrator
 * Runs all linting checks (orphans, contradictions, quality issues)
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { OrphanDetector, OrphanPage } from './orphanDetector';

export interface Contradiction {
  pages: string[]; // filenames that contradict
  claim: string; // the contradictory assertion
  sources: string[]; // /raw sources cited
  severity: 'minor' | 'major' | 'critical';
}

export interface LintReport {
  timestamp: Date;
  mode: 'quick' | 'deep';
  orphanPages: OrphanPage[];
  contradictions: Contradiction[];
  qualityIssues: { page: string; issue: string }[];
  summary: {
    totalOrphans: number;
    totalContradictions: number;
    totalIssues: number;
  };
}

export class LintOrchestrator {
  private logger: Logger;
  private wikiDir: string;
  private orphanDetector: OrphanDetector;

  constructor(wikiDir: string, logger: Logger) {
    this.wikiDir = wikiDir;
    this.logger = logger;
    this.orphanDetector = new OrphanDetector(wikiDir, logger);
  }

  /**
   * Run lint checks in quick or deep mode
   */
  async lint(quickMode: boolean = true): Promise<LintReport> {
    const startTime = Date.now();

    try {
      this.logger.info(`Running ${quickMode ? 'quick' : 'deep'} lint check...`);

      const orphans = this.orphanDetector.findOrphans();
      const contradictions: Contradiction[] = [];
      const qualityIssues: { page: string; issue: string }[] = [];

      // Deep mode adds contradiction detection
      if (!quickMode) {
        const found = this.findContradictions();
        contradictions.push(...found);

        const issues = this.checkQuality();
        qualityIssues.push(...issues);
      }

      const report: LintReport = {
        timestamp: new Date(),
        mode: quickMode ? 'quick' : 'deep',
        orphanPages: orphans,
        contradictions,
        qualityIssues,
        summary: {
          totalOrphans: orphans.length,
          totalContradictions: contradictions.length,
          totalIssues: qualityIssues.length,
        },
      };

      const duration = Date.now() - startTime;
      this.logger.info(
        `Lint check completed in ${duration}ms: ${orphans.length} orphans, ` +
          `${contradictions.length} contradictions, ${qualityIssues.length} quality issues`
      );

      return report;
    } catch (error) {
      this.logger.error(`Lint check failed: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Find contradictory assertions between pages
   */
  private findContradictions(): Contradiction[] {
    const contradictions: Contradiction[] = [];

    try {
      const files = fs.readdirSync(this.wikiDir).filter((f) => f.endsWith('.md'));

      // Simple contradiction detection: look for patterns like "A causes B" vs "A prevents B"
      const patterns = [
        { positive: /causes|leads to|results in|produces/gi, negative: /prevents|blocks|stops|inhibits/gi },
        { positive: /increases|enhances|improves/gi, negative: /decreases|reduces|worsens/gi },
        { positive: /true|always|definitely/gi, negative: /false|never|impossible/gi },
      ];

      for (const pattern of patterns) {
        const pages: { [key: string]: string[] } = {};

        for (const file of files) {
          try {
            const content = fs.readFileSync(path.join(this.wikiDir, file), 'utf-8');

            // Find sentences with positive pattern
            if (pattern.positive.test(content)) {
              pages[file] = pages[file] || [];
              pages[file].push('positive');
            }

            // Find sentences with negative pattern
            if (pattern.negative.test(content)) {
              pages[file] = pages[file] || [];
              pages[file].push('negative');
            }
          } catch (error) {
            this.logger.warn(`Failed to check ${file}: ${String(error)}`);
          }
        }

        // Look for contradictions
        for (const file1 of Object.keys(pages)) {
          if (pages[file1].includes('positive')) {
            for (const file2 of Object.keys(pages)) {
              if (file1 !== file2 && pages[file2].includes('negative')) {
                // Found potential contradiction
                contradictions.push({
                  pages: [file1, file2],
                  claim: 'Opposite assertions found',
                  sources: [file1, file2],
                  severity: 'minor',
                });
              }
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Contradiction detection failed: ${String(error)}`);
    }

    return contradictions;
  }

  /**
   * Check for quality issues in pages
   */
  private checkQuality(): { page: string; issue: string }[] {
    const issues: { page: string; issue: string }[] = [];

    try {
      const files = fs.readdirSync(this.wikiDir).filter((f) => f.endsWith('.md'));

      for (const file of files) {
        // Skip index and glossary
        if (file === 'index.md' || file === 'glossary.md') {
          continue;
        }

        try {
          const content = fs.readFileSync(path.join(this.wikiDir, file), 'utf-8');

          // Check for missing title
          if (!content.match(/^# .+$/m)) {
            issues.push({ page: file, issue: 'Missing title' });
          }

          // Check for missing summary
          if (!content.match(/## Summary/i)) {
            issues.push({ page: file, issue: 'Missing summary section' });
          }

          // Check for missing links
          if (!content.includes('Links:') && !content.includes('Sources')) {
            issues.push({ page: file, issue: 'Missing links/sources section' });
          }

          // Check for very short content
          const contentMatch = content.match(/## Content\n([\s\S]*?)(?=##|$)/i);
          if (!contentMatch || contentMatch[1].trim().length < 50) {
            issues.push({ page: file, issue: 'Content very short (<50 chars)' });
          }

          // Check for "Needs Source" flag
          if (content.includes('Needs Source') || content.includes('needs_source')) {
            issues.push({ page: file, issue: 'Page marked as needing source verification' });
          }
        } catch (error) {
          this.logger.warn(`Failed to check quality of ${file}: ${String(error)}`);
        }
      }
    } catch (error) {
      this.logger.error(`Quality check failed: ${String(error)}`);
    }

    return issues;
  }
}
