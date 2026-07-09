import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import { getPagination, paginationQuerySchema, parseDateRangeValue } from '../utils.js';

const auditLogIdParamSchema = z.object({
  auditLogId: z.string().min(1),
});

const listAuditLogsQuerySchema = paginationQuerySchema.extend({
  actorUserId: z.string().min(1).optional(),
  action: z.string().min(1).optional(),
  entityType: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  dateFrom: z.string().min(1).optional(),
  dateTo: z.string().min(1).optional(),
});

function serializeAuditLog(log: {
  id: string;
  actorType: string;
  actorUserId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  actorUser?: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  } | null;
}) {
  return {
    id: log.id,
    actorType: log.actorType,
    actorUserId: log.actorUserId,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    createdAt: log.createdAt,
    actorUser: log.actorUser
      ? {
          id: log.actorUser.id,
          email: log.actorUser.email,
          username: log.actorUser.username,
          firstName: log.actorUser.firstName,
          lastName: log.actorUser.lastName,
        }
      : null,
  };
}

export const adminAuditLogRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/audit-logs',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('audit:logs:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listAuditLogsQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const dateFrom = parseDateRangeValue(query.dateFrom);
      const dateTo = parseDateRangeValue(query.dateTo);
      const where = {
        ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
        ...(query.action ? { action: { contains: query.action, mode: 'insensitive' as const } } : {}),
        ...(query.entityType ? { entityType: query.entityType } : {}),
        ...(query.entityId ? { entityId: query.entityId } : {}),
        ...(dateFrom || dateTo
          ? {
              createdAt: {
                ...(dateFrom ? { gte: dateFrom } : {}),
                ...(dateTo ? { lte: dateTo } : {}),
              },
            }
          : {}),
      };

      const [logs, total] = await Promise.all([
        fastify.prisma.auditLog.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            actorUser: true,
          },
        }),
        fastify.prisma.auditLog.count({ where }),
      ]);

      return reply.success(
        {
          items: logs.map(serializeAuditLog),
        },
        buildPaginationMeta({
          page,
          pageSize,
          total,
        })
      );
    }
  );

  fastify.get(
    '/admin/audit-logs/:auditLogId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('audit:logs:read')],
    },
    async (request, reply) => {
      const { auditLogId } = validateOrThrow(auditLogIdParamSchema, request.params);

      const log = await fastify.prisma.auditLog.findUnique({
        where: { id: auditLogId },
        include: {
          actorUser: true,
        },
      });

      if (!log) {
        throw new NotFoundError('Audit log not found');
      }

      return reply.success({
        item: serializeAuditLog(log),
      });
    }
  );
};
