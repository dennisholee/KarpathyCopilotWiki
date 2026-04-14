/**
 * Decision Archiver
 * Archives Copilot Chat conversations as Decision pages in /wiki/decisions/
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { WikiPage } from '../models/types';

export interface ConversationEntry {
  speaker: 'user' | 'assistant';
  message: string;
  timestamp: Date;
}

export interface ArchivedDecision {
  filename: string;
  pageId: string;
  title: string;
  created: Date;
  conversationLength: number;
}

export class DecisionArchiver {
  private logger: Logger;
  private wikiDir: string;
  private decisionsDir: string;

  constructor(wikiDir: string, logger: Logger) {
    this.wikiDir = wikiDir;
    this.decisionsDir = path.join(wikiDir, 'decisions');
    this.logger = logger;

    // Ensure decisions directory exists
    if (!fs.existsSync(this.decisionsDir)) {
      fs.mkdirSync(this.decisionsDir, { recursive: true });
    }
  }

  /**
   * Archive a Copilot Chat conversation as a Decision page
   */
  async archiveConversation(
    query: string,
    conversation: ConversationEntry[],
    supportingPages?: string[]
  ): Promise<ArchivedDecision | null> {
    try {
      const now = new Date();
      this.logger.info(`Archiving decision from query: "${query}"`);

      // Generate filename (YYYYMMDDHHmmss_title_hash.md)
      const filename = this.generateDecisionFilename(query, now);
      const filepath = path.join(this.decisionsDir, filename);

      // Create page content
      const pageContent = this.formatDecisionPage(query, conversation, supportingPages, now);

      // Write to file
      fs.writeFileSync(filepath, pageContent, 'utf-8');

      const decision: ArchivedDecision = {
        filename,
        pageId: `decisions/${filename}`,
        title: this.extractPageTitle(query),
        created: now,
        conversationLength: conversation.length,
      };

      this.logger.info(`Decision archived: ${filename}`);
      return decision;
    } catch (error) {
      this.logger.error(`Failed to archive decision: ${String(error)}`);
      return null;
    }
  }

  /**
   * Generate filename for decision page
   * Format: YYYYMMDDHHmmss_title_hash.md
   */
  private generateDecisionFilename(query: string, date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');

    const timestamp = `${year}${month}${day}${hour}${minute}${second}`;

    // Generate simple hash from query
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      hash = ((hash << 5) - hash) + query.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    const hashStr = Math.abs(hash).toString(16).slice(0, 4);

    // Sanitize title
    const titleSlug = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 30);

    return `${timestamp}_${titleSlug}_${hashStr}.md`;
  }

  /**
   * Format Decision page with frontmatter and conversation
   */
  private formatDecisionPage(
    query: string,
    conversation: ConversationEntry[],
    supportingPages?: string[],
    timestamp?: Date
  ): string {
    const date = timestamp || new Date();
    const created = date.toISOString();

    const lines: string[] = [];

    // YAML frontmatter
    lines.push('---');
    lines.push(`title: Decision - ${this.extractPageTitle(query)}`);
    lines.push(`created: ${created}`);
    lines.push(`modified: ${created}`);

    // Tags
    const tags = ['decision', 'copilot-chat', 'archived'];
    lines.push(`tags: [${tags.map((t) => `"${t}"`).join(', ')}]`);

    lines.push('---');
    lines.push('');

    // Main heading
    lines.push('# Decision');
    lines.push('');

    // Original question
    lines.push('## Question');
    lines.push(query);
    lines.push('');

    // Conversation transcript
    lines.push('## Conversation');
    lines.push('');

    for (const entry of conversation) {
      const speaker = entry.speaker === 'user' ? '**User:**' : '**Assistant:**';
      lines.push(`${speaker} ${entry.message}`);
      lines.push('');
    }

    // Supporting wiki pages
    if (supportingPages && supportingPages.length > 0) {
      lines.push('## Supporting Pages');
      lines.push('');
      for (const page of supportingPages) {
        lines.push(`- [[${page}]]`);
      }
      lines.push('');
    }

    // Metadata
    lines.push('## Metadata');
    lines.push(`- **Archived**: ${created}`);
    lines.push(`- **Conversation Length**: ${conversation.length} messages`);

    if (supportingPages?.length) {
      lines.push(`- **Supporting Pages**: ${supportingPages.length}`);
    }

    lines.push('');

    return lines.join('\n');
  }

  /**
   * Extract a clean title from the query
   */
  private extractPageTitle(query: string): string {
    // Take first 50 characters and clean up
    return query
      .slice(0, 50)
      .replace(/[?!.]$/, '') // Remove trailing punctuation
      .trim();
  }

  /**
   * List all archived decisions
   */
  listDecisions(): string[] {
    try {
      if (!fs.existsSync(this.decisionsDir)) {
        return [];
      }

      const files = fs.readdirSync(this.decisionsDir);
      return files.filter((f) => f.endsWith('.md'));
    } catch (error) {
      this.logger.warn(`Failed to list decisions: ${String(error)}`);
      return [];
    }
  }

  /**
   * Get decision by filename
   */
  getDecision(filename: string): string | null {
    try {
      const filepath = path.join(this.decisionsDir, filename);

      if (!fs.existsSync(filepath)) {
        this.logger.warn(`Decision not found: ${filename}`);
        return null;
      }

      return fs.readFileSync(filepath, 'utf-8');
    } catch (error) {
      this.logger.error(`Failed to read decision: ${String(error)}`);
      return null;
    }
  }

  /**
   * Delete a decision
   */
  deleteDecision(filename: string): boolean {
    try {
      const filepath = path.join(this.decisionsDir, filename);

      if (!fs.existsSync(filepath)) {
        this.logger.warn(`Decision not found: ${filename}`);
        return false;
      }

      fs.unlinkSync(filepath);
      this.logger.info(`Decision deleted: ${filename}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete decision: ${String(error)}`);
      return false;
    }
  }
}
