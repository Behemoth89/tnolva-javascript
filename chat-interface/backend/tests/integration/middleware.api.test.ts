import request from 'supertest';
import { Router, type Request, type Response } from 'express';
import { newTestApp } from '../testDb';
import { requireAuth, requireAdmin } from '../../src/auth/middleware';

function appWithGuardedRoute() {
  const app = newTestApp();
  const router = Router();
  router.get('/protected-auth', requireAuth, (req: Request, res: Response) => {
    res.json({
      userId: req.auth?.userId,
      isAdmin: req.auth?.isAdmin,
    });
  });
  router.get('/protected-admin', requireAuth, requireAdmin, (_req: Request, res: Response) => {
    res.json({ ok: true });
  });
  app.use('/api/test', router);
  return app;
}

describe('requireAuth & requireAdmin (integration)', () => {
  it('requireAuth returns 401 for anonymous clients and does not call the handler', async () => {
    const app = appWithGuardedRoute();
    const res = await request(app).get('/api/test/protected-auth');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Not authenticated' });
  });

  it('requireAuth passes through for an authenticated client and sets req.auth', async () => {
    const app = appWithGuardedRoute();
    const a = request.agent(app);
    await a
      .post('/api/auth/register')
      .send({ email: 'auth-guard@example.com', password: 'correcthorse' })
      .expect(201);
    const res = await a.get('/api/test/protected-auth');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('userId');
    expect(res.body).toHaveProperty('isAdmin', true);
  });

  it('requireAdmin returns 401 (not 403) for anonymous clients', async () => {
    const app = appWithGuardedRoute();
    const res = await request(app).get('/api/test/protected-admin');
    expect(res.status).toBe(401);
  });

  it('requireAdmin returns 403 for a non-admin authenticated user', async () => {
    const app = appWithGuardedRoute();
    const adminSeed = request.agent(app);
    await adminSeed
      .post('/api/auth/register')
      .send({ email: 'admin-guard@example.com', password: 'correcthorse' })
      .expect(201);
    const nonAdmin = request.agent(app);
    await nonAdmin
      .post('/api/auth/register')
      .send({ email: 'non-admin-guard@example.com', password: 'correcthorse' })
      .expect(201);
    const res = await nonAdmin.get('/api/test/protected-admin');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin privileges required' });
  });

  it('requireAdmin passes through for an admin user', async () => {
    const app = appWithGuardedRoute();
    const admin = request.agent(app);
    await admin
      .post('/api/auth/register')
      .send({ email: 'admin-pass@example.com', password: 'correcthorse' })
      .expect(201);
    const res = await admin.get('/api/test/protected-admin');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
