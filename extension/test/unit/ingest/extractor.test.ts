import * as fs from 'fs';
import * as path from 'path';
import * as pdfjsLib from 'pdfjs-dist';
import { ExtractionService } from '../../../src/ingest/extractor';
import { Logger } from '../../../src/utils/logger';

jest.mock('pdfjs-dist', () => ({
  version: 'test-version',
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: jest.fn(),
}));

describe('ExtractionService', () => {
  let testDir: string;
  let logger: Logger;

  beforeEach(() => {
    jest.clearAllMocks();
    testDir = path.join(__dirname, '../../temp-extractor');
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(testDir, { recursive: true });
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('extracts csv content including quoted fields', async () => {
    const filePath = path.join(testDir, 'portfolio.csv');
    fs.writeFileSync(filePath, 'customer_id,notes\nC001,"High, monitored"\n');

    const extractor = new ExtractionService(logger);
    const result = await extractor.extractText(filePath);

    expect(result.text).toContain('Columns: customer_id, notes');
    expect(result.text).toContain('customer_id: C001, notes: High, monitored');
    expect(result.metadata?.title).toBe('portfolio');
  });

  it('rejects unsupported file extensions', async () => {
    const filePath = path.join(testDir, 'archive.bin');
    fs.writeFileSync(filePath, 'binary-ish');

    const extractor = new ExtractionService(logger);

    await expect(extractor.extractText(filePath)).rejects.toThrow('Unsupported file type: .bin');
  });

  it('falls back to text extraction for extensionless files when pdf parsing fails', async () => {
    const filePath = path.join(testDir, 'README');
    fs.writeFileSync(filePath, 'plain text fallback');
    (pdfjsLib.getDocument as jest.Mock).mockImplementation(() => ({
      promise: Promise.reject(new Error('invalid pdf')),
    }));

    const extractor = new ExtractionService(logger);
    const result = await extractor.extractText(filePath);

    expect(result.text).toBe('plain text fallback');
    expect(result.extractionMethod).toBe('text');
  });

  it('applies the minimum confidence threshold checks', () => {
    const extractor = new ExtractionService(logger);

    expect(extractor.isExtractionSufficient({
      text: 'a',
      extractionMethod: 'text',
      confidence: 1,
    })).toBe(true);

    extractor.setMinConfidence(0.8);

    expect(extractor.isExtractionSufficient({
      text: 'a',
      extractionMethod: 'text',
      confidence: 0.79,
    })).toBe(false);
  });

  it('rejects invalid confidence thresholds', () => {
    const extractor = new ExtractionService(logger);

    expect(() => extractor.setMinConfidence(-0.1)).toThrow('Confidence threshold must be between 0 and 1');
    expect(() => extractor.setMinConfidence(1.1)).toThrow('Confidence threshold must be between 0 and 1');
  });
});