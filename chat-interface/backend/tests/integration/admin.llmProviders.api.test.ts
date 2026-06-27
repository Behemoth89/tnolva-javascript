import request from 'supertest';
import { newTestApp } from '../testDb';

interface PublicProvider {
  id: number;
  name: string;
  url: string;
  api_key: string;
  type: string;
  created_at: string;
}

async function seedAdmin() {
  const app = newTestApp();
  const admin = request.agent(app);
  await admin
    .post('/api/auth/register')
    .send({ email: 'admin-llm@example.com', password: 'correcthorse' })
    .expect(201);
  return { app, admin };
}

async function seedAdminAndUser() {
  const { app, admin } = await seedAdmin();
  const user = request.agent(app);
  await user
    .post('/api/auth/register')
    .send({ email: 'regular-llm@example.com', password: 'correcthorse' })
    .expect(201);
  return { app, admin, user };
}

describe('GET /api/admin/llm-providers (integration)', () => {
  it('returns 401 for anonymous clients', async () => {
    const app = newTestApp();
    const res = await request(app).get('/api/admin/llm-providers');
    expect(res.status).toBe(401);
  });

  it('returns 403 for an authenticated non-admin user', async () => {
    const { user } = await seedAdminAndUser();
    const res = await user.get('/api/admin/llm-providers');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin privileges required' });
  });
});

describe('POST /api/admin/llm-providers (integration)', () => {
  it('admin creates a provider; api_key is omitted from the response', async () => {
    const { admin } = await seedAdmin();
    const res = await admin
      .post('/api/admin/llm-providers')
      .send({
        name: 'openai-prod',
        url: 'https://api.openai.com/v1',
        api_key: 'sk-secret-xyz',
        type: 'openai_completions',
      });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'openai-prod',
      url: 'https://api.openai.com/v1',
      type: 'openai_completions',
    });
    expect(res.body.id).toEqual(expect.any(Number));
    expect(res.body.created_at).toEqual(expect.any(String));
    expect(JSON.stringify(res.body)).not.toContain('sk-secret-xyz');
  });

  it('returns 400 for an unknown type', async () => {
    const { admin } = await seedAdmin();
    const res = await admin
      .post('/api/admin/llm-providers')
      .send({
        name: 'bad',
        url: 'https://example.com',
        api_key: 'k',
        type: 'bogus_provider',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/type/i);
  });

  it('returns 400 when api_key exceeds 512 characters', async () => {
    const { admin } = await seedAdmin();
    const res = await admin
      .post('/api/admin/llm-providers')
      .send({
        name: 'longkey',
        url: 'https://example.com',
        api_key: 'x'.repeat(513),
        type: 'openai_completions',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/api_key/);
  });

  it('returns 400 when name exceeds 128 characters', async () => {
    const { admin } = await seedAdmin();
    const res = await admin
      .post('/api/admin/llm-providers')
      .send({
        name: 'n'.repeat(129),
        url: 'https://example.com',
        api_key: 'k',
        type: 'openai_completions',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/);
  });

  it('returns 400 when required fields are missing', async () => {
    const { admin } = await seedAdmin();
    const res = await admin.post('/api/admin/llm-providers').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
  });

  it('returns 409 when the name is already in use', async () => {
    const { admin } = await seedAdmin();
    await admin
      .post('/api/admin/llm-providers')
      .send({
        name: 'dup',
        url: 'https://example.com',
        api_key: 'k1',
        type: 'anthropic',
      })
      .expect(201);
    const res = await admin
      .post('/api/admin/llm-providers')
      .send({
        name: 'dup',
        url: 'https://example.com',
        api_key: 'k2',
        type: 'anthropic',
      });
    expect(res.status).toBe(409);
  });
});

describe('GET /api/admin/llm-providers/:id (integration)', () => {
  it('returns the provider with redacted api_key for an admin', async () => {
    const { admin } = await seedAdmin();
    const create = await admin
      .post('/api/admin/llm-providers')
      .send({
        name: 'p1',
        url: 'https://example.com',
        api_key: 'sk-secret',
        type: 'openai_responses',
      })
      .expect(201);
    const res = await admin.get(`/api/admin/llm-providers/${create.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('p1');
    expect(res.body.api_key).toBe('********');
    expect(JSON.stringify(res.body)).not.toContain('sk-secret');
  });

  it('returns 404 for an unknown id', async () => {
    const { admin } = await seedAdmin();
    const res = await admin.get('/api/admin/llm-providers/9999');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/admin/llm-providers list (integration)', () => {
  it('lists providers with redacted api_key and no plaintext', async () => {
    const { admin } = await seedAdmin();
    await admin
      .post('/api/admin/llm-providers')
      .send({
        name: 'a',
        url: 'https://example.com/a',
        api_key: 'sk-aaaa',
        type: 'openai_completions',
      })
      .expect(201);
    await admin
      .post('/api/admin/llm-providers')
      .send({
        name: 'b',
        url: 'https://example.com/b',
        api_key: 'sk-bbbb',
        type: 'anthropic',
      })
      .expect(201);
    const res = await admin.get('/api/admin/llm-providers');
    expect(res.status).toBe(200);
    const list = res.body as PublicProvider[];
    expect(list).toHaveLength(2);
    for (const p of list) {
      expect(p.api_key).toBe('********');
    }
    expect(JSON.stringify(res.body)).not.toContain('sk-aaaa');
    expect(JSON.stringify(res.body)).not.toContain('sk-bbbb');
  });
});

describe('PUT /api/admin/llm-providers/:id (integration)', () => {
  it('updates a provider and preserves the existing api_key when omitted', async () => {
    const { admin } = await seedAdmin();
    const create = await admin
      .post('/api/admin/llm-providers')
      .send({
        name: 'rename',
        url: 'https://example.com',
        api_key: 'sk-original',
        type: 'openai_completions',
      })
      .expect(201);
    const res = await admin
      .put(`/api/admin/llm-providers/${create.body.id}`)
      .send({ name: 'renamed' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('renamed');
    expect(res.body.api_key).toBe('********');
  });

  it('returns 404 when updating an unknown id', async () => {
    const { admin } = await seedAdmin();
    const res = await admin
      .put('/api/admin/llm-providers/9999')
      .send({ name: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/admin/llm-providers/:id (integration)', () => {
  it('deletes a provider and returns 204', async () => {
    const { admin } = await seedAdmin();
    const create = await admin
      .post('/api/admin/llm-providers')
      .send({
        name: 'togo',
        url: 'https://example.com',
        api_key: 'k',
        type: 'anthropic',
      })
      .expect(201);
    const del = await admin.delete(`/api/admin/llm-providers/${create.body.id}`);
    expect(del.status).toBe(204);
    const get = await admin.get(`/api/admin/llm-providers/${create.body.id}`);
    expect(get.status).toBe(404);
  });

  it('returns 404 when deleting an unknown id', async () => {
    const { admin } = await seedAdmin();
    const res = await admin.delete('/api/admin/llm-providers/9999');
    expect(res.status).toBe(404);
  });
});
