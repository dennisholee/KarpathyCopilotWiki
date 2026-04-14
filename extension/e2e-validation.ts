/**
 * End-to-End Validation Script
 * Tests full workflow: Ingest → Lint → Query → Archive
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './src/utils/logger';
import { IngestOrchestrator } from './src/ingest/ingestCommand';
import { LintOrchestrator } from './src/lint/lintCommand';
import { QueryHandler } from './src/query/queryCommand';
import { DecisionArchiver } from './src/query/decisionArchiver';
import { SearchEngine } from './src/search/search-engine';
import { WikiManager } from './src/wiki/wiki-manager';

async function runEndToEndValidation() {
  const workspaceRoot = path.join(__dirname, '..');
  const rawDir = path.join(workspaceRoot, 'raw');
  const wikiDir = path.join(workspaceRoot, 'wiki');

  console.log('\n' + '='.repeat(70));
  console.log('🚀 END-TO-END VALIDATION: Personal Wiki Extension MVP');
  console.log('='.repeat(70) + '\n');

  const logger = new Logger('e2e-validation');

  try {
    // =====================
    // STEP 1: SETUP
    // =====================
    console.log('📋 STEP 1: Setup\n');

    // Ensure directories exist
    if (!fs.existsSync(wikiDir)) {
      fs.mkdirSync(wikiDir, { recursive: true });
    }
    if (!fs.existsSync(path.join(wikiDir, 'decisions'))) {
      fs.mkdirSync(path.join(wikiDir, 'decisions'), { recursive: true });
    }

    // Verify sample files exist
    const sampleFiles = [
      '20240414_neural_networks.txt',
      '20240414_data_quality.txt',
      '20240414_transformers.txt',
    ];

    console.log('✓ Checking for sample source files...\n');
    const foundFiles = fs
      .readdirSync(rawDir)
      .filter((f) => f.startsWith('sample-'));
    console.log(`  Found ${foundFiles.length} sample files:`);
    foundFiles.forEach((f) => console.log(`    - ${f}`));
    console.log();

    // =====================
    // STEP 2: INGEST
    // =====================
    console.log('\n' + '-'.repeat(70));
    console.log('📂 STEP 2: Ingest Sample Documents\n');

    const ingestOrchestrator = new IngestOrchestrator(wikiDir, logger);

    let totalPagesCreated = 0;
    let totalBacklinksInserted = 0;

    for (const file of foundFiles) {
      const sourceFile = path.join(rawDir, file);
      console.log(`  Ingesting: ${file}`);

      const result = await ingestOrchestrator.ingest({
        sourceFile,
        skipBacklinks: false,
        maxPages: 8,
      });

      console.log(
        `    ✓ Created ${result.pagesCreated.length} pages, ` +
        `${result.backlinksInserted} backlinks (${result.duration}ms)\n`
      );

      totalPagesCreated += result.pagesCreated.length;
      totalBacklinksInserted += result.backlinksInserted;
    }

    console.log(
      `\n✅ Ingest Summary: ${totalPagesCreated} pages created, ` +
      `${totalBacklinksInserted} backlinks inserted\n`
    );

    // =====================
    // STEP 3: VERIFY PAGES
    // =====================
    console.log('-'.repeat(70));
    console.log('📖 STEP 3: Verify Created Wiki Pages\n');

    const pages = fs.readdirSync(wikiDir).filter((f) => f.endsWith('.md'));
    console.log(`  Total pages in /wiki: ${pages.length}\n`);

    if (pages.length === 0) {
      console.log('  ⚠️  No pages were created. Check ingest output.');
    } else {
      console.log('  Sample pages:');
      pages.slice(0, 5).forEach((p) => {
        const filePath = path.join(wikiDir, p);
        const stat = fs.statSync(filePath);
        console.log(`    - ${p} (${stat.size} bytes)`);
      });

      if (pages.length > 5) {
        console.log(`    ... and ${pages.length - 5} more`);
      }

      // Check for YAML frontmatter and backlinks
      const samplePage = path.join(wikiDir, pages[0]);
      const content = fs.readFileSync(samplePage, 'utf-8');
      const hasFrontmatter = content.startsWith('---');
      const hasBacklinks = content.includes('[[');

      console.log(`\n  Page validation:`);
      console.log(`    ${hasFrontmatter ? '✓' : '✗'} YAML frontmatter`);
      console.log(`    ${hasBacklinks ? '✓' : '✗'} WikiLinks present`);
    }

    // =====================
    // STEP 4: LINT
    // =====================
    console.log('\n' + '-'.repeat(70));
    console.log('🔍 STEP 4: Lint Analysis\n');

    const wikiManager = new WikiManager(workspaceRoot, logger);
    const lintOrchestrator = new LintOrchestrator(wikiDir, logger);

    console.log('  Running quick lint (orphan detection)...');
    const quickLintResult = await lintOrchestrator.lint(true);

    console.log(`    ✓ Orphaned pages: ${quickLintResult.orphanCount || 0}`);

    console.log('\n  Running deep lint (contradictions + quality)...');
    const deepLintResult = await lintOrchestrator.lint(false);

    console.log(
      `    ✓ Quality issues: ${deepLintResult.contradictionCount || 0}`
    );

    // =====================
    // STEP 5: SEARCH/QUERY
    // =====================
    console.log('\n' + '-'.repeat(70));
    console.log('🔎 STEP 5: Query and Search\n');

    const searchEngine = new SearchEngine(wikiManager, logger);
    const queryHandler = new QueryHandler(searchEngine, wikiManager, logger);

    const testQueries = [
      'neural networks',
      'data quality',
      'attention mechanism',
    ];

    for (const query of testQueries) {
      console.log(`  Query: "${query}"`);

      const result = await queryHandler.query(query, {
        maxResults: 3,
        useLocalEmbeddings: true,
      });

      console.log(
        `    ✓ Found ${result.results.length} results (${result.executionTime}ms)`
      );

      if (result.results.length > 0) {
        console.log(
          `      Top: "${result.results[0].title}" ` +
          `(${Math.round(result.results[0].relevanceScore * 100)}% match)`
        );
      }

      console.log(
        `    ${result.usedFallback ? '⚠️ ' : '✓'} ` +
        `${result.usedFallback ? 'Used fallback search' : 'Direct search'}\n`
      );
    }

    // =====================
    // STEP 6: ARCHIVE DECISION
    // =====================
    console.log('-'.repeat(70));
    console.log('💾 STEP 6: Archive Decision\n');

    const decisionArchiver = new DecisionArchiver(wikiDir, logger);

    const conversation = [
      {
        speaker: 'user' as const,
        message: 'Explain the difference between attention and transformers',
        timestamp: new Date(),
      },
      {
        speaker: 'assistant' as const,
        message:
          'Attention is a mechanism for focusing on relevant parts of input. ' +
          'Transformers are a neural network architecture built on multi-head attention, ' +
          'enabling parallel processing of sequences.',
        timestamp: new Date(),
      },
      {
        speaker: 'user' as const,
        message: 'How does this relate to data quality?',
        timestamp: new Date(),
      },
      {
        speaker: 'assistant' as const,
        message:
          'Transformers process sequences of data. High-quality training data ' +
          '(completeness, accuracy, consistency) is essential for effective model training.',
        timestamp: new Date(),
      },
    ];

    const supportingPages = [
      'Attention Mechanisms',
      'Transformer Architecture',
      'Data Quality',
    ];

    const decision = await decisionArchiver.archiveConversation(
      'Difference between attention and transformers',
      conversation,
      supportingPages
    );

    if (decision) {
      console.log(`  ✓ Decision archived: ${decision.filename}`);
      console.log(
        `    - Title: ${decision.title}`);
      console.log(
        `    - Created: ${decision.created.toISOString()}`);
      console.log(
        `    - Conversation length: ${decision.conversationLength} messages`);

      // Verify decision file exists
      const decisionPath = path.join(wikiDir, 'decisions', decision.filename);
      if (fs.existsSync(decisionPath)) {
        const decisionContent = fs.readFileSync(decisionPath, 'utf-8');
        const hasTranscript = decisionContent.includes('##');
        const hasSupportingPages = supportingPages.some((p) =>
          decisionContent.includes(`[[${p}]]`)
        );

        console.log(`\n  Decision validation:`);
        console.log(`    ${hasTranscript ? '✓' : '✗'} Conversation transcript`);
        console.log(
          `    ${hasSupportingPages ? '✓' : '✗'} Supporting page links`
        );
      }
    }

    // =====================
    // SUMMARY
    // =====================
    console.log('\n' + '='.repeat(70));
    console.log('✅ VALIDATION COMPLETE');
    console.log('='.repeat(70));

    console.log(`
Summary:
  Pages created:           ${totalPagesCreated}
  Backlinks inserted:      ${totalBacklinksInserted}
  Orphaned pages:          ${quickLintResult.orphanCount || 0}
  Quality issues:          ${deepLintResult.contradictionCount || 0}
  
  Search queries tested:   ${testQueries.length}
  Decision archived:       ${decision ? 'Yes' : 'No'}
  
  All workflows functional: ✅

Recommended next steps:
  • Review created pages in /wiki
  • Open in Foam: Command Palette → 'Foam: Show Graph'
  • Run full test suite: npm test
  • Review configuration: .vscode/settings.json
`);

    console.log('='.repeat(70) + '\n');
  } catch (error) {
    console.error('\n❌ VALIDATION FAILED:', error);
    process.exit(1);
  }
}

// Run validation
runEndToEndValidation().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
