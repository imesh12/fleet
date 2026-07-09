import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES, type DispatchQueueItemStatus } from '@trackigniter8/shared';
import { ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  dispatchQueueItemStatusSchema,
  findDispatchQueueItemOrThrow,
  findDispatchQueueOrThrow,
  findPlannedTripOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeDispatchQueue,
  serializeDispatchQueueItem,
} from '../utils.js';

const dispatchQueueIdParamSchema = z.object({
  dispatchQueueId: z.string().min(1),
});

const dispatchQueueItemIdParamSchema = z.object({
  dispatchQueueId: z.string().min(1),
  itemId: z.string().min(1),
});

const listDispatchQueuesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createDispatchQueueSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateDispatchQueueSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one dispatch queue field must be supplied' });

const createDispatchQueueItemSchema = z.object({
  plannedTripId: z.string().min(1),
  sequence: z.coerce.number().int().positive().optional(),
  status: dispatchQueueItemStatusSchema.default('DRAFT'),
  notes: z.string().trim().optional(),
});

const updateDispatchQueueItemStatusSchema = z.object({
  status: dispatchQueueItemStatusSchema,
  notes: z.string().trim().optional(),
  holdReason: z.string().trim().optional(),
});

const reorderDispatchQueueItemsSchema = z.object({
  orderedItemIds: z.array(z.string().min(1)).min(1),
});

const ALLOWED_QUEUE_ITEM_STATUS_TRANSITIONS: Record<DispatchQueueItemStatus, DispatchQueueItemStatus[]> = {
  DRAFT: ['PLANNED', 'READY', 'BLOCKED', 'HELD', 'CANCELED'],
  PLANNED: ['READY', 'BLOCKED', 'HELD', 'CANCELED', 'DISPATCHED_PLACEHOLDER'],
  READY: ['BLOCKED', 'HELD', 'CANCELED', 'DISPATCHED_PLACEHOLDER'],
  BLOCKED: ['PLANNED', 'READY', 'HELD', 'CANCELED'],
  HELD: ['PLANNED', 'READY', 'BLOCKED', 'CANCELED'],
  CANCELED: [],
  DISPATCHED_PLACEHOLDER: [],
};

function assertQueueItemTransition(currentStatus: DispatchQueueItemStatus, nextStatus: DispatchQueueItemStatus) {
  if (currentStatus === nextStatus) {
    return;
  }

  if (!ALLOWED_QUEUE_ITEM_STATUS_TRANSITIONS[currentStatus].includes(nextStatus)) {
    throw new ValidationAppError(`Cannot transition dispatch queue item from ${currentStatus} to ${nextStatus}`);
  }
}

async function assertDispatchQueueCodeUnique(
  fastify: Parameters<FastifyPluginAsync>[0],
  input: { organizationId: string; code: string; excludeDispatchQueueId?: string }
) {
  const existing = await fastify.prisma.dispatchQueue.findFirst({
    where: {
      organizationId: input.organizationId,
      code: input.code,
      ...(input.excludeDispatchQueueId ? { id: { not: input.excludeDispatchQueueId } } : {}),
    },
  });

  if (existing) {
    throw new ConflictError('A dispatch queue with that code already exists for this organization');
  }
}

