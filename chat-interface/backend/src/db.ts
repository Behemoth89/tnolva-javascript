import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

export type DbHandle = Database.Database;

let db: DbHandle | null = null;

export function initDb(databasePath: string): DbHandle {
  const isMemory = databasePath === ':memory:';
  const resolved = isMemory
    ? ':memory:'
    : isAbsolute(databasePath)
      ? databasePath
      : resolve(process.cwd(), databasePath);
  if (!isMemory) {
    mkdirSync(dirname(resolved), { recursive: true });
  }
  const handle = new Database(resolved);
  if (!isMemory) {
    handle.pragma('journal_mode = WAL');
  }
  handle.pragma('foreign_keys = ON');
  handle.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT    UNIQUE NOT NULL,
      password_hash TEXT    NOT NULL,
      is_admin      INTEGER NOT NULL DEFAULT 0,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  handle.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
  `);
  handle.exec(`
    CREATE TABLE IF NOT EXISTS llm_providers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    UNIQUE NOT NULL,
      url        TEXT    NOT NULL,
      api_key    TEXT    NOT NULL,
      type       TEXT    NOT NULL CHECK (type IN ('openai_completions','openai_responses','anthropic')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  handle.exec(`
    CREATE TABLE IF NOT EXISTS llm_provider_models (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      llm_provider_id INTEGER NOT NULL REFERENCES llm_providers(id) ON DELETE CASCADE,
      name            TEXT    NOT NULL,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (llm_provider_id, name)
    );
  `);
  handle.exec(`
    CREATE INDEX IF NOT EXISTS idx_llm_provider_models_provider_id
      ON llm_provider_models(llm_provider_id);
  `);
  handle.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id                          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id                     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title                       TEXT,
      default_llm_provider_model  TEXT    NOT NULL,
      created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  handle.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id         INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      role            TEXT    NOT NULL CHECK (role IN ('user','assistant')),
      content         TEXT    NOT NULL,
      provider_model  TEXT    NOT NULL,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  handle.exec(`
    CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
  `);
  handle.exec(`
    CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id
      ON chat_messages(chat_id);
  `);
  db = handle;
  return handle;
}

export function getDb(): DbHandle {
  if (!db) {
    throw new Error('Database has not been initialized. Call initDb() first.');
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
