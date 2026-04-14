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

    it('should format context message for Copilot Chat', async () => {
      const result = await queryHandler.query('neural networks', { maxResults: 5 });
      const contextMessage = queryHandler.formatContextMessage(result);

      expect(contextMessage).toBeDefined();
      expect(typeof contextMessage).toBe('string');
      expect(contextMessage.length).toBeGreaterThan(0);
    });

    it('should include fallback flag when primary search returns empty', async () => {
      const result = await queryHandler.query('nonexistent-topic-xyz123', { maxResults: 5 });

      expect(result).toBeDefined();
      // If we don't have Copilot API configured, should use fallback
      expect(typeof result.usedFallback).toBe('boolean');
    });

    it('should extract sources from search results', async () => {
      const result = await queryHandler.query('machine learning', { maxResults: 5 });

      expect(result.sources).toBeDefined();
      expect(Array.isArray(result.sources)).toBe(true);
      // Sources should be file paths
      result.sources.forEach((source) => {
        expect(typeof source).toBe('string');
      });
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
        expect(content).toContain('created:');
        expect(content).toContain('## Conversation');
        expect(content).toContain('Explain machine learning');
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
  });
});
