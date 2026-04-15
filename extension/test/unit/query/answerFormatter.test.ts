import { formatStructuredAnswer } from '../../../src/query/answerFormatter';
import { StructuredAnswer } from '../../../src/models/types';

describe('formatStructuredAnswer', () => {
  const baseAnswer: StructuredAnswer = {
    directAnswer: 'Direct answer text.',
    keyDetails: [],
    supportingReferences: [],
    conflicts: [],
    coverageGaps: [],
    confidenceLabel: 'supported',
  };

  it('formats a minimal direct answer without optional sections', () => {
    const output = formatStructuredAnswer(baseAnswer);

    expect(output).toBe('**Direct Answer**\n\nDirect answer text.');
  });

  it('includes key details and supporting references when present', () => {
    const output = formatStructuredAnswer({
      ...baseAnswer,
      keyDetails: ['Detail A', 'Detail B'],
      supportingReferences: ['[Page A](wiki/page-a.md)', '[Page B](wiki/page-b.md)'],
    });

    expect(output).toContain('**Key Details**');
    expect(output).toContain('- Detail A');
    expect(output).toContain('- Detail B');
    expect(output).toContain('**Supporting References**');
    expect(output).toContain('- [Page A](wiki/page-a.md)');
  });

  it('includes conflicts and coverage gaps when present', () => {
    const output = formatStructuredAnswer({
      ...baseAnswer,
      conflicts: ['Source A disagrees with Source B.'],
      coverageGaps: ['Missing policy document for exception handling.'],
    });

    expect(output).toContain('**Conflicts**');
    expect(output).toContain('- Source A disagrees with Source B.');
    expect(output).toContain('**Coverage Gaps**');
    expect(output).toContain('- Missing policy document for exception handling.');
  });
});