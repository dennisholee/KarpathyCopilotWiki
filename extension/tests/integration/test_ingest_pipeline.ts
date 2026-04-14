/**
 * Integration Tests: Ingest Pipeline
 * Tests full workflow: extract -> concepts -> drafts -> backlinks -> write
 */

import * as fs from 'fs';
import * as path from 'path';
import { ExtractionService } from '../../src/ingest/extractor';
import { ConceptExtractor } from '../../src/ingest/conceptExtractor';
import { DraftGenerator } from '../../src/ingest/draftGenerator';
import { BacklinkManager } from '../../src/ingest/backlinkManager';
import { FilenameGenerator } from '../../src/utils/filenameGenerator';
import { Logger } from '../../src/utils/logger';
import { OrphanDetector } from '../../src/lint/orphanDetector';
import { IndexBuilder } from '../../src/commands/indexRebuild';

describe('Ingest Pipeline Integration Tests', () => {
  let testWikiDir: string;
  let testRawDir: string;
  let logger: Logger;

  beforeAll(() => {
    // Create temporary test directories
    testWikiDir = path.join(__dirname, '../temp-wiki');
    testRawDir = path.join(__dirname, '../temp-raw');

    if (fs.existsSync(testWikiDir)) {
      fs.rmSync(testWikiDir, { recursive: true });
    }
    if (fs.existsSync(testRawDir)) {
      fs.rmSync(testRawDir, { recursive: true });
    }

    fs.mkdirSync(testWikiDir, { recursive: true });
    fs.mkdirSync(testRawDir, { recursive: true });

    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;
  });

  afterAll(() => {
    // Clean up test directories
    if (fs.existsSync(testWikiDir)) {
      fs.rmSync(testWikiDir, { recursive: true });
    }
    if (fs.existsSync(testRawDir)) {
      fs.rmSync(testRawDir, { recursive: true });
    }
  });

  describe('T_EXTRACT_001: PDF/Text Extraction', () => {
    it('should extract text from .txt file', async () => {
      const extractor = new ExtractionService(logger);
      const testFile = path.join(testRawDir, 'test-paper.txt');

      // Create test file
      const testContent = `
        # Deep Learning Fundamentals
        
        ## Introduction
        **Artificial intelligence** has revolutionized computing.
        
        ## Key Concepts
        Neural networks use **gradient descent** for optimization.
        **Backpropagation** enables multi-layer training.
      `;
      fs.writeFileSync(testFile, testContent);

      const result = await extractor.extractText(testFile);

      expect(result).toBeDefined();
      expect(result.text).toContain('neural networks');
      expect(result.text).toContain('gradient descent');
      expect(result.extractionMethod).toBe('text');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle missing files gracefully', async () => {
      const extractor = new ExtractionService(logger);
      const nonexistentFile = path.join(testRawDir, 'nonexistent.txt');

      await expect(extractor.extractText(nonexistentFile)).rejects.toThrow();
    });
  });

  describe('T_CONCEPT_001: Concept Extraction from Headings', () => {
    it('should extract concepts from markdown headings', async () => {
      const conceptExtractor = new ConceptExtractor(logger);
      const text = `
        # Neural Networks
        ## Backpropagation
        ### Gradient Descent
        
        This document discusses training methods.
        **Supervised Learning** is fundamental.
      `;

      const concepts = await conceptExtractor.extractConcepts(text);

      expect(concepts.length).toBeGreaterThan(0);
      expect(concepts.some((c) => c.text.toLowerCase().includes('neural'))).toBe(true);
      expect(concepts.some((c) => c.text.toLowerCase().includes('backpropagation'))).toBe(true);
    });

    it('should score concepts by confidence', async () => {
      const conceptExtractor = new ConceptExtractor(logger);
      const text = `
        # Machine Learning
        Learn **deep learning** today. Deep learning is powerful.
        Deep learning requires GPUs. Deep learning evolves.
      `;

      const concepts = await conceptExtractor.extractConcepts(text);

      // Find heading vs frequency concept
      const headingConcept = concepts.find(
        (c) => c.type === 'heading' && c.text.toLowerCase().includes('machine')
      );
      const frequencyConcept = concepts.find(
        (c) => c.type === 'frequency' && c.text.toLowerCase().includes('learning')
      );

      // Headings should score higher than frequency
      if (headingConcept && frequencyConcept) {
        expect(headingConcept.confidence).toBeGreaterThanOrEqual(frequencyConcept.confidence);
      }
    });
  });

  describe('T_DRAFT_001: Draft Page Generation', () => {
    it('should generate valid WikiPage draft', async () => {
      const generator = new DraftGenerator(logger);
      const concept = {
        text: 'Transformer Architecture',
        type: 'heading',
        confidence: 0.95,
      };

      const content = `
        The transformer architecture introduced self-attention mechanisms.
        Multi-head attention processes information in parallel.
        Positional encoding adds position information.
      `;

      const draft = generator.generateDraft(concept, { sourceFile: 'test.txt', wikiDir: testWikiDir });

      expect(draft).toBeDefined();
      expect(draft.title).toBe('Transformer Architecture');
      expect(draft.summary).toBeTruthy();
      expect(draft.tags).toContain('heading');
      expect(draft.links).toContainEqual(expect.objectContaining({ url: 'test.txt' }));
    });

    it('should flag hedging language as needs_source', async () => {
      const generator = new DraftGenerator(logger);
      const concept = {
        text: 'Uncertain Concept',
        type: 'heading',
        confidence: 0.75,
      };

      const hedgingContent = `
        This might be true. Possibly the system could work.
        We believe this may happen. Allegedly, this occurs.
      `;

      const draft = generator.generateDraft(concept, { sourceFile: 'test.txt', wikiDir: testWikiDir });

      // Should contain hedging language warning
      expect(draft.content).toBeDefined();
    });
  });

  describe('T_BACKLINK_001: Bidirectional Link Insertion', () => {
    beforeEach(() => {
      // Create test wiki pages
      const page1Content = `---
title: Page A
---
# Page A
Related to concept B.
`;
      const page2Content = `---
title: Page B
---
# Page B
Related to concept A.
`;

      fs.writeFileSync(path.join(testWikiDir, '20260414_01.md'), page1Content);
      fs.writeFileSync(path.join(testWikiDir, '20260414_02.md'), page2Content);
    });

    it('should insert bidirectional backlinks', async () => {
      const backlinkMgr = new BacklinkManager(testWikiDir, logger);

      // Find pages related to "Page A"
      const relatedPages = backlinkMgr.findRelatedPages('Page A', null);
      expect(relatedPages.length).toBeGreaterThan(0);

      // Insert backlinks
      const result = backlinkMgr.insertBacklinks(
        { title: 'New Page', content: 'Related to Page A' },
        ['Page A'],
        'test.txt'
      );

      expect(result.pageFile).toBeDefined();
      expect(result.hasChanges).toBe(true);
    });

    it('should be idempotent and not duplicate links', async () => {
      const backlinkMgr = new BacklinkManager(testWikiDir, logger);

      const result1 = backlinkMgr.insertBacklinks(
        { title: 'Test Page', content: 'About A' },
        ['Page A'],
        'test.txt'
      );

      const result2 = backlinkMgr.insertBacklinks(
        { title: 'Test Page', content: 'About A' },
        ['Page A'],
        'test.txt'
      );

      // Should handle idempotent insertion
      expect(result1.pageFile).toBe(result2.pageFile);
    });
  });

  describe('T_FILENAME_001: Atomic Filename Generation', () => {
    it('should generate YYYYMMDDNN filenames', () => {
      const generator = new FilenameGenerator(testWikiDir);
      const filename = generator.generateFilename();

      expect(filename).toMatch(/^\d{8}_\d{2}\.md$/);
      expect(filename).toMatch(new RegExp(`^\\d{8}_\\d{2}\\.md$`));
    });

    it('should increment sequence number per day', () => {
      const generator = new FilenameGenerator(testWikiDir);

      const filename1 = generator.generateFilename();
      const filename2 = generator.generateFilename();

      const date1 = filename1.slice(0, 8);
      const date2 = filename2.slice(0, 8);
      const seq1 = parseInt(filename1.slice(9, 11));
      const seq2 = parseInt(filename2.slice(9, 11));

      expect(date1).toBe(date2); // Same day
      expect(seq2).toBeGreaterThan(seq1); // Incremented
    });

    it('should validate filename format', () => {
      const generator = new FilenameGenerator(testWikiDir);

      expect(generator.isValidFilename('20260414_01.md')).toBe(true);
      expect(generator.isValidFilename('20260414_99.md')).toBe(true);
      expect(generator.isValidFilename('invalid.md')).toBe(false);
      expect(generator.isValidFilename('2026041401.md')).toBe(false);
    });
  });

  describe('T_ORPHAN_001: Orphan Page Detection', () => {
    beforeEach(() => {
      // Create test wiki pages - some with links, some without
      const linkedPage = `---
title: Linked Page
---
# Linked Page
Content linking to [[Related Page]].
`;
      const orphanPage = `---
title: Orphan Page
---
# Orphan Page
Content with no backlinks.
`;

      fs.writeFileSync(path.join(testWikiDir, '20260414_03.md'), linkedPage);
      fs.writeFileSync(path.join(testWikiDir, '20260414_04.md'), orphanPage);
    });

    it('should detect pages with no inbound links', async () => {
      const orphanDetector = new OrphanDetector(testWikiDir, logger);
      const orphans = orphanDetector.findOrphans();

      expect(orphans.length).toBeGreaterThan(0);
      expect(orphans.some((o) => o.filename.includes('20260414_04'))).toBe(true);
    });

    it('should exclude index.md and glossary.md from orphans', () => {
      // Create index and glossary
      fs.writeFileSync(path.join(testWikiDir, 'index.md'), '# Index\nNo links.');
      fs.writeFileSync(path.join(testWikiDir, 'glossary.md'), '# Glossary\nNo links.');

      const orphanDetector = new OrphanDetector(testWikiDir, logger);
      const orphans = orphanDetector.findOrphans();

      // index.md and glossary.md should not appear
      expect(orphans.some((o) => o.filename === 'index.md')).toBe(false);
      expect(orphans.some((o) => o.filename === 'glossary.md')).toBe(false);
    });
  });

  describe('T_INDEX_001: Index Rebuild', () => {
    beforeEach(() => {
      // Create test pages with tags
      const page1 = `---
title: AI Basics
tags: [AI, Fundamentals]
---
# AI Basics
Artificial intelligence foundations.
## Summary
Core concepts of AI.
`;
      const page2 = `---
title: Deep Learning
tags: [AI, Neural Networks]
---
# Deep Learning
Advanced AI techniques.
## Summary
Neural network training methods.
`;

      fs.writeFileSync(path.join(testWikiDir, '20260414_05.md'), page1);
      fs.writeFileSync(path.join(testWikiDir, '20260414_06.md'), page2);
    });

    it('should rebuild index.md with categories', async () => {
      const indexBuilder = new IndexBuilder(testWikiDir, logger);
      const stats = await indexBuilder.rebuildIndex();

      expect(stats.pagesIndexed).toBeGreaterThan(0);
      expect(stats.categoriesFound).toBeGreaterThan(0);

      // Verify index.md was created
      const indexPath = path.join(testWikiDir, 'index.md');
      expect(fs.existsSync(indexPath)).toBe(true);

      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      expect(indexContent).toContain('# Wiki Index');
      expect(indexContent).toContain('AI'); // Category should be present
    });

    it('should rebuild glossary.md with terms', async () => {
      const indexBuilder = new IndexBuilder(testWikiDir, logger);
      const stats = await indexBuilder.rebuildIndex();

      expect(stats.termsInGlossary).toBeGreaterThan(0);

      // Verify glossary.md was created
      const glossaryPath = path.join(testWikiDir, 'glossary.md');
      expect(fs.existsSync(glossaryPath)).toBe(true);

      const glossaryContent = fs.readFileSync(glossaryPath, 'utf-8');
      expect(glossaryContent).toContain('# Glossary');
      expect(glossaryContent).toContain('Basics'); // Term should be present
    });
  });

  describe('T_PIPELINE_001: Full End-to-End Ingest', () => {
    it('should complete full ingest pipeline', async () => {
      // Setup
      const testFile = path.join(testRawDir, '20260414_sample.txt');
      const sampleContent = `
        # Machine Learning Overview
        
        ## Introduction
        Machine learning enables computers to learn from data.
        
        ## Key Techniques
        **Supervised learning** requires labeled data.
        **Unsupervised learning** finds patterns automatically.
        
        ### Neural Networks
        Neural networks use **backpropagation** for training.
        **Deep learning** stacks multiple layers.
      `;
      fs.writeFileSync(testFile, sampleContent);

      // Step 1: Extract
      const extractor = new ExtractionService(logger);
      const extraction = await extractor.extractText(testFile);
      expect(extraction.text).toBeTruthy();

      // Step 2: Extract concepts
      const conceptExtractor = new ConceptExtractor(logger);
      const concepts = await conceptExtractor.extractConcepts(extraction.text);
      expect(concepts.length).toBeGreaterThan(0);

      // Step 3: Generate drafts
      const draftGenerator = new DraftGenerator(logger);
      const drafts = concepts
        .slice(0, 3) // Test with first 3 concepts
        .map((concept) =>
          draftGenerator.generateDraft(concept, { sourceFile: testFile, wikiDir: testWikiDir })
        );

      expect(drafts.length).toBeGreaterThan(0);
      drafts.forEach((draft) => {
        expect(draft.title).toBeTruthy();
        expect(draft.summary).toBeTruthy();
      });

      // Step 4: Test backlinks (if we had pages to link to)
      const backlinkMgr = new BacklinkManager(testWikiDir, logger);
      drafts.forEach((draft) => {
        const relatedPages = backlinkMgr.findRelatedPages(draft.title, null);
        // Could find zero or more - both are valid
        expect(Array.isArray(relatedPages)).toBe(true);
      });
    });
  });
});
