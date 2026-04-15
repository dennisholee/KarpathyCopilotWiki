import { ContractValidationResult, ModelDefinitionSummary, ModelProposal, ModelSelectionResult } from '../models/types';

export class ProposalFormatter {
  formatProposal(proposal: ModelProposal, validationResult: ContractValidationResult): string {
    const isDerivedProposal = proposal.requirement.intent === 'derive';

    const validationSection = validationResult.issues.length === 0
      ? 'No validation issues detected.'
      : validationResult.issues.map((issue) => `- ${issue.severity.toUpperCase()}: ${issue.field} - ${issue.message}`).join('\n');

    const evidenceSection = proposal.evidence
      .map((evidence) => `- [[${evidence.title}]] (${evidence.pageId}): ${evidence.usage}${evidence.sourceReferences.length > 0 ? ` [sources: ${evidence.sourceReferences.join(', ')}]` : ''}${evidence.conflicted ? ' [conflicted]' : ''}`)
      .join('\n');

    const contextSection = isDerivedProposal
      ? [
          '### Derived Model Context',
          `- targetModel: ${proposal.contract.displayName}`,
          `- sourceModel: ${proposal.contract.sourceModel}`,
          `**Request**: ${proposal.requirement.normalizedRequest}`,
          '',
        ]
      : [
          '### Preferred Baseline Model',
          `- title: ${proposal.baselineModel?.title ?? proposal.contract.displayName}`,
          `- pageId: ${proposal.baselineModel?.pageId ?? 'derived'}`,
          `**Request**: ${proposal.requirement.normalizedRequest}`,
          '',
        ];

    const guidelineSection = proposal.guidelineResolution
      ? [
          '### Guideline Handling',
          proposal.guidelineResolution.rationale,
          '',
        ]
      : [];
    const placementSection = proposal.placementDecisions && proposal.placementDecisions.length > 0
      ? [
          '### Placement Decisions',
          proposal.placementDecisions
            .map((decision) => `- ${decision.attributeName}: ${decision.action} ${decision.action === 'rename' ? 'at' : 'after'} ${decision.targetAnchor} - ${decision.rationale}${decision.supportingSources.length > 0 ? ` [sources: ${decision.supportingSources.join(', ')}]` : ''}`)
            .join('\n'),
          '',
        ]
      : [];

    const contractYaml = this.formatAlignedContract(proposal);

    const sections = [
      '## Model Proposal',
      '',
      ...contextSection,
      '### Change Summary',
      proposal.changeSummary.map((item) => `- ${item}`).join('\n'),
      '',
      ...placementSection,
      '### Proposed Contract',
      '```yaml',
      ...contractYaml,
      '```',
      '',
      '### Rationale',
      proposal.rationale,
      '',
      ...guidelineSection,
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

  private formatAlignedContract(proposal: ModelProposal): string[] {
    const ownerLines = proposal.contract.owner
      ? [
          'owner:',
          `  id: ${this.formatYamlScalar(proposal.contract.owner.id)}`,
          `  type: ${this.formatYamlScalar(proposal.contract.owner.type)}`,
        ]
      : ['owner: null'];

    const resourceLines = proposal.contract.resources.length === 0
      ? ['resources: []']
      : [
          'resources:',
          ...proposal.contract.resources.flatMap((resource) => {
            const lines = [
              `  - type: ${this.formatYamlScalar(resource.type)}`,
              `    name: ${this.formatYamlScalar(resource.name)}`,
              `    description: ${this.formatYamlScalar(resource.description)}`,
            ];

            if (Object.keys(resource.properties).length > 0) {
              lines.push('    properties:');
              lines.push(...Object.entries(resource.properties).map(([key, value]) => `      ${key}: ${this.formatYamlScalar(value)}`));
            }

            return lines;
          }),
        ];

    const incidentLines = proposal.contract.incidentManagement
      ? [
          'incidentManagement:',
          `  type: ${this.formatYamlScalar(proposal.contract.incidentManagement.type)}`,
          ...(proposal.contract.incidentManagement.severity
            ? [`  severity: ${this.formatYamlScalar(proposal.contract.incidentManagement.severity)}`]
            : []),
          ...(proposal.contract.incidentManagement.description
            ? [`  description: ${this.formatYamlScalar(proposal.contract.incidentManagement.description)}`]
            : []),
        ]
      : ['incidentManagement: null'];

    return [
      `name: ${this.formatYamlScalar(proposal.contract.name)}`,
      `displayName: ${this.formatYamlScalar(proposal.contract.displayName)}`,
      `description: ${this.formatYamlScalar(proposal.contract.description)}`,
      `status: ${this.formatYamlScalar(proposal.contract.status)}`,
      ...ownerLines,
      'targetEntity:',
      `  name: ${this.formatYamlScalar(proposal.contract.targetEntity.name)}`,
      `  type: ${this.formatYamlScalar(proposal.contract.targetEntity.type)}`,
      'schemaText: |',
      ...proposal.contract.schemaText.split('\n').map((line) => `  ${line}`),
      ...resourceLines,
      ...incidentLines,
    ];
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

  formatDefinitionSummary(summary: ModelDefinitionSummary): string {
    const evidenceSection = summary.evidence.length > 0
      ? summary.evidence
          .map((evidence) => `- [[${evidence.title}]] (${evidence.pageId}): ${evidence.usage}${evidence.sourceReferences.length > 0 ? ` [sources: ${evidence.sourceReferences.join(', ')}]` : ''}`)
          .join('\n')
      : '- No grounded evidence found.';

    const sections = [
      '## Model Definition',
      '',
      summary.summary,
      '',
      '### Key Entities / Relationships',
      ...summary.keyEntities.map((item) => `- ${item}`),
      ...summary.keyRelationships.map((item) => `- ${item}`),
      '',
      '### Rationale',
      summary.rationale,
      '',
      '### Wiki Evidence Used',
      evidenceSection,
      '',
      '### Raw Source Traceability',
      evidenceSection,
    ];

    if (summary.assumptions.length > 0) {
      sections.push('', '### Assumptions / Gaps', ...summary.assumptions.map((item) => `- ${item}`));
    }

    if (summary.conflicts.length > 0) {
      sections.push('', '### Conflicts', ...summary.conflicts.map((item) => `- ${item}`));
    }

    return sections.join('\n');
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