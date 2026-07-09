import { z } from 'zod';
import type { FastifyPluginAsync } from 'fastify';

import { validateOrThrow } from '@trackigniter8/validation';

import { loginWithPassword, revokeRefreshToken, rotateRefreshToken } from '../../lib/auth-service.js';

const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/auth/login',
    {
      config: {
        rateLimit: {
          max: fastify.config.AUTH_RATE_LIMIT_MAX,
          timeWindow: fastify.config.AUTH_RATE_LIMIT_WINDOW,
        },
      },
    },
    async (request, reply) => {
      const payload = validateOrThrow(loginSchema, request.body);
      const userAgent = request.headers['user-agent'];
      const result = await loginWithPassword(fastify, payload, {
        ipAddress: request.ip,
        ...(userAgent ? { userAgent } : {}),
      });

      await fastify.audit.write({
        action: 'auth.login',
        actorUserId: result.user.id,
        entityType: 'User',
        entityId: result.user.id,
        ipAddress: request.ip,
        ...(userAgent ? { userAgent } : {}),
        metadata: { email: result.user.email, refreshTokenId: result.refreshTokenId },
      });

      return reply.success(result);
    }
  );

  fastify.post('/auth/logout', async (request, reply) => {
    const payload = validateOrThrow(refreshSchema, request.body);
    const userAgent = request.headers['user-agent'];
    await revokeRefreshToken(fastify, payload.refreshToken, { revokedReason: 'logout' });

    await fastify.audit.write({
      action: 'auth.logout',
      ...(request.currentUser?.id ? { actorUserId: request.currentUser.id } : {}),
      entityType: 'Session',
      ipAddress: request.ip,
      ...(userAgent ? { userAgent } : {}),
    });

    return reply.success({ revoked: true });
  });

  fastify.post(
    '/auth/refresh',
    {
      config: {
        rateLimit: {
          max: fastify.config.AUTH_RATE_LIMIT_MAX,
          timeWindow: fastify.config.AUTH_RATE_LIMIT_WINDOW,
        },
      },
    },
    async (request, reply) => {
      const payload = validateOrThrow(refreshSchema, request.body);
      const userAgent = request.headers['user-agent'];
      const result = await rotateRefreshToken(fastify, payload.refreshToken, {
        ipAddress: request.ip,
        ...(userAgent ? { userAgent } : {}),
      });

      await fastify.audit.write({
        action: 'auth.refresh',
        actorUserId: result.user.id,
        entityType: 'Session',
        entityId: result.refreshTokenId,
        ipAddress: request.ip,
        ...(userAgent ? { userAgent } : {}),
      });

      return reply.success(result);
    }
  );

  fastify.get(
    '/auth/me',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      return reply.success({
        user: request.currentUser,
      });
    }
  );
};
