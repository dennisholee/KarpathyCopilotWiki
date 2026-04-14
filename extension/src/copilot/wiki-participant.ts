import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { SearchEngine } from '../search/search-engine';
import { WikiManager } from '../wiki/wiki-manager';
import { QueryHandler, QueryResult } from '../query/queryCommand';
import { DecisionArchiver, ConversationEntry } from '../query/decisionArchiver';
import { PreviousWikiTurn } from '../models/types';
import { buildDirectAnswerPrompt, buildEffectiveQuery } from '../query/answerPrompt';

export class WikiChatParticipant {
  private searchEngine: SearchEngine;
  private wikiManager: WikiManager;
  private logger: Logger;
  private queryHandler: QueryHandler;
  private decisionArchiver: DecisionArchiver;
  private conversationHistory: ConversationEntry[] = [];
  private lastQueryResult: QueryResult | null = null;

  constructor(searchEngine: SearchEngine, wikiManager: WikiManager, logger: Logger) {
    this.searchEngine = searchEngine;
    this.wikiManager = wikiManager;
    this.logger = logger;
    this.queryHandler = new QueryHandler(searchEngine, wikiManager, logger);
    this.decisionArchiver = new DecisionArchiver(this.wikiManager.getWikiDir(), logger);
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

    return vscode.chat.createChatParticipant('personal-wiki', (request, context, stream, token) => {
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
      this.logger.info(`Wiki Chat: Processing request - "${request.prompt}"`);

      // Parse command and extract search query
      const { command, query } = this.parseCommand(request.prompt);
      const previousTurn = this.getPreviousWikiTurn();
      const effectiveQuery = buildEffectiveQuery(command === 'search' ? query : request.prompt, previousTurn);

      // Add user message to history
      this.conversationHistory.push({
        speaker: 'user',
        message: request.prompt,
        timestamp: new Date(),
      });

      // Route to appropriate handler
      let queryResult: QueryResult;
      
      if (command === 'search-help') {
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
      }
      
      if (command === 'search') {
        this.logger.info(`Executing search command with query: "${effectiveQuery}"`);
        queryResult = await this.queryHandler.query(effectiveQuery, {
          maxResults: 5,
          useLocalEmbeddings: true,
          previousTurn,
        });
      } else {
        // Default: treat entire prompt as query
        this.logger.info(`Executing default query: "${effectiveQuery}"`);
        queryResult = await this.queryHandler.query(effectiveQuery, {
          maxResults: 5,
          useLocalEmbeddings: true,
          previousTurn,
        });
      }

      queryResult = await this.applyRemoteSynthesisIfEnabled(request, queryResult, previousTurn, stream, token);
      this.lastQueryResult = queryResult;

      // Stream response
      await this.streamResponse(queryResult, stream);

      // Add assistant response to history
      this.conversationHistory.push({
        speaker: 'assistant',
        message: this.queryHandler.formatContextMessage(queryResult),
        timestamp: new Date(),
      });

      // Archive decision if user confirms (will be handled via message action)
      this.logger.debug(`Query completed in ${queryResult.executionTime}ms`);

      return {};
    } catch (error) {
      this.logger.error(`Chat handler error: ${String(error)}`);
      stream.markdown('Error processing your request. Please try again.');
      return { errorDetails: { message: String(error) } };
    }
  }

  /**
   * Parse command from user input
   * Supports: "search [query]", "search for [query]", or plain query
   */
  private parseCommand(prompt: string): { command: string; query: string } {
    const trimmed = prompt.trim();
    const lowerTrimmed = trimmed.toLowerCase();

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

    // Default: no recognized command, treat as query
    return { command: 'default', query: prompt };
  }

  /**
   * Stream formatted response to chat
   */
  private async streamResponse(queryResult: QueryResult, stream: vscode.ChatResponseStream): Promise<void> {
    if (!queryResult) {
      stream.markdown('Error: Invalid search results. Please try again.');
      return;
    }

    stream.markdown(`${this.queryHandler.formatContextMessage(queryResult)}\n\n`);

    stream.markdown(
      '[📌 Archive this conversation]' +
        '(command:personal-wiki.archiveDecision?%7B%22query%22:%22' +
        encodeURIComponent(queryResult.query) +
        '%22%7D)\n'
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
