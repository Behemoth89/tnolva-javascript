import request from 'supertest';
import { newTestApp } from '../testDb';

interface PublicModel {
  id: number;
  llm_provider_id: number;
  name: string;
  created_at: string;
}

async function seedAdminWithProvider(providerOverrides: Record<string, unknown> = {}) {
  const app = newTestApp();
  const admin = request.agent(app);
  await admin
    .post('/api/auth/register')
    .send({ email: 'admin-models@example.com', password: 'correcthorse' })
    .expect(201);
  const create = await admin
    .post('/api/admin/llm-providers')
    .send({
      name: 'p-models',
      url: 'https://example.com',
      api_key: 'k',
      type: 'openai_completions',
      ...providerOverrides,
    });
  return { app, admin, provider: create.body as { id: number; name: string } };
}

describe('GET /api/admin/llm-provider-models (integration)', () => {
  it('returns 401 for anonymous clients', async () => {
    const app = newTestApp();
    const res = await request(app).get('/api/admin/llm-provider-models');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin authenticated user', async () => {
    const { app, admin } = await seedAdminWithProvider();
    const user = request.agent(app);
    await user
      .post('/api/auth/register')
      .send({ email: 'user-models@example.com', password: 'correcthorse' })
      .expect(201);
    const res = await user.get('/api/admin/llm-provider-models');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin privileges required' });
    expect(admin).toBeDefined();
  });
});

describe('POST /api/admin/llm-provider-models (integration)', () => {
  it('admin creates a model', async () => {
    const { admin, provider } = await seedAdminWithProvider();
    const res = await admin
      .post('/api/admin/llm-provider-models')
      .send({ llm_provider_id: provider.id, name: 'gpt-4o' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ llm_provider_id: provider.id, name: 'gpt-4o' });
  });

  it('returns 400 when llm_provider_id is missing', async () => {
    const { admin } = await seedAdminWithProvider();
    const res = await admin.post('/api/admin/llm-provider-models').send({ name: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/llm_provider_id/);
  });

  it('returns 400 when llm_provider_id references a nonexistent provider', async () => {
    const { admin } = await seedAdminWithProvider();
    const res = await admin
      .post('/api/admin/llm-provider-models')
      .send({ llm_provider_id: 9999, name: 'orphan' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/provider/i);
  });

  it('returns 400 when name exceeds 128 characters', async () => {
    const { admin, provider } = await seedAdminWithProvider();
    const res = await admin
      .post('/api/admin/llm-provider-models')
      .send({ llm_provider_id: provider.id, name: 'n'.repeat(129) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/);
  });

  it('returns 409 when the same provider already has a model with that name', async () => {
    const { admin, provider } = await seedAdminWithProvider();
    await admin
      .post('/api/admin/llm-provider-models')
      .send({ llm_provider_id: provider.id, name: 'dup' })
      .expect(201);
    const res = await admin
      .post('/api/admin/llm-provider-models')
      .send({ llm_provider_id: provider.id, name: 'dup' });
    expect(res.status).toBe(409);
  });
});

describe('GET /api/admin/llm-provider-models list and filter (integration)', () => {
  it('lists all models for the admin', async () => {
    const { admin, provider } = await seedAdminWithProvider();
    await admin
      .post('/api/admin/llm-provider-models')
      .send({ llm_provider_id: provider.id, name: 'a' })
      .expect(201);
    await admin
      .post('/api/admin/llm-provider-models')
      .send({ llm_provider_id: provider.id, name: 'b' })
      .expect(201);
    const res = await admin.get('/api/admin/llm-provider-models');
    expect(res.status).toBe(200);
    const list = res.body as PublicModel[];
    expect(list).toHaveLength(2);
  });

  it('filters by provider_id when supplied', async () => {
    const { app, admin, provider: p1 } = await seedAdminWithProvider({ name: 'p1' });
    const p2 = await admin
      .post('/api/admin/llm-providers')
      .send({
        name: 'p2',
        url: 'https://example.com',
        api_key: 'k',
        type: 'anthropic',
      });
    expect(p2.status).toBe(201);
    await admin
      .post('/api/admin/llm-provider-models')
      .send({ llm_provider_id: p1.id, name: 'on-p1' })
      .expect(201);
    await admin
      .post('/api/admin/llm-provider-models')
      .send({ llm_provider_id: p2.body.id, name: 'on-p2' })
      .expect(201);
    const res = await admin.get(`/api/admin/llm-provider-models?provider_id=${p1.id}`);
    expect(res.status).toBe(200);
    const list = res.body as PublicModel[];
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('on-p1');
    expect(app).toBeDefined();
  });

  it('returns 400 for a non-positive provider_id', async () => {
    const { admin } = await seedAdminWithProvider();
    const res = await admin.get('/api/admin/llm-provider-models?provider_id=0');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/llm-provider-models/:id (integration)', () => {
  it('returns a single model for the admin', async () => {
    const { admin, provider } = await seedAdminWithProvider();
    const create = await admin
      .post('/api/admin/llm-provider-models')
      .send({ llm_provider_id: provider.id, name: 'solo' })
      .expect(201);
    const res = await admin.get(`/api/admin/llm-provider-models/${create.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('solo');
  });

  it('returns 404 for an unknown id', async () => {
    const { admin } = await seedAdminWithProvider();
    const res = await admin.get('/api/admin/llm-provider-models/9999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/admin/llm-provider-models/:id (integration)', () => {
  it('updates a model', async () => {
    const { admin, provider } = await seedAdminWithProvider();
    const create = await admin
      .post('/api/admin/llm-provider-models')
      .send({ llm_provider_id: provider.id, name: 'old' })
      .expect(201);
    const res = await admin
      .put(`/api/admin/llm-provider-models/${create.body.id}`)
      .send({ name: 'new' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('new');
  });

  it('returns 404 for an unknown id', async () => {
    const { admin } = await seedAdminWithProvider();
    const res = await admin
      .put('/api/admin/llm-provider-models/9999')
      .send({ name: 'x' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/admin/llm-provider-models/:id (integration)', () => {
  it('deletes a model and returns 204', async () => {
    const { admin, provider } = await seedAdminWithProvider();
    const create = await admin
      .post('/api/admin/llm-provider-models')
      .send({ llm_provider_id: provider.id, name: 'togo' })
      .expect(201);
    const del = await admin.delete(`/api/admin/llm-provider-models/${create.body.id}`);
    expect(del.status).toBe(204);
    const get = await admin.get(`/api/admin/llm-provider-models/${create.body.id}`);
    expect(get.status).toBe(404);
  });

  it('returns 404 for an unknown id', async () => {
    const { admin } = await seedAdminWithProvider();
    const res = await admin.delete('/api/admin/llm-provider-models/9999');
    expect(res.status).toBe(404);
  });
});
