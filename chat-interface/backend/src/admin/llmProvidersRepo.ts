import { getDb } from '../db';

export const REDACTED_API_KEY = '********';

export type LLMProviderType = 'openai_completions' | 'openai_responses' | 'anthropic';

export const LLM_PROVIDER_TYPES: readonly LLMProviderType[] = [
  'openai_completions',
  'openai_responses',
  'anthropic',
] as const;

export interface LLMProviderRow {
  id: number;
  name: string;
  url: string;
  api_key: string;
  type: LLMProviderType;
  created_at: string;
}

export interface PublicLLMProvider {
  id: number;
  name: string;
  url: string;
  api_key: string;
  type: LLMProviderType;
  created_at: string;
}

export interface CreateProviderInput {
  name: string;
  url: string;
  api_key: string;
  type: LLMProviderType;
}

export type UpdateProviderInput = Partial<CreateProviderInput>;

export type RepoResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: 'conflict' | 'not_found' | 'validation'; error: string };

function toPublic(row: LLMProviderRow): PublicLLMProvider {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    api_key: REDACTED_API_KEY,
    type: row.type,
    created_at: row.created_at,
  };
}

function mapUniqueError(err: unknown, conflictMessage: string): RepoResult<never> {
  const message = err instanceof Error ? err.message : String(err);
  if (message.toLowerCase().includes('unique')) {
    return { ok: false, code: 'conflict', error: conflictMessage };
  }
  if (message.toLowerCase().includes('foreign key') || message.toLowerCase().includes('constraint')) {
    return { ok: false, code: 'validation', error: 'Referenced row does not exist' };
  }
  return { ok: false, code: 'validation', error: 'Database error' };
}

export function listProviders(): PublicLLMProvider[] {
  const rows = getDb()
    .prepare(
      'SELECT id, name, url, api_key, type, created_at FROM llm_providers ORDER BY created_at ASC, id ASC',
    )
    .all() as LLMProviderRow[];
  return rows.map(toPublic);
}

export function getProviderById(id: number): PublicLLMProvider | null {
  const row = getDb()
    .prepare(
      'SELECT id, name, url, api_key, type, created_at FROM llm_providers WHERE id = ?',
    )
    .get(id) as LLMProviderRow | undefined;
  return row ? toPublic(row) : null;
}

export function createProvider(input: CreateProviderInput): RepoResult<PublicLLMProvider> {
  const db = getDb();
  try {
    const result = db
      .prepare(
        'INSERT INTO llm_providers (name, url, api_key, type) VALUES (?, ?, ?, ?)',
      )
      .run(input.name, input.url, input.api_key, input.type);
    const id = Number(result.lastInsertRowid);
    const created = getProviderById(id);
    if (!created) {
      return { ok: false, code: 'not_found', error: 'Provider not found after insert' };
    }
    return { ok: true, value: created };
  } catch (err) {
    return mapUniqueError(err, 'Provider name already exists');
  }
}

export function updateProvider(
  id: number,
  input: UpdateProviderInput,
): RepoResult<PublicLLMProvider> {
  const existing = getDb()
    .prepare('SELECT id FROM llm_providers WHERE id = ?')
    .get(id) as { id: number } | undefined;
  if (!existing) {
    return { ok: false, code: 'not_found', error: 'Provider not found' };
  }
  const current = getDb()
    .prepare(
      'SELECT id, name, url, api_key, type FROM llm_providers WHERE id = ?',
    )
    .get(id) as Pick<LLMProviderRow, 'id' | 'name' | 'url' | 'api_key' | 'type'>;
  const next = {
    name: input.name ?? current.name,
    url: input.url ?? current.url,
    api_key: input.api_key ?? current.api_key,
    type: input.type ?? current.type,
  };
  try {
    getDb()
      .prepare(
        'UPDATE llm_providers SET name = ?, url = ?, api_key = ?, type = ? WHERE id = ?',
      )
      .run(next.name, next.url, next.api_key, next.type, id);
    const updated = getProviderById(id);
    if (!updated) {
      return { ok: false, code: 'not_found', error: 'Provider not found after update' };
    }
    return { ok: true, value: updated };
  } catch (err) {
    return mapUniqueError(err, 'Provider name already exists');
  }
}

export function deleteProvider(id: number): RepoResult<true> {
  const result = getDb().prepare('DELETE FROM llm_providers WHERE id = ?').run(id);
  if (result.changes === 0) {
    return { ok: false, code: 'not_found', error: 'Provider not found' };
  }
  return { ok: true, value: true };
}
