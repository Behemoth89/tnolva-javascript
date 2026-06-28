export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databasePath: process.env.DATABASE_PATH ?? 'backend/data/chat.db',
  projectFilesRoot:
    process.env.PROJECT_FILES_ROOT ?? 'backend/data/project-files',
  sessionSecret: process.env.SESSION_SECRET ?? '',
  cookieSecure: (process.env.COOKIE_SECURE ?? 'false').toLowerCase() === 'true',
  frontendOrigin:
    process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173,http://localhost',
};

export function assertConfig(): void {
  if (!config.sessionSecret && config.nodeEnv !== 'test') {
    throw new Error(
      'SESSION_SECRET is not set. Set it in the environment or backend/.env before starting the backend.',
    );
  }
}
