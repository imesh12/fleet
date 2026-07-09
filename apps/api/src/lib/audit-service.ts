import type { FastifyInstance } from 'fastify';
import type { Prisma } from '@trackigniter8/db';

export function createAuditService(fastify: FastifyInstance) {
  return {
    async write(input: {
      actorUserId?: string;
      actorType?: 'USER' | 'SYSTEM';
      action: string;
      entityType?: string;
      entityId?: string;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
    }) {
      const data: Prisma.AuditLogCreateInput = {
        actorType: input.actorType ?? (input.actorUserId ? 'USER' : 'SYSTEM'),
        action: input.action,
        ...(input.actorUserId ? { actorUser: { connect: { id: input.actorUserId } } } : {}),
        ...(input.entityType ? { entityType: input.entityType } : {}),
        ...(input.entityId ? { entityId: input.entityId } : {}),
        ...(input.metadata ? { metadata: input.metadata as Prisma.InputJsonValue } : {}),
        ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
        ...(input.userAgent ? { userAgent: input.userAgent } : {}),
      };

      await fastify.prisma.auditLog.create({
        data,
      });
    },
  };
}
