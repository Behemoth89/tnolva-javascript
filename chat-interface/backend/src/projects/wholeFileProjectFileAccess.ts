import { readFileSync } from 'node:fs';
import { getProjectFileRaw, listProjectFiles } from './projectFilesRepo';
import { isTextMimeType } from './mime';
import type {
  ProjectFileAccess,
  ProjectFileRef,
  ResolveForLlmInput,
} from './projectFileAccess';

const PER_FILE_BUDGET = 100_000;
const TOTAL_BUDGET = 200_000;
const CANDIDATE_LIMIT = 1000;

export class WholeFileProjectFileAccess implements ProjectFileAccess {
  async resolveForLlm(input: ResolveForLlmInput): Promise<ProjectFileRef[]> {
    void input;
    const result = listProjectFiles({
      projectId: input.projectId,
      limit: CANDIDATE_LIMIT,
      offset: 0,
    });
    const ascending = [...result.items].sort((a, b) => {
      if (a.created_at < b.created_at) return -1;
      if (a.created_at > b.created_at) return 1;
      return a.id - b.id;
    });
    const refs: ProjectFileRef[] = [];
    let total = 0;
    for (const file of ascending) {
      if (!isTextMimeType(file.mime_type)) {
        continue;
      }
      if (total >= TOTAL_BUDGET) {
        break;
      }
      const raw = getProjectFileRaw(file.id);
      if (!raw) {
        continue;
      }
      let contentText = '';
      try {
        const buffer = readFileSync(raw.storage_path);
        contentText = buffer.toString('utf8');
      } catch {
        continue;
      }
      const exceeded = contentText.length > PER_FILE_BUDGET;
      if (exceeded) {
        contentText = contentText.slice(0, PER_FILE_BUDGET);
      }
      if (total + contentText.length > TOTAL_BUDGET) {
        break;
      }
      total += contentText.length;
      const ref: ProjectFileRef = {
        fileId: file.id,
        filename: file.filename,
        mimeType: file.mime_type,
        contentText,
      };
      if (exceeded) {
        ref.dropped = { reason: 'budget' };
      }
      refs.push(ref);
    }
    return refs;
  }
}

export const WHOLE_FILE_BUDGETS = {
  perFile: PER_FILE_BUDGET,
  total: TOTAL_BUDGET,
};
