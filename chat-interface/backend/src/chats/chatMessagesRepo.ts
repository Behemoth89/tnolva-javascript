import { getDb } from '../db';
import type { AssistantAttachment } from '../types/chat';

export type ChatMessageRole = 'user' | 'assistant';

export interface ChatMessageRow {
  id: number;
  chat_id: number;
  role: ChatMessageRole;
  content: string;
  provider_model: string;
  file_id: number | null;
  attachments: string | null;
  created_at: string;
}

export type { AssistantAttachment };

export interface PublicChatMessage {
  id: number;
  chat_id: number;
  role: ChatMessageRole;
  content: string;
  provider_model: string;
  file_ids: number[];
  attachments: AssistantAttachment[];
  created_at: string;
}

export interface InsertMessageInput {
  chat_id: number;
  role: ChatMessageRole;
  content: string;
  provider_model: string;
}

function parseAttachments(value: string | null): AssistantAttachment[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter(isAssistantAttachment);
    }
  } catch {
    // ignore
  }
  return [];
}

function isAssistantAttachment(value: unknown): value is AssistantAttachment {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const v = value as Record<string, unknown>;
  return typeof v.filename === 'string' && typeof v.mime_type === 'string';
}

function toPublic(row: ChatMessageRow, fileIds: number[]): PublicChatMessage {
  return {
    id: row.id,
    chat_id: row.chat_id,
    role: row.role,
    content: row.content,
    provider_model: row.provider_model,
    file_ids: fileIds,
    attachments: parseAttachments(row.attachments),
    created_at: row.created_at,
  };
}

export function listMessagesForChat(chatId: number): PublicChatMessage[] {
  const rows = getDb()
    .prepare(
      'SELECT id, chat_id, role, content, provider_model, file_id, attachments, created_at FROM chat_messages WHERE chat_id = ? ORDER BY created_at ASC, id ASC',
    )
    .all(chatId) as ChatMessageRow[];
  if (rows.length === 0) {
    return [];
  }
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');
  const joinRows = getDb()
    .prepare(
      `SELECT chat_message_id AS message_id, project_file_id AS file_id, position
         FROM chat_message_files
        WHERE chat_message_id IN (${placeholders})
        ORDER BY chat_message_id ASC, position ASC, project_file_id ASC`,
    )
    .all(...ids) as Array<{ message_id: number; file_id: number; position: number }>;
  const joinMap = new Map<number, number[]>();
  for (const r of joinRows) {
    const list = joinMap.get(r.message_id) ?? [];
    list.push(r.file_id);
    joinMap.set(r.message_id, list);
  }
  return rows.map((row) => {
    const joinIds = joinMap.get(row.id) ?? [];
    const combined: number[] = [];
    if (typeof row.file_id === 'number') {
      combined.push(row.file_id);
    }
    for (const id of joinIds) {
      if (!combined.includes(id)) {
        combined.push(id);
      }
    }
    return toPublic(row, combined);
  });
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
      'SELECT id, chat_id, role, content, provider_model, file_id, attachments, created_at FROM chat_messages WHERE id = ?',
    )
    .get(id) as ChatMessageRow;
  return toPublic(row, []);
}

export function loadConversation(chatId: number): PublicChatMessage[] {
  return listMessagesForChat(chatId);
}
