import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { config } from '../config';

const ONE_HOUR_MS = 60 * 60 * 1000;

function resolvedProjectFilesRoot(): string {
  // Read env at call time so tests can override the directory between tests.
  const raw = process.env.PROJECT_FILES_ROOT ?? config.projectFilesRoot;
  if (raw === ':memory:') {
    return raw;
  }
  return resolve(process.cwd(), raw);
}

export function getResolvedProjectFilesRoot(): string {
  return resolvedProjectFilesRoot();
}

export function ensureProjectFilesRoot(): string {
  const root = resolvedProjectFilesRoot();
  if (root === ':memory:') {
    return root;
  }
  if (!existsSync(root)) {
    mkdirSync(root, { recursive: true });
  }
  return root;
}

export function sweepOldTempFiles(maxAgeMs: number = ONE_HOUR_MS): number {
  const root = ensureProjectFilesRoot();
  const tmpDir = join(root, '_tmp');
  if (!existsSync(tmpDir)) {
    return 0;
  }
  const now = Date.now();
  let removed = 0;
  for (const entry of readdirSync(tmpDir)) {
    const entryPath = join(tmpDir, entry);
    try {
      const stat = statSync(entryPath);
      if (now - stat.mtimeMs > maxAgeMs) {
        rmSync(entryPath, { force: true, recursive: true });
        removed += 1;
      }
    } catch {
      // ignore
    }
  }
  return removed;
}

export function isPathInsideProjectFilesRoot(candidate: string): boolean {
  const root = ensureProjectFilesRoot();
  const normalizedRoot = root.endsWith(sep) ? root : `${root}${sep}`;
  const normalizedCandidate = candidate.startsWith(root)
    ? candidate.startsWith(normalizedRoot) || candidate === root
      ? candidate
      : null
    : null;
  if (!normalizedCandidate) {
    return false;
  }
  return true;
}
