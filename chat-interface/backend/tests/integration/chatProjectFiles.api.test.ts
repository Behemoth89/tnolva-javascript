import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { newTestApp } from '../testDb';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as llmClient from '../../src/llm/client';
import type { LlmClient, LlmRequest } from '../../src/llm/client';

const originalRoot = process.env.PROJECT_FILES_ROOT;
let tempRoot = '';

beforeEach(() => {
  tempRoot = mkdtempSync(path.join(tmpdir(), 'pfiles-test-'));
  process.env.PROJECT_FILES_ROOT = tempRoot;
});

afterEach(() => {
  if (originalRoot === undefined) {
    delete process.env.PROJECT_FILES_ROOT;
  } else {
    process.env.PROJECT_FILES_ROOT = originalRoot;
  }
  if (tempRoot) {
    rmSync(tempRoot, { force: true, recursive: true });
  }
});

async function seedTwoUsers() {
  const app = newTestApp();
  const admin = request.agent(app);
  await admin
    .post('/api/auth/register')
    .send({ email: 'admin-pfiles@example.com', password: 'correcthorse' })
    .expect(201);
  const user = request.agent(app);
  await user
    .post('/api/auth/register')
    .send({ email: 'user-pfiles@example.com', password: 'correcthorse' })
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
}

function pngBytes(): Buffer {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
    0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f,
    0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00,
    0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
}

function txtBytes(text: string): Buffer {
  return Buffer.from(text, 'utf8');
}

async function getDefaultProjectId(user: request.Agent): Promise<number> {
  const list = await user.get('/api/projects');
  const def = (list.body as Array<{ is_user_default: number; id: number }>).find(
    (p) => p.is_user_default === 1,
  );
  if (!def) {
    throw new Error('No default project');
  }
  return def.id;
}

function createSpy() {
  return jest.spyOn(llmClient, 'createLlmClient');
}

function capturedClient(captured: { current: LlmRequest | null }): LlmClient {
  return {
    async complete(req) {
      captured.current = req;
      return {
        text: 'ok',
        usage: { inputTokens: 0, outputTokens: 0 },
        finishReason: 'stop',
        raw: { stub: true },
      };
    },
  };
}

describe('LlmRequest.projectFiles (integration)', () => {
  it('populates projectFiles when the project has files', async () => {
    const { user, admin } = await seedTwoUsers();
    await seedCatalog(admin);
    const projectId = await getDefaultProjectId(user);
    // Upload a text file and a binary file
    await user
      .post(`/api/projects/${projectId}/files`)
      .attach('file', txtBytes('hello world'), { filename: 'note.txt' })
      .expect(201);
    await user
      .post(`/api/projects/${projectId}/files`)
      .attach('file', pngBytes(), { filename: 'pixel.png' })
      .expect(201);
    const chat = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const chatId = chat.body.id as number;
    const captured: { current: LlmRequest | null } = { current: null };
    const spy = createSpy();
    spy.mockReturnValue(capturedClient(captured));
    const send = await user
      .post(`/api/chats/${chatId}/messages`)
      .send({ content: 'hi' });
    expect(send.status).toBe(200);
    expect(captured.current).not.toBeNull();
    const projectFiles = captured.current?.projectFiles ?? [];
    // The PNG is binary and is skipped, the TXT is text and is included.
    expect(projectFiles).toHaveLength(1);
    expect(projectFiles[0]?.mimeType).toBe('text/plain');
    expect(projectFiles[0]?.contentText).toBe('hello world');
  });

  it('leaves projectFiles empty when the project has no files', async () => {
    const { user, admin } = await seedTwoUsers();
    await seedCatalog(admin);
    const chat = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const chatId = chat.body.id as number;
    const captured: { current: LlmRequest | null } = { current: null };
    const spy = createSpy();
    spy.mockReturnValue(capturedClient(captured));
    const send = await user
      .post(`/api/chats/${chatId}/messages`)
      .send({ content: 'hi' });
    expect(send.status).toBe(200);
    expect(captured.current?.projectFiles).toEqual([]);
  });

  it('does NOT forward projectFiles to the upstream request body', async () => {
    // Use the OpenAI completions client directly to assert that its body
    // does not contain projectFiles (it never should). This guards the
    // provider-client comment about projectFiles being opaque.
    const { user, admin } = await seedTwoUsers();
    await seedCatalog(admin);
    const projectId = await getDefaultProjectId(user);
    await user
      .post(`/api/projects/${projectId}/files`)
      .attach('file', txtBytes('secret content'), { filename: 'note.txt' })
      .expect(201);
    const chat = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const chatId = chat.body.id as number;
    const captured: { current: LlmRequest | null } = { current: null };
    const spy = createSpy();
    spy.mockReturnValue(capturedClient(captured));
    const send = await user
      .post(`/api/chats/${chatId}/messages`)
      .send({ content: 'hi' });
    expect(send.status).toBe(200);
    expect(captured.current?.projectFiles?.length ?? 0).toBeGreaterThan(0);
    // The captured request represents what the chat service passes; provider
    // clients extract only model / system / messages / temperature / maxTokens.
    // Assert that the property exists on the request (it does) but the
    // provider-side body shape does not include it: do a direct client test.
    const { OpenAICompletionsClient } = await import('../../src/llm/openaiCompletions');
    const directClient = new OpenAICompletionsClient();
    let upstreamBody: unknown = null;
    const fetchStub: typeof fetch = async (_url, init) => {
      upstreamBody = JSON.parse(init?.body as string) as unknown;
      return new Response(
        JSON.stringify({
          id: 'x',
          choices: [{ message: { content: 'ok' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 0, completion_tokens: 0 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    };
    await directClient.complete(
      {
        model: 'gpt-x',
        messages: [{ role: 'user', content: 'hi' }],
        projectFiles: [
          {
            fileId: 1,
            filename: 'note.txt',
            mimeType: 'text/plain',
            contentText: 'secret content',
          },
        ],
      },
      { url: 'https://api.openai.com/v1', apiKey: 'sk-test', fetchImpl: fetchStub },
    );
    const body = upstreamBody as Record<string, unknown> | null;
    expect(body).not.toBeNull();
    if (body) {
      expect(body.projectFiles).toBeUndefined();
      expect(JSON.stringify(body)).not.toMatch(/secret content/);
    }
  });
});
