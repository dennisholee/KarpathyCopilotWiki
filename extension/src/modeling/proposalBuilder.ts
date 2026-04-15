import {
  ContractOwner,
  ContractResource,
  ContractAttribute,
  EvidenceReference,
  ExistingModelCandidate,
  GuidelineResolution,
  IncidentManagementDefinition,
  ModelDefinitionSummary,
  PlacementDecision,
  ModelProposal,
  ModelSelectionResult,
  OpenMetadataModelContract,
  SchemaEntry,
  TargetEntityReference,
} from '../models/types';
import { QueryResult } from '../query/queryCommand';

export class ProposalBuilder {
  buildDefinitionSummary(selection: ModelSelectionResult, queryResult: QueryResult): ModelDefinitionSummary {
    const targetModel = selection.baselineCandidate ?? selection.candidates[0];
    const evidence = this.buildDefinitionEvidence(queryResult, targetModel);
    const keyEntities = this.extractDefinitionItems(evidence, /(entity|model|record|attribute|field)/i, 4);
    const keyRelationships = this.extractDefinitionItems(evidence, /(relationship|maps|references|links|association|depends)/i, 4);
    const assumptions = queryResult.evidenceBundle.coverageGaps.map(
      (gap) => `${gap.missingTopic}: ${gap.reason}. Follow-up: ${gap.suggestedFollowUp}`
    );
    const conflicts = this.buildConflicts(queryResult);

    return {
      requirement: selection.requirement,
      targetModel,
      summary: this.buildDefinitionSummaryText(selection, queryResult, evidence),
      keyEntities,
      keyRelationships,
      rationale: this.buildDefinitionRationale(selection, evidence, conflicts.length),
      assumptions,
      conflicts,
      evidence,
    };
  }

  buildDerivedProposal(selection: ModelSelectionResult, queryResult: QueryResult): ModelProposal {
    const requirement = selection.requirement;
    const evidence = this.buildDerivedEvidence(queryResult);
    const targetModelName = requirement.targetModelName || requirement.inferredEntityName;
    const attributes = this.extractDerivedAttributes(targetModelName, queryResult, evidence);
    const entityName = this.toAttributeName(targetModelName);
    const displayName = this.toDisplayName(targetModelName);
    const guidelineResolution = this.resolveGuidelineResolution(requirement, queryResult);
    const assumptions = this.buildDerivedAssumptions(attributes, queryResult, displayName);
    const conflicts = this.buildConflicts(queryResult);

    return {
      requirement,
      baselineModel: {
        pageId: `derived_${entityName}`,
        title: displayName,
        relevanceScore: 1,
        matchType: 'semantic',
        sourceReferences: Array.from(new Set(evidence.flatMap((item) => item.sourceReferences))),
        contentExcerpt: `Derived ${displayName} from grounded wiki evidence.`,
        plaintext: attributes.map((attribute) => attribute.name).join('\n'),
      },
      contract: this.buildAlignedContract({
        requirement,
        displayName,
        description: `Grounded derived proposal for ${displayName} assembled from wiki evidence and guideline context.`,
        attributes,
        evidence,
        guidelineResolution,
        sourceModel: 'Derived from grounded wiki evidence',
        sourceModelId: undefined,
        tags: ['proposal', 'openmetadata', 'wiki-grounded', 'derived'],
      }),
      guidelineResolution,
      rationale: this.buildDerivedRationale(displayName, evidence, conflicts.length),
      changeSummary: [
        `Derive a new ${entityName} contract from grounded wiki evidence instead of enhancing an existing baseline model.`,
      ],
      assumptions,
      conflicts,
      evidence,
    };
  }

