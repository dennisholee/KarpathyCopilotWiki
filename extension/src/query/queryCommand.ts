/**
 * Query Handler for Wiki Search
 * Implements search with Copilot-primary and local-fallback embeddings strategy
 */

import { Logger } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';
import { SearchEngine } from '../search/search-engine';
import { WikiManager } from '../wiki/wiki-manager';
import {
  AnsweringPolicy,
  ConflictItem,
  CoverageGap,
  EvidenceBundle,
  PreviousWikiTurn,
  QueryCoverageAssessment,
  StructuredAnswer,
  StructuredAnswerConfidence,
  SupportingFact,
  WikiAnswerEnvelope,
} from '../models/types';
import { formatStructuredAnswer } from './answerFormatter';
import { createDefaultAnsweringPolicy } from './groundTruthMode';

export interface QueryOptions {
  maxResults?: number;
  useLocalEmbeddings?: boolean;
  previousTurn?: PreviousWikiTurn;
  effectiveQuery?: string;
  answeringPolicy?: AnsweringPolicy;
}

export interface QueryResult {
  query: string;
  effectiveQuery: string;
  results: SearchResultDetail[];
  sources: string[];
  usedFallback: boolean;
  executionTime: number;
  evidenceBundle: EvidenceBundle;
  answeringPolicy?: AnsweringPolicy;
  answer: StructuredAnswer;
  answerEnvelope?: WikiAnswerEnvelope;
}

export interface SearchResultDetail {
  pageId: string;
  title: string;
  excerpt: string;
  relevanceScore: number;
  matchType: 'title' | 'content' | 'semantic';
  sourceFile?: string;
  sourceReferences: string[];
  plaintext: string;
}

export class QueryHandler {
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private searchEngine: SearchEngine;
  private wikiManager: WikiManager;

  constructor(searchEngine: SearchEngine, wikiManager: WikiManager, logger: Logger) {
    this.searchEngine = searchEngine;
    this.wikiManager = wikiManager;
    this.logger = logger;
    this.errorHandler = new ErrorHandler(logger);
  }

  /**
   * Execute search query with fallback strategy
   */
  async query(userQuery: string, options: QueryOptions = {}): Promise<QueryResult> {
    const startTime = Date.now();
    const maxResults = options.maxResults || 5;
    let usedFallback = false;
    const effectiveQuery = options.effectiveQuery?.trim() || userQuery;
    const answeringPolicy = options.answeringPolicy || createDefaultAnsweringPolicy();

    try {
      this.logger.info(`Executing query: "${effectiveQuery}"`);

      // Step 1: Try Copilot Chat primary search (if available from context)
      const primaryResults = await this.searchPrimary(effectiveQuery, maxResults);

      if (primaryResults.length > 0) {
        this.logger.info(`Found ${primaryResults.length} results via primary search`);
        const evidenceBundle = this.buildEvidenceBundle(effectiveQuery, primaryResults);
        const answer = this.buildStructuredAnswer(userQuery, evidenceBundle, answeringPolicy);
        return {
          query: userQuery,
          effectiveQuery,
          results: primaryResults,
          sources: this.extractSources(primaryResults),
          usedFallback: false,
          executionTime: Date.now() - startTime,
          evidenceBundle,
          answeringPolicy,
          answer,
          answerEnvelope: this.buildAnswerEnvelope(userQuery, effectiveQuery, answer),
        };
      }

      // Step 2: Fall back to local embeddings if available and enabled
      if (options.useLocalEmbeddings) {
        this.logger.info('Falling back to local embeddings search');
        const fallbackResults = await this.searchLocalFallback(effectiveQuery, maxResults);

        if (fallbackResults.length > 0) {
          usedFallback = true;
          this.logger.info(`Found ${fallbackResults.length} results via fallback search`);
          const evidenceBundle = this.buildEvidenceBundle(effectiveQuery, fallbackResults);
          const answer = this.buildStructuredAnswer(userQuery, evidenceBundle, answeringPolicy);
          return {
            query: userQuery,
            effectiveQuery,
            results: fallbackResults,
            sources: this.extractSources(fallbackResults),
            usedFallback: true,
            executionTime: Date.now() - startTime,
            evidenceBundle,
            answeringPolicy,
            answer,
            answerEnvelope: this.buildAnswerEnvelope(userQuery, effectiveQuery, answer),
          };
        }
      }

      // Step 3: Basic keyword search fallback
      this.logger.info('Using basic keyword search fallback');
      const keywordResults = await this.searchKeywords(effectiveQuery, maxResults);
      const evidenceBundle = this.buildEvidenceBundle(effectiveQuery, keywordResults);
      const answer = this.buildStructuredAnswer(userQuery, evidenceBundle, answeringPolicy);

      return {
        query: userQuery,
        effectiveQuery,
        results: keywordResults,
        sources: this.extractSources(keywordResults),
        usedFallback: keywordResults.length > 0 && primaryResults.length === 0,
        executionTime: Date.now() - startTime,
        evidenceBundle,
        answeringPolicy,
        answer,
        answerEnvelope: this.buildAnswerEnvelope(userQuery, effectiveQuery, answer),
      };
    } catch (error) {
      this.logger.error(`Query execution failed: ${String(error)}`);

      const evidenceBundle = this.createInsufficientEvidenceBundle(effectiveQuery);
      const answer = this.buildStructuredAnswer(userQuery, evidenceBundle, answeringPolicy);

      // Ultimate fallback: return empty results gracefully
      return {
        query: userQuery,
        effectiveQuery,
        results: [],
        sources: [],
        usedFallback: true,
        executionTime: Date.now() - startTime,
        evidenceBundle,
        answeringPolicy,
        answer,
        answerEnvelope: this.buildAnswerEnvelope(userQuery, effectiveQuery, answer),
      };
    }
  }

