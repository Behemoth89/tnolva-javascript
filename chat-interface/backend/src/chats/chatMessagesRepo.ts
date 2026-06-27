import { getDb } from '../db';

export type ChatMessageRole = 'user' | 'assistant';

export interface ChatMessageRow {
  id: number;
  chat_id: number;
  role: ChatMessageRole;
  content: string;
  provider_model: string;
  created_at: string;
}

export interface PublicChatMessage {
  id: number;
  chat_id: number;
  role: ChatMessageRole;
  content: string;
  provider_model: string;
  created_at: string;
}

export interface InsertMessageInput {
  chat_id: number;
  role: ChatMessageRole;
  content: string;
  provider_model: string;
}

function toPublic(row: ChatMessageRow): PublicChatMessage {
  return {
    id: row.id,
    chat_id: row.chat_id,
    role: row.role,
    content: row.content,
    provider_model: row.provider_model,
    created_at: row.created_at,
  };
}

export function listMessagesForChat(chatId: number): PublicChatMessage[] {
  const rows = getDb()
    .prepare(
      'SELECT id, chat_id, role, content, provider_model, created_at FROM chat_messages WHERE chat_id = ? ORDER BY created_at ASC, id ASC',
    )
    .all(chatId) as ChatMessageRow[];
  return rows.map(toPublic);
}

export function insertMessage(input: InsertMessageInput): PublicChatMessage {
  const db = getDb();
  const result = db
    .prepare(
      'INSERT INTO chat_messages (chat_id, role, content, provider_model) VALUES (?, ?, ?, ?)',
    )
    .run(input.chat_id, input.role, input.content, input.provider_model);
  const id = Number(result.lastInsertRowid);
  const row = db
    .prepare(
      'SELECT id, chat_id, role, content, provider_model, created_at FROM chat_messages WHERE id = ?',
    )
    .get(id) as ChatMessageRow;
  return toPublic(row);
}

export function loadConversation(chatId: number): PublicChatMessage[] {
  return listMessagesForChat(chatId);
}