  private buildDefinitionEvidence(
    queryResult: QueryResult,
    targetModel?: ExistingModelCandidate
  ): EvidenceReference[] {
    const pageEvidence = queryResult.evidenceBundle.supportingPages.map((page) => ({
      pageId: page.pageId,
      title: page.title,
      sourceReferences: page.sourceReferences,
      usage: page.pageId === targetModel?.pageId
        ? 'Primary grounded page used to explain the requested model definition.'
        : 'Supporting wiki page used to explain the requested model definition.',
      conflicted: false,
    }));
    const factEvidence = queryResult.evidenceBundle.supportingFacts.map((fact) => ({
      pageId: fact.pageId,
      title: fact.title,
      sourceReferences: fact.sourceReferences,
      statement: fact.statement,
      usage: fact.statement,
      conflicted: false,
    }));

    return [...pageEvidence, ...factEvidence];
  }

  private buildDefinitionSummaryText(
    selection: ModelSelectionResult,
    queryResult: QueryResult,
    evidence: EvidenceReference[]
  ): string {
    const targetTitle = selection.baselineCandidate?.title ?? this.toDisplayName(selection.requirement.targetModelName || selection.requirement.inferredEntityName);
    const factStatements = evidence
      .map((item) => item.statement)
      .filter((statement): statement is string => Boolean(statement))
      .slice(0, 2);

    if (factStatements.length > 0) {
      return `${targetTitle} is defined in the wiki as follows: ${factStatements.join(' ')}`;
    }

    return queryResult.answer.directAnswer || `${targetTitle} is described by the grounded wiki evidence returned for this request.`;
  }

  private buildDefinitionRationale(
    selection: ModelSelectionResult,
    evidence: EvidenceReference[],
    conflictCount: number
  ): string {
    const targetTitle = selection.baselineCandidate?.title ?? this.toDisplayName(selection.requirement.targetModelName || selection.requirement.inferredEntityName);
    const sourceCount = new Set(evidence.flatMap((item) => item.sourceReferences)).size;
    const conflictSentence = conflictCount > 0
      ? ` ${conflictCount} conflict${conflictCount === 1 ? '' : 's'} were detected and are disclosed below for review.`
      : '';

    return `Summarized ${targetTitle} from ${evidence.length} grounded evidence reference${evidence.length === 1 ? '' : 's'} across ${sourceCount} raw source document${sourceCount === 1 ? '' : 's'} without generating a contract.${conflictSentence}`;
  }

  private extractDefinitionItems(
    evidence: EvidenceReference[],
    keywordPattern: RegExp,
    limit: number
  ): string[] {
    const items = evidence
      .map((item) => item.statement || item.title)
      .filter((value) => keywordPattern.test(value))
      .map((value) => value.trim())
      .slice(0, limit);

    return Array.from(new Set(items));
  }

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
    const guidelineResolution = this.resolveGuidelineResolution(selection.requirement, queryResult);
    const contract = this.buildContract(selection, baselineAttributes, requestedAttributes, evidence, guidelineResolution);
    const placementDecisions = this.buildPlacementDecisions(requestedAttributes, baselineAttributes, evidence);
    const changeSummary = selection.requirement.requestedChanges.map((change) =>
      this.buildChangeSummary(change, baselineAttributes)
    );
    const assumptions = this.buildAssumptions(contract.attributes, queryResult, selection.baselineCandidate, baselineAttributes.length === 0);