  /**
   * Primary search using Copilot Chat API context
   * Returns semantic search results if configured
   */
  private async searchPrimary(query: string, maxResults: number): Promise<SearchResultDetail[]> {
    try {
      const semanticResults = await this.searchEngine.search(query, maxResults);

      return semanticResults.map((result) => ({
        pageId: result.page.id,
        title: result.page.title,
        excerpt: result.page.plaintext.slice(0, 200),
        relevanceScore: result.score,
        matchType: result.matchType as 'title' | 'content' | 'semantic',
        sourceFile: result.page.sourceUri,
        sourceReferences: result.page.sourceReferences || [],
        plaintext: result.page.plaintext,
      }));
    } catch (error) {
      this.logger.warn(`Primary search failed: ${String(error)}`);
      return [];
    }
  }

  /**
   * Fallback search using local embeddings
   * Placeholder for sentence-transformers integration (Phase 3)
   */
  private async searchLocalFallback(query: string, maxResults: number): Promise<SearchResultDetail[]> {
    try {
      this.logger.debug('Attempting local embeddings search');

      // TODO: Implement with sentence-transformers in Phase 3
      // For now, return empty to allow keyword search fallback
      return [];
    } catch (error) {
      this.logger.debug(`Local fallback search failed: ${String(error)}`);
      return [];
    }
  }

