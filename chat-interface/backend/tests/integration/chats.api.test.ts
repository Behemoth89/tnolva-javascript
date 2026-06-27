import request from 'supertest';
import { newTestApp } from '../testDb';
import * as llmClient from '../../src/llm/client';
import type { LlmClient } from '../../src/llm/client';

async function seedAdmin() {
  const app = newTestApp();
  const admin = request.agent(app);
  await admin
    .post('/api/auth/register')
    .send({ email: 'admin-chat@example.com', password: 'correcthorse' })
    .expect(201);
  return { app, admin };
}

async function seedAdminAndUser() {
  const { app, admin } = await seedAdmin();
  const user = request.agent(app);
  await user
    .post('/api/auth/register')
    .send({ email: 'user-chat@example.com', password: 'correcthorse' })
    .expect(201);
  return { app, admin, user };
}

async function seedCatalog(admin: request.Agent) {
  await admin
    .post('/api/admin/llm-providers')
    .send({
      name: 'openai',
      url: 'https://api.openai.com/v1',
      api_key: 'sk-secret-123',
      type: 'openai_completions',
    })
    .expect(201);
  const list = await admin.get('/api/admin/llm-providers');
  const providerId = (list.body as Array<{ id: number; name: string }>).find(
    (p) => p.name === 'openai',
  )?.id;
  if (!providerId) {
    throw new Error('seed catalog failed');
  }
  await admin
    .post('/api/admin/llm-provider-models')
    .send({ llm_provider_id: providerId, name: 'gpt-x' })
    .expect(201);
  await admin
    .post('/api/admin/llm-providers')
    .send({
      name: 'anthropic',
      url: 'https://api.anthropic.com/v1',
      api_key: 'sk-ant',
      type: 'anthropic',
    })
    .expect(201);
  const list2 = await admin.get('/api/admin/llm-providers');
  const anthropicId = (list2.body as Array<{ id: number; name: string }>).find(
    (p) => p.name === 'anthropic',
  )?.id;
  if (!anthropicId) {
    throw new Error('seed catalog failed');
  }
  await admin
    .post('/api/admin/llm-provider-models')
    .send({ llm_provider_id: anthropicId, name: 'claude-x' })
    .expect(201);
}

function stubClient(behavior: 'ok' | 'fail', text = 'hi back'): LlmClient {
  return {
    async complete() {
      if (behavior === 'fail') {
        throw new llmClient.LlmError({ kind: 'http', status: 500, message: 'boom' });
      }
      return {
        text,
        usage: { inputTokens: 1, outputTokens: 2 },
        finishReason: 'stop',
        raw: { stub: true },
      };
    },
  };
}

let createSpy: jest.SpyInstance;

beforeEach(() => {
  createSpy = jest.spyOn(llmClient, 'createLlmClient');
});

afterEach(() => {
  createSpy.mockRestore();
});

describe('GET /api/chats/models (integration)', () => {
  it('returns the cross product of providers and their registered models', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const res = await user.get('/api/chats/models');
    expect(res.status).toBe(200);
    const list = res.body as Array<{ provider_model: string }>;
    const models = list.map((m) => m.provider_model);
    expect(models).toContain('openai:gpt-x');
    expect(models).toContain('anthropic:claude-x');
  });

  it('returns 401 for anonymous clients', async () => {
    const app = newTestApp();
    const res = await request(app).get('/api/chats/models');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/chats (integration)', () => {
  it('returns 401 for anonymous clients', async () => {
    const app = newTestApp();
    const res = await request(app).get('/api/chats');
    expect(res.status).toBe(401);
  });

  it("returns only the caller's chats", async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const c1 = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    expect(c1.status).toBe(201);
    const c2 = await user
      .post('/api/chats')
      .send({ title: 'second', default_llm_provider_model: 'anthropic:claude-x' });
    expect(c2.status).toBe(201);
    const list = await user.get('/api/chats');
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(2);
    for (const chat of list.body as Array<{ user_id: number }>) {
      expect(chat.user_id).toBeGreaterThan(0);
    }
  });
});

