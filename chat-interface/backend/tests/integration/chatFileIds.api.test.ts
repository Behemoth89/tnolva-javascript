import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { newTestApp } from '../testDb';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as llmClient from '../../src/llm/client';
import type { LlmClient } from '../../src/llm/client';

const originalRoot = process.env.PROJECT_FILES_ROOT;
let tempRoot = '';
let createSpy: ReturnType<typeof jest.spyOn>;

beforeEach(() => {
  tempRoot = mkdtempSync(path.join(tmpdir(), 'file-ids-test-'));
  process.env.PROJECT_FILES_ROOT = tempRoot;
  createSpy = jest.spyOn(llmClient, 'createLlmClient');
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
  createSpy.mockRestore();
});

function stubOkClient(): LlmClient {
  return {
    async complete() {
      return {
        text: 'reply',
        usage: { inputTokens: 0, outputTokens: 0 },
        finishReason: 'stop',
        raw: { stub: true },
      };
    },
  };
}

async function seedTwoUsers() {
  const app = newTestApp();
  const admin = request.agent(app);
  await admin
    .post('/api/auth/register')
    .send({ email: 'admin-fids@example.com', password: 'correcthorse' })
    .expect(201);
  const user = request.agent(app);
  await user
    .post('/api/auth/register')
    .send({ email: 'user-fids@example.com', password: 'correcthorse' })
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

async function uploadFile(
  user: request.Agent,
  projectId: number,
  filename: string,
): Promise<number> {
  const res = await user
    .post(`/api/projects/${projectId}/files`)
    .attach('file', pngBytes(), { filename });
  expect(res.status).toBe(201);
  return res.body.id as number;
}

describe('POST /api/chats/:id/messages with file_ids (integration)', () => {
  it('records file_ids on the user message and the chat_message_files join rows', async () => {
    const { user, admin } = await seedTwoUsers();
    await seedCatalog(admin);
    const projectId = await getDefaultProjectId(user);
    const fileA = await uploadFile(user, projectId, 'a.png');
    const fileB = await uploadFile(user, projectId, 'b.png');
    const chat = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    expect(chat.status).toBe(201);
    const chatId = chat.body.id as number;
    createSpy.mockReturnValue(stubOkClient());
    const send = await user
      .post(`/api/chats/${chatId}/messages`)
      .send({ content: 'see attached', file_ids: [fileA, fileB] });
    expect(send.status).toBe(200);
    const userMsg = send.body.messages.find(
      (m: { role: string; content: string }) => m.role === 'user',
    );
    expect(userMsg.file_ids).toEqual([fileA, fileB]);
    const refetch = await user.get(`/api/chats/${chatId}`);
    const reUserMsg = refetch.body.messages.find(
      (m: { role: string }) => m.role === 'user',
    );
    expect(reUserMsg.file_ids).toEqual([fileA, fileB]);
  });

  it('returns 404 when a file_id belongs to a different project', async () => {
    const { user, admin } = await seedTwoUsers();
    await seedCatalog(admin);
    const projectA = await getDefaultProjectId(user);
    const newProject = await user
      .post('/api/projects')
      .send({ name: 'B', default_llm_provider_model: 'openai:gpt-x' });
    expect(newProject.status).toBe(201);
    const projectB = newProject.body.id as number;
    const fileInB = await uploadFile(user, projectB, 'a.png');
    const chat = await user
      .post('/api/chats')
      .send({ project_id: projectA, default_llm_provider_model: 'openai:gpt-x' });
    expect(chat.status).toBe(201);
    const chatId = chat.body.id as number;
    createSpy.mockReturnValue(stubOkClient());
    const send = await user
      .post(`/api/chats/${chatId}/messages`)
      .send({ content: 'x', file_ids: [fileInB] });
    expect(send.status).toBe(404);
    const refetch = await user.get(`/api/chats/${chatId}`);
    expect(refetch.body.messages).toEqual([]);
  });

  it('is unchanged when file_ids is omitted', async () => {
    const { user, admin } = await seedTwoUsers();
    await seedCatalog(admin);
    const projectId = await getDefaultProjectId(user);
    const chat = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const chatId = chat.body.id as number;
    createSpy.mockReturnValue(stubOkClient());
    const send = await user
      .post(`/api/chats/${chatId}/messages`)
      .send({ content: 'hi' });
    expect(send.status).toBe(200);
    const userMsg = send.body.messages.find(
      (m: { role: string }) => m.role === 'user',
    );
    expect(userMsg.file_ids).toEqual([]);
  });
});
