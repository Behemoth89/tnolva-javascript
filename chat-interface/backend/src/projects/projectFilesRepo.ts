import { getDb } from '../db';

export type ProjectFileSource = 'project_upload' | 'chat_upload' | 'llm_generated';

export interface ProjectFileRow {
  id: number;
  project_id: number;
  user_id: number;
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  source: ProjectFileSource;
  source_chat_id: number | null;
  source_message_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface PublicProjectFile extends Omit<ProjectFileRow, 'storage_path'> {}

export interface InsertProjectFileInput {
  project_id: number;
  user_id: number;
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  source: ProjectFileSource;
  source_chat_id: number | null;
  source_message_id: number | null;
}

export interface ListProjectFilesOptions {
  projectId: number;
  source?: ProjectFileSource;
  limit: number;
  offset: number;
}

export interface ListProjectFilesResult {
  items: PublicProjectFile[];
  total: number;
}

function toPublic(row: ProjectFileRow): PublicProjectFile {
  const { storage_path: _storage, ...rest } = row;
  return rest;
}

export function insertProjectFile(input: InsertProjectFileInput): PublicProjectFile {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO project_files
         (project_id, user_id, filename, mime_type, size_bytes, storage_path, source, source_chat_id, source_message_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.project_id,
      input.user_id,
      input.filename,
      input.mime_type,
      input.size_bytes,
      input.storage_path,
      input.source,
      input.source_chat_id,
      input.source_message_id,
    );
  const id = Number(result.lastInsertRowid);
  return getProjectFileByIdOrThrow(id);
}

export function getProjectFileByIdOrThrow(id: number): PublicProjectFile {
  const row = getDb()
    .prepare(
      `SELECT id, project_id, user_id, filename, mime_type, size_bytes, storage_path, source,
              source_chat_id, source_message_id, created_at, updated_at
         FROM project_files
        WHERE id = ?`,
    )
    .get(id) as ProjectFileRow | undefined;
  if (!row) {
    throw new Error(`Project file ${id} not found`);
  }
  return toPublic(row);
}

export function getProjectFileRaw(id: number): ProjectFileRow | null {
  const row = getDb()
    .prepare(
      `SELECT id, project_id, user_id, filename, mime_type, size_bytes, storage_path, source,
              source_chat_id, source_message_id, created_at, updated_at
         FROM project_files
        WHERE id = ?`,
    )
    .get(id) as ProjectFileRow | undefined;
  return row ?? null;
}

export function getProjectFileById(id: number): PublicProjectFile | null {
  const row = getProjectFileRaw(id);
  return row ? toPublic(row) : null;
}

export function listProjectFiles(opts: ListProjectFilesOptions): ListProjectFilesResult {
  const db = getDb();
  const totalRow = opts.source
    ? (db
        .prepare('SELECT COUNT(*) AS c FROM project_files WHERE project_id = ? AND source = ?')
        .get(opts.projectId, opts.source) as { c: number })
    : (db
        .prepare('SELECT COUNT(*) AS c FROM project_files WHERE project_id = ?')
        .get(opts.projectId) as { c: number });
  const rows = (
    opts.source
      ? (db
          .prepare(
            `SELECT id, project_id, user_id, filename, mime_type, size_bytes, storage_path, source,
                    source_chat_id, source_message_id, created_at, updated_at
               FROM project_files
              WHERE project_id = ? AND source = ?
              ORDER BY created_at DESC, id DESC
              LIMIT ? OFFSET ?`,
          )
          .all(opts.projectId, opts.source, opts.limit, opts.offset) as ProjectFileRow[])
      : (db
          .prepare(
            `SELECT id, project_id, user_id, filename, mime_type, size_bytes, storage_path, source,
                    source_chat_id, source_message_id, created_at, updated_at
               FROM project_files
              WHERE project_id = ?
              ORDER BY created_at DESC, id DESC
              LIMIT ? OFFSET ?`,
          )
          .all(opts.projectId, opts.limit, opts.offset) as ProjectFileRow[])
  );
  return {
    items: rows.map(toPublic),
    total: totalRow.c,
  };
}

export function deleteProjectFile(id: number): { storage_path: string; project_id: number } | null {
  const existing = getProjectFileRaw(id);
  if (!existing) {
    return null;
  }
  getDb().prepare('DELETE FROM project_files WHERE id = ?').run(id);
  return { storage_path: existing.storage_path, project_id: existing.project_id };
}

export function attachFileToMessage(input: {
  messageId: number;
  fileId: number;
  position: number;
}): void {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO chat_message_files (chat_message_id, project_file_id, position)
       VALUES (?, ?, ?)`,
    )
    .run(input.messageId, input.fileId, input.position);
}

export function setMessageFirstFile(input: { messageId: number; fileId: number | null }): void {
  getDb()
    .prepare('UPDATE chat_messages SET file_id = ? WHERE id = ?')
    .run(input.fileId, input.messageId);
}

export function getMessageFileIds(messageId: number): number[] {
  const rows = getDb()
    .prepare(
      `SELECT project_file_id AS id, position
         FROM chat_message_files
        WHERE chat_message_id = ?
        ORDER BY position ASC, project_file_id ASC`,
    )
    .all(messageId) as Array<{ id: number; position: number }>;
  return rows.map((r) => r.id);
}

export function getProjectFileIdsForMessages(messageIds: number[]): Map<number, number[]> {
  const map = new Map<number, number[]>();
  if (messageIds.length === 0) {
    return map;
  }
  const placeholders = messageIds.map(() => '?').join(',');
  const rows = getDb()
    .prepare(
      `SELECT chat_message_id AS message_id, project_file_id AS file_id, position
         FROM chat_message_files
        WHERE chat_message_id IN (${placeholders})
        ORDER BY chat_message_id ASC, position ASC, project_file_id ASC`,
    )
    .all(...messageIds) as Array<{ message_id: number; file_id: number; position: number }>;
  for (const r of rows) {
    const list = map.get(r.message_id) ?? [];
    list.push(r.file_id);
    map.set(r.message_id, list);
  }
  return map;
}