  /**
   * Keyword-based search fallback
   * Searches page titles and content for query terms
   */
  private async searchKeywords(query: string, maxResults: number): Promise<SearchResultDetail[]> {
    try {
      const terms = query
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 1);

      if (terms.length === 0) {
        this.logger.warn('No searchable terms found');
        return [];
      }

      // Search all wiki pages
      const pages = await this.wikiManager.listPages();
      
      if (!pages || pages.length === 0) {
        this.logger.warn('No wiki pages available for search');
        return [];
      }
      
      const scored: Array<SearchResultDetail & { score: number }> = [];

      for (const page of pages) {
        if (!page || !page.id || !page.title) {
          this.logger.debug('Skipping invalid page');
          continue;
        }

        let score = 0;

        // Title matches score highest
        const pageTitle = page.title.toLowerCase();
        for (const term of terms) {
          if (pageTitle.includes(term)) {
            score += 3;
          }
        }

        // Content matches score lower
        const plaintext = page.plaintext?.toLowerCase() || '';
        for (const term of terms) {
          const matches = (plaintext.match(new RegExp(term, 'g')) || []).length;
          score += matches * 0.5;
        }

        if (score > 0) {
          const excerpt = plaintext.slice(0, 200) || "(No preview available)";
          scored.push({
            pageId: page.id,
            title: page.title,
            excerpt,
            relevanceScore: Math.min(score / 10, 1), // Normalize to 0-1
            matchType: 'title',
            sourceReferences: page.sourceReferences || [],
            plaintext: page.plaintext,
            score,
          });
        }
      }

      // Sort by score and return top results
      const results = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(({ score, ...result }) => result);
      
      this.logger.info(`Keyword search found ${results.length} results`);
      return results;
    } catch (error) {
      this.logger.error(`Keyword search failed: ${String(error)}`);
      return [];
    }
  }

  /**
   * Extract source file references from results
   */
  private extractSources(results: SearchResultDetail[]): string[] {
    const sources = new Set<string>();

    for (const result of results) {
      for (const sourceReference of result.sourceReferences) {
        sources.add(sourceReference);
      }

      if (sources.size === 0 && result.sourceFile) {
        sources.add(result.sourceFile);
      }
    }

    return Array.from(sources);
  }

  private buildEvidenceBundle(query: string, results: SearchResultDetail[]): EvidenceBundle {
    if (results.length === 0) {
      return this.createInsufficientEvidenceBundle(query);
    }

    const supportingFacts = this.extractSupportingFacts(query, results);
    const conflicts = this.detectConflicts(query, supportingFacts);
    const sourceReferences = Array.from(
      new Set(results.flatMap((result) => result.sourceReferences))
    );

    const coverageAssessment = this.assessCoverage(query, supportingFacts, conflicts, results);
    const coverageGaps = this.buildCoverageGaps(query, coverageAssessment, supportingFacts);

    return {
      supportingPages: results.slice(0, 5).map((result) => ({
        pageId: result.pageId,
        title: result.title,
        sourceReferences: result.sourceReferences,
      })),
      supportingFacts,
      sourceReferences,
      coverageAssessment,
      conflicts,
      coverageGaps,
    };
  }

  private createInsufficientEvidenceBundle(query: string): EvidenceBundle {
    return {
      supportingPages: [],
      supportingFacts: [],
      sourceReferences: [],
      coverageAssessment: 'insufficient',
      conflicts: [],
      coverageGaps: [
        {
          missingTopic: query,
          reason: 'The available wiki material does not provide enough grounded evidence to answer this query.',
          suggestedFollowUp: `Try a narrower query related to "${query}" or ingest more supporting source material.`,
        },
      ],
    };
  }

  private extractSupportingFacts(query: string, results: SearchResultDetail[]): SupportingFact[] {
    const queryTerms = this.extractQueryTerms(query);
    const facts: SupportingFact[] = [];
    const seenStatements = new Set<string>();

    for (const result of results.slice(0, 5)) {
      const candidateSentences = this.extractSentences(result.plaintext)
        .filter((sentence) => this.isRelevantSentence(sentence, queryTerms))
        .slice(0, 3);

      for (const sentence of candidateSentences) {
        const normalizedSentence = sentence.toLowerCase();
        if (seenStatements.has(normalizedSentence)) {
          continue;
        }

        seenStatements.add(normalizedSentence);
        facts.push({
          pageId: result.pageId,
          title: result.title,
          statement: sentence,
          sourceReferences: result.sourceReferences,
        });
      }
    }

    if (facts.length === 0 && results[0]) {
      facts.push({
        pageId: results[0].pageId,
        title: results[0].title,
        statement: results[0].excerpt,
        sourceReferences: results[0].sourceReferences,
      });
    }

    return facts.slice(0, 6);
  }

  private detectConflicts(query: string, facts: SupportingFact[]): ConflictItem[] {
    const conflicts: ConflictItem[] = [];
    const queryTerms = this.extractQueryTerms(query);

    for (let leftIndex = 0; leftIndex < facts.length; leftIndex++) {
      for (let rightIndex = leftIndex + 1; rightIndex < facts.length; rightIndex++) {
        const left = facts[leftIndex];
        const right = facts[rightIndex];

        const leftPolarity = this.getSentencePolarity(left.statement);
        const rightPolarity = this.getSentencePolarity(right.statement);
        const overlap = this.getTermOverlap(left.statement, right.statement, queryTerms);

        if (leftPolarity !== 'neutral' && rightPolarity !== 'neutral' && leftPolarity !== rightPolarity && overlap >= 2) {
          conflicts.push({
            topic: query,
            summary: `${left.title} and ${right.title} provide conflicting guidance about ${query}.`,
            supportingPages: [left.title, right.title],
            supportingSources: Array.from(new Set([...left.sourceReferences, ...right.sourceReferences])),
          });
        }
      }
    }

    return conflicts.slice(0, 3);
  }

  private assessCoverage(
    query: string,
    facts: SupportingFact[],
    conflicts: ConflictItem[],
    results: SearchResultDetail[]
  ): QueryCoverageAssessment {
    if (results.length === 0 || facts.length === 0) {
      return 'insufficient';
    }

    if (conflicts.length > 0) {
      return 'conflicted';
    }

    const queryTerms = this.extractQueryTerms(query);
    const factTerms = new Set(facts.flatMap((fact) => this.extractQueryTerms(fact.statement)));
    const coveredTerms = queryTerms.filter((term) => factTerms.has(term)).length;
    const coverageRatio = queryTerms.length === 0 ? 0 : coveredTerms / queryTerms.length;

    if (coverageRatio >= 0.7 || results.length >= 2) {
      return 'complete';
    }

    return 'partial';
  }

  private buildCoverageGaps(
    query: string,
    coverageAssessment: QueryCoverageAssessment,
    facts: SupportingFact[]
  ): CoverageGap[] {
    if (coverageAssessment === 'complete') {
      return [];
    }

    if (coverageAssessment === 'conflicted') {
      return [
        {
          missingTopic: query,
          reason: 'The available evidence conflicts, so the answer includes the most defensible position but cannot fully resolve the disagreement.',
          suggestedFollowUp: `Review the cited sources for "${query}" to determine which guidance should be treated as authoritative.`,
        },
      ];
    }

    if (facts.length === 0) {
      return [
        {
          missingTopic: query,
          reason: 'No sufficiently relevant grounded evidence was found in the wiki.',
          suggestedFollowUp: `Try a narrower query related to "${query}" or ingest additional supporting material.`,
        },
      ];
    }

    return [
      {
        missingTopic: query,
        reason: 'Only part of the question is supported by the currently retrieved evidence.',
        suggestedFollowUp: `Ask a narrower follow-up about one aspect of "${query}" for a more precise grounded answer.`,
      },
    ];
  }

  private buildStructuredAnswer(
    query: string,
    evidenceBundle: EvidenceBundle,
    answeringPolicy: AnsweringPolicy
  ): StructuredAnswer {
    const supportingReferences = [
      ...evidenceBundle.supportingPages.map((page) => `Wiki: ${page.title}`),
      ...evidenceBundle.sourceReferences.map((source) => `Source: ${source}`),
    ];

    if (evidenceBundle.coverageAssessment === 'insufficient') {
      return {
        mode: answeringPolicy.mode,
        directAnswer: answeringPolicy.allowSupplementalSources
          ? 'The available wiki material does not contain enough grounded information to answer this question completely. Flexible mode may supplement with broader context when remote synthesis is available.'
          : 'The available wiki material does not contain enough grounded information to answer this question completely.',
        keyDetails: [],
        supportingReferences,
        conflicts: [],
        coverageGaps: evidenceBundle.coverageGaps.map((gap) => `${gap.reason} ${gap.suggestedFollowUp}`),
        confidenceLabel: 'insufficient-support',
        usedSupplementalKnowledge: false,
      };
    }

    const directAnswerFacts = evidenceBundle.supportingFacts.slice(0, 2).map((fact) => fact.statement);
    const directAnswer = directAnswerFacts.join(' ');
    const keyDetails = evidenceBundle.supportingFacts.slice(2, 6).map((fact) => fact.statement);

    return {
      mode: answeringPolicy.mode,
      directAnswer: directAnswer || 'The wiki contains relevant evidence, but the answer should be treated as only partially supported.',
      keyDetails,
      supportingReferences: Array.from(new Set(supportingReferences)),
      conflicts: evidenceBundle.conflicts.map((conflict) => `${conflict.summary} Sources: ${conflict.supportingSources.join(', ')}`),
      coverageGaps: evidenceBundle.coverageGaps.map((gap) => `${gap.reason} ${gap.suggestedFollowUp}`),
      confidenceLabel: evidenceBundle.coverageAssessment === 'complete' ? 'supported' : 'partially-supported',
      usedSupplementalKnowledge: false,
    };
  }

  private buildAnswerEnvelope(
    query: string,
    effectiveQuery: string,
    answer: StructuredAnswer
  ): WikiAnswerEnvelope {
    return {
      query,
      effectiveQuery,
      mode: answer.mode || 'strict',
      directAnswer: answer.directAnswer,
      supportingReferences: answer.supportingReferences,
      coverageGaps: answer.coverageGaps,
      usedSupplementalKnowledge: Boolean(answer.usedSupplementalKnowledge),
    };
  }

  private extractQueryTerms(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .map((term) => term.replace(/[^a-z0-9]/g, ''))
      .filter((term) => term.length > 2);
  }

  private extractSentences(text: string): string[] {
    return text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 20)
      .slice(0, 20);
  }

  private isRelevantSentence(sentence: string, queryTerms: string[]): boolean {
    const normalizedSentence = sentence.toLowerCase();
    return queryTerms.some((term) => normalizedSentence.includes(term));
  }

  private getSentencePolarity(sentence: string): 'positive' | 'negative' | 'neutral' {
    const normalized = sentence.toLowerCase();
    const negativePatterns = ['must not', 'cannot', 'can not', 'should not', 'is not', 'are not', 'never', 'without', 'forbidden', 'disallowed'];
    const positivePatterns = ['must', 'can', 'should', 'is', 'are', 'required', 'allowed', 'include', 'includes'];

    if (negativePatterns.some((pattern) => normalized.includes(pattern))) {
      return 'negative';
    }

    if (positivePatterns.some((pattern) => normalized.includes(pattern))) {
      return 'positive';
    }

    return 'neutral';
  }

  private getTermOverlap(left: string, right: string, queryTerms: string[]): number {
    const leftTerms = new Set(this.extractQueryTerms(left));
    const rightTerms = new Set(this.extractQueryTerms(right));

    return queryTerms.filter((term) => leftTerms.has(term) && rightTerms.has(term)).length;
  }

  withDirectAnswer(
    queryResult: QueryResult,
    directAnswer: string,
    options: {
      usedSupplementalKnowledge?: boolean;
      confidenceLabel?: StructuredAnswerConfidence;
    } = {}
  ): QueryResult {
    const usedSupplementalKnowledge = Boolean(options.usedSupplementalKnowledge);
    const confidenceLabel = options.confidenceLabel
      || (usedSupplementalKnowledge && queryResult.answer.confidenceLabel === 'insufficient-support'
        ? 'partially-supported'
        : queryResult.answer.confidenceLabel);

    const updatedAnswer: StructuredAnswer = {
      ...queryResult.answer,
      directAnswer,
      usedSupplementalKnowledge,
      confidenceLabel,
    };

    return {
      ...queryResult,
      answer: updatedAnswer,
      answerEnvelope: this.buildAnswerEnvelope(queryResult.query, queryResult.effectiveQuery, updatedAnswer),
    };
  }

  /**
   * Format query results for context injection to Copilot Chat
   */
  formatContextMessage(queryResult: QueryResult): string {
    const formattedAnswer = formatStructuredAnswer(queryResult.answer);

    if (queryResult.usedFallback) {
      return `${formattedAnswer}\n\n*Note: Grounding used fallback retrieval.*`;
    }

    return formattedAnswer;
  }
}
