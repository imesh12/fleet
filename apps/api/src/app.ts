import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';

import { getEnv } from '@trackigniter8/config';
import { createLogger } from '@trackigniter8/logger';

import './lib/types.js';
import { auditPlugin } from './plugins/audit.js';
import { authPlugin } from './plugins/auth.js';
import { databasePlugin } from './plugins/database.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { rbacPlugin } from './plugins/rbac.js';
import { redisPlugin } from './plugins/redis.js';
import { responsePlugin } from './plugins/response.js';
import { tenantPlugin } from './plugins/tenant.js';
import { registerRoutes } from './routes/index.js';

export async function createApp() {
  const env = getEnv();
  const logger = createLogger({ level: env.APP_LOG_LEVEL });

  const app = Fastify({
    loggerInstance: logger,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
    genReqId: (request) => request.headers['x-request-id']?.toString() ?? crypto.randomUUID(),
  });

  app.decorate('appLogger', logger);
  app.decorate('config', env);

  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('x-request-id', request.id);
    return payload;
  });

  await app.register(fastifyCors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowAll = env.CORS_ORIGINS.includes('*');
      const isAllowed = allowAll || env.CORS_ORIGINS.includes(origin);
      callback(isAllowed ? null : new Error('Origin not allowed by CORS policy'), isAllowed);
    },
    credentials: env.CORS_CREDENTIALS,
  });
  await app.register(fastifyHelmet);
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(databasePlugin);
  await app.register(redisPlugin);
  await app.register(responsePlugin);
  await app.register(authPlugin);
  await app.register(rbacPlugin);
  await app.register(tenantPlugin);
  await app.register(auditPlugin);
  await app.register(errorHandlerPlugin);

  await app.register(
    async (scopedApp) => {
      await scopedApp.register(registerRoutes);
    },
    { prefix: env.API_PREFIX }
  );

  return app;
}
