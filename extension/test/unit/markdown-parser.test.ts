import { generateFrontmatter, parseMarkdownWithFrontmatter } from '../../src/utils/markdown-parser';

describe('markdown parser', () => {
  it('parses inline yaml arrays from existing wiki pages', () => {
    const markdown = `---
title: Executive Summary
tags: ["executive-summary", "extracted-heading", "high-confidence"]
aliases: ["Exec Summary", "Overview"]
links: ["/raw/banking/risk/customer.csv"]
---

# Executive Summary

Body content.`;

    const parsed = parseMarkdownWithFrontmatter(markdown);

    expect(parsed.metadata.tags).toEqual([
      'executive-summary',
      'extracted-heading',
      'high-confidence',
    ]);
    expect(parsed.metadata.aliases).toEqual(['Exec Summary', 'Overview']);
    expect(parsed.metadata.links).toEqual(['/raw/banking/risk/customer.csv']);
  });

  it('normalizes legacy Links arrays into links', () => {
    const markdown = `---
title: Customer Risk
Links: ["/raw/banking/risk/customer.md", "/raw/banking/risk/exposure.txt"]
---

Body content.`;

    const parsed = parseMarkdownWithFrontmatter(markdown);

    expect(parsed.metadata.links).toEqual([
      '/raw/banking/risk/customer.md',
      '/raw/banking/risk/exposure.txt',
    ]);
  });

  it('escapes quoted values when generating frontmatter', () => {
    const frontmatter = generateFrontmatter({
      title: 'Risk "Overview"',
      aliases: ['Customer "A"'],
      links: ['/raw/banking/risk/customer "gold".md'],
      source: '/raw/banking/risk/customer "gold".md',
    });

    expect(frontmatter).toContain('title: "Risk \\"Overview\\""');
    expect(frontmatter).toContain('  - "Customer \\"A\\""');
    expect(frontmatter).toContain('  - "/raw/banking/risk/customer \\"gold\\".md"');
    expect(frontmatter).toContain('source: "/raw/banking/risk/customer \\"gold\\".md"');
  });
});