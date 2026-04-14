import * as vscode from 'vscode';
import { WikiManager } from './wiki/wiki-manager';
import { IndexManager } from './index/index-manager';
import { SearchEngine } from './search/search-engine';
import { WikiChatParticipant } from './copilot/wiki-participant';
import { Logger } from './utils/logger';
import { ErrorHandler } from './utils/error-handler';

let wikiManager: WikiManager;
let indexManager: IndexManager;
let searchEngine: SearchEngine;
let chatParticipant: WikiChatParticipant;
let logger: Logger;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    logger = new Logger('PersonalWiki');
    logger.info('Activating Personal Wiki extension...');

    // Get workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      logger.warn('No workspace folder found. Extension partially activated.');
      return;
    }

    const workspacePath = workspaceFolder.uri.fsPath;
    logger.info(`Workspace path: ${workspacePath}`);

    // Initialize managers
    wikiManager = new WikiManager(workspacePath, logger);
    indexManager = new IndexManager(workspacePath, logger);
    searchEngine = new SearchEngine(wikiManager, logger);
    chatParticipant = new WikiChatParticipant(searchEngine, wikiManager, logger);

    // Register commands
    registerCommands(context, wikiManager, indexManager, searchEngine);

    // Register Copilot Chat participant
    const handler: vscode.ChatRequestHandler = async (request, context, stream, token) => {
      return await chatParticipant.handle(request, context, stream, token);
    };
    const participant = vscode.chat.createChatParticipant('wiki', handler);
    context.subscriptions.push(participant);

    // Initialize file watcher
    await wikiManager.initializeFileWatcher();

    // Optional: Rebuild index on startup if configured
    const shouldRebuildOnStartup = vscode.workspace
      .getConfiguration('wiki')
      .get<boolean>('rebuildOnStartup', false);

    if (shouldRebuildOnStartup) {
      logger.info('Rebuilding index on startup...');
      await indexManager.rebuildIndex();
    }

    logger.info('Personal Wiki extension activated successfully!');
  } catch (error) {
    const errorMessage = ErrorHandler.handle(error, 'Extension activation failed');
    vscode.window.showErrorMessage(errorMessage);
    logger.error(errorMessage);
  }
}

function registerCommands(
  context: vscode.ExtensionContext,
  wikiManager: WikiManager,
  indexManager: IndexManager,
  searchEngine: SearchEngine
): void {
  // Command: wiki.ingest
  context.subscriptions.push(
    vscode.commands.registerCommand('wiki.ingest', async () => {
      try {
        logger.info('Starting wiki ingest...');
        vscode.window.showInformationMessage('Starting wiki ingest...');

        const progress = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Wiki Ingest',
            cancellable: false,
          },
          async (progress) => {
            progress.report({ message: 'Ingesting files...' });
            await wikiManager.ingestFromRaw();
            progress.report({ message: 'Rebuilding index...' });
            await indexManager.rebuildIndex();
          }
        );

        vscode.window.showInformationMessage('Wiki ingest completed!');
        logger.info('Wiki ingest completed successfully');
      } catch (error) {
        const errorMessage = ErrorHandler.handle(error, 'Wiki ingest failed');
        vscode.window.showErrorMessage(errorMessage);
        logger.error(errorMessage);
      }
    })
  );

  // Command: wiki.query
  context.subscriptions.push(
    vscode.commands.registerCommand('wiki.query', async () => {
      try {
        logger.info('Opening wiki query...');
        const query = await vscode.window.showInputBox({
          placeHolder: 'Ask a question about your wiki...',
          prompt: 'Enter your query',
        });

        if (!query) {
          return;
        }

        vscode.window.showInformationMessage(`Query: "${query}" sent to Copilot Chat`);
        logger.info(`User query: ${query}`);
      } catch (error) {
        const errorMessage = ErrorHandler.handle(error, 'Wiki query failed');
        vscode.window.showErrorMessage(errorMessage);
        logger.error(errorMessage);
      }
    })
  );

  // Command: wiki.lint
  context.subscriptions.push(
    vscode.commands.registerCommand('wiki.lint', async () => {
      try {
        logger.info('Starting wiki lint...');
        const quickOnly = await vscode.window.showQuickPick(
          [
            { label: 'Quick', description: 'Fast orphan detection only', picked: true },
            { label: 'Deep', description: 'Full analysis including contradictions' },
          ],
          { placeHolder: 'Select lint mode' }
        );

        if (!quickOnly) {
          return;
        }

        vscode.window.showInformationMessage(
          `Running ${quickOnly.label} wiki lint...`
        );

        const results = await wikiManager.lint(quickOnly.label === 'Quick');
        logger.info(`Lint completed: ${JSON.stringify(results)}`);

        vscode.window.showInformationMessage(
          `Lint complete: ${results.orphanCount || 0} orphans ${
            quickOnly.label === 'Deep'
              ? `, ${results.contradictionCount || 0} contradictions`
              : ''
          }`
        );
      } catch (error) {
        const errorMessage = ErrorHandler.handle(error, 'Wiki lint failed');
        vscode.window.showErrorMessage(errorMessage);
        logger.error(errorMessage);
      }
    })
  );

  // Command: wiki.indexRebuild
  context.subscriptions.push(
    vscode.commands.registerCommand('wiki.indexRebuild', async () => {
      try {
        logger.info('Rebuilding wiki index...');
        vscode.window.showInformationMessage('Rebuilding wiki index...');

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Rebuilding Index',
            cancellable: false,
          },
          async (progress) => {
            progress.report({ message: 'Scanning wiki pages...' });
            await indexManager.rebuildIndex();
          }
        );

        vscode.window.showInformationMessage('Wiki index rebuilt successfully!');
        logger.info('Wiki index rebuild completed');
      } catch (error) {
        const errorMessage = ErrorHandler.handle(error, 'Index rebuild failed');
        vscode.window.showErrorMessage(errorMessage);
        logger.error(errorMessage);
      }
    })
  );

  // Command: wiki.openSettings
  context.subscriptions.push(
    vscode.commands.registerCommand('wiki.openSettings', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'wiki');
    })
  );
}

export function deactivate(): void {
  if (wikiManager) {
    wikiManager.dispose();
  }
  logger.info('Personal Wiki extension deactivated');
}
