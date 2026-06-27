import { Router, type Request, type Response, type NextFunction } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.all('/', (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET') {
    return next();
  }
  res.setHeader('Allow', 'GET');
  res.status(405).json({ error: 'Method Not Allowed' });
});

export default router;
