import { Router, type Request, type Response } from 'express';
import { requireAuth, requireAdmin } from '../auth/middleware';
import {
  deleteProjectTemplate,
  getProjectTemplate,
  insertProjectTemplate,
  listProjectTemplates,
  updateProjectTemplate,
} from './projectTemplatesRepo';
import {
  parseCreateProjectTemplateBody,
  parseUpdateProjectTemplateBody,
} from './projectTemplatesValidation';

const router = Router();

function parseId(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    return null;
  }
  return n;
}

function handleRepoError(
  res: Response,
  result: { ok: false; code: string; error: string },
): boolean {
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
  res.status(200).json(listProjectTemplates());
});

router.post('/', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const parsed = parseCreateProjectTemplateBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const result = insertProjectTemplate({
    name: parsed.value.name,
    system_prompt: parsed.value.system_prompt,
    default_llm_provider_model: parsed.value.default_llm_provider_model,
    is_default: parsed.value.is_default,
  });
  if (!result.ok) {
    handleRepoError(res, result);
    return;
  }
  res.status(201).json(result.value);
});

router.get('/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const tpl = getProjectTemplate(id);
  if (!tpl) {
    res.status(404).json({ error: 'Project template not found' });
    return;
  }
  res.status(200).json(tpl);
});

router.patch('/:id', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const parsed = parseUpdateProjectTemplateBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const result = updateProjectTemplate(id, parsed.value);
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
  const result = deleteProjectTemplate(id);
  if (!result.ok) {
    handleRepoError(res, result);
    return;
  }
  res.status(204).end();
});

export default router;
