import { Router, type Request, type Response } from 'express';
import { listUsers } from '../auth/usersRepo';
import { requireAuth, requireAdmin } from '../auth/middleware';

const router = Router();

router.get('/users', requireAuth, requireAdmin, (_req: Request, res: Response) => {
  const users = listUsers();
  res.status(200).json(users);
});

export default router;
