import { getDb } from '../db';

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  is_admin: number;
  created_at: string;
}

export interface PublicUser {
  id: number;
  email: string;
  is_admin: number;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
}

export interface CreateUserResult {
  user: PublicUser;
  isAdmin: boolean;
}

function toPublic(row: UserRow): PublicUser {
  return { id: row.id, email: row.email, is_admin: row.is_admin };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function countUsers(): number {
  const row = getDb()
    .prepare('SELECT COUNT(*) AS c FROM users')
    .get() as { c: number } | undefined;
  return row?.c ?? 0;
}

export function findByEmail(email: string): UserRow | null {
  const normalized = normalizeEmail(email);
  const row = getDb()
    .prepare(
      'SELECT id, email, password_hash, is_admin, created_at FROM users WHERE email = ?',
    )
    .get(normalized) as UserRow | undefined;
  return row ?? null;
}

export function findById(id: number): UserRow | null {
  const row = getDb()
    .prepare(
      'SELECT id, email, password_hash, is_admin, created_at FROM users WHERE id = ?',
    )
    .get(id) as UserRow | undefined;
  return row ?? null;
}

export function createUser(input: CreateUserInput): CreateUserResult {
  const db = getDb();
  const normalized = normalizeEmail(input.email);
  const hash = input.passwordHash;
  const isFirst = countUsers() === 0;
  const isAdmin = isFirst ? 1 : 0;
  const insert = db.prepare(
    'INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, ?)',
  );
  const result = db.transaction(() => {
    return insert.run(normalized, hash, isAdmin);
  }).immediate();
  const id = Number(result.lastInsertRowid);
  return {
    user: { id, email: normalized, is_admin: isAdmin },
    isAdmin: isAdmin === 1,
  };
}

export function listUsers(): PublicUser[] {
  const rows = getDb()
    .prepare(
      'SELECT id, email, password_hash, is_admin, created_at FROM users ORDER BY created_at ASC, id ASC',
    )
    .all() as UserRow[];
  return rows.map(toPublic);
}