describe('POST /api/chats (integration)', () => {
  it('creates a chat with title and default model', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const res = await user
      .post('/api/chats')
      .send({ title: 'New chat', default_llm_provider_model: 'openai:gpt-x' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'New chat',
      default_llm_provider_model: 'openai:gpt-x',
    });
    expect(res.body.id).toEqual(expect.any(Number));
  });

  it('returns 400 for an unknown provider_model', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const res = await user.post('/api/chats').send({ default_llm_provider_model: 'mystery:x' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for a malformed provider_model', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const res = await user.post('/api/chats').send({ default_llm_provider_model: 'no-colon' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/chats/:id (integration)', () => {
  it('returns the chat and its (empty) messages for the owner', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const create = await user
      .post('/api/chats')
      .send({ title: 'mine', default_llm_provider_model: 'openai:gpt-x' });
    expect(create.status).toBe(201);
    const id = create.body.id as number;
    const res = await user.get(`/api/chats/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.chat.id).toBe(id);
    expect(res.body.messages).toEqual([]);
  });

  it('returns 404 when called by a non-owner', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const create = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    expect(create.status).toBe(201);
    const id = create.body.id as number;
    const res = await admin.get(`/api/chats/${id}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for a missing id', async () => {
    const { user } = await seedAdminAndUser();
    const res = await user.get('/api/chats/9999');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/chats/:id (integration)', () => {
  it('updates the title', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const create = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const id = create.body.id as number;
    const res = await user.patch(`/api/chats/${id}`).send({ title: 'New title' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New title');
  });

  it('updates the default model and does not change message history', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const create = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const id = create.body.id as number;
    createSpy.mockReturnValue(stubClient('ok'));
    const sent = await user
      .post(`/api/chats/${id}/messages`)
      .send({ content: 'hi' });
    expect(sent.status).toBe(200);
    const patch = await user
      .patch(`/api/chats/${id}`)
      .send({ default_llm_provider_model: 'anthropic:claude-x' });
    expect(patch.status).toBe(200);
    expect(patch.body.default_llm_provider_model).toBe('anthropic:claude-x');
    const refetch = await user.get(`/api/chats/${id}`);
    const history = refetch.body.messages as Array<{ provider_model: string }>;
    expect(history[0]?.provider_model).toBe('openai:gpt-x');
    expect(history[1]?.provider_model).toBe('openai:gpt-x');
  });

  it('returns 400 for an empty body', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const create = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const id = create.body.id as number;
    const res = await user.patch(`/api/chats/${id}`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-owner patch', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const create = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const id = create.body.id as number;
    const res = await admin.patch(`/api/chats/${id}`).send({ title: 'hijack' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/chats/:id (integration)', () => {
  it('deletes a chat and returns 204', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const create = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const id = create.body.id as number;
    const del = await user.delete(`/api/chats/${id}`);
    expect(del.status).toBe(204);
    const get = await user.get(`/api/chats/${id}`);
    expect(get.status).toBe(404);
  });

  it('returns 404 when called by a non-owner', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const create = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const id = create.body.id as number;
    const res = await admin.delete(`/api/chats/${id}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/chats/:id/messages (integration)', () => {
  it('returns 200 with the full updated chat on success', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const create = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const id = create.body.id as number;
    createSpy.mockReturnValue(stubClient('ok', 'reply text'));
    const res = await user
      .post(`/api/chats/${id}/messages`)
      .send({ content: 'hello' });
    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(2);
    expect(res.body.messages[0].role).toBe('user');
    expect(res.body.messages[0].content).toBe('hello');
    expect(res.body.messages[0].provider_model).toBe('openai:gpt-x');
    expect(res.body.messages[1].role).toBe('assistant');
    expect(res.body.messages[1].content).toBe('reply text');
    expect(res.body.messages[1].provider_model).toBe('openai:gpt-x');
    expect(createSpy).toHaveBeenCalled();
  });

  it('returns 502 with the partial chat when the LLM fails; the user message is persisted and the assistant is not', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const create = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const id = create.body.id as number;
    createSpy.mockReturnValue(stubClient('fail'));
    const res = await user
      .post(`/api/chats/${id}/messages`)
      .send({ content: 'will-fail' });
    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/Upstream LLM failed/);
    expect(res.body.chat.messages).toHaveLength(1);
    expect(res.body.chat.messages[0].role).toBe('user');
    expect(res.body.chat.messages[0].content).toBe('will-fail');
    const refetch = await user.get(`/api/chats/${id}`);
    const stored = refetch.body.messages as Array<{ role: string }>;
    expect(stored).toHaveLength(1);
    expect(stored[0]?.role).toBe('user');
  });

  it('returns 404 for a non-owner send', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const create = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const id = create.body.id as number;
    const res = await admin
      .post(`/api/chats/${id}/messages`)
      .send({ content: 'hijack' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for empty content', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const create = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const id = create.body.id as number;
    const res = await user
      .post(`/api/chats/${id}/messages`)
      .send({ content: '' });
    expect(res.status).toBe(400);
  });

  it('honors per-message provider_model override and uses it for both rows', async () => {
    const { admin, user } = await seedAdminAndUser();
    await seedCatalog(admin);
    const create = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const id = create.body.id as number;
    createSpy.mockReturnValue(stubClient('ok'));
    const res = await user
      .post(`/api/chats/${id}/messages`)
      .send({ content: 'hi', provider_model: 'anthropic:claude-x' });
    expect(res.status).toBe(200);
    expect(res.body.messages[0].provider_model).toBe('anthropic:claude-x');
    expect(res.body.messages[1].provider_model).toBe('anthropic:claude-x');
    const chat = await user.get(`/api/chats/${id}`);
    expect(chat.body.chat.default_llm_provider_model).toBe('openai:gpt-x');
  });
});
