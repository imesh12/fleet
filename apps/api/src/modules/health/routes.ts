import type { FastifyPluginAsync } from 'fastify';

import { getEnv } from '@trackigniter8/config';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  async function dependencyHealth() {
    const env = getEnv();
    const startedAt = process.uptime();

    const [database, redis] = await Promise.allSettled([
      fastify.prisma.$queryRaw`SELECT 1`,
      fastify.redis.ping(),
    ]);

    const dbHealthy = database.status === 'fulfilled';
    const redisHealthy = redis.status === 'fulfilled' && redis.value === 'PONG';
    const healthy = dbHealthy && redisHealthy;

    return {
      status: healthy ? 'ok' : 'degraded',
      app: env.APP_NAME,
      version: env.APP_VERSION,
      environment: env.NODE_ENV,
      uptimeSeconds: startedAt,
      checks: {
        database: dbHealthy ? 'ok' : 'error',
        redis: redisHealthy ? 'ok' : 'error',
      },
    };
  }

  fastify.get('/health', async (_request, reply) => {
    const result = await dependencyHealth();
    return reply.status(result.status === 'ok' ? 200 : 503).success(result);
  });

  fastify.get('/health/live', async (_request, reply) => {
    const env = getEnv();

    return reply.success({
      status: 'ok',
      app: env.APP_NAME,
      version: env.APP_VERSION,
      environment: env.NODE_ENV,
      uptimeSeconds: process.uptime(),
    });
  });

  fastify.get('/health/ready', async (_request, reply) => {
    const result = await dependencyHealth();
    return reply.status(result.status === 'ok' ? 200 : 503).success(result);
  });
};
