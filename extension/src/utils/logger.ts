import * as vscode from 'vscode';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private channel: vscode.OutputChannel;
  private logLevel: LogLevel;

  constructor(channelName: string = 'Personal Wiki') {
    this.channel = vscode.window.createOutputChannel(channelName);
    
    const config = vscode.workspace.getConfiguration('wiki');
    this.logLevel = config.get<boolean>('enableDebugLogging', false)
      ? LogLevel.DEBUG
      : LogLevel.INFO;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      const formatted = this.formatMessage('DEBUG', message, args);
      console.debug(formatted);
      this.channel.appendLine(formatted);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      const formatted = this.formatMessage('INFO', message, args);
      console.info(formatted);
      this.channel.appendLine(formatted);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.logLevel <= LogLevel.WARN) {
      const formatted = this.formatMessage('WARN', message, args);
      console.warn(formatted);
      this.channel.appendLine(formatted);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      const formatted = this.formatMessage('ERROR', message, args);
      console.error(formatted);
      this.channel.appendLine(formatted);
    }
  }

  private formatMessage(level: string, message: string, args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  show(): void {
    this.channel.show();
  }

  dispose(): void {
    this.channel.dispose();
  }
}
