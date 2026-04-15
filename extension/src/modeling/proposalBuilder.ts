import {
  ContractAttribute,
  EvidenceReference,
  ExistingModelCandidate,
  ModelProposal,
  ModelSelectionResult,
  OpenMetadataModelContract,
} from '../models/types';
import { QueryResult } from '../query/queryCommand';

export class ProposalBuilder {
  buildProposal(selection: ModelSelectionResult, queryResult: QueryResult): ModelProposal {
    if (!selection.baselineCandidate) {
      throw new Error('Cannot build a proposal without a baseline candidate.');
    }

    const conflicts = this.buildConflicts(queryResult);
    const evidence = this.buildEvidence(queryResult, selection.baselineCandidate, conflicts);
    const baselineAttributes = this.extractBaselineAttributes(selection.baselineCandidate, evidence);
    const requestedAttributes = selection.requirement.requestedChanges.map((change) =>
      this.createRequestedAttribute(change, selection.baselineCandidate as ExistingModelCandidate, baselineAttributes, evidence)
    );
    const contract = this.buildContract(selection, baselineAttributes, requestedAttributes, evidence);
    const changeSummary = selection.requirement.requestedChanges.map((change) =>
      this.buildChangeSummary(change, baselineAttributes)
    );
    const assumptions = this.buildAssumptions(contract.attributes, queryResult, selection.baselineCandidate, baselineAttributes.length === 0);

    return {
      requirement: selection.requirement,
      baselineModel: selection.baselineCandidate,
      contract,
      rationale: this.buildRationale(selection.baselineCandidate, evidence, conflicts.length),
      changeSummary,
      assumptions,
      conflicts,
      evidence,
    };
  }

  private buildContract(
    selection: ModelSelectionResult,
    baselineAttributes: ContractAttribute[],
    requestedAttributes: ContractAttribute[],
    evidence: EvidenceReference[]
  ): OpenMetadataModelContract {
    const baselineCandidate = selection.baselineCandidate as ExistingModelCandidate;
    const attributes = this.mergeAttributes([...baselineAttributes, ...requestedAttributes]);

    return {
      id: `proposal_${baselineCandidate.pageId}`,
      name: baselineCandidate.title,
      entityName: this.toAttributeName(selection.requirement.inferredEntityName || baselineCandidate.title),
      displayName: baselineCandidate.title,
      version: '1.0.0-proposal',
      domain: this.inferDomain(selection.requirement, baselineCandidate),
      description: `Grounded proposal for enhancing ${baselineCandidate.title} based on the current modelling request.`,
      sourceModel: baselineCandidate.title,
      sourceModelId: baselineCandidate.pageId,
      attributes,
      tags: ['proposal', 'openmetadata', 'wiki-grounded'],
    };
  }

  private buildEvidence(
    queryResult: QueryResult,
    baselineCandidate: ExistingModelCandidate,
    conflicts: string[]
  ): EvidenceReference[] {
    const pageEvidence: EvidenceReference[] = queryResult.evidenceBundle.supportingPages.map((page) => ({
      pageId: page.pageId,
      title: page.title,
      sourceReferences: page.sourceReferences,
      usage: page.pageId === baselineCandidate.pageId
        ? 'Baseline selection and contract derivation.'
        : 'Supporting wiki page used for contract derivation.',
      conflicted: this.isEvidenceConflicted(
        {
          pageId: page.pageId,
          title: page.title,
          sourceReferences: page.sourceReferences,
        },
        queryResult,
        conflicts
      ),
    }));
    const factEvidence: EvidenceReference[] = queryResult.evidenceBundle.supportingFacts.map((fact) => ({
      pageId: fact.pageId,
      title: fact.title,
      sourceReferences: fact.sourceReferences,
      statement: fact.statement,
      usage: fact.statement,
      conflicted: this.isEvidenceConflicted(
        {
          pageId: fact.pageId,
          title: fact.title,
          sourceReferences: fact.sourceReferences,
          statement: fact.statement,
        },
        queryResult,
        conflicts
      ),
    }));

    const combined = [...pageEvidence, ...factEvidence];
    const hasBaselineEvidence = combined.some((item) => item.pageId === baselineCandidate.pageId);

    if (!hasBaselineEvidence) {
      combined.unshift({
        pageId: baselineCandidate.pageId,
        title: baselineCandidate.title,
        sourceReferences: baselineCandidate.sourceReferences,
        statement: baselineCandidate.contentExcerpt,
        usage: 'Baseline selection fallback from the matched wiki page.',
        conflicted: this.isEvidenceConflicted(
          {
            pageId: baselineCandidate.pageId,
            title: baselineCandidate.title,
            sourceReferences: baselineCandidate.sourceReferences,
            statement: baselineCandidate.contentExcerpt,
          },
          queryResult,
          conflicts
        ),
      });
    }

    return combined;
  }

