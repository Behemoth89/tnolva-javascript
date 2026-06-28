import { Router, type Request, type Response } from 'express';
import { listUsers } from '../auth/usersRepo';
import { requireAuth, requireAdmin } from '../auth/middleware';
import llmProvidersRouter from './llmProvidersRouter';
import llmProviderModelsRouter from './llmProviderModelsRouter';
import projectTemplatesRouter from './projectTemplatesRouter';

const router = Router();

router.get('/users', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  const users = listUsers();
  res.status(200).json(users);
});

router.use('/llm-providers', llmProvidersRouter);
router.use('/llm-provider-models', llmProviderModelsRouter);
router.use('/project-templates', projectTemplatesRouter);

export default router;