    return {
      requirement: selection.requirement,
      baselineModel: selection.baselineCandidate,
      contract,
      guidelineResolution,
      placementDecisions,
      rationale: this.buildRationale(selection.baselineCandidate, evidence, conflicts.length),
      changeSummary,
      assumptions,
      conflicts,
      evidence,
    };
  }

  private buildAlignedContract(params: {
    requirement: ModelSelectionResult['requirement'];
    displayName: string;
    description: string;
    attributes: ContractAttribute[];
    evidence: EvidenceReference[];
    guidelineResolution: GuidelineResolution;
    sourceModel?: string;
    sourceModelId?: string;
    tags?: string[];
  }): OpenMetadataModelContract {
    const entityName = this.toAttributeName(params.requirement.inferredEntityName || params.displayName);
    const schemaEntries = this.buildSchemaEntries(params.attributes);
    const targetEntity = this.buildTargetEntity(params.requirement, params.displayName, params.evidence);
    const owner = this.buildOwner(params.evidence);
    const resources = this.buildResources(params.evidence);
    const incidentManagement = this.buildIncidentManagement(params.evidence);

    return {
      name: entityName,
      displayName: params.displayName,
      description: params.description,
      status: 'Draft',
      owner,
      targetEntity,
      schemaText: this.serializeSchemaText(schemaEntries),
      resources,
      incidentManagement,
      id: `proposal_${entityName}`,
      entityName,
      version: '1.0.0-proposal',
      domain: entityName,
      guidelineSources: params.guidelineResolution.requestedGuidelines.map((guideline) => guideline.name),
      fallbackStrategy: params.guidelineResolution.requestedGuidelines.length === 0
        ? 'Default the full contract shape to OpenMetadata because no named guideline was supplied.'
        : params.guidelineResolution.appliesDefaultOpenMetadata
          ? 'Use OpenMetadata defaults for any contract sections not covered by named guideline evidence.'
          : 'Named guideline evidence fully governs the emitted contract sections.',
      sourceModel: params.sourceModel,
      sourceModelId: params.sourceModelId,
      attributes: params.attributes,
      tags: params.tags ?? ['proposal', 'openmetadata', 'wiki-grounded'],
    };
  }

  private buildSchemaEntries(attributes: ContractAttribute[]): SchemaEntry[] {
    return attributes.map((attribute) => ({
      name: attribute.name,
      dataType: attribute.dataType,
      description: attribute.description,
      required: attribute.required,
      validationRules: Array.from(new Set([...attribute.businessRules, ...attribute.validationLogic])),
      sourceReferences: attribute.sourceReferences,
      isAssumed: attribute.status === 'assumed',
    }));
  }

  private serializeSchemaText(entries: SchemaEntry[]): string {
    return [
      'fields:',
      ...entries.flatMap((entry) => {
        const lines = [
          `  - name: ${entry.name}`,
          `    dataType: ${entry.dataType}`,
          `    required: ${entry.required}`,
        ];

        if (entry.description) {
          lines.push(`    description: ${entry.description}`);
        }

        if (entry.validationRules.length > 0) {
          lines.push('    validationRules:');
          lines.push(...entry.validationRules.map((rule) => `      - ${rule}`));
        }

        if (entry.sourceReferences.length > 0) {
          lines.push('    sourceReferences:');
          lines.push(...entry.sourceReferences.map((reference) => `      - ${reference}`));
        }

        if (entry.isAssumed) {
          lines.push('    assumed: true');
        }

        return lines;
      }),
    ].join('\n');
  }

  private buildTargetEntity(
    requirement: ModelSelectionResult['requirement'],
    displayName: string,
    evidence: EvidenceReference[]
  ): TargetEntityReference {
    const physicalSignals = [
      requirement.rawRequest,
      requirement.normalizedRequest,
      displayName,
      ...evidence.map((item) => item.statement || item.title),
    ].join(' ').toLowerCase();
    const isPhysical = /\btable\b|\bcolumn\b|\bdataset\b|\bschema\b|\bview\b/.test(physicalSignals);

    return {
      name: this.toDisplayName(requirement.targetModelName || requirement.inferredEntityName || displayName),
      type: isPhysical ? 'table' : 'modeled-entity',
      sourceKind: isPhysical ? 'physical' : 'logical',
    };
  }

  private buildOwner(evidence: EvidenceReference[]): ContractOwner | null {
    const ownerEvidence = evidence.find((item) => /\bowner\b|\bteam\b|\bsteward\b/i.test(item.statement || item.title));
    if (!ownerEvidence) {
      return null;
    }

    return {
      id: this.toAttributeName(ownerEvidence.title),
      type: /\bteam\b/i.test(ownerEvidence.statement || ownerEvidence.title) ? 'team' : 'organization',
    };
  }

  private buildResources(evidence: EvidenceReference[]): ContractResource[] {
    const resourceEvidence = evidence.filter((item) => /\bassertion\b|\bquality\b|\bsla\b|\bservice level\b/i.test(item.statement || item.title));

    return resourceEvidence.map((item, index) => ({
      type: /\bsla\b|\bservice level\b/i.test(item.statement || item.title) ? 'sla' : 'assertion',
      name: `${this.toAttributeName(item.title)}_${index + 1}`,
      description: item.statement || item.usage,
      properties: {},
      sourceReferences: item.sourceReferences,
      isResolved: item.sourceReferences.length > 0,
    }));
  }

  private buildIncidentManagement(evidence: EvidenceReference[]): IncidentManagementDefinition | null {
    const incidentEvidence = evidence.find((item) => /\bincident\b|\bescalation\b|\bon-call\b|\bseverity\b/i.test(item.statement || item.title));

    if (!incidentEvidence) {
      return null;
    }

    return {
      type: 'documented-process',
      severity: /severity\s+[0-9]/i.exec(incidentEvidence.statement || '')?.[0],
      description: incidentEvidence.statement || incidentEvidence.usage,
      sourceReferences: incidentEvidence.sourceReferences,
      isResolved: incidentEvidence.sourceReferences.length > 0,
    };
  }

  private buildPlacementDecisions(
    requestedAttributes: ContractAttribute[],
    baselineAttributes: ContractAttribute[],
    evidence: EvidenceReference[]
  ): PlacementDecision[] {
    return requestedAttributes.map((attribute) => {
      const action = attribute.renameOf
        ? 'rename'
        : baselineAttributes.some((baselineAttribute) => baselineAttribute.name === attribute.name)
          ? 'refine'
          : 'add';
      const targetAnchor = this.determinePlacementAnchor(attribute, baselineAttributes);

      return {
        attributeName: attribute.name,
        action,
        targetAnchor,
        rationale: this.buildPlacementRationale(attribute, action, targetAnchor, baselineAttributes),
        supportingSources: this.collectRelevantSourceReferences(attribute.name, evidence),
      };
    });
  }

  private determinePlacementAnchor(attribute: ContractAttribute, baselineAttributes: ContractAttribute[]): string {
    if (attribute.renameOf) {
      return attribute.renameOf;
    }

    const categoryMatchers: Array<{ pattern: RegExp; predicate: (name: string) => boolean }> = [
      { pattern: /_id$/i, predicate: (name) => /_id$/i.test(name) },
      { pattern: /date|time/i, predicate: (name) => /date|time/i.test(name) },
      { pattern: /status|flag/i, predicate: (name) => /status|flag/i.test(name) },
      { pattern: /number|code|rating|score/i, predicate: (name) => /number|code|rating|score/i.test(name) },
    ];

    for (const matcher of categoryMatchers) {
      if (!matcher.pattern.test(attribute.name)) {
        continue;
      }

      const matchedAnchor = [...baselineAttributes].reverse().find((baselineAttribute) => matcher.predicate(baselineAttribute.name));
      if (matchedAnchor) {
        return matchedAnchor.name;
      }
    }

    return baselineAttributes[baselineAttributes.length - 1]?.name ?? 'start_of_model';
  }

  private buildPlacementRationale(
    attribute: ContractAttribute,
    action: PlacementDecision['action'],
    targetAnchor: string,
    baselineAttributes: ContractAttribute[]
  ): string {
    if (action === 'rename' && attribute.renameOf) {
      return `Rename ${attribute.renameOf} in place to ${attribute.name} so the baseline semantic slot is preserved.`;
    }

    if (action === 'refine') {
      return `Refine the existing ${attribute.name} field directly because the baseline model already contains that attribute.`;
    }

    const anchorExists = baselineAttributes.some((baselineAttribute) => baselineAttribute.name === targetAnchor);
    if (!anchorExists) {
      return `Add ${attribute.name} at the beginning of the model because no stronger baseline anchor was available.`;
    }

    return `Add ${attribute.name} after ${targetAnchor} because it is the closest grounded baseline field with compatible semantics.`;
  }

  private buildDerivedEvidence(queryResult: QueryResult): EvidenceReference[] {
    const pageEvidence = queryResult.evidenceBundle.supportingPages.map((page) => ({
      pageId: page.pageId,
      title: page.title,
      sourceReferences: page.sourceReferences,
      usage: 'Grounded source used to derive the new model proposal.',
      conflicted: false,
    }));
    const factEvidence = queryResult.evidenceBundle.supportingFacts.map((fact) => ({
      pageId: fact.pageId,
      title: fact.title,
      sourceReferences: fact.sourceReferences,
      statement: fact.statement,
      usage: fact.statement,
      conflicted: false,
    }));
    const resultEvidence = queryResult.results
      .filter((result) => !pageEvidence.some((page) => page.pageId === result.pageId))
      .map((result) => ({
        pageId: result.pageId,
        title: result.title,
        sourceReferences: result.sourceReferences,
        statement: result.excerpt,
        usage: 'Search result context used to derive the new model proposal.',
        conflicted: false,
      }));

    return [...pageEvidence, ...factEvidence, ...resultEvidence];
  }

  private extractDerivedAttributes(
    targetModelName: string,
    queryResult: QueryResult,
    evidence: EvidenceReference[]
  ): ContractAttribute[] {
    const displayName = this.toDisplayName(targetModelName);
    const attributeNames = Array.from(new Set(
      queryResult.results
        .flatMap((result) => `${result.plaintext}\n${result.excerpt}`.split(/\n+|\s+-\s+/))
        .map((line) => line.trim())
        .filter((line) => this.looksLikeAttributeLine(line, displayName))
        .map((line) => line.replace(/^[-*]\s+/, '').trim())
        .map((line) => this.normalizeDerivedAttributeName(this.toAttributeName(line)))
        .filter((line) => this.looksLikeAttributeName(line))
        .slice(0, 10)
    ));

    const fallbackAttributeNames = attributeNames.length > 0
      ? attributeNames
      : [`${this.toAttributeName(targetModelName)}_id`, `${this.toAttributeName(targetModelName)}_name`];

    return fallbackAttributeNames.map((name) => {
      const aliases = [name, name.replace(/_/g, ' '), name.replace(/_/g, '')];
      const evidenceText = evidence
        .map((item) => item.statement || item.title)
        .filter((value) => this.matchesAnyAlias(value, aliases))
        .join(' ');
      const sourceReferences = this.collectRelevantSourceReferences(name, evidence);
      const hasGroundedEvidence = sourceReferences.length > 0 || evidenceText.length > 0;

      return {
        name,
        description: `Derived attribute for ${displayName} based on grounded wiki evidence.`,
        dataType: this.inferDataType(name, evidenceText),
        required: this.inferRequired(name, evidenceText),
        businessRules: hasGroundedEvidence
          ? [`Populate ${name} according to the grounded evidence collected for ${displayName}.`]
          : [`Assumption: confirm the business rules for ${name} because explicit supporting evidence is limited.`],
        validationLogic: hasGroundedEvidence
          ? [`Validate ${name} against the documented constraints surfaced by the evidence bundle.`]
          : [`Assumption: validation logic for ${name} must be confirmed against additional source material.`],
        sourceReferences,
        status: hasGroundedEvidence ? 'proposed' : 'assumed',
      };
    });
  }

  private buildDerivedAssumptions(
    attributes: ContractAttribute[],
    queryResult: QueryResult,
    displayName: string
  ): string[] {
    const assumedAttributes = attributes
      .filter((attribute) => attribute.status === 'assumed')
      .map((attribute) => `Derived field ${attribute.name} for ${displayName} requires additional confirmation because direct supporting evidence is limited.`);

    const coverageGapAssumptions = queryResult.evidenceBundle.coverageGaps.map(
      (gap) => `${gap.missingTopic}: ${gap.reason}. Follow-up: ${gap.suggestedFollowUp}`
    );

    return Array.from(new Set([...assumedAttributes, ...coverageGapAssumptions]));
  }

  private buildDerivedRationale(displayName: string, evidence: EvidenceReference[], conflictCount: number): string {
    const sourceCount = new Set(evidence.flatMap((item) => item.sourceReferences)).size;
    const conflictSentence = conflictCount > 0
      ? ` ${conflictCount} conflict${conflictCount === 1 ? '' : 's'} were detected and are disclosed below for review.`
      : '';

    return `Derived ${displayName} from grounded wiki evidence because no existing baseline model was required for this request, using ${evidence.length} evidence reference${evidence.length === 1 ? '' : 's'} across ${sourceCount} raw source document${sourceCount === 1 ? '' : 's'}.${conflictSentence}`;
  }

  resolveGuidelineResolution(selectionRequirement: ModelSelectionResult['requirement'], queryResult: QueryResult): GuidelineResolution {
    const requestedGuidelines = selectionRequirement.requestedGuidelines ?? [];

    if (requestedGuidelines.length === 0) {
      return {
        requestedGuidelines: [],
        appliesDefaultOpenMetadata: true,
        rationale: 'No explicit modelling guideline was named, so the response should default to the OpenMetadata contract shape.',
      };
    }

    const evidenceTitles = queryResult.evidenceBundle.supportingPages.map((page) => page.title.toLowerCase());
    const matchedGuidelines = requestedGuidelines.filter((guideline) =>
      evidenceTitles.some((title) => title.includes(guideline.normalizedName))
    );
    const unmatchedGuidelines = requestedGuidelines.filter((guideline) =>
      !matchedGuidelines.some((matched) => matched.normalizedName === guideline.normalizedName)
    );

    return {
      requestedGuidelines,
      appliesDefaultOpenMetadata: unmatchedGuidelines.length > 0,
      rationale: unmatchedGuidelines.length > 0
        ? `Named guidelines were detected (${requestedGuidelines.map((guideline) => guideline.name).join(', ')}), but unmatched sections should fall back to OpenMetadata until specific guideline evidence is resolved.`
        : `Named guidelines were detected (${requestedGuidelines.map((guideline) => guideline.name).join(', ')}) and should govern the supported response sections.`,
    };
  }

  private buildContract(
    selection: ModelSelectionResult,
    baselineAttributes: ContractAttribute[],
    requestedAttributes: ContractAttribute[],
    evidence: EvidenceReference[],
    guidelineResolution: GuidelineResolution
  ): OpenMetadataModelContract {
    const baselineCandidate = selection.baselineCandidate as ExistingModelCandidate;
    const attributes = this.mergeAttributes([...baselineAttributes, ...requestedAttributes]);

    return this.buildAlignedContract({
      requirement: selection.requirement,
      displayName: baselineCandidate.title,
      description: `Grounded proposal for enhancing ${baselineCandidate.title} based on the current modelling request.`,
      attributes,
      evidence,
      guidelineResolution,
      sourceModel: baselineCandidate.title,
      sourceModelId: baselineCandidate.pageId,
      tags: ['proposal', 'openmetadata', 'wiki-grounded'],
    });
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
    const aliases = [attributeName, attributeName.replace(/_/g, ' '), attributeName.replace(/_/g, '')];
    return Array.from(new Set(
      evidence
        .filter((item) => this.matchesAnyAlias(item.statement || item.title, aliases))
        .flatMap((item) => item.sourceReferences)
    ));
  }

  private normalizeDerivedAttributeName(attributeName: string): string {
    return attributeName
      .replace(/taxid$/i, 'tax_id')
      .replace(/taxcode$/i, 'tax_code')
      .replace(/filingstatus$/i, 'filing_status');
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

  private toDisplayName(value: string): string {
    const acronymTokens = new Set(['cdms', 'oecd']);
    const normalized = value.trim();
    const withModelSuffix = /\bmodel\b/i.test(normalized) ? normalized : `${normalized} model`;

    return withModelSuffix
      .split(/\s+/)
      .filter((token) => token.length > 0)
      .map((token) => acronymTokens.has(token.toLowerCase())
        ? token.toUpperCase()
        : token.charAt(0).toUpperCase() + token.slice(1))
      .join(' ');
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