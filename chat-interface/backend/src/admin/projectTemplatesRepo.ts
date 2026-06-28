import { getDb } from '../db';

export interface ProjectTemplateRow {
  id: number;
  name: string;
  system_prompt: string | null;
  default_llm_provider_model: string;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export interface PublicProjectTemplate {
  id: number;
  name: string;
  system_prompt: string | null;
  default_llm_provider_model: string;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectTemplateInput {
  name: string;
  system_prompt: string | null;
  default_llm_provider_model: string;
  is_default: boolean;
}

export interface UpdateProjectTemplateInput {
  name?: string;
  system_prompt?: string | null;
  default_llm_provider_model?: string;
  is_default?: boolean;
}

export type RepoResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: 'conflict' | 'not_found' | 'validation'; error: string };

function toPublic(row: ProjectTemplateRow): PublicProjectTemplate {
  return {
    id: row.id,
    name: row.name,
    system_prompt: row.system_prompt,
    default_llm_provider_model: row.default_llm_provider_model,
    is_default: row.is_default,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function listProjectTemplates(): PublicProjectTemplate[] {
  const rows = getDb()
    .prepare(
      'SELECT id, name, system_prompt, default_llm_provider_model, is_default, created_at, updated_at FROM project_templates ORDER BY created_at ASC, id ASC',
    )
    .all() as ProjectTemplateRow[];
  return rows.map(toPublic);
}

export function getProjectTemplate(id: number): PublicProjectTemplate | null {
  const row = getDb()
    .prepare(
      'SELECT id, name, system_prompt, default_llm_provider_model, is_default, created_at, updated_at FROM project_templates WHERE id = ?',
    )
    .get(id) as ProjectTemplateRow | undefined;
  return row ? toPublic(row) : null;
}

export function getDefaultProjectTemplate(): PublicProjectTemplate | null {
  const row = getDb()
    .prepare(
      'SELECT id, name, system_prompt, default_llm_provider_model, is_default, created_at, updated_at FROM project_templates WHERE is_default = 1 ORDER BY id ASC LIMIT 1',
    )
    .get() as ProjectTemplateRow | undefined;
  return row ? toPublic(row) : null;
}

export function insertProjectTemplate(
  input: CreateProjectTemplateInput,
): RepoResult<PublicProjectTemplate> {
  const db = getDb();
  const id = db.transaction(() => {
    if (input.is_default) {
      db.prepare('UPDATE project_templates SET is_default = 0, updated_at = CURRENT_TIMESTAMP').run();
    }
    const result = db
      .prepare(
        'INSERT INTO project_templates (name, system_prompt, default_llm_provider_model, is_default) VALUES (?, ?, ?, ?)',
      )
      .run(input.name, input.system_prompt, input.default_llm_provider_model, input.is_default ? 1 : 0);
    return Number(result.lastInsertRowid);
  })();
  const created = getProjectTemplate(id);
  if (!created) {
    return { ok: false, code: 'not_found', error: 'Project template not found after insert' };
  }
  return { ok: true, value: created };
}

export function updateProjectTemplate(
  id: number,
  input: UpdateProjectTemplateInput,
): RepoResult<PublicProjectTemplate> {
  const existing = getProjectTemplate(id);
  if (!existing) {
    return { ok: false, code: 'not_found', error: 'Project template not found' };
  }
  const next: {
    name: string;
    system_prompt: string | null;
    default_llm_provider_model: string;
    is_default: number;
  } = {
    name: input.name === undefined ? existing.name : input.name,
    system_prompt:
      input.system_prompt === undefined ? existing.system_prompt : input.system_prompt,
    default_llm_provider_model:
      input.default_llm_provider_model === undefined
        ? existing.default_llm_provider_model
        : input.default_llm_provider_model,
    is_default: input.is_default === undefined ? existing.is_default : input.is_default ? 1 : 0,
  };
  const db = getDb();
  db.transaction(() => {
    if (next.is_default === 1) {
      db.prepare(
        'UPDATE project_templates SET is_default = 0, updated_at = CURRENT_TIMESTAMP WHERE id != ?',
      ).run(id);
    }
    db.prepare(
      'UPDATE project_templates SET name = ?, system_prompt = ?, default_llm_provider_model = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    )
      .run(next.name, next.system_prompt, next.default_llm_provider_model, next.is_default, id);
  })();
  const updated = getProjectTemplate(id);
  if (!updated) {
    return { ok: false, code: 'not_found', error: 'Project template not found after update' };
  }
  return { ok: true, value: updated };
}

export function deleteProjectTemplate(id: number): RepoResult<true> {
  const result = getDb().prepare('DELETE FROM project_templates WHERE id = ?').run(id);
  if (result.changes === 0) {
    return { ok: false, code: 'not_found', error: 'Project template not found' };
  }
  return { ok: true, value: true };
}