  private extractBaselineAttributes(candidate: ExistingModelCandidate, evidence: EvidenceReference[]): ContractAttribute[] {
    const attributeNames = Array.from(new Set(
      candidate.plaintext
        .split(/\n+/)
        .map((rawLine) => rawLine.trim())
        .filter((rawLine) => this.looksLikeAttributeLine(rawLine, candidate.title))
        .map((rawLine) => rawLine.replace(/^[-*]\s+/, '').trim())
        .map((line) => this.toAttributeName(line))
        .filter((line) => this.looksLikeAttributeName(line))
        .slice(0, 8)
    ));

    return attributeNames.map((name) => {
      const evidenceText = this.buildAttributeEvidenceText(name, name, candidate, evidence);

      return {
        name,
        description: `Existing baseline field preserved from ${candidate.title}.`,
        dataType: this.inferDataType(name, evidenceText),
        required: this.inferRequired(name, evidenceText),
        businessRules: [`Preserve the grounded semantics already documented for ${candidate.title}.`],
        validationLogic: ['Retain baseline validation behavior from the existing model.'],
        sourceReferences: this.selectRelevantSourceReferences(name, candidate.sourceReferences, evidence),
        status: 'existing',
      };
    });
  }

  private createRequestedAttribute(
    change: string,
    candidate: ExistingModelCandidate,
    baselineAttributes: ContractAttribute[],
    evidence: EvidenceReference[]
  ): ContractAttribute {
    const renameInstruction = this.parseRenameInstruction(change, baselineAttributes);
    const name = renameInstruction?.newName ?? this.toAttributeName(change);
    const overlapsExisting = baselineAttributes.some((attribute) => attribute.name === name);
    const evidenceText = this.buildAttributeEvidenceText(name, change, candidate, evidence);
    const relevantSourceReferences = this.collectRelevantSourceReferences(name, evidence);
    const hasRuleEvidence = relevantSourceReferences.length > 0 || evidenceText.trim().length > 0;
    const sourceReferences = relevantSourceReferences.length > 0
      ? relevantSourceReferences
      : hasRuleEvidence
        ? candidate.sourceReferences
        : [];

    return {
      name,
      description: renameInstruction
        ? `Requested rename derived from the modelling request: rename ${renameInstruction.oldName} to ${renameInstruction.newName}.`
        : overlapsExisting
          ? `Requested refinement for the existing ${name} field.`
          : `Requested enhancement derived from the modelling request: ${change}.`,
      dataType: this.inferDataType(change, evidenceText),
      required: this.inferRequired(change, evidenceText),
      businessRules: hasRuleEvidence
        ? [`Populate ${name} consistently with the baseline ${candidate.title} semantics.`]
        : ['Assumption: confirm the business rule for this attribute against additional wiki evidence before implementation.'],
      validationLogic: hasRuleEvidence
        ? [`Reject empty or malformed ${name} values according to the target domain constraints.`]
        : ['Assumption: validation logic is pending because the current wiki evidence is incomplete.'],
      sourceReferences,
      status: renameInstruction ? 'renamed' : hasRuleEvidence ? 'proposed' : 'assumed',
      renameOf: renameInstruction?.oldName,
    };
  }

