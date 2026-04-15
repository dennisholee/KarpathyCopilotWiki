import * as fs from 'fs';
import * as path from 'path';
import { FilenameGenerator } from '../../../src/utils/filenameGenerator';
import { Logger } from '../../../src/utils/logger';

describe('FilenameGenerator', () => {
  let testDir: string;
  let logger: Logger;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-04-15T12:00:00Z'));
    testDir = path.join(__dirname, '../../temp-filename-generator');
    fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(testDir, { recursive: true });
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger;
  });

  afterEach(() => {
    jest.useRealTimers();
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('increments the sequence after existing files for the same day', () => {
    fs.writeFileSync(path.join(testDir, '2026041501.md'), 'a');
    fs.writeFileSync(path.join(testDir, '2026041502.md'), 'b');

    const generator = new FilenameGenerator(testDir, logger);

    expect(generator.generateFilename()).toBe('2026041503.md');
  });

  it('throws when more than 99 files exist for the same day', () => {
    const generator = new FilenameGenerator(testDir, logger);

    for (let index = 1; index <= 99; index++) {
      fs.writeFileSync(path.join(testDir, `20260415${String(index).padStart(2, '0')}.md`), 'x');
    }

    expect(() => generator.generateFilename()).toThrow('Too many files for date 20260415');
  });

  it('generates the first filename for a specific date', () => {
    const generator = new FilenameGenerator(testDir, logger);

    expect(generator.generateFilenameForDate(new Date('2025-12-31T00:00:00Z'))).toBe('2025123101.md');
  });

  it('returns null when extracting invalid dates from filenames', () => {
    const generator = new FilenameGenerator(testDir, logger);

    expect(generator.extractDateFromFilename('not-a-date.md')).toBeNull();
    expect(generator.extractDateFromFilename('2026130101.md')).toBeNull();
    expect(generator.extractDateFromFilename('2026123201.md')).toBeNull();
  });
});