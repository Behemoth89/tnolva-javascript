import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import {
  closeDb,
  initDb,
} from '../../src/db';
import {
  commitTempToProject,
  fileExists,
  getFileSize,
  getProjectDir,
  getProjectFilePath,
  getTempDir,
  readFirstBytes,
  removeProjectDir,
  stageTempFile,
  unlinkIfExists,
} from '../../src/projects/storage';
import { ensureProjectFilesRoot, sweepOldTempFiles } from '../../src/projects/tempSweep';
import { mkdtempSync, existsSync, statSync, writeFileSync, utimesSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const originalRoot = process.env.PROJECT_FILES_ROOT;
let tempRoot = '';

beforeEach(() => {
  closeDb();
  initDb(':memory:');
  tempRoot = mkdtempSync(path.join(tmpdir(), 'storage-test-'));
  process.env.PROJECT_FILES_ROOT = tempRoot;
});

afterEach(() => {
  closeDb();
  if (originalRoot === undefined) {
    delete process.env.PROJECT_FILES_ROOT;
  } else {
    process.env.PROJECT_FILES_ROOT = originalRoot;
  }
  if (tempRoot && existsSync(tempRoot)) {
    rmSync(tempRoot, { force: true, recursive: true });
  }
});

describe('storage (unit)', () => {
  it('getProjectDir joins the root and the project id', () => {
    expect(getProjectDir(42)).toBe(path.join(tempRoot, '42'));
  });

  it('getProjectFilePath produces a per-file path with the optional extension', () => {
    expect(getProjectFilePath(7, 99, '.txt')).toBe(path.join(tempRoot, '7', '99.txt'));
    expect(getProjectFilePath(7, 99, '')).toBe(path.join(tempRoot, '7', '99'));
  });

  it('ensureProjectFilesRoot returns the configured directory', () => {
    const root = ensureProjectFilesRoot();
    expect(root).toBe(tempRoot);
    expect(existsSync(tempRoot)).toBe(true);
  });

  it('stageTempFile writes inside <root>/_tmp', () => {
    const staged = stageTempFile('hello.txt');
    expect(staged.startsWith(getTempDir())).toBe(true);
    expect(existsSync(staged)).toBe(false);
  });

  it('commitTempToProject renames a staged file into the project directory', () => {
    const staged = stageTempFile('a.bin');
    writeFileSync(staged, 'abc');
    const finalPath = getProjectFilePath(5, 1, '.bin');
    commitTempToProject(staged, finalPath);
    expect(existsSync(staged)).toBe(false);
    expect(existsSync(finalPath)).toBe(true);
    expect(readFileSync(finalPath, 'utf8')).toBe('abc');
  });

  it('unlinkIfExists swallows ENOENT and rethrows other errors', () => {
    const target = path.join(tempRoot, 'missing.bin');
    expect(() => unlinkIfExists(target)).not.toThrow();
    const other = path.join(tempRoot, 'file');
    mkdirSync(other);
    expect(() => unlinkIfExists(other)).toThrow();
  });

  it('removeProjectDir removes the per-project directory', () => {
    const projectDir = getProjectDir(3);
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(path.join(projectDir, 'x.txt'), 'ok');
    removeProjectDir(3);
    expect(existsSync(projectDir)).toBe(false);
  });

  it('fileExists and getFileSize reflect disk state', () => {
    const target = path.join(tempRoot, 'sized.bin');
    writeFileSync(target, '12345');
    expect(fileExists(target)).toBe(true);
    expect(getFileSize(target)).toBe(5);
  });

  it('readFirstBytes returns up to the requested length', () => {
    const target = path.join(tempRoot, 'peek.bin');
    writeFileSync(target, 'ABCDEFGH');
    const buf = readFirstBytes(target, 4);
    expect(buf.toString('utf8')).toBe('ABCD');
  });

  it('sweepOldTempFiles removes stale files and keeps fresh ones', async () => {
    const tmp = getTempDir();
    const fresh = path.join(tmp, 'fresh.txt');
    const stale = path.join(tmp, 'stale.txt');
    writeFileSync(fresh, 'now');
    writeFileSync(stale, 'old');
    const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
    utimesSync(stale, oldTime, oldTime);
    const removed = sweepOldTempFiles();
    expect(removed).toBeGreaterThanOrEqual(1);
    expect(existsSync(stale)).toBe(false);
    expect(existsSync(fresh)).toBe(true);
  });
});
