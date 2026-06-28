import express, { type Express } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import Database from 'better-sqlite3';
import SqliteStoreFactory from 'better-sqlite3-session-store';
import healthRouter from './routes/health';
import authRouter from './auth/router';
import adminRouter from './admin/router';
import chatsRouter from './chats/chatsRouter';
import projectsRouter from './projects/projectsRouter';
import filesRouter from './projects/filesRouter';
import { config } from './config';
import { authRateLimiter, createAuthRateLimiter } from './auth/rateLimit';
import { ensureProjectFilesRoot } from './projects/tempSweep';
import { setProjectFileAccess } from './projects/container';
import { WholeFileProjectFileAccess } from './projects/wholeFileProjectFileAccess';

function createSessionStoreDb(): Database.Database {
  const dir = path.join(process.cwd(), 'backend', 'data');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const dbPath = path.join(dir, 'sessions.db');
  return new Database(dbPath);
}

export interface CreateAppOptions {
  sessionStoreDb?: Database.Database;
  rateLimiter?: { windowMs?: number; max?: number } | null;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const app = express();
  setProjectFileAccess(new WholeFileProjectFileAccess());

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const allowedOrigins = config.frontendOrigin
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );

  app.use(express.json());

  const sessionDb = options.sessionStoreDb ?? createSessionStoreDb();
  const SqliteStore = SqliteStoreFactory(session);
  const sessionStore = new SqliteStore({
    client: sessionDb,
    expired: { clear: true, intervalMs: 15 * 60 * 1000 },
  });

  app.use(
    session({
      name: 'connect.sid',
      secret: config.sessionSecret || 'dev-insecure-secret',
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.cookieSecure,
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    }),
  );

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  const limiter =
    options.rateLimiter === null
      ? null
      : options.rateLimiter
        ? createAuthRateLimiter(options.rateLimiter)
        : authRateLimiter;

  app.use('/api/health', healthRouter);
  if (limiter) {
    app.use('/api/auth/login', limiter);
    app.use('/api/auth/register', limiter);
  }
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/chats', chatsRouter);
  ensureProjectFilesRoot();
  app.use('/api/projects', projectsRouter);
  app.use('/api/projects', filesRouter);

  return app;
}
