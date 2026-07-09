import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  dispatchActionTypeSchema,
  findDispatchActionOrThrow,
  findDispatchQueueItemOrThrow,
  findPlannedTripOrThrow,
  findTripOrThrow,
  getAuditContext,
  getPagination,
  paginationQuerySchema,
  serializeDispatchAction,
} from '../utils.js';

const jsonRecordSchema = z.record(z.string(), z.unknown());

const dispatchActionIdParamSchema = z.object({
  dispatchActionId: z.string().min(1),
});

const listDispatchActionsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  tripId: z.string().min(1).optional(),
  plannedTripId: z.string().min(1).optional(),
  dispatchQueueItemId: z.string().min(1).optional(),
  actionType: dispatchActionTypeSchema.optional(),
});

const createDispatchActionSchema = z
  .object({
    organizationId: z.string().min(1),
    tripId: z.string().min(1).optional(),
    plannedTripId: z.string().min(1).optional(),
    dispatchQueueItemId: z.string().min(1).optional(),
    actionType: dispatchActionTypeSchema,
    note: z.string().trim().optional(),
    metadata: jsonRecordSchema.optional(),
  })
  .refine((value) => value.tripId || value.plannedTripId || value.dispatchQueueItemId, {
    message: 'Trip, planned trip, or dispatch queue item reference is required',
  });

async function assertDispatchActionRelations(
  fastify: Parameters<FastifyPluginAsync>[0],
  body: z.infer<typeof createDispatchActionSchema>
) {
  await fastify.requireOrganizationAccess(body as never, body.organizationId);
}

export const adminDispatchActionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/dispatch/actions', { preHandler: [fastify.authenticate, fastify.requirePermission('dispatch-actions:read')] }, async (request, reply) => {
    const query = validateOrThrow(listDispatchActionsQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();

    if (requestedOrganizationId) {
      await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    }

    const where = {
      ...(query.actionType ? { actionType: query.actionType } : {}),
      ...(query.tripId ? { tripId: query.tripId } : {}),
      ...(query.plannedTripId ? { plannedTripId: query.plannedTripId } : {}),
      ...(query.dispatchQueueItemId ? { dispatchQueueItemId: query.dispatchQueueItemId } : {}),
      ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
      ...(!isSuperAdmin && !requestedOrganizationId
        ? {
            organization: {
              users: {
                some: {
                  userId: request.currentUser!.id,
                  status: 'ACTIVE' as const,
                },
              },
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      fastify.prisma.dispatchAction.findMany({
        where,
        skip,
        take,
        orderBy: { happenedAt: 'desc' },
        include: {
          actorUser: true,
        },
      }),
      fastify.prisma.dispatchAction.count({ where }),
    ]);

    return reply.success({ items: items.map(serializeDispatchAction) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/dispatch/actions/:dispatchActionId', { preHandler: [fastify.authenticate, fastify.requirePermission('dispatch-actions:read')] }, async (request, reply) => {
    const { dispatchActionId } = validateOrThrow(dispatchActionIdParamSchema, request.params);
    const action = await findDispatchActionOrThrow(fastify.prisma, dispatchActionId);
    await fastify.requireOrganizationAccess(request, action.organizationId);
    return reply.success({ item: serializeDispatchAction(action) });
  });

  fastify.post('/admin/dispatch/actions', { preHandler: [fastify.authenticate, fastify.requirePermission('dispatch-actions:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createDispatchActionSchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);

    if (body.tripId) {
      const trip = await findTripOrThrow(fastify.prisma, body.tripId);
      if (trip.organizationId !== body.organizationId) {
        throw new ConflictError('Trip must belong to the same organization');
      }
    }

    if (body.plannedTripId) {
      const plannedTrip = await findPlannedTripOrThrow(fastify.prisma, body.plannedTripId);
      if (plannedTrip.organizationId !== body.organizationId) {
        throw new ConflictError('Planned trip must belong to the same organization');
      }
    }

    if (body.dispatchQueueItemId) {
      const queueItem = await findDispatchQueueItemOrThrow(fastify.prisma, body.dispatchQueueItemId);
      if (queueItem.plannedTrip.organizationId !== body.organizationId) {
        throw new ConflictError('Dispatch queue item must belong to the same organization');
      }
    }

    const action = await fastify.prisma.dispatchAction.create({
      data: {
        organizationId: body.organizationId,
        actionType: body.actionType,
        ...(body.tripId ? { tripId: body.tripId } : {}),
        ...(body.plannedTripId ? { plannedTripId: body.plannedTripId } : {}),
        ...(body.dispatchQueueItemId ? { dispatchQueueItemId: body.dispatchQueueItemId } : {}),
        ...(body.note ? { note: body.note } : {}),
        ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
        ...(request.currentUser?.id ? { actorUserId: request.currentUser.id } : {}),
      },
      include: {
        actorUser: true,
      },
    });

    await fastify.audit.write({
      ...getAuditContext(request),
      action: 'admin.dispatch_action.create',
      entityType: 'DispatchAction',
      entityId: action.id,
      metadata: {
        actionType: action.actionType,
        tripId: action.tripId,
        plannedTripId: action.plannedTripId,
        dispatchQueueItemId: action.dispatchQueueItemId,
      },
    });

    return reply.status(201).success({ item: serializeDispatchAction(action) });
  });
};
