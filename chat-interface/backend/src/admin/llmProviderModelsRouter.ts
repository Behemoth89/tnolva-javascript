import { Router, type Request, type Response } from 'express';
import { requireAuth, requireAdmin } from '../auth/middleware';
import { parseModelBody } from './validation';
import {
  createModel,
  deleteModel,
  getModelById,
  listModels,
  updateModel,
} from './llmProviderModelsRepo';

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

router.get('/', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const raw = typeof req.query.provider_id === 'string' ? req.query.provider_id : undefined;
  if (raw !== undefined) {
    const providerId = Number(raw);
    if (!Number.isInteger(providerId) || providerId <= 0) {
      res.status(400).json({ error: 'provider_id must be a positive integer' });
      return;
    }
    res.status(200).json(listModels(providerId));
    return;
  }
  res.status(200).json(listModels());
});

router.get('/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const model = getModelById(id);
  if (!model) {
    res.status(404).json({ error: 'Model not found' });
    return;
  }
  res.status(200).json(model);
});

router.post('/', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const parsed = parseModelBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  if (typeof parsed.value.llm_provider_id !== 'number') {
    res.status(400).json({ error: 'llm_provider_id is required' });
    return;
  }
  const result = createModel({
    llm_provider_id: parsed.value.llm_provider_id,
    name: parsed.value.name,
  });
  if (!result.ok) {
    handleRepoError(res, result);
    return;
  }
  res.status(201).json(result.value);
});

router.put('/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const parsed = parseModelBody(req.body, { partial: true });
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const result = updateModel(id, {
    llm_provider_id: parsed.value.llm_provider_id,
    name: parsed.value.name,
  });
  if (!result.ok) {
    handleRepoError(res, result);
    return;
  }
  res.status(200).json(result.value);
});

router.delete('/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const result = deleteModel(id);
  if (!result.ok) {
    handleRepoError(res, result);
    return;
  }
  res.status(204).end();
});

export default router;
