import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { WikiManager } from '../wiki/wiki-manager';
import { SearchEngine } from '../search/search-engine';

export class IndexManager {
  private workspacePath: string;
  private logger: Logger;
  private wikiDir: string;
  private wikiManager: WikiManager;
  private searchEngine: SearchEngine;

  constructor(workspacePath: string, logger: Logger) {
    this.workspacePath = workspacePath;
    this.logger = logger;
    this.wikiDir = path.join(workspacePath, 'wiki');
    this.wikiManager = new WikiManager(workspacePath, logger);
    this.searchEngine = new SearchEngine(this.wikiManager, logger);
  }

  async rebuildIndex(): Promise<void> {
    try {
      this.logger.info('Rebuilding wiki index...');

      // Initialize search engine (builds BM25 index)
      await this.searchEngine.initialize();

      // Generate and write index.md file
      const indexContent = await this.generateIndexContent();
      const indexPath = path.join(this.wikiDir, 'INDEX.md');
      fs.writeFileSync(indexPath, indexContent, 'utf-8');

      // Update glossary
      const pages = await this.wikiManager.listPages();
      const glossaryTerms = this.extractGlossaryTerms(pages);
      await this.updateGlossary(glossaryTerms);

      this.logger.info('Index rebuilt successfully');
    } catch (error) {
      this.logger.error(`Failed to rebuild index: ${String(error)}`);
      throw error;
    }
  }

  private async generateIndexContent(): Promise<string> {
    const pages = await this.wikiManager.listPages();
    const importance = await this.wikiManager.computePageImportance();

    // Sort pages by importance
    const sortedPages = pages.sort(
      (a, b) => (importance[b.id] || 0) - (importance[a.id] || 0)
    );

    let content = `# Wiki Index

Last generated: ${new Date().toISOString()}

## Statistics

- **Total pages**: ${pages.length}
- **Average document importance**: ${(
      Array.from(Object.values(importance)).reduce((a, b) => a + b, 0) /
      Object.keys(importance).length
    ).toFixed(2)}

## Top Pages by Importance

`;

    for (const page of sortedPages.slice(0, 10)) {
      const pageImportance = importance[page.id] || 0;
      content += `- [[${page.id}]] - "${page.title}" (importance: ${pageImportance.toFixed(2)})\n`;
    }

    content += `\n## All Pages\n\n`;

    // Group pages by tags
    const pagesByTag: Record<string, typeof pages> = {};
    for (const page of pages) {
      for (const tag of page.tags || ['untagged']) {
        if (!pagesByTag[tag]) {
          pagesByTag[tag] = [];
        }
        pagesByTag[tag].push(page);
      }
    }

    for (const [tag, tagPages] of Object.entries(pagesByTag)) {
      content += `\n### ${tag ? `#${tag}` : 'Untagged'}\n\n`;
      for (const page of tagPages) {
        content += `- [[${page.id}]] - ${page.title}\n`;
      }
    }

    return content;
  }

  private extractGlossaryTerms(pages: any[]): Record<string, string> {
    const glossary: Record<string, string> = {};

    for (const page of pages) {
      // Use page title as glossary term
      glossary[page.title] = page.plaintext.substring(0, 200);
    }

    return glossary;
  }

  async getGlossary(): Promise<Record<string, string>> {
    try {
      const glossaryPath = path.join(this.wikiDir, 'GLOSSARY.md');

      if (!fs.existsSync(glossaryPath)) {
        return {};
      }

      const content = fs.readFileSync(glossaryPath, 'utf-8');
      const glossary: Record<string, string> = {};

      // Parse GLOSSARY.md format: ## term\n\ndescription
      const lines = content.split('\n');
      let currentTerm: string | null = null;
      let currentDescription: string[] = [];

      for (const line of lines) {
        if (line.startsWith('## ')) {
          if (currentTerm) {
            glossary[currentTerm] = currentDescription.join(' ').trim();
          }
          currentTerm = line.substring(3).trim();
          currentDescription = [];
        } else if (currentTerm && line.trim()) {
          currentDescription.push(line);
        }
      }

      if (currentTerm) {
        glossary[currentTerm] = currentDescription.join(' ').trim();
      }

      return glossary;
    } catch (error) {
      this.logger.error(`Failed to get glossary: ${String(error)}`);
      throw error;
    }
  }

  async updateGlossary(terms: Record<string, string>): Promise<void> {
    try {
      this.logger.info('Updating glossary...');

      const glossaryPath = path.join(this.wikiDir, 'GLOSSARY.md');
      const content = this.generateGlossaryContent(terms);
      fs.writeFileSync(glossaryPath, content, 'utf-8');

      this.logger.info('Glossary updated');
    } catch (error) {
      this.logger.error(`Failed to update glossary: ${String(error)}`);
      throw error;
    }
  }

  private generateGlossaryContent(terms: Record<string, string>): string {
    let content = `# Wiki Glossary

Last updated: ${new Date().toISOString()}

`;

    const sortedTerms = Object.keys(terms).sort();
    for (const term of sortedTerms) {
      content += `## ${term}\n\n${terms[term]}\n\n`;
    }

    return content;
  }
}
