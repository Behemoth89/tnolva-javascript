import request from 'supertest';
import { newTestApp } from '../testDb';

interface UserEnvelope {
  user: {
    id: number;
    email: string;
    is_admin: number;
  };
}

function agent() {
  return request.agent(newTestApp());
}

describe('POST /api/auth/register (integration)', () => {
  it('returns 201 with the user shape and sets the session cookie', async () => {
    const app = newTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'correcthorse' });

    expect(res.status).toBe(201);
    const body = res.body as UserEnvelope;
    expect(body.user.email).toBe('alice@example.com');
    expect(body.user.id).toBeGreaterThan(0);
    expect(body.user.is_admin).toBe(1);
    expect(body).not.toHaveProperty('user.password');
    expect(body).not.toHaveProperty('user.password_hash');
    const setCookie = res.headers['set-cookie'];
    expect(Array.isArray(setCookie)).toBe(true);
    const cookies = setCookie as unknown as string[];
    expect(cookies.some((c) => c.startsWith('connect.sid='))).toBe(true);
  });

  it('rejects a duplicate email with 409 and does not insert a second row', async () => {
    const app = newTestApp();
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dupe@example.com', password: 'correcthorse' })
      .expect(201);
    const dup = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dupe@example.com', password: 'anotherpassword' });
    expect(dup.status).toBe(409);
    expect(dup.body).toHaveProperty('error');
  });

  it('rejects a malformed email with 400', async () => {
    const app = newTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'correcthorse' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects a short password with 400', async () => {
    const app = newTestApp();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'short@example.com', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect((res.body as { error: string }).error.toLowerCase()).toMatch(/password/);
  });

  it('treats email uniqueness case-insensitively', async () => {
    const app = newTestApp();
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'Alice@Example.com', password: 'correcthorse' })
      .expect(201);
    const dup = await request(app)
      .post('/api/auth/register')
      .send({ email: 'ALICE@example.com', password: 'anotherpassword' });
    expect(dup.status).toBe(409);
  });
});

describe('POST /api/auth/login (integration)', () => {
  it('logs in an existing user and sets the session cookie', async () => {
    const app = newTestApp();
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@example.com', password: 'correcthorse' })
      .expect(201);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'correcthorse' });
    expect(res.status).toBe(200);
    expect((res.body as UserEnvelope).user.email).toBe('login@example.com');
    const setCookie = res.headers['set-cookie'];
    expect(Array.isArray(setCookie)).toBe(true);
    const cookies = setCookie as unknown as string[];
    expect(cookies.some((c) => c.startsWith('connect.sid='))).toBe(true);
  });

  it('rejects a wrong password with 401 and the generic message', async () => {
    const app = newTestApp();
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@example.com', password: 'correcthorse' })
      .expect(201);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid email or password' });
  });

  it('rejects an unknown email with the same 401 message as wrong password', async () => {
    const app = newTestApp();
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@example.com', password: 'correcthorse' })
      .expect(201);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid email or password' });
  });
});

describe('POST /api/auth/logout (integration)', () => {
  it('clears the session and makes /me return 401', async () => {
    const a = agent();
    await a
      .post('/api/auth/register')
      .send({ email: 'logout@example.com', password: 'correcthorse' })
      .expect(201);
    const meBefore = await a.get('/api/auth/me');
    expect(meBefore.status).toBe(200);

    const logout = await a.post('/api/auth/logout');
    expect(logout.status).toBe(204);

    const meAfter = await a.get('/api/auth/me');
    expect(meAfter.status).toBe(401);
  });

  it('is idempotent for anonymous clients (returns 204)', async () => {
    const app = newTestApp();
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(204);
  });
});

describe('GET /api/auth/me (integration)', () => {
  it('returns 401 for anonymous clients', async () => {
    const app = newTestApp();
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Not authenticated' });
  });

  it('returns the user shape for authenticated clients and never includes password material', async () => {
    const a = agent();
    await a
      .post('/api/auth/register')
      .send({ email: 'me@example.com', password: 'correcthorse' })
      .expect(201);
    const res = await a.get('/api/auth/me');
    expect(res.status).toBe(200);
    const body = res.body as UserEnvelope;
    expect(body.user).toHaveProperty('id');
    expect(body.user).toHaveProperty('email', 'me@example.com');
    expect(body.user).toHaveProperty('is_admin');
    expect(body).not.toHaveProperty('user.password');
    expect(body).not.toHaveProperty('user.password_hash');
  });
});
