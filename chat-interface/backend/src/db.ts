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
    CREATE TABLE IF NOT EXISTS project_templates (
      id                          INTEGER PRIMARY KEY AUTOINCREMENT,
      name                        TEXT    NOT NULL,
      system_prompt               TEXT,
      default_llm_provider_model  TEXT    NOT NULL,
      is_default                  INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0,1)),
      created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  handle.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_project_templates_is_default
      ON project_templates(is_default) WHERE is_default = 1;
  `);
  handle.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id                          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id                     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name                        TEXT    NOT NULL,
      system_prompt               TEXT,
      default_llm_provider_model  TEXT    NOT NULL,
      is_user_default             INTEGER NOT NULL DEFAULT 0 CHECK (is_user_default IN (0,1)),
      created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  handle.exec(`
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
  `);
  handle.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_user_default
      ON projects(user_id) WHERE is_user_default = 1;
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
  handle.exec(`
    CREATE TABLE IF NOT EXISTS project_files (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id          INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id             INTEGER NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
      filename            TEXT    NOT NULL,
      mime_type           TEXT    NOT NULL,
      size_bytes          INTEGER NOT NULL CHECK (size_bytes >= 0),
      storage_path        TEXT    NOT NULL,
      source              TEXT    NOT NULL CHECK (source IN ('project_upload','chat_upload','llm_generated')),
      source_chat_id      INTEGER REFERENCES chats(id)         ON DELETE SET NULL,
      source_message_id   INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL,
      created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  handle.exec(`
    CREATE INDEX IF NOT EXISTS idx_project_files_project_id
      ON project_files(project_id);
  `);
  handle.exec(`
    CREATE INDEX IF NOT EXISTS idx_project_files_project_source
      ON project_files(project_id, source);
  `);
  handle.exec(`
    CREATE TABLE IF NOT EXISTS chat_message_files (
      chat_message_id  INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
      project_file_id  INTEGER NOT NULL REFERENCES project_files(id)  ON DELETE CASCADE,
      position         INTEGER NOT NULL,
      PRIMARY KEY (chat_message_id, project_file_id)
    );
  `);
  handle.exec(`
    CREATE INDEX IF NOT EXISTS idx_chat_message_files_file
      ON chat_message_files(project_file_id);
  `);
  migrateChatsAddProjectId(handle);
  migrateChatMessagesAddFileId(handle);
  migrateChatMessagesAddAttachments(handle);
  db = handle;
  return handle;
}

function hasChatMessagesFileIdColumn(handle: DbHandle): boolean {
  const row = handle
    .prepare("SELECT 1 AS present FROM pragma_table_info('chat_messages') WHERE name = 'file_id'")
    .get() as { present: number } | undefined;
  return row?.present === 1;
}

function hasChatMessagesAttachmentsColumn(handle: DbHandle): boolean {
  const row = handle
    .prepare("SELECT 1 AS present FROM pragma_table_info('chat_messages') WHERE name = 'attachments'")
    .get() as { present: number } | undefined;
  return row?.present === 1;
}

function migrateChatMessagesAddFileId(handle: DbHandle): void {
  if (hasChatMessagesFileIdColumn(handle)) {
    return;
  }
  try {
    handle.exec(`
      ALTER TABLE chat_messages ADD COLUMN file_id INTEGER
        REFERENCES project_files(id) ON DELETE SET NULL;
    `);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!/duplicate column name/i.test(message)) {
      throw err;
    }
  }
}

function migrateChatMessagesAddAttachments(handle: DbHandle): void {
  if (hasChatMessagesAttachmentsColumn(handle)) {
    return;
  }
  try {
    handle.exec(`
      ALTER TABLE chat_messages ADD COLUMN attachments TEXT;
    `);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!/duplicate column name/i.test(message)) {
      throw err;
    }
  }
}

function hasChatsProjectIdColumn(handle: DbHandle): boolean {
  const row = handle
    .prepare("SELECT 1 AS present FROM pragma_table_info('chats') WHERE name = 'project_id'")
    .get() as { present: number } | undefined;
  return row?.present === 1;
}

function hasChatsProjectIdNotNull(handle: DbHandle): boolean {
  const row = handle
    .prepare(
      "SELECT 1 AS present FROM pragma_table_info('chats') WHERE name = 'project_id' AND \"notnull\" = 1",
    )
    .get() as { present: number } | undefined;
  return row?.present === 1;
}

interface SystemFallbackSource {
  name: string;
  default_llm_provider_model: string | null;
  system_prompt: string | null;
}

function loadDefaultProjectTemplate(handle: DbHandle): SystemFallbackSource {
  const row = handle
    .prepare(
      'SELECT name, system_prompt, default_llm_provider_model FROM project_templates WHERE is_default = 1 ORDER BY id ASC LIMIT 1',
    )
    .get() as
    | {
        name: string;
        system_prompt: string | null;
        default_llm_provider_model: string;
      }
    | undefined;
  if (row) {
    return {
      name: row.name,
      system_prompt: row.system_prompt,
      default_llm_provider_model: row.default_llm_provider_model,
    };
  }
  return { name: 'Default', system_prompt: null, default_llm_provider_model: null };
}

function migrateChatsAddProjectId(handle: DbHandle): void {
  if (hasChatsProjectIdNotNull(handle)) {
    handle.exec(`
      CREATE INDEX IF NOT EXISTS idx_chats_project_id ON chats(project_id);
    `);
    return;
  }
  if (!hasChatsProjectIdColumn(handle)) {
    handle.exec(`
      ALTER TABLE chats ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;
    `);
  }
  const tx = handle.transaction(() => {
    const template = loadDefaultProjectTemplate(handle);
    const templateModel = template.default_llm_provider_model ?? '__unresolved__:__unresolved__';
    const userRows = handle
      .prepare('SELECT id FROM users')
      .all() as Array<{ id: number }>;
    for (const u of userRows) {
      const existing = handle
        .prepare(
          'SELECT id FROM projects WHERE user_id = ? AND is_user_default = 1',
        )
        .get(u.id) as { id: number } | undefined;
      if (!existing) {
        handle
          .prepare(
            `INSERT INTO projects (user_id, name, system_prompt, default_llm_provider_model, is_user_default)
             VALUES (?, ?, ?, ?, 1)`,
          )
          .run(u.id, template.name, template.system_prompt, templateModel);
      }
    }
    handle.exec(`
      UPDATE chats
        SET project_id = (
          SELECT id FROM projects
           WHERE projects.user_id = chats.user_id
             AND projects.is_user_default = 1
        )
        WHERE project_id IS NULL;
    `);
    handle.exec(`
      CREATE TABLE chats_new (
        id                          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id                     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id                  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title                       TEXT,
        default_llm_provider_model  TEXT    NOT NULL,
        created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    handle.exec(`
      INSERT INTO chats_new (id, user_id, project_id, title, default_llm_provider_model, created_at)
        SELECT id, user_id, project_id, title, default_llm_provider_model, created_at FROM chats;
    `);
    handle.exec(`DROP TABLE chats;`);
    handle.exec(`ALTER TABLE chats_new RENAME TO chats;`);
    handle.exec(`
      CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
    `);
    handle.exec(`
      CREATE INDEX IF NOT EXISTS idx_chats_project_id ON chats(project_id);
    `);
  });
  tx();
  const violations = handle.pragma('foreign_key_check') as Array<unknown>;
  if (Array.isArray(violations) && violations.length > 0) {
    console.error('foreign_key_check violations after migration:', violations);
    throw new Error('Foreign key violations detected after chats.project_id migration');
  }
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
