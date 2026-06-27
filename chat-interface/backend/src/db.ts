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
