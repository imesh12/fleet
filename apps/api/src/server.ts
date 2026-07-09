import 'dotenv/config';

import { getEnv } from '@trackigniter8/config';

import { createApp } from './app.js';

async function main() {
  const env = getEnv();
  const app = await createApp();

  try {
    await app.listen({
      host: env.APP_HOST,
      port: env.APP_PORT,
    });
  } catch (error) {
    app.log.error({ err: error }, 'Failed to start API server');
    process.exitCode = 1;
  }
}

await main();
