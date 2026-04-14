/**
 * Markdown Parser Utility
 * Parses YAML frontmatter and markdown content
 */

export interface FrontmatterMetadata {
  title?: string;
  aliases?: string[];
  tags?: string[];
  created?: string;
  modified?: string;
  entities?: Array<{ concept: string; confidence: number }>;
  source?: string;
  incomingLinks?: number;
  importance?: number;
  [key: string]: unknown;
}

export interface ParsedMarkdown {
  metadata: FrontmatterMetadata;
  content: string;
  plaintext: string;
}

/**
 * Parse markdown file with optional YAML frontmatter
 * @param markdown Full markdown content
 * @returns Parsed metadata and content
 */
export function parseMarkdownWithFrontmatter(markdown: string): ParsedMarkdown {
  const lines = markdown.split('\n');
  let currentLine = 0;
  const metadata: FrontmatterMetadata = {};

  // Check if file starts with frontmatter delimiter
  if (lines[0]?.trim() === '---') {
    currentLine = 1;

    // Find closing delimiter
    let endDelimiter = -1;
    for (let i = currentLine; i < lines.length; i++) {
      if (lines[i]?.trim() === '---') {
        endDelimiter = i;
        break;
      }
    }

    if (endDelimiter !== -1) {
      // Parse YAML frontmatter
      const frontmatterLines = lines.slice(currentLine, endDelimiter);
      parseYamlFrontmatter(frontmatterLines.join('\n'), metadata);
      currentLine = endDelimiter + 1;
    }
  }

  // Rest is content
  const content = lines.slice(currentLine).join('\n').trim();
  const plaintext = extractPlaintext(content);

  return {
    metadata,
    content,
    plaintext,
  };
}

/**
 * Simple YAML parser for frontmatter
 * Handles common cases but not full YAML spec
 */
function parseYamlFrontmatter(yaml: string, metadata: FrontmatterMetadata): void {
  const lines = yaml.split('\n');

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }

    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    // Handle quoted strings
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Type conversion
    if (value === 'true') {
      (metadata as Record<string, unknown>)[key] = true;
    } else if (value === 'false') {
      (metadata as Record<string, unknown>)[key] = false;
    } else if (!isNaN(Number(value))) {
      (metadata as Record<string, unknown>)[key] = Number(value);
    } else {
      (metadata as Record<string, unknown>)[key] = value;
    }
  }
}

/**
 * Extract plain text from markdown (removes formatting)
 */
function extractPlaintext(markdown: string): string {
  let text = markdown;

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');

  // Remove inline code
  text = text.replace(/`[^`]+`/g, '');

  // Remove markdown links [text](url) -> text
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // Remove wiki links [[text]] or [[text|label]]
  text = text.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1');

  // Remove headings
  text = text.replace(/^#+\s+/gm, '');

  // Remove bold/italic
  text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Extract wikilinks from markdown content
 * Returns array of linked page titles
 */
export function extractWikilinks(markdown: string): string[] {
  const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  const links: string[] = [];
  let match;

  while ((match = wikiLinkRegex.exec(markdown)) !== null) {
    links.push(match[1]); // Add the target page, not the label
  }

  return links;
}

/**
 * Extract code blocks from markdown
 */
export function extractCodeBlocks(markdown: string): Array<{ language: string; code: string }> {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const blocks: Array<{ language: string; code: string }> = [];
  let match;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    blocks.push({
      language: match[1] || 'text',
      code: match[2].trim(),
    });
  }

  return blocks;
}

/**
 * Generate YAML frontmatter from metadata
 */
export function generateFrontmatter(metadata: FrontmatterMetadata): string {
  let yaml = '---\n';

  // Title (always first)
  if (metadata.title) {
    yaml += `title: "${metadata.title}"\n`;
  }

  // Aliases (array)
  if (metadata.aliases && metadata.aliases.length > 0) {
    yaml += 'aliases:\n';
    metadata.aliases.forEach((alias) => {
      yaml += `  - "${alias}"\n`;
    });
  }

  // Tags (array)
  if (metadata.tags && metadata.tags.length > 0) {
    yaml += 'tags:\n';
    metadata.tags.forEach((tag) => {
      yaml += `  - ${tag}\n`;
    });
  }

  // Simple fields
  if (metadata.created) {
    yaml += `created: ${metadata.created}\n`;
  }
  if (metadata.modified) {
    yaml += `modified: ${metadata.modified}\n`;
  }

  // Entities (array of objects)
  if (metadata.entities && metadata.entities.length > 0) {
    yaml += 'entities:\n';
    metadata.entities.forEach((entity) => {
      yaml += `  - concept: "${entity.concept}"\n`;
      yaml += `    confidence: ${entity.confidence}\n`;
    });
  }

  // Other fields
  if (metadata.source) {
    yaml += `source: "${metadata.source}"\n`;
  }
  if (metadata.incomingLinks !== undefined) {
    yaml += `incomingLinks: ${metadata.incomingLinks}\n`;
  }
  if (metadata.importance !== undefined) {
    yaml += `importance: ${metadata.importance}\n`;
  }

  yaml += '---\n';
  return yaml;
}

/**
 * Slugify a title for use as filename
 * "My Page Title" -> "my-page-title"
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extract first heading from markdown
 */
export function extractFirstHeading(markdown: string): string | null {
  const headingRegex = /^#+\s+(.+)$/m;
  const match = markdown.match(headingRegex);
  return match ? match[1].trim() : null;
}
