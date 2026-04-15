import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { SearchEngine } from '../search/search-engine';
import { WikiManager } from '../wiki/wiki-manager';
import { QueryHandler, QueryResult } from '../query/queryCommand';
import { ArchivedDecision, DecisionArchiver, ConversationEntry } from '../query/decisionArchiver';
import { PreviousWikiTurn } from '../models/types';
import { buildDirectAnswerPrompt, buildEffectiveQuery } from '../query/answerPrompt';
import { IndexBuilder } from '../commands/indexRebuild';
import { IngestOrchestrator } from '../ingest/ingestCommand';
import { ModelMatcher } from '../modeling/modelMatcher';
import { ProposalBuilder } from '../modeling/proposalBuilder';
import { ContractValidator } from '../modeling/contractValidator';
import { ProposalFormatter } from '../modeling/proposalFormatter';

export class WikiChatParticipant {
  private searchEngine: SearchEngine;
  private wikiManager: WikiManager;
  private logger: Logger;
  private queryHandler: QueryHandler;
  private decisionArchiver: DecisionArchiver;
  private modelMatcher: ModelMatcher;
  private proposalBuilder: ProposalBuilder;
  private contractValidator: ContractValidator;
  private proposalFormatter: ProposalFormatter;
  private conversationHistory: ConversationEntry[] = [];
  private lastQueryResult: QueryResult | null = null;

  constructor(searchEngine: SearchEngine, wikiManager: WikiManager, logger: Logger) {
    this.searchEngine = searchEngine;
    this.wikiManager = wikiManager;
    this.logger = logger;
    this.queryHandler = new QueryHandler(searchEngine, wikiManager, logger);
    this.decisionArchiver = new DecisionArchiver(this.wikiManager.getWikiDir(), logger);
    this.modelMatcher = new ModelMatcher();
    this.proposalBuilder = new ProposalBuilder();
    this.contractValidator = new ContractValidator();
    this.proposalFormatter = new ProposalFormatter();
  }

  /**
   * Register the wiki chat participant with Copilot
   */
  static registerParticipant(
    context: vscode.ExtensionContext,
    searchEngine: SearchEngine,
    wikiManager: WikiManager,
    logger: Logger
  ): vscode.Disposable {
    const participant = new WikiChatParticipant(searchEngine, wikiManager, logger);

    return vscode.chat.createChatParticipant('karpathy-wiki.wiki', (request, context, stream, token) => {
      return participant.handle(request, context, stream, token);
    });
  }

