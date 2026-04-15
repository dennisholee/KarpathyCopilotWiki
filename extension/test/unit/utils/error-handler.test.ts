import * as vscode from 'vscode';
import { ErrorCategory, ErrorHandler } from '../../../src/utils/error-handler';
import { Logger } from '../../../src/utils/logger';

describe('ErrorHandler', () => {
  let logger: Logger;
  let handler: ErrorHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;
    handler = new ErrorHandler(logger);
  });

  it('categorizes PDF parsing errors and shows an error message', () => {
    const result = handler.handle(new Error('PDF extract parsing failed'));

    expect(result.category).toBe(ErrorCategory.PDF_PARSING);
    expect(result.userMessage).toContain('Failed to extract text from PDF');
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('PDF parsing failed'));
    expect(vscode.window.showErrorMessage).toHaveBeenCalledTimes(1);
  });

  it('uses warning messages for recoverable copilot errors', () => {
    const result = handler.handle(new Error('Copilot chat api unavailable'));

    expect(result.category).toBe(ErrorCategory.COPILOT_UNAVAILABLE);
    expect(vscode.window.showWarningMessage).toHaveBeenCalledTimes(1);
    expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
  });

  it('supports fallback messages and suppresses user messaging when requested', () => {
    const result = handler.handle('mystery failure', {
      showUserMessage: false,
      fallbackMessage: 'Fallback text',
    });

    expect(result.category).toBe(ErrorCategory.UNKNOWN);
    expect(result.userMessage).toBe('Fallback text');
    expect(vscode.window.showErrorMessage).not.toHaveBeenCalled();
    expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
  });

  it('retries until an operation succeeds', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValue('ok');
    jest.spyOn(handler as any, 'sleep').mockImplementation(async () => undefined);

    const result = await handler.tryWithRetry(operation, 'test operation', 3);

    expect(result).toBe('ok');
    expect(operation).toHaveBeenCalledTimes(3);
    expect(logger.warn).toHaveBeenCalledTimes(2);
  });

  it('returns null and handles the final error when retries are exhausted', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('permission denied'));
    const handleSpy = jest.spyOn(handler, 'handle');
    jest.spyOn(handler as any, 'sleep').mockImplementation(async () => undefined);

    const result = await handler.tryWithRetry(operation, 'write file', 2);

    expect(result).toBeNull();
    expect(operation).toHaveBeenCalledTimes(2);
    expect(handleSpy).toHaveBeenCalledWith(expect.any(Error), { showUserMessage: true });
  });

  it('uses fallback operation when the primary operation fails', async () => {
    const primary = jest.fn().mockRejectedValue(new Error('primary failed'));
    const fallback = jest.fn().mockResolvedValue('fallback result');

    const result = await handler.tryWithFallback(primary, fallback, 'search');

    expect(result).toBe('fallback result');
    expect(primary).toHaveBeenCalledTimes(1);
    expect(fallback).toHaveBeenCalledTimes(1);
  });

  it('rethrows when both primary and fallback operations fail', async () => {
    const primary = jest.fn().mockRejectedValue(new Error('primary failed'));
    const fallbackError = new Error('fallback failed');
    const fallback = jest.fn().mockRejectedValue(fallbackError);
    const handleSpy = jest.spyOn(handler, 'handle');

    await expect(handler.tryWithFallback(primary, fallback, 'search')).rejects.toThrow('fallback failed');
    expect(handleSpy).toHaveBeenCalledWith(fallbackError, { showUserMessage: true });
  });

  it('supports the static helper methods', () => {
    const error = new Error('invalid schema');

    expect(ErrorHandler.handle(error, 'context')).toBe('context: invalid schema');
    expect(ErrorHandler.extractMessage({ message: 'custom' })).toBe('custom');
    expect(ErrorHandler.isUserFacingError(new Error('permission denied'))).toBe(true);
    expect(ErrorHandler.isUserFacingError(new Error('backend exploded'))).toBe(false);
    expect(ErrorHandler.logStackTrace(error)).toContain('Error: invalid schema');
    expect(ErrorHandler.logStackTrace({ foo: 'bar' })).toBe(JSON.stringify({ foo: 'bar' }, null, 2));
  });
});