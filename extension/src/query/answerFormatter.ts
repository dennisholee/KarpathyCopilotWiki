import { StructuredAnswer } from '../models/types';

export function formatStructuredAnswer(answer: StructuredAnswer): string {
  const lines: string[] = [];
  const mode = answer.mode ?? 'strict';
  const usedSupplementalKnowledge = Boolean(answer.usedSupplementalKnowledge);

  lines.push(`**Answer Mode**: ${mode === 'strict' ? 'Strict wiki-only grounding' : 'Flexible wiki-first answer'}`);
  lines.push('');

  if (usedSupplementalKnowledge) {
    lines.push('*This answer includes supplemental context beyond the wiki evidence.*');
    lines.push('');
  }

  lines.push('**Direct Answer**');
  lines.push('');
  lines.push(answer.directAnswer);
  lines.push('');

  if (answer.keyDetails.length > 0) {
    lines.push('**Key Details**');
    lines.push('');
    for (const detail of answer.keyDetails) {
      lines.push(`- ${detail}`);
    }
    lines.push('');
  }

  if (answer.conflicts.length > 0) {
    lines.push('**Conflicts**');
    lines.push('');
    for (const conflict of answer.conflicts) {
      lines.push(`- ${conflict}`);
    }
    lines.push('');
  }

  if (answer.coverageGaps.length > 0) {
    lines.push('**Coverage Gaps**');
    lines.push('');
    for (const gap of answer.coverageGaps) {
      lines.push(`- ${gap}`);
    }
    lines.push('');
  }

  if (answer.supportingReferences.length > 0) {
    lines.push('**Supporting References**');
    lines.push('');
    for (const reference of answer.supportingReferences) {
      lines.push(`- ${reference}`);
    }
  }

  return lines.join('\n').trim();
}