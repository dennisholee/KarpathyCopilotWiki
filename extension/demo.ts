#!/usr/bin/env node

/**
 * Integration Test: Full Workflow Demonstration
 * Tests ingestion → search → lint → archive workflow
 */

import * as path from 'path';
import { Logger } from './src/utils/logger';
import { WikiManager } from './src/wiki/wiki-manager';
import { SearchEngine } from './src/search/search-engine';
import { IndexManager } from './src/index/index-manager';
import { QueryHandler } from './src/query/queryCommand';
import { DecisionArchiver } from './src/query/decisionArchiver';

async function runFullDemonstration() {
  const workspacePath = path.resolve(__dirname, '..');
  const logger = new Logger('demo');

  console.log('\n' + '='.repeat(70));
  console.log('🚀 PERSONAL WIKI EXTENSION - FULL WORKFLOW DEMONSTRATION');
  console.log('='.repeat(70) + '\n');

  try {
    // =====================
    // STEP 1: INITIALIZATION
    // =====================
    console.log('📋 STEP 1: Initialize Components\n');

    const wikiManager = new WikiManager(workspacePath, logger);
    const searchEngine = new SearchEngine(wikiManager, logger);
    const indexManager = new IndexManager(workspacePath, logger);
    const queryHandler = new QueryHandler(searchEngine, wikiManager, logger);
    const archiver = new DecisionArchiver(
      path.join(workspacePath, 'wiki'),
      logger
    );

    console.log('✅ Components initialized\n');

    // =====================
    // STEP 2: CREATE SAMPLE PAGES
    // =====================
    console.log('-'.repeat(70));
    console.log('📄 STEP 2: Create Sample Wiki Pages\n');

    const samplePages = [
      {
        title: 'Neural Networks Fundamentals',
        content: `# Neural Networks

Neural networks are computational models inspired by biological brains.

## Architecture

A typical neural network consists of:
- **Input layer**: Receives raw data
- **Hidden layers**: Extract features through learned transformations
- **Output layer**: Produces predictions

## Activation Functions

Common activation functions used in neural networks:
- ReLU: Rectified Linear Unit (max(0, x))
- Sigmoid: Logistic curve squashing to [0,1]
- Tanh: Hyperbolic tangent, range [-1,1]

## Training

Neural networks are trained using:
- **Backpropagation**: Algorithm for computing gradients
- **Optimization**: SGD, Adam, RMSprop adjust weights
- **Loss functions**: MSE, Cross-entropy measure errors`,
        metadata: {
          tags: ['neural-networks', 'machine-learning', 'fundamentals'],
          aliases: ['NN', 'Neural Net'],
          entities: [
            { concept: 'Neural Network', confidence: 0.99 },
            { concept: 'Backpropagation', confidence: 0.95 },
            { concept: 'Activation Function', confidence: 0.92 },
          ],
        },
      },
      {
        title: 'Attention Mechanisms',
        content: `# Attention Mechanisms

Attention allows neural networks to focus on relevant parts of input sequences.

## Core Concept

The attention mechanism computes a weighted combination of values based on query-key interactions.

## Query-Key-Value Framework

- **Query (Q)**: What to look for
- **Key (K)**: What each position contains
- **Value (V)**: Information to aggregate

Attention(Q, K, V) = softmax(QK^T/√d)V

## Multi-Head Attention

Running multiple attention heads in parallel:
- Each head focuses on different aspects
- Outputs are concatenated and projected
- Increases model capacity and robustness

## Applications

- Machine translation
- Question answering
- Document summarization
- Vision transformers

Related pages: [[Neural Networks Fundamentals]], [[Transformers]]`,
        metadata: {
          tags: ['attention', 'transformers', 'neural-networks'],
          entities: [
            { concept: 'Attention', confidence: 0.98 },
            { concept: 'Query-Key-Value', confidence: 0.96 },
            { concept: 'Multi-Head Attention', confidence: 0.94 },
          ],
        },
      },
      {
        title: 'Transformers Architecture',
        content: `# Transformer Architecture

Introduced in "Attention is All You Need" (Vaswani et al., 2017), Transformers revolutionized NLP.

## Components

### Self-Attention Layer
Every position can attend to every other position, enabling parallel processing.

### Position-wise Feed-Forward Networks
Two-layer MLP applied to each position independently:
- First layer: Projects to higher dimension
- ReLU activation
- Second layer: Projects back to d_model dimension

### Layer Normalization
Applied before (pre-norm) or after (post-norm) each sub-layer.

### Positional Encoding
Since attention is permutation-invariant, positional information is added to embeddings.

## Encoder-Decoder Structure

- **Encoder**: Stack of attention + FF layers
- **Decoder**: Masked self-attention + cross-attention + FF
- **Cross-attention**: Decoder attends to encoder outputs

## Advantages

- Enables parallel processing (unlike RNNs)
- Long-range dependencies via attention
- Scales to very large models (BERT, GPT, T5)

Related: [[Attention Mechanisms]], [[Neural Networks Fundamentals]]`,
        metadata: {
          tags: ['transformers', 'attention', 'nlp', 'architecture'],
          entities: [
            { concept: 'Transformer', confidence: 0.99 },
            { concept: 'Self-Attention', confidence: 0.97 },
            { concept: 'Positional Encoding', confidence: 0.91 },
          ],
        },
      },
      {
        title: 'Data Quality Dimensions',
        content: `# Data Quality Framework

High-quality data is essential for building robust machine learning systems.

## Five Dimensions

### 1. Completeness
Measure: % of non-null values
- Missing values reduce training signal
- Can be handled via imputation or deletion
- Track nulls per field and overall

### 2. Accuracy
Measure: % of correct/valid values
- Values match ground truth or business rules
- Outlier detection identifies anomalies
- Validation constraints catch errors

### 3. Consistency
Measure: Uniformity across sources/time
- Same entity represented identically
- Format standardization
- Cross-table referential integrity

### 4. Uniqueness
Measure: % of unique values (vs duplicates)
- Eliminate redundant records
- Primary key constraints
- Deduplication strategies

### 5. Timeliness
Measure: Freshness and latency
- Data available when needed
- Age of most recent update
- SLA compliance

## Quality Score

Overall quality = w1*Completeness + w2*Accuracy + w3*Consistency + w4*Uniqueness + w5*Timeliness

Related: [[Neural Networks Fundamentals]]`,
        metadata: {
          tags: ['data-quality', 'data-governance', 'metrics'],
          entities: [
            { concept: 'Data Quality', confidence: 0.98 },
            { concept: 'Completeness', confidence: 0.96 },
            { concept: 'Accuracy', confidence: 0.96 },
          ],
        },
      },
    ];

    let createdCount = 0;
    for (const page of samplePages) {
      try {
        await wikiManager.createPage(page.title, page.content, page.metadata);
        createdCount++;
        console.log(`✓ Created: ${page.title}`);
      } catch (error) {
        console.log(`✗ Failed to create ${page.title}: ${String(error)}`);
      }
    }

    console.log(`\n✅ Created ${createdCount}/${samplePages.length} pages\n`);

    // =====================
    // STEP 3: INITIALIZE SEARCH
    // =====================
    console.log('-'.repeat(70));
    console.log('🔍 STEP 3: Initialize Search Engine\n');

    await searchEngine.initialize();
    console.log('✅ Search engine initialized with BM25 index\n');

    // =====================
    // STEP 4: TEST SEARCHES
    // =====================
    console.log('-'.repeat(70));
    console.log('🔎 STEP 4: Test Search Queries\n');

    const testQueries = [
      'attention mechanisms',
      'neural networks',
      'data quality',
      'transformers architecture',
      'activation functions',
    ];

    for (const query of testQueries) {
      console.log(`📌 Query: "${query}"`);

      const result = await queryHandler.query(query, {
        maxResults: 3,
        useLocalEmbeddings: false,
      });

      if (result.results.length > 0) {
        for (const r of result.results) {
          console.log(
            `   ✓ ${r.title} (${(r.relevanceScore * 100).toFixed(0)}%)`
          );
        }
      } else {
        console.log('   (no results)');
      }

      console.log(`   ⏱️  ${result.executionTime}ms\n`);
    }

    // =====================
    // STEP 5: REBUILD INDEX
    // =====================
    console.log('-'.repeat(70));
    console.log('📑 STEP 5: Rebuild Wiki Index\n');

    await indexManager.rebuildIndex();
    console.log('✅ Index rebuilt\n');

    // =====================
    // STEP 6: LINT ANALYSIS
    // =====================
    console.log('-'.repeat(70));
    console.log('🔍 STEP 6: Run Lint Analysis\n');

    const lintResult = await wikiManager.lint(false); // Deep lint
    console.log(`✓ Orphaned pages: ${lintResult.orphanCount || 0}`);
    if (lintResult.contradictionCount !== undefined) {
      console.log(`✓ Contradictions found: ${lintResult.contradictionCount}`);
    }
    if (lintResult.qualityScore !== undefined) {
      console.log(`✓ Quality score: ${(lintResult.qualityScore || 0).toFixed(1)}/100`);
    }
    console.log();

    // =====================
    // STEP 7: ARCHIVE DECISION
    // =====================
    console.log('-'.repeat(70));
    console.log('💾 STEP 7: Archive a Decision\n');

    const conversation = [
      {
        speaker: 'user' as const,
        message: 'What is the difference between attention and transformers?',
        timestamp: new Date(),
      },
      {
        speaker: 'assistant' as const,
        message:
          'Attention is a mechanism that allows models to focus on relevant parts of input. ' +
          'Transformers are a neural network architecture built entirely on attention mechanisms, ' +
          'enabling parallel processing of sequences without recurrence.',
        timestamp: new Date(),
      },
      {
        speaker: 'user' as const,
        message: 'How do they relate to data quality?',
        timestamp: new Date(),
      },
      {
        speaker: 'assistant' as const,
        message:
          'Transformers require high-quality training data. Data quality dimensions like ' +
          'completeness, accuracy, and consistency directly impact model performance.',
        timestamp: new Date(),
      },
    ];

    const decision = await archiver.archiveConversation(
      'Transformers and Attention: Key Concepts',
      conversation,
      ['Attention Mechanisms', 'Transformers Architecture', 'Data Quality Dimensions']
    );

    if (decision) {
      console.log(`✅ Decision archived: ${decision.filename}`);
      console.log(`   Title: ${decision.title}`);
      console.log(`   Conversation turns: ${decision.conversationLength}`);
      console.log(`   Created: ${decision.created.toISOString()}\n`);
    }

    // =====================
    // STEP 8: VERIFY FILES
    // =====================
    console.log('-'.repeat(70));
    console.log('📁 STEP 8: Verify Created Files\n');

    const fs = await import('fs');
    const wikiDir = path.join(workspacePath, 'wiki');
    const decisionsDir = path.join(wikiDir, 'decisions');

    const wikiFiles = fs.readdirSync(wikiDir).filter((f) => f.endsWith('.md'));
    console.log(`Pages in /wiki: ${wikiFiles.length}`);
    console.log(`   Including: INDEX.md, GLOSSARY.md, + ${wikiFiles.length - 2} content pages\n`);

    const decisions = fs.readdirSync(decisionsDir).filter((f) => f.endsWith('.md'));
    console.log(`Decisions in /wiki/decisions: ${decisions.length}`);
    if (decisions.length > 0) {
      console.log(`   Most recent: ${decisions.sort().reverse()[0]}\n`);
    }

    // =====================
    // SUMMARY
    // =====================
    console.log('='.repeat(70));
    console.log('✅ WORKFLOW DEMONSTRATION COMPLETE');
    console.log('='.repeat(70));

    const summary = `
Summary:
  Pages created:        ${createdCount}
  Total wiki pages:     ${wikiFiles.length}
  Archived decisions:   ${decisions.length}
  
  Search queries tested: ${testQueries.length}
  Quality score:        ${(lintResult.qualityScore || 0).toFixed(1)}/100
  Orphaned pages:       ${lintResult.orphanCount || 0}
  
  Status: ✅ All systems operational!

Next Steps:
  1. Browse /wiki/decisions to view archived decisions
  2. View /wiki/INDEX.md for page overview
  3. View /wiki/GLOSSARY.md for auto-generated glossary
  4. Try custom search queries in code
  5. Integrate with VS Code Copilot Chat
    `;

    console.log(summary);
    console.log('='.repeat(70) + '\n');
  } catch (error) {
    console.error('\n❌ Demonstration failed:', error);
    process.exit(1);
  }
}

// Run demonstration
runFullDemonstration().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
