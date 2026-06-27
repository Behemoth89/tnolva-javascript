import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import type { Express } from 'express';
import { initDb, closeDb } from '../src/db';
import { createApp } from '../src/app';

const SHARED_TEST_DATA_DIR = path.join(os.tmpdir(), 'chat-interface-tests');

function ensureDataDir(): void {
  if (!fs.existsSync(SHARED_TEST_DATA_DIR)) {
    fs.mkdirSync(SHARED_TEST_DATA_DIR, { recursive: true });
  }
}

export function resetDatabaseForTest(): void {
  closeDb();
}

export function useTempDatabase(): void {
  closeDb();
  ensureDataDir();
  const dbPath = path.join(
    SHARED_TEST_DATA_DIR,
    `users-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.db`,
  );
  initDb(dbPath);
}

export function makeTempSessionDbPath(): string {
  ensureDataDir();
  return path.join(
    SHARED_TEST_DATA_DIR,
    `sessions-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.db`,
  );
}

export function openTempSessionDb(): Database.Database {
  return new Database(makeTempSessionDbPath());
}

export function cleanupTestArtifacts(): void {
  if (!fs.existsSync(SHARED_TEST_DATA_DIR)) {
    return;
  }
  for (const file of fs.readdirSync(SHARED_TEST_DATA_DIR)) {
    try {
      fs.unlinkSync(path.join(SHARED_TEST_DATA_DIR, file));
    } catch {
      // ignore
    }
  }
}

export function newTestApp(): Express {
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'integration-test-secret';
  process.env.COOKIE_SECURE = 'false';
  process.env.NODE_ENV = 'test';
  useTempDatabase();
  return createApp({
    sessionStoreDb: openTempSessionDb(),
    rateLimiter: { max: 10_000 },
  });
}
