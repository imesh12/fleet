import fp from 'fastify-plugin';
import { Redis } from 'ioredis';

import { getEnv } from '@trackigniter8/config';

export const redisPlugin = fp(async (fastify) => {
  const env = getEnv();
  const redis = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  try {
    await redis.connect();
  } catch (error) {
    fastify.log.warn({ err: error }, 'Redis connection failed during boot; health checks may report degraded status');
  }

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async () => {
    if (redis.status !== 'end') {
      await redis.quit();
    }
  });
});
