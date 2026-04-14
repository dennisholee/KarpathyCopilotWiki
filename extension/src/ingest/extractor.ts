/**
 * PDF and Text Extraction Service
 * Implements hybrid extraction: pdfjs-dist (client-side) with PyMuPDF fallback
 */

import * as fs from 'fs';
import * as path from 'path';
import * as pdfjsLib from 'pdfjs-dist';
import { Logger } from '../utils/logger';

export interface ExtractionResult {
  text: string;
  metadata?: {
    title?: string;
    authors?: string[];
    date?: string;
    pageCount?: number;
  };
  extractionMethod: 'pdfjs' | 'text' | 'unknown';
  confidence: number; // 0-1, how complete the extraction is
}

export class ExtractionService {
  private logger: Logger;
  private minExtractionConfidence = 0.5; // Fallback to backend if < 50% text extracted

  constructor(logger: Logger) {
    this.logger = logger;
    // Set up pdfjs worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }

  /**
   * Extract text from a file (PDF or plain text)
   */
  async extractText(filePath: string): Promise<ExtractionResult> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const ext = path.extname(filePath).toLowerCase();

      // Route to appropriate extractor
      if (ext === '.pdf') {
        return await this.extractFromPdf(filePath);
      } else if (['.txt', '.md', '.markdown'].includes(ext)) {
        return await this.extractFromText(filePath);
      } else {
        // Try PDF extraction for unknown types (user might have saved PDF without extension)
        try {
          return await this.extractFromPdf(filePath);
        } catch (e) {
          // If PDF fails, try as text
          return await this.extractFromText(filePath);
        }
      }
    } catch (error) {
      this.logger.error(`Text extraction failed for ${filePath}: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Extract text from PDF using pdfjs-dist
   */
  private async extractFromPdf(filePath: string): Promise<ExtractionResult> {
    try {
      this.logger.debug(`Extracting from PDF: ${filePath}`);

      // Read file into buffer
      const fileData = fs.readFileSync(filePath);

      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;

      let text = '';
      let totalChars = 0;
      const pageCount = pdf.numPages;

      // Extract text from each page
      for (let i = 1; i <= pageCount; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();

          // Join text items with spaces
          const pageText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ');

          text += pageText + '\n';
          totalChars += pageText.length;
        } catch (pageError) {
          this.logger.warn(`Failed to extract page ${i}: ${String(pageError)}`);
        }
      }

      // Calculate confidence based on extracted text length
      // Heuristic: typical PDF has ~3000-5000 chars per page; if we get <50% of that, confidence is lower
      const expectedChars = pageCount * 4000;
      const confidence = Math.min(1, totalChars / expectedChars);

      this.logger.debug(
        `PDF extraction: ${totalChars} chars, ${pageCount} pages, confidence: ${confidence.toFixed(2)}`
      );

      return {
        text: text.trim(),
        metadata: {
          pageCount,
        },
        extractionMethod: 'pdfjs',
        confidence,
      };
    } catch (error) {
      this.logger.error(`PDF extraction failed: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Extract text from plain text file
   */
  private async extractFromText(filePath: string): Promise<ExtractionResult> {
    try {
      this.logger.debug(`Extracting from text file: ${filePath}`);

      const text = fs.readFileSync(filePath, 'utf-8');

      // For text files, assume complete extraction (confidence = 1)
      return {
        text,
        metadata: {},
        extractionMethod: 'text',
        confidence: 1.0,
      };
    } catch (error) {
      this.logger.error(`Text extraction failed: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Check if extraction confidence is sufficient
   * Returns true if confidence meets threshold
   */
  isExtractionSufficient(result: ExtractionResult): boolean {
    return result.confidence >= this.minExtractionConfidence;
  }

  /**
   * Set minimum extraction confidence threshold
   */
  setMinConfidence(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1');
    }
    this.minExtractionConfidence = threshold;
  }
}
