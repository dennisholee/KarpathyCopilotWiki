import * as fs from 'fs';
import * as path from 'path';
import { IngestOrchestrator } from '../../src/ingest/ingestCommand';
import { WikiManager } from '../../src/wiki/wiki-manager';
import { ExtractionService } from '../../src/ingest/extractor';
import { Logger } from '../../src/utils/logger';

describe('Grouped raw ingestion', () => {
  let workspaceDir: string;
  let logger: Logger;

  beforeEach(() => {
    workspaceDir = path.join(__dirname, '../temp-raw-ingest');
    fs.rmSync(workspaceDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(workspaceDir, 'raw', 'banking', 'risk'), { recursive: true });
    fs.mkdirSync(path.join(workspaceDir, 'raw', 'banking', 'payments'), { recursive: true });

    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(workspaceDir, { recursive: true, force: true });
  });

  it('discovers nested raw files and preserves folder grouping in wiki output', async () => {
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'banking', 'risk', 'customer.md'),
      '# Customer Risk\nCustomer risk profile and rating guidance.'
    );
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'banking', 'risk', 'exposure.txt'),
      'Exposure limits and review cadence for the customer portfolio.'
    );
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'banking', 'payments', 'settlement.md'),
      '# Settlement Status\nSettlement lifecycle for payment processing.'
    );

    const wikiManager = new WikiManager(workspaceDir, logger);
    const summary = await wikiManager.ingestFromRaw();

    expect(summary.created).toBe(3);
    expect(wikiManager.listRawFiles()).toEqual([
      'banking/payments/settlement.md',
      'banking/risk/customer.md',
      'banking/risk/exposure.txt',
    ]);

    const customerPage = await wikiManager.getPage('banking-risk-customer');
    expect(customerPage).not.toBeNull();
    expect(customerPage?.tags).toContain('grouped-ingest');
    expect(customerPage?.tags).toContain('group-banking-risk');
    expect(customerPage?.sourceReferences).toContain('/raw/banking/risk/customer.md');
    expect(customerPage?.content).toContain('Folder group: banking/risk');
    expect(customerPage?.content).toContain('/raw/banking/risk/exposure.txt');
    expect(customerPage?.content).not.toContain('/raw/banking/payments/settlement.md');

    const customerPageFile = fs.readFileSync(
      path.join(workspaceDir, 'wiki', 'banking-risk-customer.md'),
      'utf-8'
    );
    expect(customerPageFile).toContain('links:');
    expect(customerPageFile).toContain('/raw/banking/risk/customer.md');
  });

  it('supports csv extraction as part of grouped ingest', async () => {
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'banking', 'risk', 'portfolio.csv'),
      'customer_id,risk_rating\nC001,High\nC002,Medium\n'
    );

    const extractor = new ExtractionService(logger);
    const extraction = await extractor.extractText(
      path.join(workspaceDir, 'raw', 'banking', 'risk', 'portfolio.csv')
    );

    expect(extraction.text).toContain('Columns: customer_id, risk_rating');
    expect(extraction.text).toContain('customer_id: C001, risk_rating: High');

    const wikiManager = new WikiManager(workspaceDir, logger);
    const summary = await wikiManager.ingestFromRaw();

    expect(summary.created).toBe(1);
    const page = await wikiManager.getPage('banking-risk-portfolio');
    expect(page).not.toBeNull();
    expect(page?.tags).toContain('source-csv');
    expect(page?.sourceReferences).toContain('/raw/banking/risk/portfolio.csv');
  });

  it('keeps distinct wiki pages when different raw files share the same title', async () => {
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'banking', 'risk', 'overview.md'),
      '# Shared Overview\nRisk-side overview content.'
    );
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'banking', 'payments', 'overview.md'),
      '# Shared Overview\nPayments-side overview content.'
    );

    const wikiManager = new WikiManager(workspaceDir, logger);
    const summary = await wikiManager.ingestFromRaw();

    expect(summary.created).toBe(2);

    const riskPage = await wikiManager.getPage('banking-risk-overview');
    const paymentsPage = await wikiManager.getPage('banking-payments-overview');

    expect(riskPage).not.toBeNull();
    expect(paymentsPage).not.toBeNull();
    expect(riskPage?.sourceReferences).toContain('/raw/banking/risk/overview.md');
    expect(paymentsPage?.sourceReferences).toContain('/raw/banking/payments/overview.md');
  });

  it('resolves a nested raw file path safely', () => {
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'banking', 'risk', 'portfolio.csv'),
      'customer_id,risk_rating\nC001,High\n'
    );

    const wikiManager = new WikiManager(workspaceDir, logger);

    expect(wikiManager.resolveRawFile('banking/risk/portfolio.csv')).toBe(
      path.join(workspaceDir, 'raw', 'banking', 'risk', 'portfolio.csv')
    );
    expect(wikiManager.resolveRawFile('../outside.txt')).toBeNull();
  });

  it('rejects ambiguous basename-only raw file targets', () => {
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'banking', 'risk', 'portfolio.csv'),
      'customer_id,risk_rating\nC001,High\n'
    );
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'banking', 'payments', 'portfolio.csv'),
      'payment_id,status\nP001,Settled\n'
    );

    const wikiManager = new WikiManager(workspaceDir, logger);
    const resolution = wikiManager.resolveRawFileTarget('portfolio.csv');

    expect(resolution.status).toBe('ambiguous');
    expect(resolution.matches).toEqual([
      'banking/payments/portfolio.csv',
      'banking/risk/portfolio.csv',
    ]);
    expect(wikiManager.resolveRawFile('portfolio.csv')).toBeNull();
  });

  it('resolves raw directories safely and ingests only the targeted subtree', async () => {
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'banking', 'risk', 'customer.md'),
      '# Customer Risk\nCustomer risk profile and rating guidance.'
    );
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'banking', 'payments', 'settlement.md'),
      '# Settlement Status\nSettlement lifecycle for payment processing.'
    );

    const wikiManager = new WikiManager(workspaceDir, logger);
    const directoryResolution = wikiManager.resolveRawDirectoryTarget('banking/risk');

    expect(directoryResolution.status).toBe('resolved');
    expect(directoryResolution.relativePath).toBe('banking/risk');
    expect(directoryResolution.files).toEqual(['banking/risk/customer.md']);

    const summary = await wikiManager.ingestFromRaw('banking/risk');

    expect(summary.created).toBe(1);
    expect(await wikiManager.getPage('banking-risk-customer')).not.toBeNull();
    expect(await wikiManager.getPage('banking-payments-settlement')).toBeNull();
  });

  it('persists source links when targeted ingest uses the orchestrator path', async () => {
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'banking', 'risk', 'customer.md'),
      '# Customer Risk\nCustomer risk profile and rating guidance.'
    );

    const wikiManager = new WikiManager(workspaceDir, logger);
    const orchestrator = new IngestOrchestrator(wikiManager.getWikiDir(), logger);
    const result = await orchestrator.ingest({
      sourceFile: path.join(workspaceDir, 'raw', 'banking', 'risk', 'customer.md'),
      sourceReference: '/raw/banking/risk/customer.md',
      groupPath: 'banking/risk',
      groupDocuments: ['/raw/banking/risk/customer.md'],
      maxPages: 3,
    });

    expect(result.pagesCreated.length).toBeGreaterThan(0);

    const createdPage = fs.readFileSync(
      path.join(workspaceDir, 'wiki', result.pagesCreated[0]),
      'utf-8'
    );
    expect(createdPage).toContain('links:');
    expect(createdPage).toContain('/raw/banking/risk/customer.md');
  });

  it('updates the same targeted-ingest pages instead of creating duplicates on rerun', async () => {
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'banking', 'risk', 'customer.md'),
      '# Customer Risk\nCustomer risk profile and rating guidance.'
    );

    const wikiManager = new WikiManager(workspaceDir, logger);
    const orchestrator = new IngestOrchestrator(wikiManager.getWikiDir(), logger);

    const firstResult = await orchestrator.ingest({
      sourceFile: path.join(workspaceDir, 'raw', 'banking', 'risk', 'customer.md'),
      sourceReference: '/raw/banking/risk/customer.md',
      groupPath: 'banking/risk',
      groupDocuments: ['/raw/banking/risk/customer.md'],
      maxPages: 3,
    });

    const secondResult = await orchestrator.ingest({
      sourceFile: path.join(workspaceDir, 'raw', 'banking', 'risk', 'customer.md'),
      sourceReference: '/raw/banking/risk/customer.md',
      groupPath: 'banking/risk',
      groupDocuments: ['/raw/banking/risk/customer.md'],
      maxPages: 3,
    });

    expect(firstResult.pagesCreated.length).toBeGreaterThan(0);
    expect(secondResult.pagesCreated).toEqual([]);
    expect(secondResult.pagesUpdated).toEqual(firstResult.pagesCreated);

    const wikiFiles = fs.readdirSync(path.join(workspaceDir, 'wiki')).filter((fileName) => fileName.endsWith('.md'));
    expect(wikiFiles).toEqual(expect.arrayContaining(firstResult.pagesCreated));
    expect(wikiFiles.length).toBe(firstResult.pagesCreated.length);
  });

  it('creates a fallback page when extracted text has no concepts or sentence punctuation', async () => {
    const rawFilePath = path.join(workspaceDir, 'raw', 'banking', 'risk', 'oecd-guidance.pdf');
    fs.writeFileSync(rawFilePath, Buffer.from('placeholder pdf bytes'));

    const extractionSpy = jest.spyOn(ExtractionService.prototype, 'extractText').mockResolvedValue({
      text: 'SAF T OECD guidance xml schema audit file tax compliance reference document',
      metadata: {
        title: 'OECD Guidance for the Standard Audit File Tax',
      },
      extractionMethod: 'pdfjs',
      confidence: 0.2,
    });

    const wikiManager = new WikiManager(workspaceDir, logger);
    const orchestrator = new IngestOrchestrator(wikiManager.getWikiDir(), logger);
    const result = await orchestrator.ingest({
      sourceFile: rawFilePath,
      sourceReference: '/raw/banking/risk/oecd-guidance.pdf',
      groupPath: 'banking/risk',
      groupDocuments: ['/raw/banking/risk/oecd-guidance.pdf'],
      maxPages: 3,
    });

    expect(result.pagesCreated.length).toBe(1);

    const createdPage = fs.readFileSync(
      path.join(workspaceDir, 'wiki', result.pagesCreated[0]),
      'utf-8'
    );
    expect(createdPage.toLowerCase()).toContain('oecd guidance for the standard audit file tax');
    expect(createdPage).toContain('SAF T OECD guidance xml schema audit file tax compliance reference document');
  });

  it('builds page ids correctly when parent folders contain extension-like substrings', async () => {
    fs.mkdirSync(path.join(workspaceDir, 'raw', 'reports.md', 'archive'), { recursive: true });
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'reports.md', 'archive', 'customer.md'),
      '# Customer Archive\nArchived customer reference content.'
    );

    const wikiManager = new WikiManager(workspaceDir, logger);
    const summary = await wikiManager.ingestFromRaw();

    expect(summary.created).toBe(1);
    const page = await wikiManager.getPage('reportsmd-archive-customer');
    expect(page).not.toBeNull();
    expect(page?.sourceReferences).toContain('/raw/reports.md/archive/customer.md');
  });

  it('reports unsupported files without failing the overall ingest run', async () => {
    fs.mkdirSync(path.join(workspaceDir, 'raw', 'banking', 'archive'), { recursive: true });
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'banking', 'archive', 'notes.bin'),
      Buffer.from([0x01, 0x02, 0x03])
    );

    const wikiManager = new WikiManager(workspaceDir, logger);
    const summary = await wikiManager.ingestFromRaw();

    expect(summary.created).toBe(0);
    expect(summary.updated).toBe(0);
    expect(summary.failures).toHaveLength(1);
    expect(summary.failures[0]?.relativePath).toBe('banking/archive/notes.bin');
    expect(summary.failures[0]?.reason).toContain('Unsupported file type');
  });

  it('preserves canonical raw path casing in grouped ingest source references', async () => {
    fs.writeFileSync(
      path.join(workspaceDir, 'raw', 'CDMS_Architecture_Wiki.md'),
      '# CDMS Architecture\nCanonical source path casing should be preserved.'
    );

    const wikiManager = new WikiManager(workspaceDir, logger);
    const summary = await wikiManager.ingestFromRaw();

    expect(summary.created).toBe(1);

    const pages = await wikiManager.listPages();
    expect(pages).toHaveLength(1);

    const page = pages[0];
    expect(page).not.toBeNull();
    expect(page?.sourceReferences).toContain('/raw/CDMS_Architecture_Wiki.md');

    const pageFile = fs.readFileSync(
      path.join(workspaceDir, 'wiki', `${page?.id}.md`),
      'utf-8'
    );
    expect(pageFile).toContain('source: "/raw/CDMS_Architecture_Wiki.md"');
    expect(pageFile).toContain('- "/raw/CDMS_Architecture_Wiki.md"');
  });

  it('does not create stopword-only or structural-noise pages during targeted ingest', async () => {
    const rawFilePath = path.join(workspaceDir, 'raw', 'CDMS_Architecture_Wiki.md');
    fs.writeFileSync(
      rawFilePath,
      [
        '# Customer Data Management System',
        '',
        '## Section',
        'The CDMS provides party, tax, and relationship data for customer operations.',
        '',
        '## Overview',
        'The architecture supports trusted customer records and governance controls.',
      ].join('\n')
    );

    const wikiManager = new WikiManager(workspaceDir, logger);
    const orchestrator = new IngestOrchestrator(wikiManager.getWikiDir(), logger);
    const result = await orchestrator.ingest({
      sourceFile: rawFilePath,
      sourceReference: '/raw/CDMS_Architecture_Wiki.md',
      groupPath: '',
      groupDocuments: ['/raw/CDMS_Architecture_Wiki.md'],
      maxPages: 10,
    });

    expect(result.pagesCreated.some((pageName) => pageName.endsWith('-the.md'))).toBe(false);
    expect(result.pagesCreated.some((pageName) => pageName.endsWith('-section.md'))).toBe(false);
    expect(result.pagesCreated.some((pageName) => pageName.endsWith('-overview.md'))).toBe(false);
    expect(result.pagesCreated.length).toBeGreaterThan(0);
  });
});