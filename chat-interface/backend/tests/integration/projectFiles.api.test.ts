import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { newTestApp } from '../testDb';
import { mkdtempSync, writeFileSync, existsSync, rmSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { getDb } from '../../src/db';
import * as llmClient from '../../src/llm/client';
import type { LlmClient } from '../../src/llm/client';

const originalRoot = process.env.PROJECT_FILES_ROOT;
let tempRoot = '';

beforeEach(() => {
  tempRoot = mkdtempSync(path.join(tmpdir(), 'files-router-test-'));
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

function openSharedDb(): Database.Database {
  const handle = getDb() as unknown as { name: string };
  return new Database(handle.name);
}

async function seedAdmin() {
  const app = newTestApp();
  const admin = request.agent(app);
  await admin
    .post('/api/auth/register')
    .send({ email: 'admin-files@example.com', password: 'correcthorse' })
    .expect(201);
  return { app, admin };
}

async function seedTwoUsers() {
  const { app, admin } = await seedAdmin();
  const user = request.agent(app);
  await user
    .post('/api/auth/register')
    .send({ email: 'user-files@example.com', password: 'correcthorse' })
    .expect(201);
  return { app, admin, user };
}

async function seedProject(user: request.Agent, name: string): Promise<number> {
  const defList = await user.get('/api/projects');
  const defProject = (defList.body as Array<{ is_user_default: number; id: number }>).find(
    (p) => p.is_user_default === 1,
  );
  if (!defProject) {
    throw new Error('No default project seeded');
  }
  return defProject.id;
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
  // 1x1 transparent PNG
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
    0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f,
    0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00,
    0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
}

describe('POST /api/projects/:id/files (integration)', () => {
  it('uploads a file and returns 201 with the persisted row', async () => {
    const { user } = await seedTwoUsers();
    await seedProject(user, 'default');
    const projectId = await seedProject(user, 'p1');
    const res = await user
      .post(`/api/projects/${projectId}/files`)
      .attach('file', pngBytes(), { filename: 'pixel.png' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      filename: 'pixel.png',
      mime_type: 'image/png',
      source: 'project_upload',
    });
    expect(res.body.id).toEqual(expect.any(Number));
    const storedPath = path.join(tempRoot, String(projectId), `${res.body.id}.png`);
    expect(existsSync(storedPath)).toBe(true);
  });

  it('returns 413 when the upload exceeds the 25 MB cap', async () => {
    const { user } = await seedTwoUsers();
    const projectId = await seedProject(user, 'p1');
    const big = Buffer.alloc(26 * 1024 * 1024, 0);
    const res = await user
      .post(`/api/projects/${projectId}/files`)
      .attach('file', big, { filename: 'big.bin' });
    expect(res.status).toBe(413);
    const dir = path.join(tempRoot, String(projectId));
    if (existsSync(dir)) {
      const entries = require('node:fs').readdirSync(dir);
      expect(entries).toEqual([]);
    }
  });

  it('returns 404 when the project belongs to a different user', async () => {
    const { admin, user } = await seedTwoUsers();
    const userProject = await seedProject(user, 'u1');
    const res = await admin
      .post(`/api/projects/${userProject}/files`)
      .attach('file', pngBytes(), { filename: 'pixel.png' });
    expect(res.status).toBe(404);
  });

  it('returns 400 when no file part is present', async () => {
    const { user } = await seedTwoUsers();
    const projectId = await seedProject(user, 'p1');
    const res = await user.post(`/api/projects/${projectId}/files`).field('source', 'project_upload');
    expect(res.status).toBe(400);
  });

  it('honors source=chat_upload in the form body', async () => {
    const { user } = await seedTwoUsers();
    const projectId = await seedProject(user, 'p1');
    const res = await user
      .post(`/api/projects/${projectId}/files`)
      .field('source', 'chat_upload')
      .attach('file', pngBytes(), { filename: 'pixel.png' });
    expect(res.status).toBe(201);
    expect(res.body.source).toBe('chat_upload');
  });
});

describe('GET /api/projects/:id/files (integration)', () => {
  it('lists project files with pagination and source filter', async () => {
    const { user } = await seedTwoUsers();
    const projectId = await seedProject(user, 'p1');
    for (let i = 0; i < 3; i += 1) {
      const res = await user
        .post(`/api/projects/${projectId}/files`)
        .attach('file', pngBytes(), { filename: `a${i}.png` });
      expect(res.status).toBe(201);
    }
    const res = await user
      .post(`/api/projects/${projectId}/files`)
      .field('source', 'chat_upload')
      .attach('file', pngBytes(), { filename: 'b.png' });
    expect(res.status).toBe(201);
    const list = await user.get(`/api/projects/${projectId}/files`);
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(4);
    const onlyChat = await user.get(`/api/projects/${projectId}/files?source=chat_upload`);
    expect(onlyChat.status).toBe(200);
    expect(onlyChat.body.items).toHaveLength(1);
    expect(onlyChat.body.items[0].source).toBe('chat_upload');
    const paged = await user.get(`/api/projects/${projectId}/files?limit=2&offset=0`);
    expect(paged.body.items).toHaveLength(2);
    expect(paged.body.limit).toBe(2);
  });

  it('returns 404 when the project is not owned by the caller', async () => {
    const { admin, user } = await seedTwoUsers();
    const userProject = await seedProject(user, 'p1');
    const res = await admin.get(`/api/projects/${userProject}/files`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/projects/files/:fileId (integration)', () => {
  it('downloads the file bytes for the owner', async () => {
    const { user } = await seedTwoUsers();
    const projectId = await seedProject(user, 'p1');
    const upload = await user
      .post(`/api/projects/${projectId}/files`)
      .attach('file', pngBytes(), { filename: 'pixel.png' });
    expect(upload.status).toBe(201);
    const fileId = upload.body.id as number;
    const download = await user.get(`/api/projects/files/${fileId}`);
    expect(download.status).toBe(200);
    expect(download.headers['content-type']).toBe('image/png');
    expect(Buffer.compare(download.body as Buffer, pngBytes())).toBe(0);
  });

  it('returns 404 when the file belongs to another user', async () => {
    const { admin, user } = await seedTwoUsers();
    const projectId = await seedProject(user, 'p1');
    const upload = await user
      .post(`/api/projects/${projectId}/files`)
      .attach('file', pngBytes(), { filename: 'pixel.png' });
    expect(upload.status).toBe(201);
    const res = await admin.get(`/api/projects/files/${upload.body.id}`);
    expect(res.status).toBe(404);
  });

  it('returns 410 when the on-disk file is missing', async () => {
    const { user } = await seedTwoUsers();
    const projectId = await seedProject(user, 'p1');
    const upload = await user
      .post(`/api/projects/${projectId}/files`)
      .attach('file', pngBytes(), { filename: 'pixel.png' });
    const fileId = upload.body.id as number;
    const stored = path.join(tempRoot, String(projectId), `${fileId}.png`);
    rmSync(stored);
    const res = await user.get(`/api/projects/files/${fileId}`);
    expect(res.status).toBe(410);
  });
});

describe('DELETE /api/projects/files/:fileId (integration)', () => {
  it('deletes the file row and the on-disk bytes', async () => {
    const { user } = await seedTwoUsers();
    const projectId = await seedProject(user, 'p1');
    const upload = await user
      .post(`/api/projects/${projectId}/files`)
      .attach('file', pngBytes(), { filename: 'pixel.png' });
    const fileId = upload.body.id as number;
    const stored = path.join(tempRoot, String(projectId), `${fileId}.png`);
    expect(existsSync(stored)).toBe(true);
    const del = await user.delete(`/api/projects/files/${fileId}`);
    expect(del.status).toBe(204);
    expect(existsSync(stored)).toBe(false);
    const get = await user.get(`/api/projects/files/${fileId}`);
    expect(get.status).toBe(404);
  });

  it('returns 404 when the file belongs to another user', async () => {
    const { admin, user } = await seedTwoUsers();
    const projectId = await seedProject(user, 'p1');
    const upload = await user
      .post(`/api/projects/${projectId}/files`)
      .attach('file', pngBytes(), { filename: 'pixel.png' });
    const res = await admin.delete(`/api/projects/files/${upload.body.id}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/projects/:id/files/from-message (integration)', () => {
  it('persists the assistant attachment as an llm_generated file', async () => {
    const { user, admin } = await seedTwoUsers();
    await seedCatalog(admin);
    const projectId = await seedProject(user, 'p1');
    const chat = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    expect(chat.status).toBe(201);
    const chatId = chat.body.id as number;
    // Seed an assistant message directly via a separate connection to the
    // same SQLite file the app uses.
    const sharedDb = openSharedDb();
    const insertMsg = sharedDb
      .prepare(
        `INSERT INTO chat_messages (chat_id, role, content, provider_model, attachments)
         VALUES (?, 'assistant', ?, ?, ?)`,
      )
      .run(chatId, 'reply', 'openai:gpt-x', JSON.stringify([
        { filename: 'spec.md', mime_type: 'text/markdown', content_text: '# Hello' },
      ]));
    const assistantMessageId = Number(insertMsg.lastInsertRowid);
    sharedDb.close();
    const res = await user
      .post(`/api/projects/${projectId}/files/from-message`)
      .send({ chat_id: chatId, message_id: assistantMessageId, attachment_index: 0 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      source: 'llm_generated',
      source_chat_id: chatId,
      source_message_id: assistantMessageId,
      mime_type: 'text/markdown',
      filename: 'spec.md',
    });
    const list = await user.get(`/api/projects/${projectId}/files?source=llm_generated`);
    expect(list.body.items).toHaveLength(1);
    const stored = path.join(tempRoot, String(projectId), `${list.body.items[0].id}.md`);
    expect(existsSync(stored)).toBe(true);
    expect(readFileSync(stored, 'utf8')).toBe('# Hello');
  });

  it('returns 404 when the chat does not belong to the project', async () => {
    const { user, admin } = await seedTwoUsers();
    await seedCatalog(admin);
    const projectA = await seedProject(user, 'a');
    const projectB = await seedProject(user, 'b');
    const chatA = await user
      .post('/api/chats')
      .send({ project_id: projectA, default_llm_provider_model: 'openai:gpt-x' });
    expect(chatA.status).toBe(201);
    const res = await user
      .post(`/api/projects/${projectB}/files/from-message`)
      .send({ chat_id: chatA.body.id, message_id: 1, attachment_index: 0 });
    expect(res.status).toBe(404);
  });

  it('returns 400 when the message is a user message', async () => {
    const { user, admin } = await seedTwoUsers();
    await seedCatalog(admin);
    const projectId = await seedProject(user, 'p1');
    const chat = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    expect(chat.status).toBe(201);
    const chatId = chat.body.id as number;
    const okClient: LlmClient = {
      async complete() {
        return {
          text: 'ok',
          usage: { inputTokens: 0, outputTokens: 0 },
          finishReason: 'stop',
          raw: {},
        };
      },
    };
    const spy = jest.spyOn(llmClient, 'createLlmClient').mockReturnValue(okClient);
    const sent = await user
      .post(`/api/chats/${chatId}/messages`)
      .send({ content: 'hi' });
    expect(sent.status).toBe(200);
    const userMessageId = (sent.body.messages as Array<{ id: number; role: string }>).find(
      (m) => m.role === 'user',
    )?.id;
    expect(userMessageId).toBeDefined();
    const res = await user
      .post(`/api/projects/${projectId}/files/from-message`)
      .send({ chat_id: chatId, message_id: userMessageId, attachment_index: 0 });
    expect(res.status).toBe(400);
    spy.mockRestore();
  });

  it('returns 404 when the project is not owned by the caller', async () => {
    const { admin, user } = await seedTwoUsers();
    const projectId = await seedProject(user, 'p1');
    const res = await admin
      .post(`/api/projects/${projectId}/files/from-message`)
      .send({ chat_id: 1, message_id: 1, attachment_index: 0 });
    expect(res.status).toBe(404);
  });

  it('returns 413 when the attachment is over the 25 MB cap', async () => {
    const { user, admin } = await seedTwoUsers();
    await seedCatalog(admin);
    const projectId = await seedProject(user, 'p1');
    const chat = await user
      .post('/api/chats')
      .send({ default_llm_provider_model: 'openai:gpt-x' });
    const chatId = chat.body.id as number;
    const sharedDb = openSharedDb();
    const big = 'x'.repeat(26 * 1024 * 1024);
    const insertMsg = sharedDb
      .prepare(
        `INSERT INTO chat_messages (chat_id, role, content, provider_model, attachments)
         VALUES (?, 'assistant', ?, ?, ?)`,
      )
      .run(chatId, 'reply', 'openai:gpt-x', JSON.stringify([
        { filename: 'big.txt', mime_type: 'text/plain', content_text: big },
      ]));
    const assistantMessageId = Number(insertMsg.lastInsertRowid);
    sharedDb.close();
    const res = await user
      .post(`/api/projects/${projectId}/files/from-message`)
      .send({ chat_id: chatId, message_id: assistantMessageId, attachment_index: 0 });
    expect(res.status).toBe(413);
  });
});
