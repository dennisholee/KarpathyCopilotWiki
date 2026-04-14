/**
 * Ingest Orchestrator
 * Coordinates extraction → concepts → drafts → backlinks → page write pipeline
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';
import { WikiPage } from '../models/types';
import { ExtractionService } from './extractor';
import { ConceptExtractor } from './conceptExtractor';
import { DraftGenerator } from './draftGenerator';
import { BacklinkManager } from './backlinkManager';
import { FilenameGenerator } from '../utils/filenameGenerator';

export interface IngestOptions {
  sourceFile: string; // Path in /raw
  skipBacklinks?: boolean;
  maxPages?: number; // Max drafts to generate
}

export interface IngestResult {
  sourceFile: string;
  pagesCreated: string[]; // Filenames of created pages
  failedPages: string[];
  backlinksInserted: number;
  duration: number; // milliseconds
}

export class IngestOrchestrator {
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private extractionService: ExtractionService;
  private conceptExtractor: ConceptExtractor;
  private draftGenerator: DraftGenerator;
  private backlinkManager: BacklinkManager;
  private filenameGenerator: FilenameGenerator;
  private wikiDir: string;
  private statusProgress: vscode.Progress<{ message?: string; increment?: number }> | null = null;

  constructor(wikiDir: string, logger: Logger) {
    this.wikiDir = wikiDir;
    this.logger = logger;
    this.errorHandler = new ErrorHandler(logger);
    this.extractionService = new ExtractionService(logger);
    this.conceptExtractor = new ConceptExtractor(logger);
    this.draftGenerator = new DraftGenerator(logger);
    this.backlinkManager = new BacklinkManager(wikiDir, logger);
    this.filenameGenerator = new FilenameGenerator(wikiDir, logger);
  }

  /**
   * Set progress reporter for status messages (T041)
   */
  setProgressReporter(
    progress: vscode.Progress<{ message?: string; increment?: number }>
  ): void {
    this.statusProgress = progress;
  }

  /**
   * Report progress to UI
   */
  private reportProgress(message: string, increment?: number): void {
    if (this.statusProgress) {
      this.statusProgress.report({ message, increment });
    }
    this.logger.info(message);
  }

  /**
   * Run full ingest pipeline on a source file
   */
  async ingest(options: IngestOptions): Promise<IngestResult> {
    const startTime = Date.now();
    const result: IngestResult = {
      sourceFile: options.sourceFile,
      pagesCreated: [],
      failedPages: [],
      backlinksInserted: 0,
      duration: 0,
    };

    try {
      this.reportProgress(`📂 Ingesting ${path.basename(options.sourceFile)}...`);

      // Step 1: Extract text (with error handling)
      this.reportProgress(`📄 Extracting text...`, 20);
      const extraction = await this.errorHandler.tryWithRetry(
        () => this.extractionService.extractText(options.sourceFile),
        'PDF extraction',
        2 // PDF parsing may fail; 2 attempts is reasonable
      );

      if (!extraction) {
        this.errorHandler.handle(
          new Error('PDF extraction failed and retries exhausted'),
          { showUserMessage: true }
        );
        result.duration = Date.now() - startTime;
        return result;
      }

      this.logger.debug(
        `Extracted ${extraction.text.length} characters (confidence: ${extraction.confidence.toFixed(2)})`
      );

      // Step 2: Extract concepts
      this.reportProgress(`🔍 Analyzing concepts...`, 20);
      const concepts = await this.conceptExtractor.extractConcepts(extraction.text, {
        maxConcepts: options.maxPages || 10,
        minConfidence: 0.6,
      });

      this.logger.debug(`Extracted ${concepts.length} concepts`);

      if (concepts.length === 0) {
        this.logger.warn('No concepts extracted; skipping page generation');
        this.reportProgress('⚠️ No concepts found in document', 0);
        result.duration = Date.now() - startTime;
        return result;
      }

      // Step 3-5: Generate drafts, insert backlinks, write pages
      this.reportProgress(`📝 Generating wiki pages...`, 20);
      const draftOptions = {
        sourceFile: options.sourceFile,
        concepts,
        extractedText: extraction.text,
      };

      const totalSteps = concepts.length;
      for (let i = 0; i < concepts.length; i++) {
        const concept = concepts[i];
        try {
          // Generate draft
          const draft = this.draftGenerator.generateDraft(concept, draftOptions);

          // Find related pages
          const relatedTitles = this.backlinkManager.findRelatedPages(draft.title);

          // Insert backlinks
          if (!options.skipBacklinks && relatedTitles.length > 0) {
            const linkResult = await this.backlinkManager.insertBacklinks(
              draft,
              relatedTitles,
              this.filenameGenerator.generateFilename()
            );
            result.backlinksInserted += linkResult.linksAdded.length;
          }

          // Generate filename
          const filename = this.filenameGenerator.generateFilename();

          // Ensure page has valid filename and schema
          (draft as any).filename = filename;

          // Write page to disk (with error handling)
          const filePath = path.join(this.wikiDir, filename);
          const pageContent = this.formatPageAsMarkdown(draft);

          try {
            fs.writeFileSync(filePath, pageContent, 'utf-8');
            result.pagesCreated.push(filename);
            const progressPct = Math.round(((i + 1) / totalSteps) * 40); // 40% for page generation
            this.reportProgress(
              `📝 Created page ${i + 1}/${totalSteps}: ${draft.title}`,
              progressPct
            );
          } catch (writeError) {
            // Handle file write errors specifically
            const writeErr = writeError instanceof Error ? writeError : new Error(String(writeError));
            if (writeErr.message.includes('permission') || writeErr.message.includes('EACCES')) {
              this.errorHandler.handle(writeErr, {
                showUserMessage: true,
                fallbackMessage: 'Cannot write to wiki directory. Check file permissions.',
              });
            } else {
              throw writeErr;
            }
            result.failedPages.push(concept.text);
          }
        } catch (error) {
          const conceptError = error instanceof Error ? error : new Error(String(error));
          this.logger.warn(
            `Failed to create page for concept "${concept.text}": ${conceptError.message}`
          );
          result.failedPages.push(concept.text);
        }
      }

      result.duration = Date.now() - startTime;
      this.reportProgress(
        `✅ Ingest complete: ${result.pagesCreated.length}/${totalSteps} pages, ` +
        `${result.backlinksInserted} backlinks (${result.duration}ms)`,
        20
      );

      this.logger.info(
        `Ingest completed: ${result.pagesCreated.length} pages created, ` +
        `${result.failedPages.length} failed, ` +
        `${result.backlinksInserted} backlinks inserted (${result.duration}ms)`
      );

      return result;
    } catch (error) {
      result.duration = Date.now() - startTime;
      const ingestError = error instanceof Error ? error : new Error(String(error));
      this.errorHandler.handle(ingestError, {
        showUserMessage: true,
        fallbackMessage: 'Ingest pipeline failed. Check the output panel for details.',
      });
      this.logger.error(`Ingest pipeline failed: ${ingestError.message}`);
      throw error;
    }
  }

  /**
   * Format WikiPage as Markdown with frontmatter
   */
  private formatPageAsMarkdown(page: WikiPage): string {
    const frontmatter = `---
title: ${page.title}
created: ${page.created}
tags: [${page.tags.map((t) => `"${t}"`).join(', ')}]
---

`;

    // Use existing formatted content or generate from scratch
    let content = page.content;

    // Ensure links section exists
    if (!content.includes('Links:')) {
      content += `\n\n## Links\n${page.links.map((l) => `- ${l}`).join('\n')}`;
    }

    return frontmatter + content;
  }
}
