import { buildDirectAnswerPrompt, buildEffectiveQuery } from '../../../src/query/answerPrompt';
import { EvidenceBundle } from '../../../src/models/types';

describe('answerPrompt', () => {
  const evidenceBundle: EvidenceBundle = {
    supportingPages: [
      {
        pageId: 'policy-exceptions',
        title: 'Policy Exceptions',
        sourceReferences: ['/raw/policy/exceptions.md'],
      },
    ],
    supportingFacts: [
      {
        pageId: 'policy-exceptions',
        title: 'Policy Exceptions',
        statement: 'Exception handling requires director approval.',
        sourceReferences: ['/raw/policy/exceptions.md'],
      },
      {
        pageId: 'risk-controls',
        title: 'Risk Controls',
        statement: 'Exceptions must be reviewed quarterly.',
        sourceReferences: ['/raw/policy/controls.md'],
      },
    ],
    sourceReferences: ['/raw/policy/exceptions.md', '/raw/policy/controls.md'],
    coverageAssessment: 'partial',
    conflicts: [
      {
        topic: 'approval level',
        summary: 'One source mentions director approval while another references committee approval.',
        supportingPages: ['policy-exceptions', 'risk-controls'],
        supportingSources: ['/raw/policy/exceptions.md', '/raw/policy/controls.md'],
      },
    ],
    coverageGaps: [
      {
        missingTopic: 'escalation timing',
        reason: 'No grounded source describes the escalation timeline.',
        suggestedFollowUp: 'Find the escalation SLA document.',
      },
    ],
  };

  it('returns the trimmed prompt when there is no previous turn', () => {
    expect(buildEffectiveQuery('  what are the rules?  ')).toBe('what are the rules?');
  });

  it('blends previous context for short follow-up prompts', () => {
    const effectiveQuery = buildEffectiveQuery('what about exceptions', {
      query: 'What are the policy rules?',
      answer: 'Base answer',
    });

    expect(effectiveQuery).toBe('What are the policy rules? what about exceptions');
  });

  it('does not blend previous context for longer standalone prompts', () => {
    const effectiveQuery = buildEffectiveQuery(
      'Please summarize the full control workflow for exception requests',
      {
        query: 'What are the policy rules?',
        answer: 'Base answer',
      }
    );

    expect(effectiveQuery).toBe('Please summarize the full control workflow for exception requests');
  });

  it('builds a direct-answer prompt with facts, conflicts, gaps, and previous context', () => {
    const prompt = buildDirectAnswerPrompt('What are the exception rules?', evidenceBundle, {
      query: 'What are the policy rules?',
      answer: 'Base answer',
    });

    expect(prompt).toContain('Use only the grounded evidence below');
    expect(prompt).toContain('User question: What are the exception rules?');
    expect(prompt).toContain('Previous wiki turn for context:');
    expect(prompt).toContain('- Question: What are the policy rules?');
    expect(prompt).toContain('- Exception handling requires director approval. (Page: Policy Exceptions)');
    expect(prompt).toContain('Conflicts:');
    expect(prompt).toContain('- One source mentions director approval while another references committee approval.');
    expect(prompt).toContain('Coverage gaps:');
    expect(prompt).toContain('- No grounded source describes the escalation timeline.');
  });

  it('falls back gracefully when there are no grounded facts, conflicts, or gaps', () => {
    const prompt = buildDirectAnswerPrompt('What is unknown?', {
      ...evidenceBundle,
      supportingFacts: [],
      conflicts: [],
      coverageGaps: [],
    });

    expect(prompt).toContain('Grounded facts:');
    expect(prompt).toContain('- No grounded facts available.');
    expect(prompt).not.toContain('Conflicts:');
    expect(prompt).not.toContain('Coverage gaps:');
  });

  it('builds a flexible-mode prompt that allows labeled supplemental context', () => {
    const prompt = buildDirectAnswerPrompt(
      'What are the exception rules and common practices?',
      evidenceBundle,
      undefined,
      {
        mode: 'flexible',
        wikiOnly: false,
        allowSupplementalSources: true,
        showModeIndicator: true,
      }
    );

    expect(prompt).toContain('Start with the grounded wiki evidence below');
    expect(prompt).toContain('Supplemental context:');
    expect(prompt).toContain('do not contradict the grounded evidence');
  });
});