import { getDb } from '../db';

export interface LLMProviderModelRow {
  id: number;
  llm_provider_id: number;
  name: string;
  created_at: string;
}

export interface PublicLLMProviderModel {
  id: number;
  llm_provider_id: number;
  name: string;
  created_at: string;
}

export interface CreateModelInput {
  llm_provider_id: number;
  name: string;
}

export type UpdateModelInput = Partial<CreateModelInput>;

export type RepoResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: 'conflict' | 'not_found' | 'validation'; error: string };

function toPublic(row: LLMProviderModelRow): PublicLLMProviderModel {
  return {
    id: row.id,
    llm_provider_id: row.llm_provider_id,
    name: row.name,
    created_at: row.created_at,
  };
}

function providerExists(id: number): boolean {
  const row = getDb()
    .prepare('SELECT id FROM llm_providers WHERE id = ?')
    .get(id) as { id: number } | undefined;
  return Boolean(row);
}

function mapUniqueError(err: unknown): RepoResult<never> {
  const message = err instanceof Error ? err.message : String(err);
  if (message.toLowerCase().includes('unique')) {
    return {
      ok: false,
      code: 'conflict',
      error: 'Model name already exists for this provider',
    };
  }
  if (message.toLowerCase().includes('foreign key')) {
    return { ok: false, code: 'validation', error: 'Provider not found' };
  }
  return { ok: false, code: 'validation', error: 'Database error' };
}

export function listModels(providerId?: number): PublicLLMProviderModel[] {
  const db = getDb();
  if (typeof providerId === 'number') {
    const rows = db
      .prepare(
        'SELECT id, llm_provider_id, name, created_at FROM llm_provider_models WHERE llm_provider_id = ? ORDER BY created_at ASC, id ASC',
      )
      .all(providerId) as LLMProviderModelRow[];
    return rows.map(toPublic);
  }
  const rows = db
    .prepare(
      'SELECT id, llm_provider_id, name, created_at FROM llm_provider_models ORDER BY created_at ASC, id ASC',
    )
    .all() as LLMProviderModelRow[];
  return rows.map(toPublic);
}

export function getModelById(id: number): PublicLLMProviderModel | null {
  const row = getDb()
    .prepare(
      'SELECT id, llm_provider_id, name, created_at FROM llm_provider_models WHERE id = ?',
    )
    .get(id) as LLMProviderModelRow | undefined;
  return row ? toPublic(row) : null;
}

export function createModel(input: CreateModelInput): RepoResult<PublicLLMProviderModel> {
  if (!providerExists(input.llm_provider_id)) {
    return { ok: false, code: 'validation', error: 'Provider not found' };
  }
  try {
    const result = getDb()
      .prepare(
        'INSERT INTO llm_provider_models (llm_provider_id, name) VALUES (?, ?)',
      )
      .run(input.llm_provider_id, input.name);
    const id = Number(result.lastInsertRowid);
    const created = getModelById(id);
    if (!created) {
      return { ok: false, code: 'not_found', error: 'Model not found after insert' };
    }
    return { ok: true, value: created };
  } catch (err) {
    return mapUniqueError(err);
  }
}

export function updateModel(id: number, input: UpdateModelInput): RepoResult<PublicLLMProviderModel> {
  const existing = getDb()
    .prepare('SELECT id, llm_provider_id, name FROM llm_provider_models WHERE id = ?')
    .get(id) as Pick<LLMProviderModelRow, 'id' | 'llm_provider_id' | 'name'> | undefined;
  if (!existing) {
    return { ok: false, code: 'not_found', error: 'Model not found' };
  }
  if (typeof input.llm_provider_id === 'number' && !providerExists(input.llm_provider_id)) {
    return { ok: false, code: 'validation', error: 'Provider not found' };
  }
  const next = {
    llm_provider_id: input.llm_provider_id ?? existing.llm_provider_id,
    name: input.name ?? existing.name,
  };
  try {
    getDb()
      .prepare(
        'UPDATE llm_provider_models SET llm_provider_id = ?, name = ? WHERE id = ?',
      )
      .run(next.llm_provider_id, next.name, id);
    const updated = getModelById(id);
    if (!updated) {
      return { ok: false, code: 'not_found', error: 'Model not found after update' };
    }
    return { ok: true, value: updated };
  } catch (err) {
    return mapUniqueError(err);
  }
}

export function deleteModel(id: number): RepoResult<true> {
  const result = getDb()
    .prepare('DELETE FROM llm_provider_models WHERE id = ?')
    .run(id);
  if (result.changes === 0) {
    return { ok: false, code: 'not_found', error: 'Model not found' };
  }
  return { ok: true, value: true };
}
