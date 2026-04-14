/**
 * Index Rebuild Service
 * Generates and updates index.md and glossary.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';

export interface IndexStats {
  pagesIndexed: number;
  termsInGlossary: number;
  categoriesFound: number;
}

export class IndexBuilder {
  private logger: Logger;
  private wikiDir: string;

  constructor(wikiDir: string, logger: Logger) {
    this.wikiDir = wikiDir;
    this.logger = logger;
  }

  /**
   * Rebuild index.md and glossary.md
   */
  async rebuildIndex(): Promise<IndexStats> {
    try {
      this.logger.info('Rebuilding wiki index...');

      // Scan all pages
      const pages = this.scanPages();

      // Extract categories and glossary terms
      const categories = this.categorizePages(pages);
      const glossaryTerms = this.extractGlossaryTerms(pages);

      // Generate index.md
      this.generateIndexFile(categories, pages.length);

      // Generate glossary.md
      this.generateGlossaryFile(glossaryTerms);

      const stats: IndexStats = {
        pagesIndexed: pages.length,
        termsInGlossary: glossaryTerms.length,
        categoriesFound: Object.keys(categories).length,
      };

      this.logger.info(
        `Index rebuild completed: ${stats.pagesIndexed} pages, ` +
          `${stats.termsInGlossary} glossary terms, ${stats.categoriesFound} categories`
      );

      return stats;
    } catch (error) {
      this.logger.error(`Index rebuild failed: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Scan all wiki pages
   */
  private scanPages(): Array<{ filename: string; title: string; tags: string[] }> {
    const pages: Array<{ filename: string; title: string; tags: string[] }> = [];

    try {
      const files = fs.readdirSync(this.wikiDir).filter((f) => f.endsWith('.md'));

      for (const file of files) {
        // Skip index and glossary
        if (file === 'index.md' || file === 'glossary.md' || file.startsWith('decisions/')) {
          continue;
        }

        try {
          const content = fs.readFileSync(path.join(this.wikiDir, file), 'utf-8');

          // Extract title
          const titleMatch = content.match(/^# (.+?)$/m);
          const title = titleMatch ? titleMatch[1] : file;

          // Extract tags from frontmatter or tags section
          const tagsMatch = content.match(/tags:\s*\[(.*?)\]/i);
          const tags: string[] = [];

          if (tagsMatch) {
            const tagStr = tagsMatch[1];
            tags.push(
              ...tagStr
                .split(',')
                .map((t) => t.trim().replace(/['"]/g, ''))
                .filter((t) => t.length > 0)
            );
          }

          pages.push({ filename: file, title, tags });
        } catch (error) {
          this.logger.warn(`Failed to scan ${file}: ${String(error)}`);
        }
      }
    } catch (error) {
      this.logger.error(`Page scanning failed: ${String(error)}`);
    }

    return pages;
  }

  /**
   * Categorize pages by their tags
   */
  private categorizePages(pages: Array<{ filename: string; title: string; tags: string[] }>): Record<string, any[]> {
    const categories: Record<string, any[]> = {};

    for (const page of pages) {
      // Use tags as categories, or default to "Uncategorized"
      const cats = page.tags.length > 0 ? page.tags : ['Uncategorized'];

      for (const cat of cats) {
        if (!categories[cat]) {
          categories[cat] = [];
        }

        categories[cat].push({
          filename: page.filename,
          title: page.title,
        });
      }
    }

    // Sort pages within each category
    for (const cat of Object.keys(categories)) {
      categories[cat].sort((a, b) => a.title.localeCompare(b.title));
    }

    return categories;
  }

  /**
   * Extract glossary terms from pages (first line of summary + title)
   */
  private extractGlossaryTerms(pages: Array<{ filename: string; title: string }>): Array<{
    term: string;
    definition: string;
    page: string;
  }> {
    const terms: Array<{ term: string; definition: string; page: string }> = [];

    for (const page of pages) {
      try {
        const content = fs.readFileSync(path.join(this.wikiDir, page.filename), 'utf-8');

        // Extract summary as definition
        const summaryMatch = content.match(/## Summary\n([\s\S]*?)(?=##|$)/i);
        const definition = summaryMatch
          ? summaryMatch[1]
              .trim()
              .split('\n')[0]
              .slice(0, 100)
          : page.title;

        terms.push({
          term: page.title,
          definition,
          page: page.filename,
        });
      } catch (error) {
        this.logger.warn(`Failed to extract glossary term from ${page.filename}: ${String(error)}`);
      }
    }

    // Sort alphabetically
    terms.sort((a, b) => a.term.localeCompare(b.term));

    return terms;
  }

  /**
   * Generate index.md file
   */
  private generateIndexFile(categories: Record<string, any[]>, totalPages: number): void {
    const lines: string[] = [
      '# Wiki Index',
      '',
      `**Last Updated**: ${new Date().toISOString()}`,
      `**Total Pages**: ${totalPages}`,
      '',
    ];

    // Add table of contents
    const sortedCats = Object.keys(categories).sort();

    for (const cat of sortedCats) {
      lines.push(`## ${cat}`);
      lines.push('');

      for (const page of categories[cat]) {
        lines.push(`- [[${page.title}]](${page.filename})`);
      }

      lines.push('');
    }

    const indexPath = path.join(this.wikiDir, 'index.md');
    fs.writeFileSync(indexPath, lines.join('\n'), 'utf-8');

    this.logger.debug(`Generated index.md with ${sortedCats.length} categories`);
  }

  /**
   * Generate glossary.md file
   */
  private generateGlossaryFile(terms: Array<{ term: string; definition: string; page: string }>): void {
    const lines: string[] = [
      '# Glossary',
      '',
      `**Last Updated**: ${new Date().toISOString()}`,
      `**Total Terms**: ${terms.length}`,
      '',
    ];

    for (const term of terms) {
      lines.push(`### ${term.term}`);
      lines.push('');
      lines.push(term.definition);
      lines.push('');
      lines.push(`*See: [[${term.term}]]*`);
      lines.push('');
    }

    const glossaryPath = path.join(this.wikiDir, 'glossary.md');
    fs.writeFileSync(glossaryPath, lines.join('\n'), 'utf-8');

    this.logger.debug(`Generated glossary.md with ${terms.length} terms`);
  }
}
