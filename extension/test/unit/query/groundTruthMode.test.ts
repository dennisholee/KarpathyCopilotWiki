import * as vscode from 'vscode';
import {
  buildAnsweringPolicy,
  normalizeGroundTruthMode,
  resolveGroundTruthModeSetting,
} from '../../../src/query/groundTruthMode';

describe('groundTruthMode', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('defaults invalid values to strict', () => {
    expect(normalizeGroundTruthMode('unexpected')).toBe('strict');
    expect(normalizeGroundTruthMode(undefined)).toBe('strict');
  });

  it('resolves the workspace setting with strict as the default', () => {
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((_key: string, defaultValue: unknown) => defaultValue),
    });

    const setting = resolveGroundTruthModeSetting();

    expect(setting.key).toBe('wiki.groundTruthMode');
    expect(setting.mode).toBe('strict');
    expect(setting.defaultMode).toBe('strict');
    expect(setting.scope).toBe('workspace');
  });

  it('builds a flexible answering policy from the configured mode', () => {
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn((key: string, defaultValue: unknown) => {
        if (key === 'groundTruthMode') {
          return 'flexible';
        }
        return defaultValue;
      }),
    });

    const policy = buildAnsweringPolicy(resolveGroundTruthModeSetting());

    expect(policy.mode).toBe('flexible');
    expect(policy.wikiOnly).toBe(false);
    expect(policy.allowSupplementalSources).toBe(true);
    expect(policy.showModeIndicator).toBe(true);
  });
});