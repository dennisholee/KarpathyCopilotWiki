import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Logger } from '../../../src/utils/logger';
import { WikiManager } from '../../../src/wiki/wiki-manager';

describe('WikiManager', () => {
  let workspaceDir: string;
  let logger: Logger;
  let wikiManager: WikiManager;
  let watcher: {
    dispose: jest.Mock;
    onDidCreate: jest.Mock;
    onDidChange: jest.Mock;
    onDidDelete: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    workspaceDir = path.join(__dirname, '../../temp-wiki-manager');
    fs.rmSync(workspaceDir, { recursive: true, force: true });
    fs.mkdirSync(workspaceDir, { recursive: true });

    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;

    watcher = {
      dispose: jest.fn(),
      onDidCreate: jest.fn(),
      onDidChange: jest.fn(),
      onDidDelete: jest.fn(),
    };
    (vscode.workspace.createFileSystemWatcher as jest.Mock).mockReturnValue(watcher);

    wikiManager = new WikiManager(workspaceDir, logger);
  });

  afterEach(() => {
    fs.rmSync(workspaceDir, { recursive: true, force: true });
  });

  it('creates required directories and initializes the file watcher', async () => {
    expect(fs.existsSync(path.join(workspaceDir, 'raw'))).toBe(true);
    expect(fs.existsSync(path.join(workspaceDir, 'wiki'))).toBe(true);
    expect(fs.existsSync(path.join(workspaceDir, 'wiki', 'decisions'))).toBe(true);

    await wikiManager.initializeFileWatcher();

    expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledTimes(1);
    expect(vscode.RelativePattern).toHaveBeenCalledWith(path.join(workspaceDir, 'raw'), '**/*');
    expect(watcher.onDidCreate).toHaveBeenCalledTimes(1);
    expect(watcher.onDidChange).toHaveBeenCalledTimes(1);
    expect(watcher.onDidDelete).toHaveBeenCalledTimes(1);
  });

  it('creates, reads, lists, updates, and deletes pages with normalized source links', async () => {
    const createdPage = await wikiManager.createPage('Customer Risk', '# Customer Risk\n\nBody', {
      source: 'banking/risk/customer.md',
      tags: ['risk'],
      aliases: ['Risk Profile'],
    });

    expect(createdPage.id).toBe('customer-risk');
    expect(createdPage.sourceReferences).toEqual(['/raw/banking/risk/customer.md']);

    const duplicatePage = await wikiManager.createPage('Customer Risk', '# Changed', {
      source: 'other.md',
    });
    expect(duplicatePage.content).toBe('# Customer Risk\n\nBody');
    expect(logger.warn).toHaveBeenCalledWith('Page already exists: customer-risk');

    const updatedPage = await wikiManager.updatePage('customer-risk', {
      content: '# Customer Risk\n\nUpdated content with [[linked-page]]',
      tags: ['risk', 'customer'],
      sourceReferences: ['banking/risk/customer.md', '/raw/banking/risk/exposure.txt'],
    });

    expect(updatedPage.tags).toEqual(['risk', 'customer']);
    expect(updatedPage.links).toEqual(['linked-page']);
    expect(updatedPage.sourceReferences).toEqual([
      '/raw/banking/risk/customer.md',
      '/raw/banking/risk/exposure.txt',
    ]);

    const listedPages = await wikiManager.listPages();
    expect(listedPages.map((page) => page.id)).toEqual(['customer-risk']);
    expect(wikiManager.getSourceReferences(updatedPage)).toEqual([
      '/raw/banking/risk/customer.md',
      '/raw/banking/risk/exposure.txt',
    ]);

    await wikiManager.deletePage('customer-risk');
    expect(await wikiManager.getPage('customer-risk')).toBeNull();
    await expect(wikiManager.deletePage('customer-risk')).rejects.toThrow('Page not found: customer-risk');
  });

  it('builds backlink graphs, related pages, lint summaries, and importance scores', async () => {
    await wikiManager.createPage('Page A', '# Page A\n\n[[page-b]]\n[[page-c]]', {
      tags: ['alpha'],
      links: ['/raw/a.md'],
    }, 'page-a');
    await wikiManager.createPage('Page B', '# Page B\n\n[[page-c]]', {
      tags: ['beta'],
      links: ['/raw/b.md'],
    }, 'page-b');
    await wikiManager.createPage('Page C', '# Page C\n\nBody', {
      tags: ['gamma'],
      links: ['/raw/c.md'],
    }, 'page-c');
    await wikiManager.createPage('Page D', '# Page D\n\nOrphan body', {
      tags: ['delta'],
      links: ['/raw/d.md'],
    }, 'page-d');

    const backlinkGraph = await wikiManager.getBacklinkGraph();
    expect(backlinkGraph['page-c']).toEqual(['page-a', 'page-b']);
    expect(backlinkGraph['page-d']).toEqual([]);

    const relatedPages = await wikiManager.getRelatedPages('page-c');
    expect(relatedPages.sort()).toEqual(['page-a', 'page-b']);
    expect(await wikiManager.getRelatedPages('missing')).toEqual([]);

    const quickLint = await wikiManager.lint(true);
    expect(quickLint).toEqual({ orphanCount: 1 });

    const deepLint = await wikiManager.lint(false);
    expect(deepLint).toEqual({
      orphanCount: 1,
      contradictionCount: 0,
      qualityScore: 90,
    });

    const importance = await wikiManager.computePageImportance();
    expect(importance['page-c']).toBeGreaterThan(importance['page-d']);
    expect(importance['page-d']).toBe(0);
  });

  it('disposes the watcher when present', async () => {
    await wikiManager.initializeFileWatcher();

    wikiManager.dispose();

    expect(watcher.dispose).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('WikiManager disposed');
  });
});