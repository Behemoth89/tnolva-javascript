import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import { requireAuth } from '../auth/middleware';
import { TWENTY_FIVE_MB, deleteFile, downloadFile, listFiles, saveLlmGeneratedFile, uploadFileFromTemp } from './projectFilesService';
import { getProjectForUser } from './projectsRepo';
import { stageTempFile } from './storage';
import { validateFilePart, validateSaveFromMessageBody, validateSource } from './filesValidation';
import { extname } from 'node:path';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(process.cwd(), 'backend', 'data', 'project-files', '_tmp'));
    },
    filename: (_req, file, cb) => {
      try {
        const tempPath = stageTempFile(file.originalname);
        cb(null, path.basename(tempPath));
      } catch (err) {
        cb(err as Error, '');
      }
    },
  }),
  limits: { fileSize: TWENTY_FIVE_MB },
});

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeExt(filename: string): string {
  return extname(filename).toLowerCase();
}

function projectNotFound(res: Response): void {
  res.status(404).json({ error: 'Project not found' });
}

router.post(
  '/:id/files',
  requireAuth,
  (req, res, next) => {
    upload.single('file')(req, res, (err: unknown) => {
      if (err) {
        const code = (err as { code?: string }).code;
        if (code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({ error: 'File exceeds the 25 MB cap' });
          return;
        }
        res.status(400).json({ error: (err as Error).message ?? 'Upload failed' });
        return;
      }
      next();
    });
  },
  (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (typeof userId !== 'number') {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: 'id must be a positive integer' });
      return;
    }
    const project = getProjectForUser(id, userId);
    if (!project) {
      projectNotFound(res);
      return;
    }
    const sourceValidation = validateSource(isPlainObject(req.body) ? req.body.source : undefined);
    if (!sourceValidation.ok) {
      res.status(400).json({ error: sourceValidation.error });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'file part is required' });
      return;
    }
    const partValidation = validateFilePart({
      originalname: req.file.originalname,
      buffer: req.file.buffer ?? (req.file as unknown as { path?: string }).path,
      size: req.file.size,
    });
    let tempPath: string | null = null;
    let originalName = req.file.originalname;
    if (req.file.path) {
      tempPath = req.file.path;
    }
    if (partValidation.ok) {
      originalName = partValidation.value.originalname;
    }
    if (!tempPath) {
      res.status(400).json({ error: 'file bytes are missing' });
      return;
    }
    try {
      const result = uploadFileFromTemp({
        projectId: project.id,
        userId,
        tempPath,
        originalFilename: originalName,
        declaredMimeType: req.file.mimetype ?? null,
        source: sourceValidation.value,
      });
      res.status(201).json({
        ...result.file,
        _unused_ext: safeExt(result.file.filename),
      });
    } catch (err) {
      const code = (err as Error & { code?: string }).code;
      if (code === 'file_too_large') {
        res.status(413).json({ error: (err as Error).message });
        return;
      }
      res.status(500).json({ error: 'Failed to save file' });
    }
  },
);

router.get('/:id/files', requireAuth, (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const project = getProjectForUser(id, userId);
  if (!project) {
    projectNotFound(res);
    return;
  }
  const source = typeof req.query.source === 'string' ? req.query.source : undefined;
  const limit = req.query.limit !== undefined ? Number(req.query.limit) : undefined;
  const offset = req.query.offset !== undefined ? Number(req.query.offset) : undefined;
  try {
    const result = listFiles({
      projectId: project.id,
      userId,
      source: source as never,
      limit: Number.isFinite(limit) ? (limit as number) : undefined,
      offset: Number.isFinite(offset) ? (offset as number) : undefined,
    });
    res.status(200).json({
      items: result.items,
      total: result.total,
      limit: Math.min(Math.max(limit ?? 50, 1), 200),
      offset: Math.max(offset ?? 0, 0),
    });
  } catch (err) {
    const code = (err as Error & { code?: string }).code;
    if (code === 'not_found') {
      projectNotFound(res);
      return;
    }
    res.status(500).json({ error: 'Failed to list files' });
  }
});

router.get('/files/:fileId', requireAuth, (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const fileId = Number(req.params.fileId);
  if (!Number.isInteger(fileId) || fileId <= 0) {
    res.status(400).json({ error: 'fileId must be a positive integer' });
    return;
  }
  const result = downloadFile({ fileId, userId });
  if (!result) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  if (result.fileMissing) {
    res.status(410).json({ error: 'File bytes are missing on disk' });
    return;
  }
  const encodedFilename = encodeURIComponent(result.filename);
  res.setHeader('Content-Type', result.mimeType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodedFilename}`,
  );
  res.sendFile(result.storagePath, (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'Failed to read file bytes' });
    }
  });
});

router.delete('/files/:fileId', requireAuth, (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const fileId = Number(req.params.fileId);
  if (!Number.isInteger(fileId) || fileId <= 0) {
    res.status(400).json({ error: 'fileId must be a positive integer' });
    return;
  }
  const result = deleteFile({ fileId, userId });
  if (!result) {
    res.status(404).json({ error: 'File not found' });
    return;
  }
  res.status(204).end();
});

router.post('/:id/files/from-message', requireAuth, (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const project = getProjectForUser(id, userId);
  if (!project) {
    projectNotFound(res);
    return;
  }
  const parsed = validateSaveFromMessageBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  try {
    const file = saveLlmGeneratedFile({
      projectId: project.id,
      userId,
      chatId: parsed.value.chatId,
      messageId: parsed.value.messageId,
      attachmentIndex: parsed.value.attachmentIndex,
    });
    res.status(201).json(file);
  } catch (err) {
    const code = (err as Error & { code?: string }).code;
    if (code === 'file_too_large') {
      res.status(413).json({ error: (err as Error).message });
      return;
    }
    if (code === 'not_found') {
      res.status(404).json({ error: (err as Error).message });
      return;
    }
    if (code === 'user_message') {
      res.status(400).json({ error: (err as Error).message });
      return;
    }
    res.status(500).json({ error: 'Failed to save LLM-generated file' });
  }
});

export default router;
