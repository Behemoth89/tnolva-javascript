import request from 'supertest';
import { newTestApp } from '../testDb';

interface AdminUser {
  id: number;
  email: string;
  is_admin: number;
  created_at?: string;
}

describe('GET /api/admin/users (integration)', () => {
  it('returns 401 for anonymous clients', async () => {
    const app = newTestApp();
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('returns 403 for an authenticated non-admin user', async () => {
    const app = newTestApp();
    const adminAgent = request.agent(app);
    await adminAgent
      .post('/api/auth/register')
      .send({ email: 'admin-seed@example.com', password: 'correcthorse' })
      .expect(201);
    const nonAdmin = request.agent(app);
    await nonAdmin
      .post('/api/auth/register')
      .send({ email: 'non-admin@example.com', password: 'correcthorse' })
      .expect(201);
    const res = await nonAdmin.get('/api/admin/users');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin privileges required' });
  });

  it('returns 200 with a user list for the admin, ordered by creation, with no password material', async () => {
    const app = newTestApp();
    const a = request.agent(app);
    await a
      .post('/api/auth/register')
      .send({ email: 'admin@example.com', password: 'correcthorse' })
      .expect(201);
    await new Promise((r) => setTimeout(r, 25));
    const b = request.agent(app);
    await b
      .post('/api/auth/register')
      .send({ email: 'user2@example.com', password: 'correcthorse' })
      .expect(201);

    const res = await a.get('/api/admin/users');
    expect(res.status).toBe(200);
    const list = res.body as AdminUser[];
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(2);
    for (const u of list) {
      expect(u).toHaveProperty('id');
      expect(u).toHaveProperty('email');
      expect(u).toHaveProperty('is_admin');
      expect(u).not.toHaveProperty('password');
      expect(u).not.toHaveProperty('password_hash');
    }
    const emails = list.map((u) => u.email);
    expect(emails).toEqual(['admin@example.com', 'user2@example.com']);
  });
});
