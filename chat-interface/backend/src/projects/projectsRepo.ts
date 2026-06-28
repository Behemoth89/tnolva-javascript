import { getDb } from '../db';

export interface ProjectRow {
  id: number;
  user_id: number;
  name: string;
  system_prompt: string | null;
  default_llm_provider_model: string;
  is_user_default: number;
  created_at: string;
  updated_at: string;
}

export interface PublicProject {
  id: number;
  user_id: number;
  name: string;
  system_prompt: string | null;
  default_llm_provider_model: string;
  is_user_default: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  user_id: number;
  name: string;
  system_prompt: string | null;
  default_llm_provider_model: string;
}

export interface UpdateProjectInput {
  name?: string;
  system_prompt?: string | null;
  default_llm_provider_model?: string;
}

export type RepoResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: 'conflict' | 'not_found' | 'validation'; error: string };

function toPublic(row: ProjectRow): PublicProject {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    system_prompt: row.system_prompt,
    default_llm_provider_model: row.default_llm_provider_model,
    is_user_default: row.is_user_default,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function listProjectsForUser(userId: number): PublicProject[] {
  const rows = getDb()
    .prepare(
      'SELECT id, user_id, name, system_prompt, default_llm_provider_model, is_user_default, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY created_at ASC, id ASC',
    )
    .all(userId) as ProjectRow[];
  return rows.map(toPublic);
}

export function getProjectForUser(id: number, userId: number): PublicProject | null {
  const row = getDb()
    .prepare(
      'SELECT id, user_id, name, system_prompt, default_llm_provider_model, is_user_default, created_at, updated_at FROM projects WHERE id = ? AND user_id = ?',
    )
    .get(id, userId) as ProjectRow | undefined;
  return row ? toPublic(row) : null;
}

export function getDefaultProjectForUser(userId: number): PublicProject | null {
  const row = getDb()
    .prepare(
      'SELECT id, user_id, name, system_prompt, default_llm_provider_model, is_user_default, created_at, updated_at FROM projects WHERE user_id = ? AND is_user_default = 1',
    )
    .get(userId) as ProjectRow | undefined;
  return row ? toPublic(row) : null;
}

export function getProjectByIdRaw(id: number): PublicProject | null {
  const row = getDb()
    .prepare(
      'SELECT id, user_id, name, system_prompt, default_llm_provider_model, is_user_default, created_at, updated_at FROM projects WHERE id = ?',
    )
    .get(id) as ProjectRow | undefined;
  return row ? toPublic(row) : null;
}

export function insertProject(input: CreateProjectInput): RepoResult<PublicProject> {
  const db = getDb();
  const result = db
    .prepare(
      'INSERT INTO projects (user_id, name, system_prompt, default_llm_provider_model, is_user_default) VALUES (?, ?, ?, ?, 0)',
    )
    .run(input.user_id, input.name, input.system_prompt, input.default_llm_provider_model);
  const id = Number(result.lastInsertRowid);
  const created = getProjectForUser(id, input.user_id);
  if (!created) {
    return { ok: false, code: 'not_found', error: 'Project not found after insert' };
  }
  return { ok: true, value: created };
}

export function updateProject(
  id: number,
  userId: number,
  input: UpdateProjectInput,
): RepoResult<PublicProject> {
  const existing = getProjectForUser(id, userId);
  if (!existing) {
    return { ok: false, code: 'not_found', error: 'Project not found' };
  }
  const next: {
    name: string;
    system_prompt: string | null;
    default_llm_provider_model: string;
  } = {
    name: input.name === undefined ? existing.name : input.name,
    system_prompt: input.system_prompt === undefined ? existing.system_prompt : input.system_prompt,
    default_llm_provider_model:
      input.default_llm_provider_model === undefined
        ? existing.default_llm_provider_model
        : input.default_llm_provider_model,
  };
  getDb()
    .prepare(
      'UPDATE projects SET name = ?, system_prompt = ?, default_llm_provider_model = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    )
    .run(next.name, next.system_prompt, next.default_llm_provider_model, id);
  const updated = getProjectForUser(id, userId);
  if (!updated) {
    return { ok: false, code: 'not_found', error: 'Project not found after update' };
  }
  return { ok: true, value: updated };
}

export function setUserDefaultProject(
  id: number,
  userId: number,
): RepoResult<PublicProject> {
  const existing = getProjectForUser(id, userId);
  if (!existing) {
    return { ok: false, code: 'not_found', error: 'Project not found' };
  }
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare('UPDATE projects SET is_user_default = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id != ?')
      .run(userId, id);
    db.prepare('UPDATE projects SET is_user_default = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(id);
  });
  tx();
  const updated = getProjectForUser(id, userId);
  if (!updated) {
    return { ok: false, code: 'not_found', error: 'Project not found after make-default' };
  }
  return { ok: true, value: updated };
}

export function deleteProject(id: number, userId: number): RepoResult<true> {
  const existing = getProjectForUser(id, userId);
  if (!existing) {
    return { ok: false, code: 'not_found', error: 'Project not found' };
  }
  if (existing.is_user_default === 1) {
    return {
      ok: false,
      code: 'conflict',
      error: 'Cannot delete the default project; promote another project to default first',
    };
  }
  getDb().prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(id, userId);
  return { ok: true, value: true };
}
