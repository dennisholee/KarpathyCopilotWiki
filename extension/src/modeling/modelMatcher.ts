import { QueryResult } from '../query/queryCommand';
import { ExistingModelCandidate, ModelingRequirement, ModelSelectionResult } from '../models/types';

const ENTITY_HINTS = ['model', 'entity', 'aggregate', 'portfolio', 'transaction', 'account', 'customer'];
const REQUEST_VERBS = new Set(['add', 'include', 'with', 'capture', 'track', 'extend', 'enhance', 'rename']);
const GENERIC_ENTITY_TERMS = new Set(['model', 'entity', 'aggregate']);
const ENTITY_BOUNDARY_TERMS = new Set(['to', 'for', 'on', 'within', 'in', 'of', 'the', 'a', 'an', 'and', 'or', 'with']);

export class ModelMatcher {
  buildRequirement(rawRequest: string): ModelingRequirement {
    const normalizedRequest = rawRequest.trim().replace(/\s+/g, ' ');
    const requestedChanges = this.extractRequestedChanges(normalizedRequest);
    const inferredEntityName = this.inferEntityName(normalizedRequest);

    return {
      rawRequest,
      normalizedRequest,
      requestedChanges,
      inferredEntityName,
    };
  }

  selectBaseline(rawRequest: string, queryResult: QueryResult): ModelSelectionResult {
    const requirement = this.buildRequirement(rawRequest);
    const candidates: ExistingModelCandidate[] = queryResult.results
      .slice(0, 5)
      .map((result) => ({
        pageId: result.pageId,
        title: result.title,
        relevanceScore: result.relevanceScore,
        matchType: result.matchType,
        sourceReferences: result.sourceReferences,
        contentExcerpt: result.excerpt,
        plaintext: result.plaintext,
        effectiveScore: 0,
      }))
      .map((candidate) => ({
        ...candidate,
        effectiveScore: this.scoreCandidate(candidate, requirement),
      }))
      .sort((left, right) => (right.effectiveScore ?? right.relevanceScore) - (left.effectiveScore ?? left.relevanceScore))
      .slice(0, 3);

    const baselineCandidate = candidates[0];
    const baselineScore = baselineCandidate?.effectiveScore ?? 0;
    const hasCredibleMatch = Boolean(
      baselineCandidate && (baselineScore >= 0.2 || baselineCandidate.matchType === 'title')
    );

    if (!hasCredibleMatch) {
      return {
        requirement,
        candidates,
        needsRefinement: true,
        refinementReason: candidates.length === 0
          ? 'No sufficiently credible existing model matched the request.'
          : `The strongest candidate (${baselineCandidate?.title ?? 'unknown'}) did not score as a credible baseline.`,
      };
    }

    return {
      requirement,
      candidates,
      baselineCandidate,
      needsRefinement: false,
    };
  }

  private extractRequestedChanges(request: string): string[] {
    const structuredSegments = [
      ...Array.from(
        request.matchAll(/(?:extend|enhance)\s+(?:the\s+)?[a-z0-9_\- ]+\b(?:model|entity|aggregate)\b\s+with\s+([^.;]+)/gi)
      ).map((match) => match[1]),
      ...Array.from(
        request.matchAll(/(?:add|include|with|capture|track|rename)\s+([^.;]+)/gi)
      ).map((match) => match[1]),
    ];

    const explicitSegments = structuredSegments
      .flatMap((segment) => segment.split(/,|\band\b/gi))
      .map((part) => part.trim())
      .filter((part) => part.length > 1)
      .map((part) => part.replace(/^(a|an|the)\s+/i, ''))
      .map((part) => part.replace(/^(add|include|with|capture|track|extend|enhance|rename)\s+/i, ''))
      .map((part) => this.stripTrailingModelContext(part));

    if (explicitSegments.length > 0) {
      return this.unique(explicitSegments.map((segment) => this.normalizePhrase(segment)));
    }

    return [this.normalizePhrase(request)];
  }

