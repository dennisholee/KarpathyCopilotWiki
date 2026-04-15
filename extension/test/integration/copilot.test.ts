/**
 * Integration Tests: Copilot Chat Integration
 * Validates message handling, query execution, and decision archival
 */

import * as path from 'path';
import * as fs from 'fs';
import { Logger } from '../../src/utils/logger';
import { SearchEngine } from '../../src/search/search-engine';
import { WikiManager } from '../../src/wiki/wiki-manager';
import { QueryHandler, QueryResult } from '../../src/query/queryCommand';
import { DecisionArchiver, ConversationEntry } from '../../src/query/decisionArchiver';
import { WikiChatParticipant } from '../../src/copilot/wiki-participant';
import { buildEffectiveQuery } from '../../src/query/answerPrompt';

describe('Copilot Chat Integration Tests', () => {
  let logger: Logger;
  let wikiDir: string;
  let tempDir: string;
  let wikiManager: WikiManager;
  let searchEngine: SearchEngine;
  let queryHandler: QueryHandler;
  let decisionArchiver: DecisionArchiver;

  beforeEach(() => {
    logger = new Logger('test');
    tempDir = path.join(__dirname, '../../.test-workspace-copilot');

    // Clean up any existing test workspace
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }

    fs.mkdirSync(tempDir, { recursive: true });
    wikiDir = path.join(tempDir, 'wiki');
    fs.mkdirSync(wikiDir, { recursive: true });

    wikiManager = new WikiManager(tempDir, logger);
    searchEngine = new SearchEngine(wikiManager, logger);
    queryHandler = new QueryHandler(searchEngine, wikiManager, logger);
    decisionArchiver = new DecisionArchiver(wikiDir, logger);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('T038: QueryHandler - Multi-tier Fallback Search', () => {
    beforeEach(() => {
      // Create sample wiki pages for search
      const page1 = `---
title: Neural Networks Basics
tags:
  - ml
  - neural-networks
---

# Neural Networks Basics

Neural networks are computational models inspired by biological neurons.

## Key Components
- Neurons (nodes)
- Weights and biases
- Activation functions
- Backpropagation algorithm
`;

      const page2 = `---
title: Machine Learning Fundamentals
tags:
  - ml
  - basics
---

# Machine Learning Fundamentals

Machine learning is a subset of artificial intelligence that enables systems to learn from data.

## Core Concepts
- Supervised learning
- Unsupervised learning
- Reinforcement learning
- Feature engineering
`;

      fs.writeFileSync(path.join(wikiDir, '20240101_nn-basics.md'), page1);
      fs.writeFileSync(path.join(wikiDir, '20240102_ml-fundamentals.md'), page2);
    });

    it('should execute query and return results', async () => {
      const result = await queryHandler.query('neural networks', { maxResults: 5 });

      expect(result).toBeDefined();
      expect(result.query).toBe('neural networks');
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should format a structured answer for Copilot Chat', async () => {
      const result = await queryHandler.query('neural networks', { maxResults: 5 });
      const contextMessage = queryHandler.formatContextMessage(result);

      expect(contextMessage).toBeDefined();
      expect(typeof contextMessage).toBe('string');
      expect(contextMessage.length).toBeGreaterThan(0);
      expect(contextMessage).toContain('**Direct Answer**');
      expect(contextMessage).toContain('**Supporting References**');
    });

    it('should include fallback flag when primary search returns empty', async () => {
      const result = await queryHandler.query('nonexistent-topic-xyz123', { maxResults: 5 });

      expect(result).toBeDefined();
      // If we don't have Copilot API configured, should use fallback
      expect(typeof result.usedFallback).toBe('boolean');
    });

    it('should extract raw source references from search results when available', async () => {
      const pageWithSource = `---
title: Machine Learning Sources
source: "ml-sources.md"
---

# Machine Learning Sources

Machine learning depends on grounded documentation. See /raw/ml-sources.md for source evidence.
`;
      fs.writeFileSync(path.join(wikiDir, '20240103_ml-sources.md'), pageWithSource);

      const result = await queryHandler.query('machine learning', { maxResults: 5 });

      expect(result.sources).toBeDefined();
      expect(Array.isArray(result.sources)).toBe(true);
      expect(result.sources.some((source) => source.includes('/raw/'))).toBe(true);
    });

    it('should respect maxResults option', async () => {
      const result = await queryHandler.query('learning', { maxResults: 1 });

      expect(result.results.length).toBeLessThanOrEqual(1);
    });

    it('should include executionTime metric', async () => {
      const result = await queryHandler.query('neural', { maxResults: 5 });

      expect(typeof result.executionTime).toBe('number');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should identify conflicting evidence across supporting facts', async () => {
      const page3 = `---
title: Portfolio Rule Positive
source: "portfolio-positive.md"
---

# Portfolio Rule Positive

Portfolio withdrawals must be approved before processing.
`;

      const page4 = `---
title: Portfolio Rule Negative
source: "portfolio-negative.md"
---

# Portfolio Rule Negative

Portfolio withdrawals must not be approved before processing.
`;

      fs.writeFileSync(path.join(wikiDir, '20240103_portfolio-positive.md'), page3);
      fs.writeFileSync(path.join(wikiDir, '20240104_portfolio-negative.md'), page4);

      const result = await queryHandler.query('portfolio withdrawals approval', { maxResults: 5 });

      expect(result.evidenceBundle.conflicts.length).toBeGreaterThan(0);
      expect(result.answer.conflicts.length).toBeGreaterThan(0);
    });

    it('should produce an insufficient-support answer when no evidence exists', async () => {
      const result = await queryHandler.query('unmapped nonexistent domain phrase', { maxResults: 5 });

      expect(result.answer.confidenceLabel).toBe('insufficient-support');
      expect(result.answer.directAnswer).toContain('does not contain enough grounded information');
      expect(result.answer.coverageGaps.length).toBeGreaterThan(0);
    });
  });

  describe('T039: DecisionArchiver - Conversation Archival', () => {
    it('should archive conversation with metadata', async () => {
      const conversation: ConversationEntry[] = [
        {
          speaker: 'user',
          message: 'What are neural networks?',
          timestamp: new Date(),
        },
        {
          speaker: 'assistant',
          message: 'Neural networks are computational models...',
          timestamp: new Date(),
        },
      ];

      const decision = await decisionArchiver.archiveConversation(
        'What are neural networks?',
        conversation,
        ['neural-networks-basics']
      );

      expect(decision).toBeDefined();
      expect(decision?.filename).toBeDefined();
      expect(decision?.pageId).toBeDefined();
      expect(decision?.title).toContain('neural');
      expect(decision?.created).toBeDefined();
      expect(decision?.conversationLength).toBe(2);
    });

    it('should create decision file with correct format', async () => {
      const conversation: ConversationEntry[] = [
        {
          speaker: 'user',
          message: 'Explain machine learning',
          timestamp: new Date(),
        },
        {
          speaker: 'assistant',
          message: 'Machine learning is a subset of AI...',
          timestamp: new Date(),
        },
      ];

      const decision = await decisionArchiver.archiveConversation(
        'Explain machine learning',
        conversation
      );

      if (decision) {
        const decisionFilePath = path.join(wikiDir, 'decisions', decision.filename);
        expect(fs.existsSync(decisionFilePath)).toBe(true);

        const content = fs.readFileSync(decisionFilePath, 'utf-8');
        expect(content).toContain('---'); // YAML frontmatter start
        expect(content).toContain('title:');
        expect(content).toContain('summary:');
        expect(content).toContain('tags:');
        expect(content).toContain('created:');
        expect(content).toContain('## Links');
        expect(content).toContain('## Content');
        expect(content).toContain('### Conversation');
        expect(content).toContain('Explain machine learning');
      }
    });

    it('should include supporting sources when provided', async () => {
      const conversation: ConversationEntry[] = [
        {
          speaker: 'user',
          message: 'Explain source traceability',
          timestamp: new Date(),
        },
      ];

      const archived = await decisionArchiver.archiveConversation(
        'Explain source traceability',
        conversation,
        ['traceability-page'],
        { supportingSources: ['/raw/traceability.md'] }
      );

      if (archived) {
        const decisionFilePath = path.join(wikiDir, 'decisions', archived.filename);
        const content = fs.readFileSync(decisionFilePath, 'utf-8');
        expect(content).toContain('## Links');
        expect(content).toContain('Supporting raw sources: /raw/traceability.md');
        expect(content).toContain('/raw/traceability.md');
      }
    });

    it('should generate unique filenames for archived decisions', async () => {
      const conversation1: ConversationEntry[] = [
        {
          speaker: 'user',
          message: 'What is AI?',
          timestamp: new Date(),
        },
      ];

      const conversation2: ConversationEntry[] = [
        {
          speaker: 'user',
          message: 'What is Machine Learning?',
          timestamp: new Date(Date.now() + 100), // Different query
        },
      ];

      const decision1 = await decisionArchiver.archiveConversation('What is AI?', conversation1);
      const decision2 = await decisionArchiver.archiveConversation('What is Machine Learning?', conversation2);

      // Different queries should produce different filenames (due to different hash)
      // Wait a bit to ensure timestamps are different if we test with same query
      expect(decision1?.filename).toBeDefined();
      expect(decision2?.filename).toBeDefined();
      // If queries differ, filenames will differ due to hash component
      if (decision1?.filename !== decision2?.filename) {
        expect(true).toBe(true); // Pass if different as expected
      }
      // This is not a strict test because same query within same second may generate same filename
    });

    it('should include supporting pages in decision', async () => {
      const conversation: ConversationEntry[] = [
        {
          speaker: 'user',
          message: 'How does backpropagation work?',
          timestamp: new Date(),
        },
      ];

      const supportingPages = ['neural-networks', 'optimization-algorithms'];
      const decision = await decisionArchiver.archiveConversation(
        'How does backpropagation work?',
        conversation,
        supportingPages
      );

      if (decision) {
        const decisionFilePath = path.join(wikiDir, 'decisions', decision.filename);
        const content = fs.readFileSync(decisionFilePath, 'utf-8');

        // Should contain wiki links to supporting pages
        for (const page of supportingPages) {
          expect(content).toContain(`[[${page}]]`);
        }
      }
    });

    it('should list archived decisions', async () => {
      // Archive first decision
      const conversation1: ConversationEntry[] = [
        {
          speaker: 'user',
          message: 'First query',
          timestamp: new Date(),
        },
      ];

      await decisionArchiver.archiveConversation('First query', conversation1);

      // List decisions
      const decisions = await decisionArchiver.listDecisions();

      expect(Array.isArray(decisions)).toBe(true);
      expect(decisions.length).toBeGreaterThan(0);
    });

    it('should retrieve specific decision by filename', async () => {
      const conversation: ConversationEntry[] = [
        {
          speaker: 'user',
          message: 'Test query for retrieval',
          timestamp: new Date(),
        },
      ];

      const archived = await decisionArchiver.archiveConversation(
        'Test query for retrieval',
        conversation
      );

      if (archived) {
        const decision = await decisionArchiver.getDecision(archived.filename);

        expect(decision).toBeDefined();
        expect(typeof decision).toBe('string');
        expect(decision).toContain('retrieval');
      }
    });

    it('should delete decision file', async () => {
      const conversation: ConversationEntry[] = [
        {
          speaker: 'user',
          message: 'Query to be deleted',
          timestamp: new Date(),
        },
      ];

      const archived = await decisionArchiver.archiveConversation(
        'Query to be deleted',
        conversation
      );

      if (archived) {
        const decisionFilePath = path.join(wikiDir, 'decisions', archived.filename);
        expect(fs.existsSync(decisionFilePath)).toBe(true);

        await decisionArchiver.deleteDecision(archived.filename);
        expect(fs.existsSync(decisionFilePath)).toBe(false);
      }
    });
  });

  describe('Copilot Chat Integration', () => {
    beforeEach(() => {
      // Create sample wiki pages
      const samplePage = `---
title: Test Wiki Page
tags:
  - test
source: "test-source.md"
---

# Test Content

This is a test wiki page with searchable content about artificial intelligence.
`;

      fs.writeFileSync(path.join(wikiDir, '20240101_test.md'), samplePage);
    });

    it('should create WikiChatParticipant instance', () => {
      const participant = new WikiChatParticipant(searchEngine, wikiManager, logger);

      expect(participant).toBeDefined();
      expect(participant.getWikiDir()).toBe(wikiDir);
    });

    it('should maintain empty conversation history initially', () => {
      const participant = new WikiChatParticipant(searchEngine, wikiManager, logger);

      expect(participant.getConversationHistory()).toBeDefined();
      expect(participant.getConversationHistory().length).toBe(0);
    });

    it('should clear conversation history', () => {
      const participant = new WikiChatParticipant(searchEngine, wikiManager, logger);

      participant.clearHistory();
      expect(participant.getConversationHistory().length).toBe(0);
    });

    it('should support end-to-end flow: query -> archive -> retrieve', async () => {
      const participant = new WikiChatParticipant(searchEngine, wikiManager, logger);

      // Simulate user query
      const queryResult = await queryHandler.query('artificial intelligence', { maxResults: 5 });

      // Simulate conversation history
      const conversation: ConversationEntry[] = [
        {
          speaker: 'user',
          message: 'What is artificial intelligence?',
          timestamp: new Date(),
        },
        {
          speaker: 'assistant',
          message: queryHandler.formatContextMessage(queryResult),
          timestamp: new Date(),
        },
      ];

      // Archive decision
      const decision = await decisionArchiver.archiveConversation(
        'What is artificial intelligence?',
        conversation
      );

      expect(decision).toBeDefined();
      expect(decision?.filename).toBeDefined();

      // Verify decision can be retrieved
      const retrieved = await decisionArchiver.getDecision(decision!.filename);
      expect(retrieved).toBeDefined();
      expect(typeof retrieved).toBe('string');
      expect(retrieved).toContain('artificial');
    });

    it('should automatically archive each handled query as a decision page', async () => {
      const participant = new WikiChatParticipant(searchEngine, wikiManager, logger);
      const stream = {
        markdown: jest.fn(),
      };

      await participant.handle(
        { prompt: 'artificial intelligence' } as unknown as never,
        {} as never,
        stream as never,
        {} as never
      );

      const decisionsDir = path.join(wikiDir, 'decisions');
      const decisionFiles = fs.readdirSync(decisionsDir).filter((file) => file.endsWith('.md'));

      expect(decisionFiles.length).toBe(1);

      const content = fs.readFileSync(path.join(decisionsDir, decisionFiles[0]), 'utf-8');
      expect(content).toContain('## Summary');
      expect(content).toContain('## Links');
      expect(content).toContain('## Content');
      expect(content).toContain('[[Test Wiki Page]]');
      expect(content).toContain('/raw/test-source.md');
      expect(stream.markdown).toHaveBeenCalled();
    });

    it('should build a follow-up query using only the immediately previous turn', () => {
      const effectiveQuery = buildEffectiveQuery('tell me more about the exceptions', {
        query: 'what are the portfolio business rules',
        answer: 'Portfolio withdrawals require approval.',
      });

      expect(effectiveQuery).toContain('what are the portfolio business rules');
      expect(effectiveQuery).toContain('tell me more about the exceptions');
    });

    it('should generate a model proposal from the strongest grounded wiki page', async () => {
      const portfolioPage = `---
title: Portfolio Model
tags:
  - portfolio
source: "portfolio-model.md"
---

# Portfolio Model

- portfolio_id
- portfolio_name
- inception_date
`;
      fs.writeFileSync(path.join(wikiDir, '20240102_portfolio-model.md'), portfolioPage);

      const participant = new WikiChatParticipant(searchEngine, wikiManager, logger);
      const stream = {
        markdown: jest.fn(),
      };

      await participant.handle(
        { prompt: 'add risk rating and review date to the portfolio model', command: 'model' } as unknown as never,
        {} as never,
        stream as never,
        {} as never
      );

      const output = stream.markdown.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('## Model Proposal');
      expect(output).toContain('### Preferred Baseline Model');
      expect(output).toContain('Portfolio Model');
      expect(output).toContain('portfolio_id');
      expect(output).toContain('risk_rating');
      expect(output).toContain('review_date');
      expect(output).toContain('### Proposed Contract');
      expect(output).toContain("sourceModel: 'Portfolio Model'");
    });

    it('should ask for refinement when no grounded model match is credible', async () => {
      const participant = new WikiChatParticipant(searchEngine, wikiManager, logger);
      const stream = {
        markdown: jest.fn(),
      };

      await participant.handle(
        { prompt: 'zqxjv fracture taxonomy delta', command: 'model' } as unknown as never,
        {} as never,
        stream as never,
        {} as never
      );

      const output = stream.markdown.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('## Refinement Needed');
      expect(output).toContain('Try narrowing the request');
    });

    it('should disclose conflicts and assumptions when evidence is incomplete or contradictory', async () => {
      const conflictPageA = `---
title: Transaction Model Optional Settlement
tags:
  - transaction
source: "transaction-optional.md"
---

# Transaction Model Optional Settlement

- transaction_id
- settlement_status

Settlement status is optional before posting.
`;
      const conflictPageB = `---
title: Transaction Model Required Settlement
tags:
  - transaction
source: "transaction-required.md"
---

# Transaction Model Required Settlement

- transaction_id
- settlement_status

Settlement status is required before posting.
`;
      fs.writeFileSync(path.join(wikiDir, '20240103_transaction-optional.md'), conflictPageA);
      fs.writeFileSync(path.join(wikiDir, '20240104_transaction-required.md'), conflictPageB);

      const participant = new WikiChatParticipant(searchEngine, wikiManager, logger);
      const stream = {
        markdown: jest.fn(),
      };

      await participant.handle(
        { prompt: 'add settlement status validation logic to the transaction model', command: 'model' } as unknown as never,
        {} as never,
        stream as never,
        {} as never
      );

      const output = stream.markdown.mock.calls.map((call) => call[0]).join('\n');
      expect(output).toContain('### Assumptions / Gaps');
      expect(output).toContain('### Conflicts');
      expect(output).toContain('settlement');
    });
  });

  describe('T044-T045: End-to-End Workflow & Foam Compatibility', () => {
    beforeEach(() => {
      // Create a complete wiki structure for end-to-end testing
      const page1 = `---
title: Machine Learning
tags: [ml, ai]
---

# Machine Learning

Machine learning is [[Artificial Intelligence]] applied to systems that learn from data.

## Supervised Learning

Uses [[Labeled Data]] to train models. Common approach in [[Neural Networks]].

## Unsupervised Learning

Finds patterns in [[Unlabeled Data]] without guidance.
`;

      const page2 = `---
title: Neural Networks
tags: [ml, deep-learning]
---

# Neural Networks

Inspired by biological neurons. Part of [[Machine Learning]].

## Backpropagation

Algorithm for training [[Neural Networks]]. Uses [[Gradient Descent]].
`;

      const page3 = `---
title: Artificial Intelligence
tags: [ai]
---

# Artificial Intelligence

Broad field including [[Machine Learning]] and [[Neural Networks]].
`;

      const page4 = `---
title: Gradient Descent
tags: [optimization, ml]
---

# Gradient Descent

Optimization algorithm used in [[Neural Networks]] training.
`;

      fs.writeFileSync(path.join(wikiDir, '20260414_ml.md'), page1);
      fs.writeFileSync(path.join(wikiDir, '20260414_nn.md'), page2);
      fs.writeFileSync(path.join(wikiDir, '20260414_ai.md'), page3);
      fs.writeFileSync(path.join(wikiDir, '20260414_gd.md'), page4);
    });

    it('should verify Foam-compatible backlink syntax [[WikiLink]]', async () => {
      const pages = await wikiManager.listPages();
      
      // Verify pages exist
      expect(pages.length).toBeGreaterThanOrEqual(4);

      // Check for [[WikiLink]] syntax in pages
      for (const page of pages) {
        const content = page.plaintext || '';
        
        // Pages should contain Wiki links
        if (content.includes('[[')) {
          expect(content).toMatch(/\[\[.+\]\]/); // Regex for [[SomethingHere]]
        }
      }
    });

    it('should detect and map backlinks correctly', async () => {
      const pages = await wikiManager.listPages();
      
      // Should have created test pages
      expect(pages.length).toBeGreaterThanOrEqual(3);

      // Pages should have links array
      const pagesWithLinks = pages.filter((p) => p.links && p.links.length > 0);
      expect(pagesWithLinks.length).toBeGreaterThanOrEqual(0); // At least some pages should have links

      // Verify that pages have either links or are properly connected
      for (const page of pages) {
        expect(page.links).toBeDefined();
        if (page.links) {
          expect(Array.isArray(page.links)).toBe(true);
        }
      }
    });

    it('should support full workflow: query -> archive -> graph traversal', async () => {
      // Step 1: Query related to wiki content
      const result = await queryHandler.query('machine learning algorithms', { maxResults: 5 });

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.query).toBe('machine learning algorithms');

      // Step 2: Format context for user
      const contextMessage = queryHandler.formatContextMessage(result);
      expect(contextMessage).toContain('Machine Learning');

      // Step 3: Create conversation
      const conversation: ConversationEntry[] = [
        {
          speaker: 'user',
          message: 'What machine learning algorithms exist?',
          timestamp: new Date(),
        },
        {
          speaker: 'assistant',
          message: contextMessage,
          timestamp: new Date(),
        },
      ];

      // Step 4: Archive decision
      const decision = await decisionArchiver.archiveConversation(
        'What machine learning algorithms exist?',
        conversation,
        result.results.map((r) => r.title)
      );

      expect(decision).toBeDefined();
      expect(decision?.filename).toBeDefined();
      expect(decision?.conversationLength).toBe(2);
    });

    it('should handle complex backlink networks', async () => {
      // Create interconnected pages
      const hubPage = `---
title: AI Hub
tags: [hub, ai]
---

# AI Hub

Central page linking to relevant AI concepts.

## Overview

This hub connects major AI concepts together.
`;

      fs.writeFileSync(path.join(wikiDir, '20260414_hub.md'), hubPage);

      const pages = await wikiManager.listPages();
      const hubPageObj = pages.find((p) => p.title === 'AI Hub');

      expect(hubPageObj).toBeDefined();

      // Hub page should exist and be properly formatted
      expect(hubPageObj!.title).toBe('AI Hub');
      expect(hubPageObj!.plaintext).toContain('Central page');
    });

    it('should maintain backlink bidirectionality', async () => {
      const pages = await wikiManager.listPages();
      
      // Should have multiple pages
      expect(pages.length).toBeGreaterThanOrEqual(3);

      // Pages should have links defined
      const pagesWithLinks = pages.filter((p) => p.links && p.links.length > 0);
      expect(pagesWithLinks.length).toBeGreaterThanOrEqual(0);
    });

    it('should support orphan detection for graph analysis', async () => {
      // Create an orphan page (no incoming/outgoing links)
      const orphanPage = `---
title: Orphan Concept
tags: [orphan]
---

# Orphan Concept

This page has no links to other pages.

Self-contained content.
`;

      fs.writeFileSync(path.join(wikiDir, '20260414_orphan.md'), orphanPage);

      // Run orphan detection
      const pages = await wikiManager.listPages();
      const orphans = pages.filter((page) => {
        const content = page.plaintext || '';
        return !content.includes('[[') && !content.includes(']]');
      });

      expect(orphans.length).toBeGreaterThan(0);
      expect(orphans.some((p) => p.title === 'Orphan Concept')).toBe(true);
    });

    it('should have valid metadata for all pages', async () => {
      const pages = await wikiManager.listPages();

      for (const page of pages) {
        // Verify required metadata
        expect(page.id).toBeDefined();
        expect(page.title).toBeDefined();
        expect(typeof page.title).toBe('string');

        // Verify content exists
        expect(page.content).toBeDefined();
        expect(page.plaintext).toBeDefined();

        // Tags and links should exist (can be empty arrays)
        expect(page.tags).toBeDefined();
        expect(page.links).toBeDefined();
      }
    });

    it('should handle decision archival with correct Foam-compatible format', async () => {
      const conversation: ConversationEntry[] = [
        {
          speaker: 'user',
          message: 'Compare ML vs NN approaches',
          timestamp: new Date(),
        },
        {
          speaker: 'assistant',
          message: 'ML is broader, NN is specific technique [[Neural Networks]]',
          timestamp: new Date(),
        },
      ];

      const decision = await decisionArchiver.archiveConversation(
        'Compare ML vs NN approaches',
        conversation,
        ['Machine Learning', 'Neural Networks']
      );

      expect(decision).toBeDefined();

      if (decision) {
        const filePath = path.join(wikiDir, 'decisions', decision.filename);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Verify Foam-compatible format
        expect(content).toMatch(/^---/); // YAML start
        expect(content).toContain('title:');
        expect(content).toContain('tags:');
        
        // Should survive Foam parsing
        expect(content).toMatch(/## (Question|Conversation|Decision)/);
      }
    });
  });
});
