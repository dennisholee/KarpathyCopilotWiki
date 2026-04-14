import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { WikiPage } from '../models/types';
import {
  parseMarkdownWithFrontmatter,
  extractWikilinks,
  generateFrontmatter,
  slugify,
  extractFirstHeading,
  FrontmatterMetadata,
} from '../utils/markdown-parser';

export class WikiManager {
  private workspacePath: string;
  private logger: Logger;
  private fileWatcher: vscode.FileSystemWatcher | null = null;
  private rawDir: string;
  private wikiDir: string;

  constructor(workspacePath: string, logger: Logger) {
    this.workspacePath = workspacePath;
    this.logger = logger;
    this.rawDir = path.join(workspacePath, 'raw');
    this.wikiDir = path.join(workspacePath, 'wiki');

    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.rawDir)) {
      fs.mkdirSync(this.rawDir, { recursive: true });
      this.logger.info(`Created raw directory: ${this.rawDir}`);
    }

    if (!fs.existsSync(this.wikiDir)) {
      fs.mkdirSync(this.wikiDir, { recursive: true });
      this.logger.info(`Created wiki directory: ${this.wikiDir}`);
    }

    const decisionsDir = path.join(this.wikiDir, 'decisions');
    if (!fs.existsSync(decisionsDir)) {
      fs.mkdirSync(decisionsDir, { recursive: true });
      this.logger.info(`Created decisions directory: ${decisionsDir}`);
    }
  }

  async initializeFileWatcher(): Promise<void> {
    try {
      const pattern = new vscode.RelativePattern(this.rawDir, '**/*');
      this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

      this.fileWatcher.onDidCreate((uri) => {
        this.logger.debug(`File created: ${uri.fsPath}`);
      });

      this.fileWatcher.onDidChange((uri) => {
        this.logger.debug(`File changed: ${uri.fsPath}`);
      });

      this.fileWatcher.onDidDelete((uri) => {
        this.logger.debug(`File deleted: ${uri.fsPath}`);
      });

      this.logger.info('File watcher initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize file watcher: ${String(error)}`);
    }
  }

  async ingestFromRaw(): Promise<{ created: number; updated: number }> {
    try {
      this.logger.info('Starting ingest from /raw');

      const files = fs.readdirSync(this.rawDir).filter((f) => !f.startsWith('.'));
      this.logger.info(`Found ${files.length} files in /raw`);

      let createdCount = 0;
      let updatedCount = 0;

      for (const file of files) {
        try {
          if (!file.endsWith('.txt') && !file.endsWith('.md')) {
            this.logger.debug(`Skipping non-text file: ${file}`);
            continue;
          }

          const filePath = path.join(this.rawDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');

          // Simple ingestion: create one page per raw file
          // In production, might split into multiple pages
          const title =
            extractFirstHeading(content) ||
            file.replace(/\.(txt|md)$/, '').replace(/[-_]/g, ' ');

          const slug = slugify(title);
          const existingPage = await this.getPage(slug);

          if (existingPage) {
            await this.updatePage(slug, {
              content,
              modified: new Date().toISOString(),
            });
            updatedCount++;
            this.logger.debug(`Updated page from: ${file}`);
          } else {
            await this.createPage(title, content, {
              source: file,
              tags: ['ingested'],
            });
            createdCount++;
            this.logger.debug(`Created page from: ${file}`);
          }
        } catch (fileError) {
          this.logger.error(`Failed to ingest ${file}: ${String(fileError)}`);
        }
      }

      this.logger.info(`Ingest completed: ${createdCount} created, ${updatedCount} updated`);
      return { created: createdCount, updated: updatedCount };
    } catch (error) {
      this.logger.error(`Ingest failed: ${String(error)}`);
      throw error;
    }
  }

  async lint(quickMode: boolean): Promise<{
    orphanCount: number;
    contradictionCount?: number;
    qualityScore?: number;
  }> {
    try {
      this.logger.info(`Running ${quickMode ? 'quick' : 'deep'} lint`);

      const pages = await this.listPages();
      const backlinkGraph = await this.getBacklinkGraph();

      let orphanCount = 0;

      // Count orphaned pages (no incoming or outgoing links)
      for (const page of pages) {
        const incomingCount = backlinkGraph[page.id]?.length || 0;
        const outgoingCount = page.links.length;

        if (incomingCount === 0 && outgoingCount === 0) {
          orphanCount++;
          this.logger.debug(`Orphaned page: ${page.id}`);
        }
      }

      const result = {
        orphanCount,
        ...(quickMode
          ? {}
          : {
              contradictionCount: 0, // TODO: Implement contradiction detection
              qualityScore: 100 - Math.min(orphanCount * 10, 50), // Quality decreases with orphans
            }),
      };

      return result;
    } catch (error) {
      this.logger.error(`Lint failed: ${String(error)}`);
      throw error;
    }
  }

  async getPage(pageId: string): Promise<WikiPage | null> {
    try {
      const filePath = path.join(this.wikiDir, `${pageId}.md`);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = parseMarkdownWithFrontmatter(content);
      const links = extractWikilinks(parsed.content);

      const sourceUri = vscode.Uri.file(filePath).toString();

      return {
        id: pageId,
        title: parsed.metadata.title || extractFirstHeading(parsed.content) || pageId,
        aliases: parsed.metadata.aliases || [],
        content: parsed.content,
        plaintext: parsed.plaintext,
        created: parsed.metadata.created,
        modified: parsed.metadata.modified,
        tags: parsed.metadata.tags || [],
        links: links,
        sourceUri,
        sourceReferences: this.extractSourceReferences(parsed.metadata, parsed.content),
      };
    } catch (error) {
      this.logger.error(`Failed to get page ${pageId}: ${String(error)}`);
      throw error;
    }
  }

  async listPages(): Promise<WikiPage[]> {
    try {
      const files = fs.readdirSync(this.wikiDir).filter((f) => f.endsWith('.md'));
      const pages: WikiPage[] = [];

      for (const file of files) {
        const pageId = file.replace('.md', '');
        const page = await this.getPage(pageId);
        if (page) {
          pages.push(page);
        }
      }

      return pages;
    } catch (error) {
      this.logger.error(`Failed to list pages: ${String(error)}`);
      throw error;
    }
  }

  getSourceReferences(page: WikiPage): string[] {
    return page.sourceReferences || [];
  }

  private extractSourceReferences(
    metadata: FrontmatterMetadata,
    content: string
  ): string[] {
    const references = new Set<string>();

    if (typeof metadata.source === 'string' && metadata.source.trim().length > 0) {
      references.add(this.normalizeSourceReference(metadata.source));
    }

    const rawPathMatches = content.match(/\/raw\/[^\s)\]]+/g) || [];
    for (const match of rawPathMatches) {
      references.add(match.replace(/[.,;:]+$/, ''));
    }

    return Array.from(references);
  }

  private normalizeSourceReference(source: string): string {
    if (source.startsWith('/raw/')) {
      return source;
    }

    return `/raw/${source.replace(/^\/+/, '')}`;
  }

  /**
   * Get the wiki directory path
   */
  getWikiDir(): string {
    return this.wikiDir;
  }

  /**
   * Get the raw directory path
   */
  getRawDir(): string {
    return this.rawDir;
  }

  /**
   * Create a new wiki page
   */
  async createPage(
    title: string,
    content: string,
    metadata: Partial<FrontmatterMetadata> = {}
  ): Promise<WikiPage> {
    try {
      const slug = slugify(title);
      const filePath = path.join(this.wikiDir, `${slug}.md`);

      // Check if page already exists
      if (fs.existsSync(filePath)) {
        this.logger.warn(`Page already exists: ${slug}`);
        return this.getPage(slug) as Promise<WikiPage>;
      }

      // Generate frontmatter
      const defaultMetadata: FrontmatterMetadata = {
        title,
        created: new Date().toISOString(),
        ...metadata,
      };

      const frontmatter = generateFrontmatter(defaultMetadata);
      const fullContent = frontmatter + '\n' + content;

      fs.writeFileSync(filePath, fullContent, 'utf-8');
      this.logger.info(`Created wiki page: ${slug}`);

      return this.getPage(slug) as Promise<WikiPage>;
    } catch (error) {
      this.logger.error(`Failed to create page: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Update an existing page
   */
  async updatePage(pageId: string, updates: Partial<WikiPage>): Promise<WikiPage> {
    try {
      let page = await this.getPage(pageId);
      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      // Merge updates
      const updatedMetadata: FrontmatterMetadata = {
        title: updates.title || page.title,
        modified: new Date().toISOString(),
        tags: updates.tags || page.tags,
        aliases: updates.aliases || page.aliases,
      };

      const frontmatter = generateFrontmatter(updatedMetadata);
      const fullContent = frontmatter + '\n' + (updates.content || page.content);

      const filePath = path.join(this.wikiDir, `${pageId}.md`);
      fs.writeFileSync(filePath, fullContent, 'utf-8');
      this.logger.info(`Updated wiki page: ${pageId}`);

      page = (await this.getPage(pageId)) as WikiPage;
      return page;
    } catch (error) {
      this.logger.error(`Failed to update page ${pageId}: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Delete a wiki page
   */
  async deletePage(pageId: string): Promise<void> {
    try {
      const filePath = path.join(this.wikiDir, `${pageId}.md`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Page not found: ${pageId}`);
      }

      fs.unlinkSync(filePath);
      this.logger.info(`Deleted wiki page: ${pageId}`);
    } catch (error) {
      this.logger.error(`Failed to delete page ${pageId}: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Get backlink graph for the wiki
   * Returns a map of page ID to list of pages that link to it
   */
  async getBacklinkGraph(): Promise<Record<string, string[]>> {
    try {
      const pages = await this.listPages();
      const backlinkGraph: Record<string, string[]> = {};

      // Initialize graph with all pages
      for (const page of pages) {
        backlinkGraph[page.id] = [];
      }

      // Build backlink relationships
      for (const page of pages) {
        for (const link of page.links) {
          // link is the target page ID
          if (backlinkGraph[link]) {
            backlinkGraph[link].push(page.id);
          }
        }
      }

      return backlinkGraph;
    } catch (error) {
      this.logger.error(`Failed to get backlink graph: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Get related pages for a given page
   */
  async getRelatedPages(pageId: string, depth: number = 1): Promise<string[]> {
    try {
      const backlinkGraph = await this.getBacklinkGraph();
      const page = await this.getPage(pageId);
      if (!page) {
        return [];
      }

      const related = new Set<string>();

      // Direct links from this page
      for (const link of page.links) {
        if (link !== pageId) {
          related.add(link);
        }
      }

      // Backlinks to this page
      for (const backlinker of backlinkGraph[pageId] || []) {
        related.add(backlinker);
      }

      // Remove the page itself
      related.delete(pageId);

      return Array.from(related);
    } catch (error) {
      this.logger.error(`Failed to get related pages for ${pageId}: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Compute page importance based on incoming links
   */
  async computePageImportance(): Promise<Record<string, number>> {
    try {
      const pages = await this.listPages();
      const backlinkGraph = await this.getBacklinkGraph();
      const importance: Record<string, number> = {};

      // Simple importance = number of incoming links
      // Could be enhanced with PageRank-like algorithm
      for (const page of pages) {
        const incomingLinks = backlinkGraph[page.id]?.length || 0;
        importance[page.id] = Math.log(incomingLinks + 1) / Math.log(10); // Logarithmic scale
      }

      return importance;
    } catch (error) {
      this.logger.error(`Failed to compute page importance: ${String(error)}`);
      throw error;
    }
  }

  dispose(): void {
    if (this.fileWatcher) {
      this.fileWatcher.dispose();
    }
    this.logger.info('WikiManager disposed');
  }
}
