import * as vscode from 'vscode';
import { Logger } from '../../../src/utils/logger';

describe('Logger', () => {
  const outputChannel = {
    appendLine: jest.fn(),
    show: jest.fn(),
    dispose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (vscode.window.createOutputChannel as jest.Mock).mockReturnValue(outputChannel);
  });

  it('writes debug messages when debug logging is enabled', () => {
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn(() => true),
    });
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => undefined);

    const logger = new Logger('test');
    logger.debug('debug message', { id: 1 });

    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(outputChannel.appendLine).toHaveBeenCalledWith(
      expect.stringContaining('[DEBUG] debug message')
    );

    debugSpy.mockRestore();
  });

  it('suppresses debug messages when debug logging is disabled', () => {
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest.fn(() => false),
    });
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => undefined);

    const logger = new Logger('test');
    logger.debug('debug message');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(outputChannel.appendLine).not.toHaveBeenCalled();

    debugSpy.mockRestore();
  });

  it('writes info, warn, and error messages to the output channel', () => {
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const logger = new Logger('test');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(outputChannel.appendLine).toHaveBeenCalledTimes(3);

    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('shows and disposes the output channel', () => {
    const logger = new Logger('test');

    logger.show();
    logger.dispose();

    expect(outputChannel.show).toHaveBeenCalledTimes(1);
    expect(outputChannel.dispose).toHaveBeenCalledTimes(1);
  });
});