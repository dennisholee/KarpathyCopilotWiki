/**
 * Error Handler
 * Centralized error handling with user-friendly messages and fallback strategies
 */

import * as vscode from 'vscode';
import { Logger } from './logger';

export enum ErrorCategory {
  PDF_PARSING = 'PDF_PARSING',
  FILE_PERMISSION = 'FILE_PERMISSION',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  COPILOT_UNAVAILABLE = 'COPILOT_UNAVAILABLE',
  EMBEDDINGS_FAILED = 'EMBEDDINGS_FAILED',
  WIKI_OPERATION = 'WIKI_OPERATION',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorHandlingOptions {
  showUserMessage?: boolean;
  fallbackMessage?: string;
  autoRetry?: boolean;
  retryCount?: number;
}

export interface HandledError {
  category: ErrorCategory;
  originalError: Error;
  userMessage: string;
  internalMessage: string;
  fallbackAction?: () => Promise<void>;
}

export class ErrorHandler {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Categorize and handle errors with appropriate user messaging
   */
  handle(
    error: Error | string,
    options: ErrorHandlingOptions = {}
  ): HandledError {
    const {
      showUserMessage = true,
      fallbackMessage,
      autoRetry = false,
      retryCount = 3,
    } = options;

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const category = this.categorizeError(errorObj);

    let userMessage: string;
    let internalMessage: string;

    switch (category) {
      case ErrorCategory.PDF_PARSING:
        userMessage =
          'Failed to extract text from PDF. The file may be corrupted or password-protected. ' +
          'Try converting to a different PDF or provide the text directly.';
        internalMessage = `PDF parsing failed: ${errorObj.message}`;
        break;

      case ErrorCategory.FILE_PERMISSION:
        userMessage =
          'Permission denied. Check file/folder permissions or try running VS Code as administrator. ' +
          'The wiki directory may be read-only.';
        internalMessage = `File permission error: ${errorObj.message}`;
        break;

      case ErrorCategory.FILE_NOT_FOUND:
        userMessage =
          'File or directory not found. Check that the file path is correct and the wiki directory exists.';
        internalMessage = `File not found: ${errorObj.message}`;
        break;

      case ErrorCategory.COPILOT_UNAVAILABLE:
        userMessage =
          'Copilot Chat unavailable. Using local search fallback. ' +
          'To use semantic search, ensure GitHub Copilot is installed and GITHUB_COPILOT_API_KEY is configured.';
        internalMessage = `Copilot API unavailable: ${errorObj.message}`;
        break;

      case ErrorCategory.EMBEDDINGS_FAILED:
        userMessage =
          'Semantic search unavailable. Falling back to keyword search. ' +
          'Phase 3 embeddings integration may not be available.';
        internalMessage = `Embeddings failed: ${errorObj.message}`;
        break;

      case ErrorCategory.VALIDATION_FAILED:
        userMessage =
          'Validation error: Data does not meet requirements. ' +
          'Check page title, tags, or content format.';
        internalMessage = `Validation failed: ${errorObj.message}`;
        break;

      case ErrorCategory.WIKI_OPERATION:
        userMessage =
          'Wiki operation failed. Check that the wiki directory is accessible and has write permissions.';
        internalMessage = `Wiki operation error: ${errorObj.message}`;
        break;

      default:
        userMessage =
          fallbackMessage ||
          'An unexpected error occurred. Check the output panel for details.';
        internalMessage = `Unknown error: ${errorObj.message}`;
    }

    // Log the error
    this.logger.error(internalMessage);

    // Show user message if requested
    if (showUserMessage) {
      this.showErrorMessage(userMessage, category);
    }

    const handledError: HandledError = {
      category,
      originalError: errorObj,
      userMessage,
      internalMessage,
    };

    return handledError;
  }

  /**
   * Categorize error based on error message patterns
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    if (
      message.includes('pdf') ||
      message.includes('parsing') ||
      message.includes('extract')
    ) {
      return ErrorCategory.PDF_PARSING;
    }

    if (
      message.includes('permission') ||
      message.includes('denied') ||
      message.includes('eacces') ||
      message.includes('eperm')
    ) {
      return ErrorCategory.FILE_PERMISSION;
    }

    if (
      message.includes('enoent') ||
      message.includes('not found') ||
      message.includes('no such file')
    ) {
      return ErrorCategory.FILE_NOT_FOUND;
    }

    if (
      message.includes('copilot') ||
      message.includes('github_copilot_api_key') ||
      message.includes('chat api')
    ) {
      return ErrorCategory.COPILOT_UNAVAILABLE;
    }

    if (
      message.includes('embedding') ||
      message.includes('transformers') ||
      message.includes('model')
    ) {
      return ErrorCategory.EMBEDDINGS_FAILED;
    }

    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('schema')
    ) {
      return ErrorCategory.VALIDATION_FAILED;
    }

    if (
      message.includes('wiki') ||
      message.includes('page') ||
      message.includes('directory')
    ) {
      return ErrorCategory.WIKI_OPERATION;
    }

    return ErrorCategory.UNKNOWN;
  }

  /**
   * Show error message to user via VS Code interface
   */
  private showErrorMessage(message: string, category: ErrorCategory): void {
    // Use warning for recoverable errors, error for critical ones
    const isRecoverable =
      category === ErrorCategory.COPILOT_UNAVAILABLE ||
      category === ErrorCategory.EMBEDDINGS_FAILED;

    if (isRecoverable) {
      vscode.window.showWarningMessage(message);
    } else {
      vscode.window.showErrorMessage(message);
    }
  }

  /**
   * Wrap async operation with error handling and retry logic
   */
  async tryWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3
  ): Promise<T | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(
          `[${operationName}] Attempt ${attempt}/${maxRetries}...`
        );
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `[${operationName}] Attempt ${attempt} failed: ${lastError.message}`
        );

        if (attempt < maxRetries) {
          // Exponential backoff: 100ms, 200ms, 400ms
          const delayMs = Math.pow(2, attempt - 1) * 100;
          await this.sleep(delayMs);
        }
      }
    }

    // All retries exhausted
    this.handle(lastError || new Error(`${operationName} failed after ${maxRetries} attempts`), {
      showUserMessage: true,
    });

    return null;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create graceful fallback for when primary operation fails
   */
  async tryWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      this.logger.debug(`[${operationName}] Attempting primary operation...`);
      return await primaryOperation();
    } catch (primaryError) {
      this.logger.warn(
        `[${operationName}] Primary failed, using fallback: ${primaryError instanceof Error ? primaryError.message : String(primaryError)}`
      );

      try {
        this.logger.debug(`[${operationName}] Attempting fallback operation...`);
        return await fallbackOperation();
      } catch (fallbackError) {
        this.handle(
          fallbackError instanceof Error
            ? fallbackError
            : new Error(String(fallbackError)),
          { showUserMessage: true }
        );
        throw fallbackError;
      }
    }
  }

  // Static methods for backwards compatibility
  static handle(error: unknown, context: string): string {
    const message = ErrorHandler.extractMessage(error);
    const fullMessage = `${context}: ${message}`;
    return fullMessage;
  }

  static extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String((error as Record<string, unknown>).message);
    }

    return String(error);
  }

  static isUserFacingError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('permission') ||
        message.includes('not found') ||
        message.includes('invalid') ||
        message.includes('timeout')
      );
    }
    return false;
  }

  static logStackTrace(error: unknown): string {
    if (error instanceof Error && error.stack) {
      return error.stack;
    }
    return JSON.stringify(error, null, 2);
  }
}
