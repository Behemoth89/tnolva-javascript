import { getDb } from '../db';

export interface ChatRow {
  id: number;
  user_id: number;
  title: string | null;
  default_llm_provider_model: string;
  created_at: string;
}

export interface PublicChat {
  id: number;
  user_id: number;
  title: string | null;
  default_llm_provider_model: string;
  created_at: string;
}

export interface CreateChatInput {
  user_id: number;
  title: string | null;
  default_llm_provider_model: string;
}

export interface UpdateChatInput {
  title?: string | null;
  default_llm_provider_model?: string;
}

export type RepoResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: 'conflict' | 'not_found' | 'validation'; error: string };

function toPublic(row: ChatRow): PublicChat {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    default_llm_provider_model: row.default_llm_provider_model,
    created_at: row.created_at,
  };
}

export function listChatsForUser(userId: number): PublicChat[] {
  const rows = getDb()
    .prepare(
      'SELECT id, user_id, title, default_llm_provider_model, created_at FROM chats WHERE user_id = ? ORDER BY created_at DESC, id DESC',
    )
    .all(userId) as ChatRow[];
  return rows.map(toPublic);
}

export function getChatByIdForUser(id: number, userId: number): PublicChat | null {
  const row = getDb()
    .prepare(
      'SELECT id, user_id, title, default_llm_provider_model, created_at FROM chats WHERE id = ? AND user_id = ?',
    )
    .get(id, userId) as ChatRow | undefined;
  return row ? toPublic(row) : null;
}

export function getChatByIdRaw(id: number): PublicChat | null {
  const row = getDb()
    .prepare(
      'SELECT id, user_id, title, default_llm_provider_model, created_at FROM chats WHERE id = ?',
    )
    .get(id) as ChatRow | undefined;
  return row ? toPublic(row) : null;
}

export function createChat(input: CreateChatInput): RepoResult<PublicChat> {
  const db = getDb();
  try {
    const result = db
      .prepare(
        'INSERT INTO chats (user_id, title, default_llm_provider_model) VALUES (?, ?, ?)',
      )
      .run(input.user_id, input.title, input.default_llm_provider_model);
    const id = Number(result.lastInsertRowid);
    const created = getChatByIdForUser(id, input.user_id);
    if (!created) {
      return { ok: false, code: 'not_found', error: 'Chat not found after insert' };
    }
    return { ok: true, value: created };
  } catch {
    return { ok: false, code: 'validation', error: 'Database error' };
  }
}

export function updateChat(
  id: number,
  userId: number,
  input: UpdateChatInput,
): RepoResult<PublicChat> {
  const existing = getChatByIdForUser(id, userId);
  if (!existing) {
    return { ok: false, code: 'not_found', error: 'Chat not found' };
  }
  const next: { title: string | null; default_llm_provider_model: string } = {
    title: input.title === undefined ? existing.title : input.title,
    default_llm_provider_model:
      input.default_llm_provider_model === undefined
        ? existing.default_llm_provider_model
        : input.default_llm_provider_model,
  };
  getDb()
    .prepare(
      'UPDATE chats SET title = ?, default_llm_provider_model = ? WHERE id = ?',
    )
    .run(next.title, next.default_llm_provider_model, id);
  const updated = getChatByIdForUser(id, userId);
  if (!updated) {
    return { ok: false, code: 'not_found', error: 'Chat not found after update' };
  }
  return { ok: true, value: updated };
}

export function deleteChatForUser(id: number, userId: number): RepoResult<true> {
  const result = getDb()
    .prepare('DELETE FROM chats WHERE id = ? AND user_id = ?')
    .run(id, userId);
  if (result.changes === 0) {
    return { ok: false, code: 'not_found', error: 'Chat not found' };
  }
  return { ok: true, value: true };
}
