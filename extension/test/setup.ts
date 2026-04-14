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
    showInformationMessage: jest.fn(),
    createOutputChannel: jest.fn(() => ({
      appendLine: jest.fn(),
      show: jest.fn(),
      dispose: jest.fn(),
    })),
  },
  Uri: {
    file: jest.fn((path) => ({ fsPath: path })),
  },
}), { virtual: true });

// Set test timeout
jest.setTimeout(10000);
