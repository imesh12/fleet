import type { FastifyPluginAsync } from 'fastify';

import { getEnv } from '@trackigniter8/config';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (_request, reply) => {
    const env = getEnv();
    const startedAt = process.uptime();

    const [database, redis] = await Promise.allSettled([
      fastify.prisma.$queryRaw`SELECT 1`,
      fastify.redis.ping(),
    ]);

    const dbHealthy = database.status === 'fulfilled';
    const redisHealthy = redis.status === 'fulfilled' && redis.value === 'PONG';
    const statusCode = dbHealthy && redisHealthy ? 200 : 503;

    return reply.status(statusCode).success({
      status: dbHealthy && redisHealthy ? 'ok' : 'degraded',
      app: env.APP_NAME,
      version: env.APP_VERSION,
      environment: env.NODE_ENV,
      uptimeSeconds: startedAt,
      checks: {
        database: dbHealthy ? 'ok' : 'error',
        redis: redisHealthy ? 'ok' : 'error',
      },
    });
  });
};
