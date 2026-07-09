import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import { getAuditContext, getPagination, paginationQuerySchema, serializeSession } from '../utils.js';

const listSessionsQuerySchema = paginationQuerySchema.extend({
  userId: z.string().min(1),
});

const sessionIdParamSchema = z.object({
  sessionId: z.string().min(1),
});

const revokeSessionSchema = z.object({
  reason: z.string().trim().optional(),
});

const revokeAllSessionsSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().trim().optional(),
});

export const adminSessionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/sessions',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:sessions:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listSessionsQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const where = {
        userId: query.userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      };

      const [sessions, total] = await Promise.all([
        fastify.prisma.refreshToken.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        fastify.prisma.refreshToken.count({ where }),
      ]);

      return reply.success(
        {
          items: sessions.map(serializeSession),
        },
        buildPaginationMeta({
          page,
          pageSize,
          total,
        })
      );
    }
  );

  fastify.post(
    '/admin/sessions/:sessionId/revoke',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:sessions:manage')],
    },
    async (request, reply) => {
      const { sessionId } = validateOrThrow(sessionIdParamSchema, request.params);
      const body = validateOrThrow(revokeSessionSchema, request.body ?? {});

      const session = await fastify.prisma.refreshToken.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundError('Session not found');
      }

      await fastify.prisma.refreshToken.update({
        where: { id: sessionId },
        data: {
          revokedAt: new Date(),
          revokedReason: body.reason ?? 'admin_revoked',
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.session.revoke',
        entityType: 'Session',
        entityId: sessionId,
        metadata: {
          userId: session.userId,
          tokenId: session.tokenId,
          reason: body.reason ?? 'admin_revoked',
        },
      });

      return reply.success({
        revoked: true,
      });
    }
  );

  fastify.post(
    '/admin/sessions/revoke-all',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:sessions:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(revokeAllSessionsSchema, request.body);

      const result = await fastify.prisma.refreshToken.updateMany({
        where: {
          userId: body.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: body.reason ?? 'admin_revoked_all',
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.session.revoke-all',
        entityType: 'User',
        entityId: body.userId,
        metadata: {
          affectedSessions: result.count,
          reason: body.reason ?? 'admin_revoked_all',
        },
      });

      return reply.success({
        revoked: true,
        affectedSessions: result.count,
      });
    }
  );
};