  private stripTrailingModelContext(value: string): string {
    return value
      .replace(/\s+(?:to|for|on|within|in)\s+the\s+[a-z0-9_\- ]+\b(?:model|entity|aggregate)\b$/i, '')
      .replace(/\s+(?:to|for|on|within|in)\s+[a-z0-9_\- ]+\b(?:model|entity|aggregate)\b$/i, '')
      .trim();
  }

  private inferEntityName(request: string): string {
    const tokens = request.toLowerCase().match(/[a-z0-9]+/g) || [];
    const contextualEntity = this.extractContextualEntity(tokens);
    if (contextualEntity) {
      return contextualEntity;
    }

    const explicitEntity = tokens.find((token) => ENTITY_HINTS.includes(token) && !GENERIC_ENTITY_TERMS.has(token));
    if (explicitEntity) {
      return explicitEntity;
    }

    const firstMeaningfulToken = tokens.find((token) => !REQUEST_VERBS.has(token) && !GENERIC_ENTITY_TERMS.has(token));
    return firstMeaningfulToken || 'proposed_model';
  }

  private normalizePhrase(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private unique(values: string[]): string[] {
    return Array.from(new Set(values.filter((value) => value.length > 0)));
  }

  private extractContextualEntity(tokens: string[]): string | undefined {
    for (let index = 1; index < tokens.length; index += 1) {
      if (!GENERIC_ENTITY_TERMS.has(tokens[index])) {
        continue;
      }

      const entityTokens: string[] = [];

      for (let tokenIndex = index - 1; tokenIndex >= 0; tokenIndex -= 1) {
        const token = tokens[tokenIndex];

        if (REQUEST_VERBS.has(token) || GENERIC_ENTITY_TERMS.has(token) || ENTITY_BOUNDARY_TERMS.has(token)) {
          break;
        }

        entityTokens.unshift(token);
      }

      if (entityTokens.length > 0) {
        return entityTokens.join(' ');
      }
    }

    return undefined;
  }

  private scoreCandidate(candidate: ExistingModelCandidate, requirement: ModelingRequirement): number {
    let score = candidate.relevanceScore;
    const inferredEntity = requirement.inferredEntityName.toLowerCase();

    if (!inferredEntity || GENERIC_ENTITY_TERMS.has(inferredEntity)) {
      return score;
    }

    const normalizedTitle = candidate.title.toLowerCase();
    const normalizedExcerpt = candidate.contentExcerpt.toLowerCase();
    const normalizedPlaintext = candidate.plaintext.toLowerCase();

    if (this.matchesTokenSequence(normalizedTitle, inferredEntity)) {
      score += 0.75;
    }

    if (this.matchesTokenSequence(normalizedTitle, `${inferredEntity} model`) || this.matchesTokenSequence(normalizedTitle, `${inferredEntity} entity`)) {
      score += 0.5;
    }

    if (this.matchesTokenSequence(normalizedExcerpt, inferredEntity)) {
      score += 0.2;
    }

    if (this.matchesTokenSequence(normalizedPlaintext, inferredEntity)) {
      score += 0.1;
    }

    return score;
  }

  private matchesTokenSequence(value: string, phrase: string): boolean {
    const valueTokens = value.match(/[a-z0-9]+/g) || [];
    const phraseTokens = phrase.match(/[a-z0-9]+/g) || [];

    if (valueTokens.length === 0 || phraseTokens.length === 0 || phraseTokens.length > valueTokens.length) {
      return false;
    }

    for (let startIndex = 0; startIndex <= valueTokens.length - phraseTokens.length; startIndex += 1) {
      let matches = true;

      for (let phraseIndex = 0; phraseIndex < phraseTokens.length; phraseIndex += 1) {
        if (valueTokens[startIndex + phraseIndex] !== phraseTokens[phraseIndex]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        return true;
      }
    }

    return false;
  }
}