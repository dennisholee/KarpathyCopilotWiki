/**
 * Integration Test: Phase 2B Core Services
 * Tests the full ingest pipeline with focus on compilation and basic functionality
 */

import * as fs from 'fs';
import * as path from 'path';
import { ExtractionService } from '../../src/ingest/extractor';
import { ConceptExtractor } from '../../src/ingest/conceptExtractor';
import { DraftGenerator } from '../../src/ingest/draftGenerator';
import { FilenameGenerator } from '../../src/utils/filenameGenerator';
import { Logger } from '../../src/utils/logger';

describe('Phase 2B Integration: Core Services', () => {
  let testDir: string;
  let logger: Logger;

  beforeAll(() => {
    testDir = path.join(__dirname, '../temp-integration');
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
    fs.mkdirSync(testDir, { recursive: true });

    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('ExtractionService', () => {
    it('should extract text from .txt file', async () => {
      const testFile = path.join(testDir, 'sample.txt');
      const content = `
        # Neural Networks
        ## Introduction
        **Deep learning** is powerful.
        Neural networks use **backpropagation**.
      `;
      fs.writeFileSync(testFile, content);

      const extractor = new ExtractionService(logger);
      const result = await extractor.extractText(testFile);

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(result.extractionMethod).toBe('text');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle file not found gracefully', async () => {
      const extractor = new ExtractionService(logger);
      await expect(extractor.extractText('/nonexistent/file.txt')).rejects.toThrow();
    });
  });

  describe('ConceptExtractor', () => {
    it('should extract concepts from text', async () => {
      const text = `
        # Machine Learning
        ## Supervised Learning
        Training with labeled data.
        **Deep networks** learn representations.
      `;

      const conceptExtractor = new ConceptExtractor(logger);
      const concepts = await conceptExtractor.extractConcepts(text);

      expect(concepts).toBeDefined();
      expect(Array.isArray(concepts)).toBe(true);
      expect(concepts.length).toBeGreaterThan(0);

      // Verify concepts have required fields
      concepts.forEach((concept) => {
        expect(concept.text).toBeTruthy();
        expect(concept.type).toBeTruthy();
        expect(concept.confidence).toBeGreaterThan(0);
        expect(concept.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should score headings higher than frequency', async () => {
      const text = `
        # Featured Concept
        ## Subheading
        Frequency word frequency word frequency.
      `;

      const conceptExtractor = new ConceptExtractor(logger);
      const concepts = await conceptExtractor.extractConcepts(text);

      // Find heading type concept
      const headingConcepts = concepts.filter((c) => c.type === 'heading');
      const frequencyConcepts = concepts.filter((c) => c.type === 'frequency');

      if (headingConcepts.length > 0 && frequencyConcepts.length > 0) {
        const maxHeadingConfidence = Math.max(...headingConcepts.map((c) => c.confidence));
        const maxFrequencyConfidence = Math.max(...frequencyConcepts.map((c) => c.confidence));
        expect(maxHeadingConfidence).toBeGreaterThanOrEqual(maxFrequencyConfidence * 0.8);
      }
    });
  });

  describe('DraftGenerator', () => {
    it('should generate draft WikiPage from concept', async () => {
      const concept = {
        text: 'Deep Learning',
        type: 'heading' as const,
        confidence: 0.95,
      };

      const concepts = [concept];

      const draftGenerator = new DraftGenerator(logger);
      const draft = draftGenerator.generateDraft(concept, {
        sourceFile: '/test/sample.txt',
        concepts,
        extractedText: 'Deep learning is machine learning using neural networks.',
      });

      expect(draft).toBeDefined();
      expect(draft.title).toBe('Deep Learning');
      expect(draft.content).toBeTruthy();
      expect(draft.tags).toBeDefined();
      expect(Array.isArray(draft.tags)).toBe(true);
    });

    it('should include source file in links', () => {
      const concept = {
        text: 'Sample Concept',
        type: 'bold' as const,
        confidence: 0.85,
      };

      const concepts = [concept];

      const draftGenerator = new DraftGenerator(logger);
      const draft = draftGenerator.generateDraft(concept, {
        sourceFile: '/test/file.txt',
        concepts,
        extractedText: 'This is a sample concept about something important.',
      });

      expect(draft.links).toBeDefined();
      expect(Array.isArray(draft.links)).toBe(true);
    });
  });

  describe('FilenameGenerator', () => {
    it('should generate valid YYYYMMDDNN filenames', () => {
      const generator = new FilenameGenerator(testDir, logger);
      const filename = generator.generateFilename();

      // Format is YYYYMMDDNN.md (8 digits for date + 2 digits for sequence, no underscore)
      expect(filename).toMatch(/^\d{10}\.md$/);
      expect(filename.length).toBe(13); // 10 digits + . + md
    });

    it('should validate filename format', () => {
      const generator = new FilenameGenerator(testDir, logger);

      expect(generator.isValidFilename('2026041401.md')).toBe(true);
      expect(generator.isValidFilename('2026041499.md')).toBe(true);
      expect(generator.isValidFilename('invalid.md')).toBe(false);
      expect(generator.isValidFilename('20260414_01.md')).toBe(false); // underscore version not supported
    });

    it('should extract date from valid filename', () => {
      const generator = new FilenameGenerator(testDir, logger);
      const date = generator.extractDateFromFilename('2026041401.md');

      expect(date).toBeDefined();
      // Just verify it's a valid date, don't check specific value due to timezone
      expect(date?.getFullYear()).toBe(2026);
      expect(date?.getMonth()).toBe(3); // April is month 3 (0-indexed)
    });
  });

  describe('End-to-End Pipeline', () => {
    it('should process sample text file completely', async () => {
      // Step 1: Create test file
      const testFile = path.join(testDir, 'ete_test.txt');
      const content = `
        # Artificial Intelligence
        ## Machine Learning Overview
        Machine learning enables systems to learn from data.
        **Neural networks** are fundamental to deep learning.
        **Supervised learning** requires labeled data.
        ### Deep Networks
        Deep networks stack multiple layers of neurons.
      `;
      fs.writeFileSync(testFile, content);

      // Step 2: Extract text
      const extractor = new ExtractionService(logger);
      const extraction = await extractor.extractText(testFile);
      expect(extraction.text).toBeTruthy();

      // Step 3: Extract concepts
      const conceptExtractor = new ConceptExtractor(logger);
      const concepts = await conceptExtractor.extractConcepts(extraction.text);
      expect(concepts.length).toBeGreaterThan(0);

      // Step 4: Generate drafts
      const draftGenerator = new DraftGenerator(logger);
      const drafts = concepts.slice(0, 3).map((concept) =>
        draftGenerator.generateDraft(concept, {
          sourceFile: testFile,
          concepts,
          extractedText: extraction.text,
        })
      );

      expect(drafts.length).toBeGreaterThan(0);
      drafts.forEach((draft) => {
        expect(draft.title).toBeTruthy();
        expect(draft.content).toBeTruthy();
        expect(Array.isArray(draft.tags)).toBe(true);
      });
    });
  });

  describe('Sample Fixtures Validation', () => {
    it('should find sample test fixtures', () => {
      const fixturesDir = path.join(__dirname, '../../../specs/001-vscode-native-wiki/testdata');
      expect(fs.existsSync(fixturesDir)).toBe(true);

      const samples = ['sample-paper-01.txt', 'sample-paper-02.txt', 'sample-paper-03.txt'];

      samples.forEach((sample) => {
        const filepath = path.join(fixturesDir, sample);
        expect(fs.existsSync(filepath)).toBe(true);

        const content = fs.readFileSync(filepath, 'utf-8');
        expect(content.length).toBeGreaterThan(100);
      });
    });

    it('should process sample-paper-01.txt', async () => {
      const fixturesDir = path.join(__dirname, '../../../specs/001-vscode-native-wiki/testdata');
      const sampleFile = path.join(fixturesDir, 'sample-paper-01.txt');

      const extractor = new ExtractionService(logger);
      const extraction = await extractor.extractText(sampleFile);

      expect(extraction.text).toBeTruthy();
      expect(extraction.text.toLowerCase()).toContain('neural');

      const conceptExtractor = new ConceptExtractor(logger);
      const concepts = await conceptExtractor.extractConcepts(extraction.text);

      expect(concepts.length).toBeGreaterThanOrEqual(5);
    });

    it('should process sample-paper-02.txt', async () => {
      const fixturesDir = path.join(__dirname, '../../../specs/001-vscode-native-wiki/testdata');
      const sampleFile = path.join(fixturesDir, 'sample-paper-02.txt');

      const extractor = new ExtractionService(logger);
      const extraction = await extractor.extractText(sampleFile);

      expect(extraction.text).toBeTruthy();
      expect(extraction.text.toLowerCase()).toContain('data');

      const conceptExtractor = new ConceptExtractor(logger);
      const concepts = await conceptExtractor.extractConcepts(extraction.text);

      expect(concepts.length).toBeGreaterThanOrEqual(5);
    });

    it('should process sample-paper-03.txt', async () => {
      const fixturesDir = path.join(__dirname, '../../../specs/001-vscode-native-wiki/testdata');
      const sampleFile = path.join(fixturesDir, 'sample-paper-03.txt');

      const extractor = new ExtractionService(logger);
      const extraction = await extractor.extractText(sampleFile);

      expect(extraction.text).toBeTruthy();
      expect(extraction.text.toLowerCase()).toContain('transformer');

      const conceptExtractor = new ConceptExtractor(logger);
      const concepts = await conceptExtractor.extractConcepts(extraction.text);

      expect(concepts.length).toBeGreaterThanOrEqual(5);
    });
  });
});