  private mergeAttributes(attributes: ContractAttribute[]): ContractAttribute[] {
    const merged = new Map<string, ContractAttribute>();

    for (const attribute of attributes) {
      const existing = merged.get(attribute.name);
      if (!existing) {
        merged.set(attribute.name, attribute);
        continue;
      }

      merged.set(attribute.name, {
        ...existing,
        description: attribute.status === 'renamed'
          ? attribute.description
          : existing.status === 'existing' && attribute.status !== 'existing'
            ? `${existing.description} Refined by the modelling request.`
            : existing.description,
        dataType: attribute.status !== 'existing' ? attribute.dataType : existing.dataType,
        required: attribute.status !== 'existing' ? attribute.required : existing.required,
        businessRules: Array.from(new Set([...existing.businessRules, ...attribute.businessRules])),
        validationLogic: Array.from(new Set([...existing.validationLogic, ...attribute.validationLogic])),
        sourceReferences: Array.from(new Set([...existing.sourceReferences, ...attribute.sourceReferences])),
        status: attribute.status === 'renamed'
          ? 'renamed'
          : existing.status === 'existing'
            ? existing.status
            : attribute.status,
        renameOf: attribute.renameOf ?? existing.renameOf,
      });
    }

    return Array.from(merged.values());
  }

  private buildChangeSummary(change: string, baselineAttributes: ContractAttribute[]): string {
    const renameInstruction = this.parseRenameInstruction(change, baselineAttributes);
    if (renameInstruction) {
      return `Rename ${renameInstruction.oldName} to ${renameInstruction.newName} while preserving the baseline semantic intent.`;
    }

    const normalizedName = this.toAttributeName(change);
    const overlapsExisting = baselineAttributes.some((attribute) => attribute.name === normalizedName);
    if (overlapsExisting) {
      return `Refine the existing ${normalizedName} field on top of the baseline model instead of creating a duplicate attribute.`;
    }

    return `Add or refine ${normalizedName} on top of the baseline model.`;
  }

  private parseRenameInstruction(
    change: string,
    baselineAttributes: ContractAttribute[]
  ): { oldName: string; newName: string } | undefined {
    const renameMatch = change.match(/(.+?)\s+to\s+(.+)/i);
    if (!renameMatch) {
      return undefined;
    }

    const oldName = this.toAttributeName(renameMatch[1]);
    const newName = this.toAttributeName(renameMatch[2]);
    const hasBaselineMatch = baselineAttributes.some((attribute) => attribute.name === oldName);

    if (!hasBaselineMatch || !newName) {
      return undefined;
    }

    return { oldName, newName };
  }

  private looksLikeAttributeName(value: string): boolean {
    return value.length > 0 && value.length <= 64 && !value.includes(' ') && /[a-z]/.test(value);
  }

  private looksLikeAttributeLine(rawLine: string, title: string): boolean {
    if (!rawLine || /^#{1,6}\s+/.test(rawLine) || /^given\b|^when\b|^then\b/i.test(rawLine)) {
      return false;
    }

    const normalizedLine = rawLine.replace(/^[-*]\s+/, '').trim();
    if (!normalizedLine || normalizedLine.toLowerCase() === title.toLowerCase()) {
      return false;
    }

    if (/^[-*]\s+/.test(rawLine)) {
      return !/[.:;!?]/.test(normalizedLine);
    }

    return /^[a-z][a-z0-9_]*$/i.test(normalizedLine);
  }

  private inferDomain(requirement: ModelSelectionResult['requirement'], baselineCandidate: ExistingModelCandidate): string {
    return requirement.inferredEntityName || this.toAttributeName(baselineCandidate.title);
  }

  private inferDataType(change: string, evidenceText: string): string {
    const combined = `${change} ${evidenceText}`.toLowerCase();
    if (/date|time|timestamp|review_date|settlement_date/i.test(combined)) {
      return 'date';
    }
    if (/amount|balance|rate|rating|score|count|number|threshold|limit|frequency|days|months|years|percent|percentage/i.test(combined)) {
      return 'number';
    }
    if (/flag|enabled|eligible|true|false|boolean|yes|no/i.test(combined)) {
      return 'boolean';
    }
    return 'string';
  }

  private inferRequired(change: string, evidenceText: string): boolean {
    const combined = `${change} ${evidenceText}`.toLowerCase();

    if (/optional|may be empty|nullable|can be omitted|not required/.test(combined)) {
      return false;
    }

    if (/required|must|mandatory|cannot be empty|non-null|before posting|before processing/.test(combined)) {
      return true;
    }

    return this.toAttributeName(change).endsWith('_id');
  }

