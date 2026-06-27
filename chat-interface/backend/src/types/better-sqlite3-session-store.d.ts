declare module 'better-sqlite3-session-store' {
  import type { Store, SessionData } from 'express-session';
  import type { Database as BetterSqlite3Database } from 'better-sqlite3';

  interface SqliteStoreOptions {
    client: string | BetterSqlite3Database;
    expired?: { clear: boolean; intervalMs?: number } | boolean;
    hash?: unknown;
  }

  interface SqliteStoreClass {
    new (options: SqliteStoreOptions): Store;
  }

  interface SqliteStoreFactory {
    (session: unknown): SqliteStoreClass;
  }

  const factory: SqliteStoreFactory;
  export default factory;
}
