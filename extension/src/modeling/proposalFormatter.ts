import { ContractValidationResult, ModelProposal, ModelSelectionResult } from '../models/types';

export class ProposalFormatter {
  formatProposal(proposal: ModelProposal, validationResult: ContractValidationResult): string {
    const contractLines = proposal.contract.attributes.map((attribute) => {
      const lines = [
        `- name: ${this.formatYamlScalar(attribute.name)}`,
        `  status: ${this.formatYamlScalar(attribute.status)}`,
        `  description: ${this.formatYamlScalar(attribute.description)}`,
        `  dataType: ${this.formatYamlScalar(attribute.dataType)}`,
        `  required: ${attribute.required}`,
        '  businessRules:',
        this.formatYamlArray(attribute.businessRules, 4),
        '  validationLogic:',
        this.formatYamlArray(attribute.validationLogic, 4),
        '  sourceMappings:',
        this.formatYamlArray(attribute.sourceReferences, 4),
      ];

      if (attribute.renameOf) {
        lines.splice(2, 0, `  renameOf: ${this.formatYamlScalar(attribute.renameOf)}`);
      }

      return lines.join('\n');
    });
    const changeSummaryYaml = proposal.changeSummary.length > 0
      ? proposal.changeSummary.map((item) => `  - ${item}`).join('\n')
      : '  []';
    const conflictsYaml = proposal.conflicts.length > 0
      ? proposal.conflicts.map((item) => `  - ${item}`).join('\n')
      : '  []';
    const assumptionsYaml = proposal.assumptions.length > 0
      ? proposal.assumptions.map((item) => `  - ${item}`).join('\n')
      : '  []';
    const evidenceYaml = proposal.evidence.length > 0
      ? proposal.evidence.map((evidence) => {
          return [
            `  - wikiPage: ${this.formatYamlScalar(evidence.title)}`,
            '    rawSources:',
            this.formatYamlArray(evidence.sourceReferences, 6),
            `    usage: ${this.formatYamlScalar(evidence.usage)}`,
            `    conflicted: ${evidence.conflicted}`,
          ].join('\n');
        }).join('\n')
      : '  []';

    const validationSection = validationResult.issues.length === 0
      ? 'No validation issues detected.'
      : validationResult.issues.map((issue) => `- ${issue.severity.toUpperCase()}: ${issue.field} - ${issue.message}`).join('\n');

    const evidenceSection = proposal.evidence
      .map((evidence) => `- [[${evidence.title}]] (${evidence.pageId}): ${evidence.usage}${evidence.sourceReferences.length > 0 ? ` [sources: ${evidence.sourceReferences.join(', ')}]` : ''}${evidence.conflicted ? ' [conflicted]' : ''}`)
      .join('\n');

    const sections = [
      '## Model Proposal',
      '',
      '### Preferred Baseline Model',
      `- title: ${proposal.baselineModel.title}`,
      `- pageId: ${proposal.baselineModel.pageId}`,
      `**Request**: ${proposal.requirement.normalizedRequest}`,
      '',
      '### Change Summary',
      proposal.changeSummary.map((item) => `- ${item}`).join('\n'),
      '',
      '### Proposed Contract',
      '```yaml',
      `id: ${this.formatYamlScalar(proposal.contract.id)}`,
      `name: ${this.formatYamlScalar(proposal.contract.name)}`,
      `entityName: ${this.formatYamlScalar(proposal.contract.entityName)}`,
      `displayName: ${this.formatYamlScalar(proposal.contract.displayName)}`,
      `version: ${this.formatYamlScalar(proposal.contract.version)}`,
      `domain: ${this.formatYamlScalar(proposal.contract.domain)}`,
      `description: ${this.formatYamlScalar(proposal.contract.description)}`,
      `sourceModel: ${this.formatYamlScalar(proposal.contract.sourceModel)}`,
      `sourceModelId: ${this.formatYamlScalar(proposal.contract.sourceModelId ?? 'unknown')}`,
      `rationale: ${this.formatYamlScalar(proposal.rationale)}`,
      'changeSummary:',
      changeSummaryYaml,
      'conflicts:',
      conflictsYaml,
      'assumptions:',
      assumptionsYaml,
      'attributes:',
      contractLines.join('\n'),
      'evidence:',
      evidenceYaml,
      '```',
      '',
      '### Rationale',
      proposal.rationale,
      '',
      '### Wiki Evidence Used',
      evidenceSection,
      '',
      '### Compliance Validation',
      validationSection,
    ];

    if (proposal.conflicts.length > 0) {
      sections.splice(sections.indexOf('### Wiki Evidence Used') - 1, 0,
        '### Conflicts',
        proposal.conflicts.map((conflict) => `- ${conflict}`).join('\n'),
        ''
      );
    }

    if (proposal.assumptions.length > 0) {
      sections.splice(sections.indexOf('### Wiki Evidence Used') - 1, 0,
        '### Assumptions / Gaps',
        proposal.assumptions.map((assumption) => `- ${assumption}`).join('\n'),
        ''
      );
    }

    return sections.join('\n');
  }

  formatRefinementGuidance(selection: ModelSelectionResult): string {
    const candidateLines = selection.candidates.length > 0
      ? selection.candidates.map((candidate) => `- ${candidate.title} (${candidate.matchType}, score ${(candidate.effectiveScore ?? candidate.relevanceScore).toFixed(2)})`).join('\n')
      : '- No grounded candidates found.';

    return [
      '## Refinement Needed',
      '',
      selection.refinementReason ?? 'No sufficiently credible baseline model was found.',
      '',
      'Try narrowing the request to one baseline entity, naming the target model explicitly, or describing only the fields you want to add or change.',
      '',
      '### Closest Candidates',
      candidateLines,
    ].join('\n');
  }

  private formatYamlArray(values: string[], indent: number): string {
    const prefix = ' '.repeat(indent);

    if (values.length === 0) {
      return `${prefix}[]`;
    }

    return values.map((value) => `${prefix}- ${this.formatYamlScalar(value)}`).join('\n');
  }

  private formatYamlScalar(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
  }
}