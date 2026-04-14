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
    
    // Initialize search engine (builds BM25 index)
    try {
      await searchEngine.initialize();
      logger.info('Search engine initialized');
    } catch (initError) {
      logger.warn(`Failed to initialize search engine: ${String(initError)}, continuing with lazy initialization`);
    }
    
    chatParticipant = new WikiChatParticipant(searchEngine, wikiManager, logger);

    // Register commands
    registerCommands(context, wikiManager, indexManager, searchEngine);

    // Register Copilot Chat participant
    const handler: vscode.ChatRequestHandler = async (request, context, stream, token) => {
      return await chatParticipant.handle(request, context, stream, token);
    };
    
    try {
      // Register with full ID including extension name as per package.json contribution
      const participant = vscode.chat.createChatParticipant('karpathy-wiki.wiki', handler);
      participant.iconPath = new vscode.ThemeIcon('book');
      context.subscriptions.push(participant);
      logger.info('Chat participant "karpathy-wiki.wiki" registered successfully');
    } catch (participantError) {
      logger.error(`Failed to register chat participant: ${String(participantError)}`);
      // Continue - non-critical feature
    }

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
        vscode.window.showInformationMessage('Starting wiki ingest from /raw directory...');

        const progress = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Wiki Ingest',
            cancellable: false,
          },
          async (progress) => {
            try {
              progress.report({ message: 'Scanning /raw directory...', increment: 0 });
              
              progress.report({ 
                message: `Processing files: extracting text...`, 
                increment: 10 
              });
              
              await wikiManager.ingestFromRaw();
              
              progress.report({ 
                message: 'Detecting backlinks...', 
                increment: 40 
              });
              
              progress.report({ 
                message: 'Rebuilding index and glossary...', 
                increment: 80 
              });
              
              await indexManager.rebuildIndex();
              
              progress.report({ 
                message: 'Ingest complete!', 
                increment: 100 
              });
            } catch (ingestError) {
              logger.error(`Ingest progress error: ${String(ingestError)}`);
              throw ingestError;
            }
          }
        );

        vscode.window.showInformationMessage('✅ Wiki ingest completed! Check wiki/ for new pages.');
        logger.info('Wiki ingest completed successfully');
      } catch (error) {
        const errorMessage = ErrorHandler.handle(error, 'Wiki ingest failed');
        logger.error(`Ingest failed: ${errorMessage}`);
        
        // Provide recovery suggestions
        const choice = await vscode.window.showErrorMessage(
          `Ingest failed: ${errorMessage}`,
          'Retry',
          'Dismiss'
        );
        
        if (choice === 'Retry') {
          await vscode.commands.executeCommand('wiki.ingest');
        }
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

        const isQuick = quickOnly.label === 'Quick';
        vscode.window.showInformationMessage(
          `Running ${quickOnly.label} wiki lint analysis...`
        );

        let results: any;
        
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Wiki Lint (${quickOnly.label})`,
            cancellable: false,
          },
          async (progress) => {
            try {
              progress.report({ message: 'Analyzing pages...', increment: 20 });
              results = await wikiManager.lint(isQuick);
              
              if (!isQuick) {
                progress.report({ message: 'Checking for contradictions...', increment: 60 });
              }
              
              progress.report({ message: 'Complete!', increment: 100 });
            } catch (lintError) {
              logger.error(`Lint error during analysis: ${String(lintError)}`);
              throw lintError;
            }
          }
        );

        const orphanCount = results?.orphanCount || 0;
        const contradictionCount = results?.contradictionCount || 0;
        
        const message = isQuick
          ? `✅ Lint complete: ${orphanCount} orphan pages found`
          : `✅ Lint complete: ${orphanCount} orphans, ${contradictionCount} potential contradictions`;
        
        vscode.window.showInformationMessage(message);
        logger.info(`Lint completed: ${message}`);
      } catch (error) {
        const errorMessage = ErrorHandler.handle(error, 'Wiki lint failed');
        logger.error(`Lint failed: ${errorMessage}`);
        
        vscode.window.showErrorMessage(
          `Lint failed: ${errorMessage}`
        );
      }
    })
  );

  // Command: wiki.indexRebuild
  context.subscriptions.push(
    vscode.commands.registerCommand('wiki.indexRebuild', async () => {
      try {
        logger.info('Rebuilding wiki index...');
        vscode.window.showInformationMessage('Rebuilding wiki index and glossary...');

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Rebuilding Index',
            cancellable: false,
          },
          async (progress) => {
            try {
              progress.report({ message: 'Scanning wiki pages...', increment: 20 });
              progress.report({ message: 'Building index...', increment: 50 });
              await indexManager.rebuildIndex();
              progress.report({ message: 'Generating glossary...', increment: 80 });
              progress.report({ message: 'Complete!', increment: 100 });
            } catch (rebuildError) {
              logger.error(`Index rebuild error: ${String(rebuildError)}`);
              throw rebuildError;
            }
          }
        );

        vscode.window.showInformationMessage('✅ Wiki index rebuilt successfully!');
        logger.info('Wiki index rebuild completed');
      } catch (error) {
        const errorMessage = ErrorHandler.handle(error, 'Index rebuild failed');
        logger.error(`Index rebuild failed: ${errorMessage}`);
        
        const choice = await vscode.window.showErrorMessage(
          `Index rebuild failed: ${errorMessage}`,
          'Retry',
          'Dismiss'
        );
        
        if (choice === 'Retry') {
          await vscode.commands.executeCommand('wiki.indexRebuild');
        }
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
