import { AnsweringPolicy, EvidenceBundle, PreviousWikiTurn } from '../models/types';

const FOLLOW_UP_PATTERNS = [
  /^(and|what about|how about|tell me more|more about|what are the exceptions|what about the exceptions)/i,
  /^(why|how|where|when|who|those|them|it|they|that|these)\b/i,
];

export function buildEffectiveQuery(
  prompt: string,
  previousTurn?: PreviousWikiTurn
): string {
  const trimmedPrompt = prompt.trim();
  if (!previousTurn) {
    return trimmedPrompt;
  }

  const wordCount = trimmedPrompt.split(/\s+/).filter(Boolean).length;
  const shouldBlendContext =
    wordCount <= 6 || FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(trimmedPrompt));

  if (!shouldBlendContext) {
    return trimmedPrompt;
  }

  return `${previousTurn.query} ${trimmedPrompt}`;
}

export function buildDirectAnswerPrompt(
  query: string,
  evidenceBundle: EvidenceBundle,
  previousTurn?: PreviousWikiTurn,
  policy: AnsweringPolicy = {
    mode: 'strict',
    wikiOnly: true,
    allowSupplementalSources: false,
    showModeIndicator: true,
  }
): string {
  const factLines = evidenceBundle.supportingFacts
    .slice(0, 6)
    .map((fact) => `- ${fact.statement} (Page: ${fact.title})`)
    .join('\n');

  const conflictLines = evidenceBundle.conflicts.length > 0
    ? `\nConflicts:\n${evidenceBundle.conflicts.map((conflict) => `- ${conflict.summary}`).join('\n')}`
    : '';

  const gapLines = evidenceBundle.coverageGaps.length > 0
    ? `\nCoverage gaps:\n${evidenceBundle.coverageGaps.map((gap) => `- ${gap.reason}`).join('\n')}`
    : '';

  const previousContext = previousTurn
    ? `\nPrevious wiki turn for context:\n- Question: ${previousTurn.query}\n- Answer: ${previousTurn.answer}`
    : '';

  const instructionLines = policy.allowSupplementalSources
    ? [
        'Start with the grounded wiki evidence below when writing one concise direct answer paragraph.',
        'If the grounded evidence is incomplete, you may add concise supplemental context beyond the wiki.',
        'Mark any non-wiki material with the phrase "Supplemental context:" and do not contradict the grounded evidence.',
      ]
    : [
        'Use only the grounded evidence below to write one concise direct answer paragraph.',
        'Do not invent facts or use outside knowledge. If the evidence is partial or conflicted, reflect that in the answer.',
      ];

  return [
    ...instructionLines,
    `User question: ${query}`,
    previousContext,
    '\nGrounded facts:',
    factLines || '- No grounded facts available.',
    conflictLines,
    gapLines,
  ].join('\n');
}