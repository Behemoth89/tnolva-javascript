import { Router, type Request, type Response } from 'express';
import { requireAuth, requireAdmin } from '../auth/middleware';
import { parseProviderBody } from './validation';
import {
  createProvider,
  deleteProvider,
  getProviderById,
  listProviders,
  updateProvider,
} from './llmProvidersRepo';

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

router.get('/', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  res.status(200).json(listProviders());
});

router.get('/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const provider = getProviderById(id);
  if (!provider) {
    res.status(404).json({ error: 'Provider not found' });
    return;
  }
  res.status(200).json(provider);
});

router.post('/', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const parsed = parseProviderBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const result = createProvider(parsed.value);
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
  const parsed = parseProviderBody(req.body, { partial: true });
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const result = updateProvider(id, parsed.value);
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
  const result = deleteProvider(id);
  if (!result.ok) {
    handleRepoError(res, result);
    return;
  }
  res.status(204).end();
});

export default router;