  private buildAttributeEvidenceText(
    attributeName: string,
    change: string,
    candidate: ExistingModelCandidate,
    evidence: EvidenceReference[]
  ): string {
    const aliases = [
      attributeName,
      attributeName.replace(/_/g, ' '),
      this.toAttributeName(change),
      change.toLowerCase(),
    ].filter((value) => value.length > 0);

    const pageLines = candidate.plaintext
      .split(/\n+/)
      .filter((line) => this.matchesAnyAlias(line, aliases));
    const evidenceLines = evidence
      .map((item) => item.statement || '')
      .filter((statement) => this.matchesAnyAlias(statement, aliases));

    return [...pageLines, ...evidenceLines].join(' ');
  }

  private selectRelevantSourceReferences(
    attributeName: string,
    fallbackSources: string[],
    evidence: EvidenceReference[]
  ): string[] {
    const relevantSources = this.collectRelevantSourceReferences(attributeName, evidence);

    const combined = relevantSources.length > 0 ? relevantSources : fallbackSources;
    return Array.from(new Set(combined));
  }

  private collectRelevantSourceReferences(
    attributeName: string,
    evidence: EvidenceReference[]
  ): string[] {
    const aliases = [attributeName, attributeName.replace(/_/g, ' ')];
    return Array.from(new Set(
      evidence
        .filter((item) => this.matchesAnyAlias(item.statement || item.title, aliases))
        .flatMap((item) => item.sourceReferences)
    ));
  }

  private matchesAnyAlias(value: string, aliases: string[]): boolean {
    return aliases.some((alias) => this.matchesAliasTokens(value, alias));
  }

