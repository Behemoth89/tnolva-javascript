import {
  closeSync,
  createReadStream,
  existsSync,
  mkdirSync,
  openSync,
  readSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  type ReadStream,
} from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { ensureProjectFilesRoot } from './tempSweep';

export function getProjectDir(projectId: number): string {
  return join(ensureProjectFilesRoot(), String(projectId));
}

export function getProjectFilePath(
  projectId: number,
  fileId: number,
  ext: string,
): string {
  const dir = getProjectDir(projectId);
  const safeExt = ext && /^\.[A-Za-z0-9]+$/.test(ext) ? ext : '';
  return join(dir, `${fileId}${safeExt}`);
}

export function getTempDir(): string {
  const root = ensureProjectFilesRoot();
  const tmp = join(root, '_tmp');
  if (!existsSync(tmp)) {
    mkdirSync(tmp, { recursive: true });
  }
  return tmp;
}

export function stageTempFile(originalName: string): string {
  const tmpDir = getTempDir();
  const suffix = randomBytes(12).toString('hex');
  const safeOriginal = originalName.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 64);
  return join(tmpDir, `${Date.now()}-${suffix}-${safeOriginal}`);
}

export function commitTempToProject(tempPath: string, finalPath: string): void {
  const finalDir = join(finalPath, '..');
  if (!existsSync(finalDir)) {
    mkdirSync(finalDir, { recursive: true });
  }
  renameSync(tempPath, finalPath);
}

export function unlinkIfExists(path: string): void {
  try {
    unlinkSync(path);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      throw err;
    }
  }
}

export function removeProjectDir(projectId: number): void {
  const dir = getProjectDir(projectId);
  rmSync(dir, { force: true, recursive: true });
}

export function fileExists(path: string): boolean {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

export function getFileSize(path: string): number {
  return statSync(path).size;
}

export function readFirstBytes(path: string, length: number): Buffer {
  const buf = Buffer.alloc(length);
  const fd = openSync(path, 'r');
  try {
    const bytesRead = readSync(fd, buf, 0, length, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    closeSync(fd);
  }
}

export function createDownloadStream(path: string): ReadStream {
  return createReadStream(path);
}
