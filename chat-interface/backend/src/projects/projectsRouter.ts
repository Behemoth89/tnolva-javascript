import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../auth/middleware';
import {
  deleteProject,
  getProjectForUser,
  insertProject,
  listProjectsForUser,
  setUserDefaultProject,
  updateProject,
} from './projectsRepo';
import {
  parseCreateProjectBody,
  parseProjectIdParam,
  parseUpdateProjectBody,
} from './validation';
import { ensureDefaultProject } from './projectsService';

const router = Router();

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

router.get('/', requireAuth, (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  ensureDefaultProject(userId);
  res.status(200).json(listProjectsForUser(userId));
});

router.get('/default', requireAuth, (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const project = ensureDefaultProject(userId);
  res.status(200).json(project);
});

router.post('/', requireAuth, (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const parsed = parseCreateProjectBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const result = insertProject({
    user_id: userId,
    name: parsed.value.name,
    system_prompt: parsed.value.system_prompt,
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
  const id = parseProjectIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const project = getProjectForUser(id, userId);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.status(200).json(project);
});

router.patch('/:id', requireAuth, (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const id = parseProjectIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const parsed = parseUpdateProjectBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  const result = updateProject(id, userId, parsed.value);
  if (!result.ok) {
    handleRepoError(res, result);
    return;
  }
  res.status(200).json(result.value);
});

router.post('/:id/make-default', requireAuth, (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const id = parseProjectIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const result = setUserDefaultProject(id, userId);
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
  const id = parseProjectIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return;
  }
  const result = deleteProject(id, userId);
  if (!result.ok) {
    handleRepoError(res, result);
    return;
  }
  res.status(204).end();
});

export default router;
