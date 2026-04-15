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
      } else if (ext === '.csv') {
        return await this.extractFromCsv(filePath);
      } else if (['.txt', '.md', '.markdown'].includes(ext)) {
        return await this.extractFromText(filePath);
      } else if (!ext) {
        // Preserve legacy fallback for extensionless files.
        try {
          return await this.extractFromPdf(filePath);
        } catch (e) {
          return await this.extractFromText(filePath);
        }
      } else {
        throw new Error(`Unsupported file type: ${ext}`);
      }
    } catch (error) {
      this.logger.error(`Text extraction failed for ${filePath}: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Extract text from CSV by converting rows into readable key-value lines.
   */
  private async extractFromCsv(filePath: string): Promise<ExtractionResult> {
    try {
      this.logger.debug(`Extracting from CSV file: ${filePath}`);

      const csvText = fs.readFileSync(filePath, 'utf-8');
      const rows = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (rows.length === 0) {
        return {
          text: '',
          metadata: {},
          extractionMethod: 'text',
          confidence: 1.0,
        };
      }

      const headers = this.parseCsvLine(rows[0]);
      const records = rows.slice(1).map((row, index) => {
        const values = this.parseCsvLine(row);

        if (headers.length === 0) {
          return `Row ${index + 1}: ${values.join(', ')}`;
        }

        return headers
          .map((header, valueIndex) => {
            const safeHeader = header || `column_${valueIndex + 1}`;
            const safeValue = values[valueIndex] || '';
            return `${safeHeader}: ${safeValue}`;
          })
          .join(', ');
      });

      const text = [
        headers.length > 0 ? `Columns: ${headers.join(', ')}` : 'Columns: unavailable',
        ...records,
      ].join('\n');

      return {
        text,
        metadata: {
          title: path.basename(filePath, path.extname(filePath)).replace(/[-_]/g, ' '),
        },
        extractionMethod: 'text',
        confidence: 1.0,
      };
    } catch (error) {
      this.logger.error(`CSV extraction failed: ${String(error)}`);
      throw error;
    }
  }

  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index++) {
      const character = line[index];
      const nextCharacter = line[index + 1];

      if (character === '"') {
        if (inQuotes && nextCharacter === '"') {
          current += '"';
          index++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (character === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
        continue;
      }

      current += character;
    }

    values.push(current.trim());
    return values;
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
