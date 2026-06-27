import 'dotenv/config';
import { createApp } from './app';
import { assertConfig, config } from './config';
import { initDb } from './db';

assertConfig();
initDb(config.databasePath);
// eslint-disable-next-line no-console
console.log(`[backend] database initialized at ${config.databasePath}`);

const app = createApp();

app.listen(config.port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://0.0.0.0:${config.port}`);
});