  /**
   * Handle incoming Copilot Chat messages
   */
  async handle(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult> {
    try {
      const commandRequest = request as vscode.ChatRequest & { command?: string };
      const requestedCommand = this.normalizeCommand(commandRequest.command);
      this.logger.info(
        `Wiki Chat: Processing request - command="${requestedCommand ?? 'none'}" prompt="${request.prompt}"`
      );

      // Parse command and extract query
      const { command, query } = requestedCommand
        ? this.resolveSlashCommand(requestedCommand, request.prompt)
        : this.parseCommand(request.prompt);
      const previousTurn = this.getPreviousWikiTurn();

      // Add user message to history
      this.conversationHistory.push({
        speaker: 'user',
        message: request.prompt,
        timestamp: new Date(),
      });

      // Route to appropriate handler based on command
      if (command === 'rebuild') {
        return await this.handleRebuild(stream);
      } else if (command === 'ingest') {
        return await this.handleIngest(stream, query);
      } else if (command === 'model') {
        return await this.handleModel(query, previousTurn, stream);
      } else if (command === 'ingest-help') {
        // User typed "ingest" without a filename - show help
        this.logger.info('Displaying ingest help');
        stream.markdown(
          '**Wiki Ingest Help**\n\n' +
          'Usage: `ingest` to process all files in `/raw`, or `ingest [filename]` for one file\n\n' +
          '**Examples:**\n' +
          '- `ingest`\n' +
          '- `ingest *`\n' +
          '- `ingest my-document.pdf`\n' +
          '- `ingest for research-paper.md`\n' +
          '- `ingest technical-spec.txt`\n\n' +
          'This will ingest all raw files or a specific raw document from `/raw` and create wiki pages with summaries and backlinks.'
        );
        return {};
      } else if (command === 'query-help') {
        // User typed "query" without a question - show help
        this.logger.info('Displaying query help');
        stream.markdown(
          '**Wiki Query Help**\n\n' +
          'Usage: `query [your question]` or just ask directly\n\n' +
          '**Examples:**\n' +
          '- `query what are neural networks`\n' +
          '- `query explain transformers architecture`\n' +
          '- `what are the key machine learning concepts`\n\n' +
          'The wiki will search for relevant pages and provide a comprehensive answer.'
        );
        return {};
      } else if (command === 'search-help') {
        // User typed "search" without a query - show help
        this.logger.info('Displaying search help');
        stream.markdown(
          '**Wiki Search Help**\n\n' +
          'Usage: `search [your query]` or `search for [your query]`\n\n' +
          '**Examples:**\n' +
          '- `search neural networks`\n' +
          '- `search for machine learning basics`\n' +
          '- `search transformers architecture`\n\n' +
          'Or just ask a question directly and I\'ll search the wiki for relevant pages!'
        );
        return {};
      } else if (command === 'model-help') {
        this.logger.info('Displaying model help');
        stream.markdown(
          '**Wiki Model Help**\n\n' +
          'Usage: `@wiki /model [modelling requirement]`\n\n' +
          '**Examples:**\n' +
          '- `@wiki /model add risk rating to the portfolio model`\n' +
          '- `@wiki /model extend the transaction entity with settlement status and validation rules`\n\n' +
          'This will find the strongest grounded wiki model, propose an OpenMetadata-style contract enhancement, and disclose evidence, assumptions, and conflicts.'
        );
        return {};
      }

      // Process query (search, query, or default)
      const effectiveQuery = buildEffectiveQuery(
        command === 'search' || command === 'query' ? query : request.prompt,
        previousTurn
      );
      
      const displayQuery = (command === 'search' || command === 'query' ? query : request.prompt).trim();

      return await this.handleQuery(displayQuery, effectiveQuery, previousTurn, stream, request, token);
    } catch (error) {
      this.logger.error(`Chat handler error: ${String(error)}`);
      stream.markdown('Error processing your request. Please try again.');
      return { errorDetails: { message: String(error) } };
    }
  }

  private async handleModel(
    rawRequest: string,
    previousTurn: PreviousWikiTurn | undefined,
    stream: vscode.ChatResponseStream
  ): Promise<vscode.ChatResult> {
    const trimmedRequest = rawRequest.trim();

    if (!trimmedRequest) {
      stream.markdown(this.proposalFormatter.formatRefinementGuidance({
        requirement: this.modelMatcher.buildRequirement(rawRequest),
        candidates: [],
        needsRefinement: true,
        refinementReason: 'A modelling requirement is required before a proposal can be generated.',
      }));
      return {};
    }

    const effectiveRequest = buildEffectiveQuery(trimmedRequest, previousTurn);
    const queryResult = await this.queryHandler.query(effectiveRequest, {
      maxResults: 5,
      useLocalEmbeddings: true,
      previousTurn,
    });
    this.lastQueryResult = queryResult;

    const selection = this.modelMatcher.selectBaseline(trimmedRequest, queryResult);
    if (selection.baselineCandidate) {
      const baselinePage = await this.wikiManager.getPage(selection.baselineCandidate.pageId);
      if (baselinePage) {
        selection.baselineCandidate = {
          ...selection.baselineCandidate,
          contentExcerpt: baselinePage.content,
          plaintext: baselinePage.content,
          sourceReferences: baselinePage.sourceReferences || selection.baselineCandidate.sourceReferences,
        };
      }
    }

    let response: string;
    if (selection.needsRefinement || !selection.baselineCandidate) {
      response = this.proposalFormatter.formatRefinementGuidance(selection);
    } else {
      const proposal = this.proposalBuilder.buildProposal(selection, queryResult);
      const validation = this.contractValidator.validate(
        proposal.contract,
        proposal.rationale,
        proposal.evidence.length
      );
      response = this.proposalFormatter.formatProposal(proposal, validation);
    }

    stream.markdown(response);
    this.conversationHistory.push(
      {
        speaker: 'assistant',
        message: response,
        timestamp: new Date(),
      }
    );

    return {};
  }

  /**
   * Handle query/search request
   */
  private async handleQuery(
    displayQuery: string,
    query: string,
    previousTurn: PreviousWikiTurn | undefined,
    stream: vscode.ChatResponseStream,
    request: vscode.ChatRequest,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult> {
    this.logger.info(`Executing query: "${query}"`);

    const queryResult = await this.queryHandler.query(query, {
      maxResults: 5,
      useLocalEmbeddings: true,
      previousTurn,
    });

    const synthesizedResult = await this.applyRemoteSynthesisIfEnabled(
      request,
      queryResult,
      previousTurn,
      stream,
      token
    );
    this.lastQueryResult = synthesizedResult;

    const answerMessage = this.queryHandler.formatContextMessage(synthesizedResult);
    const archivedDecision = await this.archiveAnsweredQuery(displayQuery || query, answerMessage, synthesizedResult);

    // Stream response
    await this.streamResponse(synthesizedResult, stream, archivedDecision);

    // Add assistant response to history
    this.conversationHistory.push({
      speaker: 'assistant',
      message: answerMessage,
      timestamp: new Date(),
    });

    this.logger.debug(`Query completed in ${synthesizedResult.executionTime}ms`);
    return {};
  }

  /**
   * Handle rebuild command
   */
  private async handleRebuild(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    try {
      this.logger.info('Rebuild index command initiated');
      stream.markdown('🔄 Rebuilding wiki index...\n\n');

      const indexBuilder = new IndexBuilder(this.wikiManager.getWikiDir(), this.logger);
      const stats = await indexBuilder.rebuildIndex();

      const response =
        `✅ **Index Rebuilt Successfully**\n\n` +
        `- **Pages Indexed**: ${stats.pagesIndexed}\n` +
        `- **Glossary Terms**: ${stats.termsInGlossary}\n` +
        `- **Categories Found**: ${stats.categoriesFound}\n\n` +
        `The wiki index has been updated. You can now search and query your pages.`;

      stream.markdown(response);

      // Add to history
      this.conversationHistory.push({
        speaker: 'assistant',
        message: response,
        timestamp: new Date(),
      });

      return {};
    } catch (error) {
      this.logger.error(`Rebuild failed: ${String(error)}`);
      stream.markdown(`❌ Failed to rebuild index: ${String(error)}`);
      return { errorDetails: { message: String(error) } };
    }
  }

  /**
   * Handle ingest command
   */
  private async handleIngest(stream: vscode.ChatResponseStream, sourceFile: string): Promise<vscode.ChatResult> {
    try {
      const trimmedSourceFile = sourceFile.trim();

      if (!trimmedSourceFile || trimmedSourceFile === '*') {
        this.logger.info('Ingest command initiated for all files in /raw');
        stream.markdown('📂 Ingesting all files from `/raw`...\n\n');

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Ingesting All Raw Files',
            cancellable: false,
          },
          async (progress) => {
            progress.report({ message: 'Scanning /raw directory...', increment: 0 });

            const ingestSummary = await this.wikiManager.ingestFromRaw();
            progress.report({ message: 'Rebuilding wiki index...', increment: 80 });

            const indexBuilder = new IndexBuilder(this.wikiManager.getWikiDir(), this.logger);
            const indexStats = await indexBuilder.rebuildIndex();
            progress.report({ message: 'Ingest complete!', increment: 100 });

            const response =
              '✅ **Full Raw Ingestion Complete**\n\n' +
              `- **Files Processed**: all files in /raw\n` +
              `- **Pages Created**: ${ingestSummary.created}\n` +
              `- **Pages Updated**: ${ingestSummary.updated}\n` +
              `- **Index Pages Scanned**: ${indexStats.pagesIndexed}\n` +
              `- **Glossary Terms**: ${indexStats.termsInGlossary}\n` +
              `- **Categories Found**: ${indexStats.categoriesFound}\n\n` +
              'The wiki has been refreshed from the full raw corpus.';

            stream.markdown(response);

            this.conversationHistory.push({
              speaker: 'assistant',
              message: response,
              timestamp: new Date(),
            });
          }
        );

        return {};
      }

      if (!trimmedSourceFile) {
        stream.markdown(
          '**Ingest Raw Documents**\n\n' +
          'Usage: `ingest` to process all files in `/raw`, or `ingest [filename]` for one file\n\n' +
          '**Examples:**\n' +
          '- `ingest`\n' +
          '- `ingest *`\n' +
          '- `ingest my-document.pdf`\n' +
          '- `ingest for research-paper.md`\n\n' +
          'This will ingest all raw files or a specific raw document and create wiki pages.'
        );
        return {};
      }

      this.logger.info(`Ingest command initiated for: ${trimmedSourceFile}`);

      // Resolve full path to raw file
      const rawDir = this.wikiManager.getRawDir();
      const rawFilePath = path.join(rawDir, trimmedSourceFile);

      // Verify file exists
      if (!fs.existsSync(rawFilePath)) {
        const availableFiles = fs
          .readdirSync(rawDir)
          .filter((fileName: string) => !fileName.startsWith('.'))
          .slice(0, 10);
        stream.markdown(
          `❌ File not found: \`${trimmedSourceFile}\`\n\n` +
          `**Available files in /raw:**\n` +
          (availableFiles.length > 0 
            ? availableFiles.map((fileName: string) => `- ${fileName}`).join('\n')
            : '(empty directory)')
        );
        return {};
      }

      stream.markdown(`📂 Ingesting ${trimmedSourceFile}...\n\n`);

      const orchestrator = new IngestOrchestrator(this.wikiManager.getWikiDir(), this.logger);

      // Set up progress reporter
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Ingesting Wiki Document',
          cancellable: false,
        },
        async (progress) => {
          orchestrator.setProgressReporter(progress);

          const result = await orchestrator.ingest({
            sourceFile: rawFilePath,
            skipBacklinks: false,
            maxPages: 10,
          });

          const indexBuilder = new IndexBuilder(this.wikiManager.getWikiDir(), this.logger);
          await indexBuilder.rebuildIndex();

          const response =
            `✅ **Ingestion Complete**\n\n` +
            `- **Source**: ${trimmedSourceFile}\n` +
            `- **Pages Created**: ${result.pagesCreated.length}\n` +
            `- **Failed Pages**: ${result.failedPages.length}\n` +
            `- **Backlinks Inserted**: ${result.backlinksInserted}\n` +
            `- **Duration**: ${(result.duration / 1000).toFixed(2)}s\n\n`;

          if (result.pagesCreated.length > 0) {
            stream.markdown(response + `**Created pages:**\n${result.pagesCreated.map((p) => `- ${p}`).join('\n')}`);
          } else {
            stream.markdown(response + 'ℹ️ No pages were created during ingestion.');
          }

          // Add to history
          this.conversationHistory.push({
            speaker: 'assistant',
            message: response,
            timestamp: new Date(),
          });

          return result;
        }
      );

