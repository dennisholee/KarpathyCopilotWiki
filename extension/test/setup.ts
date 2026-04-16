/**
 * Jest setup file
 * Runs before all tests
 */

// Mock VS Code API if not available in test environment
jest.mock('vscode', () => ({
  workspace: {
    createFileSystemWatcher: jest.fn(() => ({
      dispose: jest.fn(),
      onDidCreate: jest.fn(),
      onDidChange: jest.fn(),
      onDidDelete: jest.fn(),
    })),
    getConfiguration: jest.fn(() => ({
      get: jest.fn((key, defaultValue) => defaultValue),
    })),
  },
  RelativePattern: jest.fn((baseFolder, pattern) => ({
    baseFolder,
    pattern,
  })),
  chat: {
    createChatParticipant: jest.fn(() => ({
      dispose: jest.fn(),
    })),
  },
  window: {
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showInformationMessage: jest.fn(),
    withProgress: jest.fn(async (_options, task) => task({ report: jest.fn() })),
    createOutputChannel: jest.fn(() => ({
      appendLine: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn(),
    })),
  },
  ProgressLocation: {
    Notification: 15,
  },
  Uri: {
    file: jest.fn((path) => ({ fsPath: path })),
  },
  LanguageModelChatMessage: {
    User: jest.fn((content) => ({ role: 'user', content })),
  },
}), { virtual: true });

// Set test timeout
jest.setTimeout(10000);
