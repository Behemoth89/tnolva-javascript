import type { ProjectFileSource } from './projectFilesRepo';
import type { ValidationResult } from '../chats/validation';

export type FileSource = ProjectFileSource;

export const FILE_SOURCES: ReadonlyArray<ProjectFileSource> = [
  'project_upload',
  'chat_upload',
  'llm_generated',
];

const UPLOADABLE_SOURCES: ReadonlyArray<Extract<ProjectFileSource, 'project_upload' | 'chat_upload'>> = [
  'project_upload',
  'chat_upload',
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function validateFilePart(
  part: unknown,
): ValidationResult<{ originalname: string; buffer: Buffer; size: number }> {
  if (!isPlainObject(part)) {
    return { ok: false, error: 'No file part in upload' };
  }
  if (typeof part.originalname !== 'string' || part.originalname.length === 0) {
    return { ok: false, error: 'Missing file name' };
  }
  if (!Buffer.isBuffer(part.buffer)) {
    return { ok: false, error: 'Missing file bytes' };
  }
  if (typeof part.size !== 'number' || part.size < 0) {
    return { ok: false, error: 'Invalid file size' };
  }
  return {
    ok: true,
    value: {
      originalname: part.originalname,
      buffer: part.buffer,
      size: part.size,
    },
  };
}

export function validateFileIds(
  value: unknown,
): ValidationResult<number[]> {
  if (!Array.isArray(value)) {
    return { ok: false, error: 'file_ids must be an array' };
  }
  const out: number[] = [];
  for (const raw of value) {
    if (typeof raw !== 'number' || !Number.isInteger(raw) || raw <= 0) {
      return { ok: false, error: 'file_ids entries must be positive integers' };
    }
    out.push(raw);
  }
  return { ok: true, value: out };
}

export function validateSaveFromMessageBody(
  body: unknown,
): ValidationResult<{ chatId: number; messageId: number; attachmentIndex: number }> {
  if (!isPlainObject(body)) {
    return { ok: false, error: 'Request body must be a JSON object' };
  }
  const { chat_id, message_id, attachment_index } = body;
  if (typeof chat_id !== 'number' || !Number.isInteger(chat_id) || chat_id <= 0) {
    return { ok: false, error: 'chat_id must be a positive integer' };
  }
  if (typeof message_id !== 'number' || !Number.isInteger(message_id) || message_id <= 0) {
    return { ok: false, error: 'message_id must be a positive integer' };
  }
  if (
    typeof attachment_index !== 'number' ||
    !Number.isInteger(attachment_index) ||
    attachment_index < 0
  ) {
    return { ok: false, error: 'attachment_index must be a non-negative integer' };
  }
  return {
    ok: true,
    value: {
      chatId: chat_id,
      messageId: message_id,
      attachmentIndex: attachment_index,
    },
  };
}

export function validateSource(
  raw: unknown,
): ValidationResult<Extract<ProjectFileSource, 'project_upload' | 'chat_upload'>> {
  if (raw === undefined || raw === null || raw === '') {
    return { ok: true, value: 'project_upload' };
  }
  if (typeof raw !== 'string') {
    return { ok: false, error: 'source must be a string' };
  }
  if ((UPLOADABLE_SOURCES as ReadonlyArray<string>).includes(raw)) {
    return { ok: true, value: raw as Extract<ProjectFileSource, 'project_upload' | 'chat_upload'> };
  }
  return { ok: false, error: 'source must be one of project_upload, chat_upload' };
}

export function isProjectFileSource(value: unknown): value is ProjectFileSource {
  return typeof value === 'string' && (FILE_SOURCES as ReadonlyArray<string>).includes(value);
}