  private matchesAliasTokens(value: string, alias: string): boolean {
    const valueTokens = value.toLowerCase().match(/[a-z0-9]+/g) || [];
    const aliasTokens = alias.toLowerCase().replace(/_/g, ' ').match(/[a-z0-9]+/g) || [];

    if (valueTokens.length === 0 || aliasTokens.length === 0 || aliasTokens.length > valueTokens.length) {
      return false;
    }

    for (let startIndex = 0; startIndex <= valueTokens.length - aliasTokens.length; startIndex += 1) {
      let matches = true;

      for (let aliasIndex = 0; aliasIndex < aliasTokens.length; aliasIndex += 1) {
        if (valueTokens[startIndex + aliasIndex] !== aliasTokens[aliasIndex]) {
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

  private buildAssumptions(
    attributes: ContractAttribute[],
    queryResult: QueryResult,
    baselineCandidate: ExistingModelCandidate,
    missingBaselineAttributes: boolean
  ): string[] {
    const attributeAssumptions = attributes
      .filter((attribute) => attribute.status === 'assumed')
      .map((attribute) => `Business rules for ${attribute.name} require user confirmation because the wiki evidence is incomplete.`);

    const baselineAssumptions = missingBaselineAttributes
      ? [`The baseline schema for ${baselineCandidate.title} could not be extracted from the available wiki page content, so only explicitly requested fields are represented in the proposal.`]
      : [];

    const coverageGapAssumptions = queryResult.evidenceBundle.coverageGaps.map(
      (gap) => `${gap.missingTopic}: ${gap.reason}. Follow-up: ${gap.suggestedFollowUp}`
    );

    return Array.from(new Set([...attributeAssumptions, ...baselineAssumptions, ...coverageGapAssumptions]));
  }

  private buildConflicts(queryResult: QueryResult): string[] {
    const evidenceConflicts = queryResult.evidenceBundle.conflicts.map(
      (conflict) => `${conflict.topic}: ${conflict.summary}`
    );

    const inferredConflicts = this.inferConflictsFromEvidence(queryResult);

    return Array.from(new Set([...evidenceConflicts, ...queryResult.answer.conflicts, ...inferredConflicts]));
  }

  private inferConflictsFromEvidence(queryResult: QueryResult): string[] {
    const statements = queryResult.evidenceBundle.supportingFacts
      .map((fact) => fact.statement.trim())
      .filter((statement) => statement.length > 0);
    const conflicts = new Set<string>();

    for (let index = 0; index < statements.length; index += 1) {
      for (let comparisonIndex = index + 1; comparisonIndex < statements.length; comparisonIndex += 1) {
        const first = statements[index];
        const second = statements[comparisonIndex];

        if (!this.areStatementsContradictory(first, second)) {
          continue;
        }

        const topic = this.deriveConflictTopic(first, second);
        conflicts.add(`${topic}: Contradictory evidence found between "${first}" and "${second}".`);
      }
    }

    return Array.from(conflicts);
  }

  private areStatementsContradictory(first: string, second: string): boolean {
    const normalizedFirst = first.toLowerCase();
    const normalizedSecond = second.toLowerCase();

    const firstIsRequired = /\b(required|must|mandatory|cannot be empty|non-null)\b/.test(normalizedFirst);
    const secondIsRequired = /\b(required|must|mandatory|cannot be empty|non-null)\b/.test(normalizedSecond);
    const firstIsOptional = /\b(optional|not required|may be empty|nullable|can be omitted)\b/.test(normalizedFirst);
    const secondIsOptional = /\b(optional|not required|may be empty|nullable|can be omitted)\b/.test(normalizedSecond);
    const sharedTopicTokens = this.extractConflictTopicTokens(first).filter((token) => this.extractConflictTopicTokens(second).includes(token));

    return sharedTopicTokens.length > 0 && ((firstIsRequired && secondIsOptional) || (firstIsOptional && secondIsRequired));
  }

  private deriveConflictTopic(first: string, second: string): string {
    const firstTokens = new Set(this.extractConflictTopicTokens(first));
    const secondTokens = this.extractConflictTopicTokens(second);
    const sharedTokens = secondTokens.filter((token) => firstTokens.has(token));

    if (sharedTokens.length >= 2) {
      return `${sharedTokens[0]} ${sharedTokens[1]}`;
    }

    if (sharedTokens.length === 1) {
      return sharedTokens[0];
    }

    return 'evidence conflict';
  }

  private extractConflictTopicTokens(value: string): string[] {
    const ignoredTokens = new Set([
      'is', 'the', 'a', 'an', 'and', 'or', 'before', 'after', 'be', 'to',
      'required', 'optional', 'must', 'mandatory', 'nullable', 'empty', 'not',
      'can', 'cannot', 'may', 'omit', 'omitted', 'non', 'null', 'required', 'posting', 'processing'
    ]);

    return (value.toLowerCase().match(/[a-z0-9]+/g) || []).filter((token) => !ignoredTokens.has(token));
  }

  private buildRationale(
    baselineCandidate: ExistingModelCandidate,
    evidence: EvidenceReference[],
    conflictCount: number
  ): string {
    const sourceCount = new Set(evidence.flatMap((item) => item.sourceReferences)).size;
    const conflictSentence = conflictCount > 0
      ? ` ${conflictCount} conflict${conflictCount === 1 ? '' : 's'} were detected and are disclosed below for review.`
      : '';

    return `Selected ${baselineCandidate.title} as the baseline because it was the strongest grounded wiki match for the modelling request, supported by ${evidence.length} evidence reference${evidence.length === 1 ? '' : 's'} across ${sourceCount} source document${sourceCount === 1 ? '' : 's'}.${conflictSentence}`;
  }

  private toAttributeName(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64) || 'proposed_attribute';
  }

  private isEvidenceConflicted(
    evidence: Pick<EvidenceReference, 'pageId' | 'title' | 'sourceReferences' | 'statement'>,
    queryResult: QueryResult,
    conflicts: string[]
  ): boolean {
    const normalizedTitle = evidence.title.toLowerCase();
    const normalizedPageId = evidence.pageId.toLowerCase();
    const normalizedStatement = (evidence.statement ?? '').toLowerCase();
    const normalizedSources = evidence.sourceReferences.map((source) => source.toLowerCase());

    const structuredConflict = queryResult.evidenceBundle.conflicts.some((conflict) => {
      const matchesPage = conflict.supportingPages.some((page) => page.toLowerCase() === normalizedTitle);
      const matchesSource = conflict.supportingSources.some((source) => normalizedSources.includes(source.toLowerCase()));
      const matchesStatement = normalizedStatement.length > 0
        && (conflict.topic.toLowerCase().includes(normalizedStatement) || normalizedStatement.includes(conflict.topic.toLowerCase()));

      return matchesPage || matchesSource || matchesStatement;
    });

    if (structuredConflict) {
      return true;
    }

    return conflicts.some((conflict) => {
      const normalizedConflict = conflict.toLowerCase();
      return normalizedConflict.includes(normalizedTitle)
        || normalizedConflict.includes(normalizedPageId)
        || (normalizedStatement.length > 0 && normalizedConflict.includes(normalizedStatement))
        || normalizedSources.some((source) => normalizedConflict.includes(source));
    });
  }
}