export const adminDispatchQueueRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/dispatch-queues', { preHandler: [fastify.authenticate, fastify.requirePermission('dispatch-queues:read')] }, async (request, reply) => {
    const query = validateOrThrow(listDispatchQueuesQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();

    if (requestedOrganizationId) {
      await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    }

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { code: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
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
      fastify.prisma.dispatchQueue.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      fastify.prisma.dispatchQueue.count({ where }),
    ]);

    return reply.success({ items: items.map(serializeDispatchQueue) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/dispatch-queues/:dispatchQueueId', { preHandler: [fastify.authenticate, fastify.requirePermission('dispatch-queues:read')] }, async (request, reply) => {
    const { dispatchQueueId } = validateOrThrow(dispatchQueueIdParamSchema, request.params);
    const queue = await findDispatchQueueOrThrow(fastify.prisma, dispatchQueueId);
    await fastify.requireOrganizationAccess(request, queue.organizationId);

    return reply.success({
      item: {
        ...serializeDispatchQueue(queue),
        items: queue.items.map(serializeDispatchQueueItem),
      },
    });
  });

  fastify.post('/admin/dispatch-queues', { preHandler: [fastify.authenticate, fastify.requirePermission('dispatch-queues:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createDispatchQueueSchema, request.body);
    const code = normalizeEntityCode(body.code);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    await assertDispatchQueueCodeUnique(fastify, { organizationId: body.organizationId, code });

    const queue = await fastify.prisma.dispatchQueue.create({
      data: {
        organizationId: body.organizationId,
        name: body.name,
        code,
        status: body.status ?? 'ACTIVE',
        ...(body.description ? { description: body.description } : {}),
      },
      include: { items: true },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.dispatch_queue.create', entityType: 'DispatchQueue', entityId: queue.id, metadata: { organizationId: queue.organizationId, code: queue.code, status: queue.status } });
    return reply.status(201).success({ item: serializeDispatchQueue(queue) });
  });

  fastify.patch('/admin/dispatch-queues/:dispatchQueueId', { preHandler: [fastify.authenticate, fastify.requirePermission('dispatch-queues:manage')] }, async (request, reply) => {
    const { dispatchQueueId } = validateOrThrow(dispatchQueueIdParamSchema, request.params);
    const body = validateOrThrow(updateDispatchQueueSchema, request.body);
    const queue = await findDispatchQueueOrThrow(fastify.prisma, dispatchQueueId);
    await fastify.requireOrganizationAccess(request, queue.organizationId);

    const updateData = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
    };

    const updated = await fastify.prisma.dispatchQueue.update({ where: { id: dispatchQueueId }, data: updateData, include: { items: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.dispatch_queue.update', entityType: 'DispatchQueue', entityId: dispatchQueueId, metadata: updateData });
    return reply.success({ item: serializeDispatchQueue(updated) });
  });

  fastify.post('/admin/dispatch-queues/:dispatchQueueId/activate', { preHandler: [fastify.authenticate, fastify.requirePermission('dispatch-queues:manage')] }, async (request, reply) => {
    const { dispatchQueueId } = validateOrThrow(dispatchQueueIdParamSchema, request.params);
    const queue = await findDispatchQueueOrThrow(fastify.prisma, dispatchQueueId);
    await fastify.requireOrganizationAccess(request, queue.organizationId);
    const updated = await fastify.prisma.dispatchQueue.update({ where: { id: dispatchQueueId }, data: { status: 'ACTIVE' }, include: { items: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.dispatch_queue.activate', entityType: 'DispatchQueue', entityId: dispatchQueueId });
    return reply.success({ item: serializeDispatchQueue(updated) });
  });

  fastify.post('/admin/dispatch-queues/:dispatchQueueId/deactivate', { preHandler: [fastify.authenticate, fastify.requirePermission('dispatch-queues:manage')] }, async (request, reply) => {
    const { dispatchQueueId } = validateOrThrow(dispatchQueueIdParamSchema, request.params);
    const queue = await findDispatchQueueOrThrow(fastify.prisma, dispatchQueueId);
    await fastify.requireOrganizationAccess(request, queue.organizationId);
    const updated = await fastify.prisma.dispatchQueue.update({ where: { id: dispatchQueueId }, data: { status: 'INACTIVE' }, include: { items: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.dispatch_queue.deactivate', entityType: 'DispatchQueue', entityId: dispatchQueueId });
    return reply.success({ item: serializeDispatchQueue(updated) });
  });

  fastify.post('/admin/dispatch-queues/:dispatchQueueId/items', { preHandler: [fastify.authenticate, fastify.requirePermission('dispatch-queues:manage')] }, async (request, reply) => {
    const { dispatchQueueId } = validateOrThrow(dispatchQueueIdParamSchema, request.params);
    const body = validateOrThrow(createDispatchQueueItemSchema, request.body);
    const queue = await findDispatchQueueOrThrow(fastify.prisma, dispatchQueueId);
    await fastify.requireOrganizationAccess(request, queue.organizationId);
    const plannedTrip = await findPlannedTripOrThrow(fastify.prisma, body.plannedTripId);

    if (plannedTrip.organizationId !== queue.organizationId) {
      throw new ConflictError('Planned trip must belong to the same organization as the dispatch queue');
    }

    const duplicate = queue.items.find((entry) => entry.plannedTripId === body.plannedTripId);
    if (duplicate) {
      throw new ConflictError('That planned trip is already in the dispatch queue');
    }

    const sequence = body.sequence ?? (queue.items.length === 0 ? 1 : Math.max(...queue.items.map((entry) => entry.sequence)) + 1);
    if (queue.items.some((entry) => entry.sequence === sequence)) {
      throw new ValidationAppError('A dispatch queue item already exists at that sequence');
    }

    const item = await fastify.prisma.dispatchQueueItem.create({
      data: {
        dispatchQueueId,
        plannedTripId: body.plannedTripId,
        sequence,
        status: body.status ?? 'DRAFT',
        ...(body.notes ? { notes: body.notes } : {}),
      },
      include: {
        plannedTrip: {
          include: {
            customerAccount: { include: { contacts: true, locations: true } },
            serviceRoute: { include: { stops: true } },
            serviceRouteTemplate: { include: { stops: true } },
            tripTemplate: { include: { stops: true } },
            vehicle: {
              include: {
                customerAccount: { include: { contacts: true, locations: true } },
                department: true,
                businessUnit: true,
                vehicleType: true,
                vehicleGroup: true,
                make: true,
                model: true,
                serviceRouteTemplate: { include: { stops: true } },
                documents: true,
                devices: true,
              },
            },
            driver: {
              include: {
                customerAccount: { include: { contacts: true, locations: true } },
                department: true,
                businessUnit: true,
                driverGroup: true,
                skillAssignments: { include: { driverSkill: true } },
                licenses: true,
                documents: true,
                vehicleAssignments: true,
              },
            },
            assignment: { include: { driver: true, vehicle: true } },
            stops: true,
            dispatchQueueItems: true,
          },
        },
      },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.dispatch_queue_item.create', entityType: 'DispatchQueueItem', entityId: item.id, metadata: { dispatchQueueId, plannedTripId: item.plannedTripId, sequence: item.sequence } });
    return reply.status(201).success({ item: serializeDispatchQueueItem(item) });
  });

  fastify.delete('/admin/dispatch-queues/:dispatchQueueId/items/:itemId', { preHandler: [fastify.authenticate, fastify.requirePermission('dispatch-queues:manage')] }, async (request, reply) => {
    const { dispatchQueueId, itemId } = validateOrThrow(dispatchQueueItemIdParamSchema, request.params);
    const queue = await findDispatchQueueOrThrow(fastify.prisma, dispatchQueueId);
    await fastify.requireOrganizationAccess(request, queue.organizationId);
    const item = await findDispatchQueueItemOrThrow(fastify.prisma, itemId);

    if (item.dispatchQueueId !== dispatchQueueId) {
      throw new ConflictError('Dispatch queue item does not belong to the requested queue');
    }

    await fastify.prisma.$transaction(async (tx) => {
      await tx.dispatchQueueItem.delete({ where: { id: itemId } });
      const remaining = await tx.dispatchQueueItem.findMany({ where: { dispatchQueueId }, orderBy: { sequence: 'asc' } });
      for (const [index, entry] of remaining.entries()) {
        const nextSequence = index + 1;
        if (entry.sequence !== nextSequence) {
          await tx.dispatchQueueItem.update({ where: { id: entry.id }, data: { sequence: nextSequence } });
        }
      }
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.dispatch_queue_item.delete', entityType: 'DispatchQueueItem', entityId: itemId, metadata: { dispatchQueueId } });
    return reply.success({ deleted: true });
  });

  fastify.post('/admin/dispatch-queues/:dispatchQueueId/items/reorder', { preHandler: [fastify.authenticate, fastify.requirePermission('dispatch-queues:manage')] }, async (request, reply) => {
    const { dispatchQueueId } = validateOrThrow(dispatchQueueIdParamSchema, request.params);
    const body = validateOrThrow(reorderDispatchQueueItemsSchema, request.body);
    const queue = await findDispatchQueueOrThrow(fastify.prisma, dispatchQueueId);
    await fastify.requireOrganizationAccess(request, queue.organizationId);

    const currentItemIds = queue.items.map((entry) => entry.id).sort();
    const submittedItemIds = [...body.orderedItemIds].sort();
    if (currentItemIds.length !== submittedItemIds.length || currentItemIds.some((id, index) => id !== submittedItemIds[index])) {
      throw new ValidationAppError('Reorder payload must include every dispatch queue item exactly once');
    }

    await fastify.prisma.$transaction(async (tx) => {
      for (const [index, itemId] of body.orderedItemIds.entries()) {
        await tx.dispatchQueueItem.update({ where: { id: itemId }, data: { sequence: index + 1 } });
      }
    });

    const updated = await findDispatchQueueOrThrow(fastify.prisma, dispatchQueueId);
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.dispatch_queue_item.reorder', entityType: 'DispatchQueue', entityId: dispatchQueueId, metadata: { orderedItemIds: body.orderedItemIds } });
    return reply.success({ item: { ...serializeDispatchQueue(updated), items: updated.items.map(serializeDispatchQueueItem) } });
  });

  fastify.post('/admin/dispatch-queues/:dispatchQueueId/items/:itemId/status', { preHandler: [fastify.authenticate, fastify.requirePermission('dispatch-status:manage')] }, async (request, reply) => {
    const { dispatchQueueId, itemId } = validateOrThrow(dispatchQueueItemIdParamSchema, request.params);
    const body = validateOrThrow(updateDispatchQueueItemStatusSchema, request.body);
    const queue = await findDispatchQueueOrThrow(fastify.prisma, dispatchQueueId);
    await fastify.requireOrganizationAccess(request, queue.organizationId);
    const item = await findDispatchQueueItemOrThrow(fastify.prisma, itemId);

    if (item.dispatchQueueId !== dispatchQueueId) {
      throw new ConflictError('Dispatch queue item does not belong to the requested queue');
    }

    assertQueueItemTransition(item.status as DispatchQueueItemStatus, body.status);

    const updated = await fastify.prisma.dispatchQueueItem.update({
      where: { id: itemId },
      data: {
        status: body.status,
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.holdReason !== undefined ? { holdReason: body.holdReason } : {}),
      },
      include: {
        plannedTrip: {
          include: {
            customerAccount: { include: { contacts: true, locations: true } },
            serviceRoute: { include: { stops: true } },
            serviceRouteTemplate: { include: { stops: true } },
            tripTemplate: { include: { stops: true } },
            vehicle: {
              include: {
                customerAccount: { include: { contacts: true, locations: true } },
                department: true,
                businessUnit: true,
                vehicleType: true,
                vehicleGroup: true,
                make: true,
                model: true,
                serviceRouteTemplate: { include: { stops: true } },
                documents: true,
                devices: true,
              },
            },
            driver: {
              include: {
                customerAccount: { include: { contacts: true, locations: true } },
                department: true,
                businessUnit: true,
                driverGroup: true,
                skillAssignments: { include: { driverSkill: true } },
                licenses: true,
                documents: true,
                vehicleAssignments: true,
              },
            },
            assignment: { include: { driver: true, vehicle: true } },
            stops: true,
            dispatchQueueItems: true,
          },
        },
      },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.dispatch_queue_item.status', entityType: 'DispatchQueueItem', entityId: itemId, metadata: { from: item.status, to: body.status, holdReason: body.holdReason } });
    return reply.success({ item: serializeDispatchQueueItem(updated) });
  });
};