      return {};
    } catch (error) {
      this.logger.error(`Ingest failed: ${String(error)}`);
      stream.markdown(`❌ Failed to ingest document: ${String(error)}`);
      return { errorDetails: { message: String(error) } };
    }
  }

  private normalizeCommand(command: string | undefined): string | undefined {
    if (!command) {
      return undefined;
    }

    const normalized = command.trim().replace(/^\/+/, '').toLowerCase();
    return normalized || undefined;
  }

  private resolveSlashCommand(command: string, prompt: string): { command: string; query: string } {
    const trimmedPrompt = prompt.trim();

    switch (command) {
      case 'rebuild':
        return { command: 'rebuild', query: '' };
      case 'ingest':
        return { command: 'ingest', query: trimmedPrompt };
      case 'query':
        return {
          command: trimmedPrompt ? 'query' : 'query-help',
          query: trimmedPrompt,
        };
      case 'search':
        return {
          command: trimmedPrompt ? 'search' : 'search-help',
          query: trimmedPrompt,
        };
      case 'model':
        return {
          command: trimmedPrompt ? 'model' : 'model-help',
          query: trimmedPrompt,
        };
      default:
        return this.parseCommand(prompt);
    }
  }

  /**
   * Parse command from user input
  * Supports: "/search [query]", "/ingest [file]", "/rebuild", "/query [question]", "/model [requirement]", or plain query
   */
  private parseCommand(prompt: string): { command: string; query: string } {
    let trimmed = prompt.trim();
    
    // Strip leading "/" if present (VS Code chat subcommand prefix)
    if (trimmed.startsWith('/')) {
      trimmed = trimmed.slice(1).trim();
    }
    
    const lowerTrimmed = trimmed.toLowerCase();

    // Match "rebuild" command
    if (lowerTrimmed === 'rebuild' || lowerTrimmed.match(/^rebuild\s*$/)) {
      return { command: 'rebuild', query: '' };
    }

    // Match "ingest" or "ingest for" pattern
    const ingestMatch = lowerTrimmed.match(/^ingest\s+(?:for\s+)?(.*)$/i);
    if (ingestMatch) {
      const query = ingestMatch[1].trim();
      if (!query) {
        return { command: 'ingest-help', query: '' };
      }
      return { command: 'ingest', query };
    }

    // Check if it's just "ingest" with nothing after
    if (lowerTrimmed === 'ingest') {
      return { command: 'ingest-help', query: '' };
    }

    // Match "query" or "query for" pattern
    const queryMatch = lowerTrimmed.match(/^query\s+(?:for\s+)?(.*)$/i);
    if (queryMatch) {
      const q = queryMatch[1].trim();
      if (!q) {
        return { command: 'query-help', query: '' };
      }
      return { command: 'query', query: q };
    }

    // Check if it's just "query" with nothing after
    if (lowerTrimmed === 'query') {
      return { command: 'query-help', query: '' };
    }

    // Match "search" or "search for" pattern
    const searchMatch = lowerTrimmed.match(/^search\s+(?:for\s+)?(.*)$/i);
    if (searchMatch) {
      const query = searchMatch[1].trim();
      // If query is empty, return a prompt for help
      if (!query) {
        return { command: 'search-help', query: '' };
      }
      return { command: 'search', query };
    }

    // Check if it's just "search" with nothing after
    if (lowerTrimmed === 'search') {
      return { command: 'search-help', query: '' };
    }

    const modelMatch = lowerTrimmed.match(/^model\s+(.*)$/i);
    if (modelMatch) {
      const query = modelMatch[1].trim();
      if (!query) {
        return { command: 'model-help', query: '' };
      }
      return { command: 'model', query };
    }

    if (lowerTrimmed === 'model') {
      return { command: 'model-help', query: '' };
    }

    // Default: no recognized command, treat as query
    return { command: 'default', query: prompt };
  }

  /**
   * Stream formatted response to chat
   */
  private async streamResponse(
    queryResult: QueryResult,
    stream: vscode.ChatResponseStream,
    archivedDecision?: ArchivedDecision | null
  ): Promise<void> {
    if (!queryResult) {
      stream.markdown('Error: Invalid search results. Please try again.');
      return;
    }

    stream.markdown(`${this.queryHandler.formatContextMessage(queryResult)}\n\n`);

    if (archivedDecision) {
      stream.markdown(`*Decision archived to /wiki/decisions/${archivedDecision.filename}.*\n`);
    }
  }

  private async archiveAnsweredQuery(
    query: string,
    answerMessage: string,
    queryResult: QueryResult
  ): Promise<ArchivedDecision | null> {
    const supportingPages = queryResult.evidenceBundle.supportingPages.map((page) => page.title);
    const supportingSources = queryResult.evidenceBundle.sourceReferences;

    return this.decisionArchiver.archiveConversation(
      query,
      [
        {
          speaker: 'user',
          message: query,
          timestamp: new Date(),
        },
        {
          speaker: 'assistant',
          message: answerMessage,
          timestamp: new Date(),
        },
      ],
      supportingPages,
      { supportingPages, supportingSources }
    );
  }

  /**
   * Archive current conversation as a Decision page
   */
  async archiveDecision(): Promise<void> {
    try {
      if (this.conversationHistory.length === 0) {
        this.logger.warn('No conversation to archive');
        return;
      }

      // Extract query from first user message
      const userMessages = this.conversationHistory.filter((m) => m.speaker === 'user');
      if (userMessages.length === 0) {
        this.logger.warn('No user messages in conversation history');
        return;
      }

      const query = userMessages[0].message;

      const supportingPages = this.lastQueryResult?.evidenceBundle.supportingPages.map((page) => page.title) || [];
      const supportingSources = this.lastQueryResult?.evidenceBundle.sourceReferences || [];

      const decision = await this.decisionArchiver.archiveConversation(
        query,
        this.conversationHistory,
        supportingPages,
        { supportingPages, supportingSources }
      );

      if (decision) {
        this.logger.info(`Decision archived: ${decision.filename}`);
        this.conversationHistory = []; // Clear history
      }
    } catch (error) {
      this.logger.error(`Failed to archive decision: ${String(error)}`);
    }
  }

  /**
   * Get the wiki directory path
   */
  getWikiDir(): string {
    return this.wikiManager.getWikiDir();
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ConversationEntry[] {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.lastQueryResult = null;
  }

  private getPreviousWikiTurn(): PreviousWikiTurn | undefined {
    if (this.conversationHistory.length < 2) {
      return undefined;
    }

    const previousAssistant = this.conversationHistory[this.conversationHistory.length - 1];
    const previousUser = this.conversationHistory[this.conversationHistory.length - 2];

    if (!previousAssistant || !previousUser || previousAssistant.speaker !== 'assistant' || previousUser.speaker !== 'user') {
      return undefined;
    }

    return {
      query: previousUser.message,
      answer: previousAssistant.message,
    };
  }

  private async applyRemoteSynthesisIfEnabled(
    request: vscode.ChatRequest,
    queryResult: QueryResult,
    previousTurn: PreviousWikiTurn | undefined,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<QueryResult> {
    const configuration = vscode.workspace.getConfiguration('wiki');
    const remoteSynthesisEnabled = configuration.get<boolean>('enableRemoteAnswerSynthesis', false);

    if (!remoteSynthesisEnabled) {
      return queryResult;
    }

    const requestWithModel = request as vscode.ChatRequest & {
      model?: {
        sendRequest: (messages: unknown[], options: Record<string, never>, token: vscode.CancellationToken) => Promise<{ text: AsyncIterable<string> }>;
      };
    };

    if (!requestWithModel.model || queryResult.evidenceBundle.supportingFacts.length === 0) {
      this.logger.info('Remote answer synthesis enabled but unavailable; using grounded local synthesis.');
      return queryResult;
    }

    try {
      const languageModelFactory = (vscode as unknown as {
        LanguageModelChatMessage?: { User: (content: string) => unknown };
      }).LanguageModelChatMessage;

      if (!languageModelFactory) {
        return queryResult;
      }

      this.logger.info('Remote answer synthesis enabled for this response.');
      stream.markdown('*Remote answer synthesis enabled for this response.*\n\n');

      const prompt = buildDirectAnswerPrompt(queryResult.query, queryResult.evidenceBundle, previousTurn);
      const response = await requestWithModel.model.sendRequest(
        [languageModelFactory.User(prompt)],
        {},
        token
      );

      let directAnswer = '';
      for await (const fragment of response.text) {
        directAnswer += String(fragment);
      }

      const trimmedDirectAnswer = directAnswer.trim();
      if (!trimmedDirectAnswer) {
        return queryResult;
      }

      return this.queryHandler.withDirectAnswer(queryResult, trimmedDirectAnswer);
    } catch (error) {
      this.logger.warn(`Remote answer synthesis failed, falling back to grounded local answer: ${String(error)}`);
      return queryResult;
    }
  }

}
