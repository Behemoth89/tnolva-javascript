import type { ProjectFileAccess } from './projectFileAccess';
import { WholeFileProjectFileAccess } from './wholeFileProjectFileAccess';

let cached: ProjectFileAccess | null = null;

export function getProjectFileAccess(): ProjectFileAccess {
  if (!cached) {
    cached = new WholeFileProjectFileAccess();
  }
  return cached;
}

export function setProjectFileAccess(access: ProjectFileAccess): void {
  cached = access;
}
