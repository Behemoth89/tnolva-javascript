import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../auth/middleware';
import { getDb } from '../db';
import {
  createChat,
  deleteChatForUser,
  listChatsForUser,
  updateChat,
} from './chatsRepo';
import {
  parseCreateChatBody,
  parseSendMessageBody,
  parseUpdateChatBody,
} from './validation';
import {
  getChatWithMessagesForUser,
  sendMessage,
} from './chatService';
import { getProjectForUser } from '../projects/projectsRepo';
import { ensureDefaultProject } from '../projects/projectsService';

const router = Router();

function parseId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    return null;
  }
  return n;
}

function handleRepoError(res: Response, result: { ok: false; code: string; error: string }): boolean {
  if (result.ok) {
    return false;
  }
  if (result.code === 'conflict') {
    res.status(409).json({ error: result.error });
  } else if (result.code === 'not_found') {
    res.status(404).json({ error: result.error });
  } else {
    res.status(400).json({ error: result.error });
  }
  return true;
}

router.get('/models', requireAuth, (_req: Request, res: Response) => {
  const rows = getDb()
    .prepare(
      `SELECT p.name AS provider_name, m.name AS model_name, p.type AS type
         FROM llm_provider_models m
         JOIN llm_providers p ON p.id = m.llm_provider_id
         ORDER BY p.name ASC, m.name ASC`,
    )
    .all() as Array<{ provider_name: string; model_name: string; type: string }>;
  res.status(200).json(
    rows.map((r) => ({
      provider_model: `${r.provider_name}:${r.model_name}`,
      provider_name: r.provider_name,
      model_name: r.model_name,
      type: r.type,
    })),
  );
});

router.get('/', requireAuth, (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.status(200).json(listChatsForUser(userId));
});

router.post('/', requireAuth, (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const parsed = parseCreateChatBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  let projectId: number;
  if (typeof parsed.value.project_id === 'number') {
    const owned = getProjectForUser(parsed.value.project_id, userId);
    if (!owned) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    projectId = owned.id;
  } else {
    const def = ensureDefaultProject(userId);
    projectId = def.id;
  }
  const result = createChat({
    user_id: userId,
    project_id: projectId,
    title: parsed.value.title,
    default_llm_provider_model: parsed.value.default_llm_provider_model,
  });
  if (!result.ok) {
    handleRepoError(res, result);
    return;
  }
  res.status(201).json(result.value);
});

router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const data = getChatWithMessagesForUser(id, userId);
  if (!data) {
    res.status(404).json({ error: 'Chat not found' });
    return;
  }
  res.status(200).json(data);
});

router.patch('/:id', requireAuth, (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const parsed = parseUpdateChatBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const result = updateChat(id, userId, parsed.value);
  if (!result.ok) {
    handleRepoError(res, result);
    return;
  }
  res.status(200).json(result.value);
});

router.delete('/:id', requireAuth, (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const result = deleteChatForUser(id, userId);
  if (!result.ok) {
    handleRepoError(res, result);
    return;
  }
  res.status(204).end();
});

router.post('/:id/messages', requireAuth, async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const parsed = parseSendMessageBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const result = await sendMessage(userId, id, parsed.value.content, {
    providerModelOverride: parsed.value.provider_model,
  });
  if (result.kind === 'not_found') {
    res.status(404).json({ error: 'Chat not found' });
    return;
  }
  if (result.kind === 'llm_failed') {
    res.status(502).json({ error: result.error, chat: result.chat });
    return;
  }
  res.status(200).json(result.value);
});

export default router;
