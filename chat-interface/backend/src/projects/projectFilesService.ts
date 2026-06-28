import { existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { getDb } from '../db';
import { getChatByIdRaw } from '../chats/chatsRepo';
import { listMessagesForChat } from '../chats/chatMessagesRepo';
import {
  type ListProjectFilesResult,
  type ProjectFileSource,
  type PublicProjectFile,
  deleteProjectFile as deleteProjectFileRow,
  getProjectFileById,
  getProjectFileIdsForMessages,
  getProjectFileRaw,
  insertProjectFile,
  listProjectFiles,
} from './projectFilesRepo';
import {
  commitTempToProject,
  fileExists,
  getFileSize,
  getProjectFilePath,
  readFirstBytes,
  stageTempFile,
  unlinkIfExists,
} from './storage';
import { sniffMimeType } from './mime';
import { getProjectForUser } from './projectsRepo';

export const TWENTY_FIVE_MB = 25 * 1024 * 1024;
const SNIFF_BYTES = 16 * 1024;

export interface UploadFileInput {
  projectId: number;
  userId: number;
  tempPath: string;
  originalFilename: string;
  declaredMimeType: string | null;
  source: ProjectFileSource;
  sourceChatId?: number | null;
  sourceMessageId?: number | null;
}

export interface UploadFileResult {
  file: PublicProjectFile;
  storagePath: string;
}

export function uploadFileFromTemp(input: UploadFileInput): UploadFileResult {
  if (!existsSync(input.tempPath)) {
    throw new Error('Staged file is missing');
  }
  const size = getFileSize(input.tempPath);
  if (size > TWENTY_FIVE_MB) {
    unlinkIfExists(input.tempPath);
    const err = new Error('File exceeds the 25 MB cap');
    (err as Error & { code?: string }).code = 'file_too_large';
    throw err;
  }
  const head = readFirstBytes(input.tempPath, SNIFF_BYTES);
  const sniffed = sniffMimeType(head, input.originalFilename);
  const inserted = insertProjectFile({
    project_id: input.projectId,
    user_id: input.userId,
    filename: input.originalFilename,
    mime_type: sniffed.mimeType,
    size_bytes: size,
    storage_path: '__pending__',
    source: input.source,
    source_chat_id: input.sourceChatId ?? null,
    source_message_id: input.sourceMessageId ?? null,
  });
  const finalPath = getProjectFilePath(input.projectId, inserted.id, sniffed.ext);
  try {
    commitTempToProject(input.tempPath, finalPath);
  } catch (err) {
    try {
      deleteProjectFileRow(inserted.id);
    } catch {
      // ignore
    }
    throw err;
  }
  getDb()
    .prepare(
      'UPDATE project_files SET storage_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    )
    .run(finalPath, inserted.id);
  const refreshed = getProjectFileById(inserted.id);
  if (!refreshed) {
    throw new Error('Project file missing after upload commit');
  }
  return { file: refreshed, storagePath: finalPath };
}

export function listFiles(input: {
  projectId: number;
  userId: number;
  source?: ProjectFileSource;
  limit?: number;
  offset?: number;
}): ListProjectFilesResult {
  const project = getProjectForUser(input.projectId, input.userId);
  if (!project) {
    const err = new Error('Project not found');
    (err as Error & { code?: string }).code = 'not_found';
    throw err;
  }
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
  const offset = Math.max(input.offset ?? 0, 0);
  return listProjectFiles({
    projectId: input.projectId,
    source: input.source,
    limit,
    offset,
  });
}

export interface DownloadFileResult {
  row: PublicProjectFile;
  storagePath: string;
  mimeType: string;
  filename: string;
  fileMissing: boolean;
}

export function downloadFile(input: { fileId: number; userId: number }): DownloadFileResult | null {
  const raw = getProjectFileRaw(input.fileId);
  if (!raw) {
    return null;
  }
  const project = getProjectForUser(raw.project_id, input.userId);
  if (!project) {
    return null;
  }
  const missing = !fileExists(raw.storage_path);
  return {
    row: {
      id: raw.id,
      project_id: raw.project_id,
      user_id: raw.user_id,
      filename: raw.filename,
      mime_type: raw.mime_type,
      size_bytes: raw.size_bytes,
      source: raw.source,
      source_chat_id: raw.source_chat_id,
      source_message_id: raw.source_message_id,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    },
    storagePath: raw.storage_path,
    mimeType: raw.mime_type,
    filename: raw.filename,
    fileMissing: missing,
  };
}

export function deleteFile(input: { fileId: number; userId: number }): { storagePath: string } | null {
  const raw = getProjectFileRaw(input.fileId);
  if (!raw) {
    return null;
  }
  const project = getProjectForUser(raw.project_id, input.userId);
  if (!project) {
    return null;
  }
  const result = deleteProjectFileRow(input.fileId);
  if (!result) {
    return null;
  }
  try {
    unlinkSync(result.storage_path);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      // eslint-disable-next-line no-console
      console.warn(`[project-files] failed to unlink ${result.storage_path}:`, err);
    }
  }
  return { storagePath: result.storage_path };
}

export interface AssistantAttachment {
  filename: string;
  mime_type: string;
  content_b64?: string;
  content_text?: string;
}

export function readAssistantAttachments(messageId: number): AssistantAttachment[] {
  const row = getDb()
    .prepare('SELECT attachments FROM chat_messages WHERE id = ?')
    .get(messageId) as { attachments: string | null } | undefined;
  if (!row?.attachments) {
    return [];
  }
  try {
    const parsed = JSON.parse(row.attachments) as unknown;
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

export function writeAssistantAttachments(
  messageId: number,
  attachments: AssistantAttachment[],
): void {
  const json = JSON.stringify(attachments);
  getDb()
    .prepare('UPDATE chat_messages SET attachments = ? WHERE id = ?')
    .run(json, messageId);
}

export interface SaveLlmGeneratedFileInput {
  projectId: number;
  userId: number;
  chatId: number;
  messageId: number;
  attachmentIndex: number;
}

export function saveLlmGeneratedFile(input: SaveLlmGeneratedFileInput): PublicProjectFile {
  const project = getProjectForUser(input.projectId, input.userId);
  if (!project) {
    const err = new Error('Project not found');
    (err as Error & { code?: string }).code = 'not_found';
    throw err;
  }
  const chat = getChatByIdRaw(input.chatId);
  if (!chat || chat.project_id !== input.projectId) {
    const err = new Error('Chat not found');
    (err as Error & { code?: string }).code = 'not_found';
    throw err;
  }
  const messages = listMessagesForChat(input.chatId);
  const target = messages.find((m) => m.id === input.messageId);
  if (!target) {
    const err = new Error('Message not found');
    (err as Error & { code?: string }).code = 'not_found';
    throw err;
  }
  if (target.role !== 'assistant') {
    const err = new Error('Message is not an assistant message');
    (err as Error & { code?: string }).code = 'user_message';
    throw err;
  }
  const attachments = readAssistantAttachments(target.id);
  const attachment = attachments[input.attachmentIndex];
  if (!attachment) {
    const err = new Error('Attachment not found');
    (err as Error & { code?: string }).code = 'not_found';
    throw err;
  }
  const buffer = decodeAttachmentContent(attachment);
  if (buffer.byteLength > TWENTY_FIVE_MB) {
    const err = new Error('Attachment exceeds the 25 MB cap');
    (err as Error & { code?: string }).code = 'file_too_large';
    throw err;
  }
  const tempPath = stageTempFile(attachment.filename);
  writeFileSync(tempPath, buffer);
  try {
    const result = uploadFileFromTemp({
      projectId: input.projectId,
      userId: input.userId,
      tempPath,
      originalFilename: attachment.filename,
      declaredMimeType: attachment.mime_type,
      source: 'llm_generated',
      sourceChatId: input.chatId,
      sourceMessageId: input.messageId,
    });
    return result.file;
  } catch (err) {
    unlinkIfExists(tempPath);
    throw err;
  }
}

function decodeAttachmentContent(attachment: AssistantAttachment): Buffer {
  if (typeof attachment.content_b64 === 'string') {
    return Buffer.from(attachment.content_b64, 'base64');
  }
  if (typeof attachment.content_text === 'string') {
    return Buffer.from(attachment.content_text, 'utf8');
  }
  return Buffer.alloc(0);
}

export function listFileIdsForMessages(messageIds: number[]): Map<number, number[]> {
  return getProjectFileIdsForMessages(messageIds);
}

// sniffMimeType is referenced from uploadFileFromTemp; re-export to keep import live
export { sniffMimeType };
