import 'dotenv/config';
import { createApp } from './app';
import { assertConfig, config } from './config';
import { initDb } from './db';
import { ensureProjectFilesRoot, sweepOldTempFiles } from './projects/tempSweep';

assertConfig();
initDb(config.databasePath);
// eslint-disable-next-line no-console
console.log(`[backend] database initialized at ${config.databasePath}`);

const projectFilesRoot = ensureProjectFilesRoot();
const removedTemp = sweepOldTempFiles();
// eslint-disable-next-line no-console
console.log(
  `[backend] project files root at ${projectFilesRoot} (swept ${removedTemp} stale temp file(s))`,
);

const app = createApp();

app.listen(config.port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://0.0.0.0:${config.port}`);
});
