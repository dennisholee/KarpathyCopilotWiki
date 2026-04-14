import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { SearchEngine } from '../search/search-engine';
import { WikiManager } from '../wiki/wiki-manager';
import { QueryHandler, QueryResult } from '../query/queryCommand';
import { DecisionArchiver, ConversationEntry } from '../query/decisionArchiver';

export class WikiChatParticipant {
  private searchEngine: SearchEngine;
  private wikiManager: WikiManager;
  private logger: Logger;
  private queryHandler: QueryHandler;
  private decisionArchiver: DecisionArchiver;
  private conversationHistory: ConversationEntry[] = [];

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
        this.logger.info(`Executing search command with query: "${query}"`);
        queryResult = await this.queryHandler.query(query, {
          maxResults: 5,
          useLocalEmbeddings: true,
        });
      } else {
        // Default: treat entire prompt as query
        this.logger.info(`Executing default query: "${request.prompt}"`);
        queryResult = await this.queryHandler.query(request.prompt, {
          maxResults: 5,
          useLocalEmbeddings: true,
        });
      }

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
    if (!queryResult || !queryResult.results) {
      stream.markdown('Error: Invalid search results. Please try again.');
      return;
    }

    if (queryResult.results.length === 0) {
      stream.markdown(
        '📭 No wiki pages found for your search.\n\n' +
        'Try:\n' +
        '- Using shorter keywords\n' +
        '- Rephrasing your search\n' +
        '- Checking if your wiki pages exist with `@wiki ingest`'
      );
      return;
    }

    stream.markdown(`🔍 Found ${queryResult.results.length} relevant wiki page${queryResult.results.length !== 1 ? 's' : ''}:\n\n`);

    for (const result of queryResult.results) {
      if (!result || !result.title) {
        continue;
      }
      
      const scorePercent = Math.round((result.relevanceScore || 0) * 100);
      stream.markdown(`**${result.title}** (${scorePercent}% match)\n`);
      
      const excerpt = result.excerpt || "(No preview available)";
      stream.markdown(`${excerpt.slice(0, 150)}...\n\n`);
    }

    if (queryResult.usedFallback) {
      stream.markdown('*Note: Results generated using fallback search method.*\n\n');
    }

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

      // Extract supporting page titles (mentioned in results)
      const supportingPages: string[] = [];

      const decision = await this.decisionArchiver.archiveConversation(
        query,
        this.conversationHistory,
        supportingPages
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
  }

}
