import { getDb } from '../db';
import { getDefaultProjectTemplate } from '../admin/projectTemplatesRepo';
import {
  getDefaultProjectForUser,
  insertProject,
  type PublicProject,
  type RepoResult,
} from './projectsRepo';

export function loadSystemDefaultTemplate(): {
  name: string;
  system_prompt: string | null;
  default_llm_provider_model: string | null;
} {
  const tpl = getDefaultProjectTemplate();
  if (tpl) {
    return {
      name: tpl.name,
      system_prompt: tpl.system_prompt,
      default_llm_provider_model: tpl.default_llm_provider_model,
    };
  }
  return { name: 'Default', system_prompt: null, default_llm_provider_model: null };
}

export function ensureDefaultProject(userId: number): PublicProject {
  const existing = getDefaultProjectForUser(userId);
  if (existing) {
    return existing;
  }
  const db = getDb();
  const fallback = loadSystemDefaultTemplate();
  const inserted: PublicProject | RepoResult<PublicProject> = db.transaction(() => {
    const found = getDefaultProjectForUser(userId);
    if (found) {
      return found;
    }
    return insertProject({
      user_id: userId,
      name: fallback.name,
      system_prompt: fallback.system_prompt,
      default_llm_provider_model:
        fallback.default_llm_provider_model ?? 'unresolved:unresolved',
    });
  }).immediate();
  if ('ok' in inserted && !inserted.ok) {
    throw new Error(inserted.error);
  }
  const value = 'ok' in inserted ? inserted.value : (inserted as PublicProject);
  if (value.is_user_default !== 1) {
    db.prepare('UPDATE projects SET is_user_default = 1 WHERE id = ?').run(value.id);
    const refreshed = getDefaultProjectForUser(userId);
    if (refreshed) {
      return refreshed;
    }
  }
  return value;
}
