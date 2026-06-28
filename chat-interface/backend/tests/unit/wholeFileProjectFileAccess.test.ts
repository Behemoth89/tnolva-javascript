import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { closeDb, initDb } from '../../src/db';
import { createUser } from '../../src/auth/usersRepo';
import { ensureDefaultProject } from '../../src/projects/projectsService';
import { writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { WholeFileProjectFileAccess } from '../../src/projects/wholeFileProjectFileAccess';
import { uploadFileFromTemp } from '../../src/projects/projectFilesService';
import { stageTempFile } from '../../src/projects/storage';

const originalRoot = process.env.PROJECT_FILES_ROOT;
let tempRoot = '';

beforeEach(() => {
  closeDb();
  initDb(':memory:');
  tempRoot = mkdtempSync(path.join(tmpdir(), 'pfa-test-'));
  process.env.PROJECT_FILES_ROOT = tempRoot;
});

afterEach(() => {
  closeDb();
  if (originalRoot === undefined) {
    delete process.env.PROJECT_FILES_ROOT;
  } else {
    process.env.PROJECT_FILES_ROOT = originalRoot;
  }
  if (tempRoot) {
    rmSync(tempRoot, { force: true, recursive: true });
  }
});

function seedUser() {
  const result = createUser({ email: 'pfa@example.com', passwordHash: 'h' });
  return result.user.id;
}

function uploadTextFile(projectId: number, userId: number, content: string, mime = 'text/plain') {
  const tempPath = stageTempFile(`f-${Date.now()}.txt`);
  writeFileSync(tempPath, content);
  return uploadFileFromTemp({
    projectId,
    userId,
    tempPath,
    originalFilename: `f-${Date.now()}.txt`,
    declaredMimeType: mime,
    source: 'project_upload',
  });
}

describe('WholeFileProjectFileAccess (unit)', () => {
  it('returns an empty array for a project with no files', async () => {
    const userId = seedUser();
    const project = ensureDefaultProject(userId);
    const access = new WholeFileProjectFileAccess();
    const result = await access.resolveForLlm({
      projectId: project.id,
      chatId: 1,
      userMessage: 'hi',
    });
    expect(result).toEqual([]);
  });

  it('returns all files for a project that fits within the budget', async () => {
    const userId = seedUser();
    const project = ensureDefaultProject(userId);
    uploadTextFile(project.id, userId, 'a'.repeat(50_000));
    uploadTextFile(project.id, userId, 'b'.repeat(50_000));
    const access = new WholeFileProjectFileAccess();
    const result = await access.resolveForLlm({
      projectId: project.id,
      chatId: 1,
      userMessage: 'hi',
    });
    expect(result).toHaveLength(2);
    expect(result.every((r) => !r.dropped)).toBe(true);
  });

  it('marks a file as dropped when it exceeds the per-file cap', async () => {
    const userId = seedUser();
    const project = ensureDefaultProject(userId);
    uploadTextFile(project.id, userId, 'x'.repeat(150_000));
    const access = new WholeFileProjectFileAccess();
    const result = await access.resolveForLlm({
      projectId: project.id,
      chatId: 1,
      userMessage: 'hi',
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.contentText.length).toBe(100_000);
    expect(result[0]?.dropped).toEqual({ reason: 'budget' });
  });

  it('omits files that would push past the total cap', async () => {
    const userId = seedUser();
    const project = ensureDefaultProject(userId);
    uploadTextFile(project.id, userId, 'a'.repeat(80_000));
    uploadTextFile(project.id, userId, 'b'.repeat(80_000));
    uploadTextFile(project.id, userId, 'c'.repeat(80_000));
    const access = new WholeFileProjectFileAccess();
    const result = await access.resolveForLlm({
      projectId: project.id,
      chatId: 1,
      userMessage: 'hi',
    });
    const total = result.reduce((sum, r) => sum + r.contentText.length, 0);
    expect(total).toBeLessThanOrEqual(200_000);
    expect(result.length).toBeLessThan(3);
  });

  it('skips binary files entirely', async () => {
    const userId = seedUser();
    const project = ensureDefaultProject(userId);
    const tempPath = stageTempFile('a.png');
    writeFileSync(tempPath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    uploadFileFromTemp({
      projectId: project.id,
      userId,
      tempPath,
      originalFilename: 'a.png',
      declaredMimeType: 'image/png',
      source: 'project_upload',
    });
    uploadTextFile(project.id, userId, 'plain text');
    const access = new WholeFileProjectFileAccess();
    const result = await access.resolveForLlm({
      projectId: project.id,
      chatId: 1,
      userMessage: 'hi',
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.mimeType).toBe('text/plain');
  });
});
