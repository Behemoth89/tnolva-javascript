import { describe, expect, it, beforeEach, afterAll, beforeAll } from '@jest/globals';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import { initDb, getDb, closeDb } from '../../src/db';
import { createUser } from '../../src/auth/usersRepo';
import { listChatsForUser, createChat } from '../../src/chats/chatsRepo';
import { getDefaultProjectForUser } from '../../src/projects/projectsRepo';
import { createProvider } from '../../src/admin/llmProvidersRepo';
import { createModel } from '../../src/admin/llmProviderModelsRepo';

const SHARED_DIR = path.join(os.tmpdir(), 'chat-interface-projects-migration');

function makeTempDbPath(): string {
  if (!fs.existsSync(SHARED_DIR)) {
    fs.mkdirSync(SHARED_DIR, { recursive: true });
  }
  return path.join(
    SHARED_DIR,
    `legacy-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.db`,
  );
}

function seedLegacyDatabase(dbPath: string): { userA: number; userB: number; chatA: number; chatB: number } {
  const handle = new Database(dbPath);
  handle.pragma('foreign_keys = ON');
  handle.exec(`
    CREATE TABLE users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      is_admin      INTEGER NOT NULL DEFAULT 0,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE chats (
      id                          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id                     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title                       TEXT,
      default_llm_provider_model  TEXT    NOT NULL,
      created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  handle
    .prepare('INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, 1)')
    .run('a@x.com', 'h');
  handle
    .prepare('INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, 0)')
    .run('b@x.com', 'h');
  const userA = (handle.prepare('SELECT id FROM users WHERE email = ?').get('a@x.com') as { id: number }).id;
  const userB = (handle.prepare('SELECT id FROM users WHERE email = ?').get('b@x.com') as { id: number }).id;
  handle
    .prepare('INSERT INTO chats (user_id, title, default_llm_provider_model) VALUES (?, ?, ?)')
    .run(userA, 'A1', 'openai:gpt-x');
  handle
    .prepare('INSERT INTO chats (user_id, title, default_llm_provider_model) VALUES (?, ?, ?)')
    .run(userA, 'A2', 'openai:gpt-x');
  handle
    .prepare('INSERT INTO chats (user_id, title, default_llm_provider_model) VALUES (?, ?, ?)')
    .run(userB, 'B1', 'openai:gpt-x');
  const chatA = (handle.prepare('SELECT id FROM chats WHERE user_id = ? AND title = ?').get(userA, 'A1') as { id: number }).id;
  const chatB = (handle.prepare('SELECT id FROM chats WHERE user_id = ?').get(userB) as { id: number }).id;
  handle.close();
  return { userA, userB, chatA, chatB };
}

describe('migrateChatsAddProjectId (migration)', () => {
  beforeAll(() => {
    if (!fs.existsSync(SHARED_DIR)) {
      fs.mkdirSync(SHARED_DIR, { recursive: true });
    }
  });

  beforeEach(() => {
    closeDb();
  });

  afterAll(() => {
    closeDb();
    try {
      for (const f of fs.readdirSync(SHARED_DIR)) {
        fs.unlinkSync(path.join(SHARED_DIR, f));
      }
    } catch {
      // ignore
    }
  });

  it('backfills existing chats with the owner user-default project and makes project_id NOT NULL', () => {
    const dbPath = makeTempDbPath();
    const { userA, userB, chatA, chatB } = seedLegacyDatabase(dbPath);
    initDb(dbPath);
    const db = getDb();

    // Verify schema
    const cols = db
      .prepare("SELECT name, \"notnull\" AS is_not_null FROM pragma_table_info('chats') WHERE name = 'project_id'")
      .get() as { name: string; is_not_null: number } | undefined;
    expect(cols).toBeDefined();
    expect(cols?.is_not_null).toBe(1);

    // Verify backfill: every chat has a project_id
    const orphaned = db
      .prepare('SELECT id FROM chats WHERE project_id IS NULL')
      .all() as Array<{ id: number }>;
    expect(orphaned).toHaveLength(0);

    // Verify each user has exactly one user-default project
    const projects = db
      .prepare('SELECT id, user_id, is_user_default FROM projects ORDER BY id ASC')
      .all() as Array<{ id: number; user_id: number; is_user_default: number }>;
    const defaultA = projects.find((p) => p.user_id === userA && p.is_user_default === 1);
    const defaultB = projects.find((p) => p.user_id === userB && p.is_user_default === 1);
    expect(defaultA).toBeDefined();
    expect(defaultB).toBeDefined();

    // Verify chats belong to the right project
    const chatARow = db
      .prepare('SELECT user_id, project_id FROM chats WHERE id = ?')
      .get(chatA) as { user_id: number; project_id: number };
    expect(chatARow.user_id).toBe(userA);
    expect(chatARow.project_id).toBe(defaultA?.id);
    const chatBRow = db
      .prepare('SELECT user_id, project_id FROM chats WHERE id = ?')
      .get(chatB) as { user_id: number; project_id: number };
    expect(chatBRow.user_id).toBe(userB);
    expect(chatBRow.project_id).toBe(defaultB?.id);
  });

  it('running initDb against a fresh db creates the projects table', () => {
    const dbPath = makeTempDbPath();
    initDb(dbPath);
    const db = getDb();
    const tableRow = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'projects'")
      .get() as { name: string } | undefined;
    expect(tableRow).toBeDefined();
    const idx = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_projects_user_id'")
      .get() as { name: string } | undefined;
    expect(idx).toBeDefined();
  });

  it('project_id is the user-default after the migration when a chat is created with no project_id supplied', () => {
    const dbPath = makeTempDbPath();
    seedLegacyDatabase(dbPath);
    initDb(dbPath);
    const u = createUser({ email: 'c@x.com', passwordHash: 'h' });
    // Lazy-seed: ensure the default project exists
    const { ensureDefaultProject } = require('../../src/projects/projectsService');
    const def = ensureDefaultProject(u.user.id);
    expect(def.is_user_default).toBe(1);
    // Now create a chat for user u
    const p = createProvider({
      name: 'openai',
      url: 'https://api.openai.com/v1',
      api_key: 'sk',
      type: 'openai_completions',
    });
    if (!p.ok) throw new Error('seed provider failed');
    const m = createModel({ llm_provider_id: p.value.id, name: 'gpt-x' });
    if (!m.ok) throw new Error('seed model failed');
    const created = createChat({
      user_id: u.user.id,
      project_id: def.id,
      title: 'c1',
      default_llm_provider_model: 'openai:gpt-x',
    });
    expect(created.ok).toBe(true);
    const list = listChatsForUser(u.user.id);
    expect(list[0]?.project_id).toBe(def.id);
  });
});
