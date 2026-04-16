import * as vscode from 'vscode';
import { AnsweringPolicy, GroundTruthMode, GroundTruthModeSetting } from '../models/types';

export const GROUND_TRUTH_MODE_KEY = 'wiki.groundTruthMode';
export const DEFAULT_GROUND_TRUTH_MODE: GroundTruthMode = 'strict';

export function normalizeGroundTruthMode(value: string | undefined): GroundTruthMode {
  return value === 'flexible' ? 'flexible' : DEFAULT_GROUND_TRUTH_MODE;
}

export function resolveGroundTruthModeSetting(
  configuration = vscode.workspace.getConfiguration('wiki')
): GroundTruthModeSetting {
  const configuredValue = configuration.get<string>('groundTruthMode', DEFAULT_GROUND_TRUTH_MODE);
  const mode = normalizeGroundTruthMode(configuredValue);

  return {
    key: GROUND_TRUTH_MODE_KEY,
    mode,
    defaultMode: DEFAULT_GROUND_TRUTH_MODE,
    scope: 'workspace',
  };
}

export function buildAnsweringPolicy(
  setting: GroundTruthModeSetting = resolveGroundTruthModeSetting()
): AnsweringPolicy {
  return {
    mode: setting.mode,
    wikiOnly: setting.mode === 'strict',
    allowSupplementalSources: setting.mode === 'flexible',
    showModeIndicator: true,
  };
}

export function createDefaultAnsweringPolicy(): AnsweringPolicy {
  return buildAnsweringPolicy({
    key: GROUND_TRUTH_MODE_KEY,
    mode: DEFAULT_GROUND_TRUTH_MODE,
    defaultMode: DEFAULT_GROUND_TRUTH_MODE,
    scope: 'workspace',
  });
}