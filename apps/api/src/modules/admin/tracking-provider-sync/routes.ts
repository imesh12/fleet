import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';
import {
  assertProviderTypeMatches,
  ingestNormalizedTrackingBatch,
  normalizeProviderBatch,
} from '../../../lib/tracking-execution.js';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findTrackingProviderOrThrow,
  findTrackingProviderSyncItemOrThrow,
  findTrackingProviderSyncRunOrThrow,
  getAuditContext,
  getPagination,
  paginationQuerySchema,
  serializeTrackingProviderSyncItem,
  serializeTrackingProviderSyncRun,
  trackingProviderSyncItemStatusSchema,
  trackingProviderSyncRunStatusSchema,
} from '../utils.js';

const providerIdParamSchema = z.object({
  providerId: z.string().min(1),
});

const providerSyncRunIdParamSchema = z.object({
  providerId: z.string().min(1),
  syncRunId: z.string().min(1),
});

const syncItemIdParamSchema = z.object({
  providerId: z.string().min(1),
  syncRunId: z.string().min(1),
  syncItemId: z.string().min(1),
});

const listSyncRunsQuerySchema = paginationQuerySchema.extend({
  status: trackingProviderSyncRunStatusSchema.optional(),
});

const createSyncRunSchema = z.object({
  runType: z.string().trim().min(1),
  status: trackingProviderSyncRunStatusSchema.default('PENDING'),
  startedAt: z.coerce.date().optional(),
  finishedAt: z.coerce.date().optional(),
  summary: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const createSyncItemSchema = z.object({
  externalEntityType: z.string().trim().min(1),
  externalEntityId: z.string().trim().min(1),
  status: trackingProviderSyncItemStatusSchema.default('PENDING'),
  message: z.string().trim().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

const updateSyncItemSchema = z
  .object({
    status: trackingProviderSyncItemStatusSchema.optional(),
    message: z.string().trim().nullable().optional(),
    payload: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one sync item field must be supplied' });

const syncExecutionSchema = z.object({
  providerType: z.string().trim().min(1).optional(),
  runType: z.string().trim().min(1).optional(),
  devicePayloads: z.array(z.record(z.string(), z.unknown())).optional(),
  positionPayloads: z.array(z.record(z.string(), z.unknown())).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

async function executeProviderSyncRun(
  fastify: Parameters<FastifyPluginAsync>[0],
  input: {
    provider: Awaited<ReturnType<typeof findTrackingProviderOrThrow>>;
    run: {
      id: string;
      runType: string;
      metadata: Prisma.JsonValue | null;
    };
    request: FastifyRequest;
    body?: z.infer<typeof syncExecutionSchema>;
    auditAction: string;
  }
) {
  const payloadSource = (input.body?.metadata ?? input.run.metadata ?? {}) as Record<string, unknown>;
  const providerType = input.body?.providerType ?? (typeof payloadSource.providerType === 'string' ? payloadSource.providerType : input.provider.providerType);
  assertProviderTypeMatches(providerType, input.provider);

  const devicePayloads = (input.body?.devicePayloads ??
    (Array.isArray(payloadSource.devicePayloads) ? payloadSource.devicePayloads : [])) as Record<string, unknown>[];
  const positionPayloads = (input.body?.positionPayloads ??
    (Array.isArray(payloadSource.positionPayloads) ? payloadSource.positionPayloads : [])) as Record<string, unknown>[];

  if (positionPayloads.length === 0) {
    throw new ConflictError('Sync execution requires at least one position payload');
  }

  const normalized = normalizeProviderBatch({
    organizationId: input.provider.organizationId,
    providerType,
    devicePayloads,
    positionPayloads,
  });

  const syncItemInputs: Prisma.TrackingProviderSyncItemCreateManyInput[] = [
    ...normalized.devices.map((device) => ({
      trackingProviderSyncRunId: input.run.id,
      externalEntityType: 'device',
      externalEntityId: device.externalDeviceId,
      status: 'PENDING' as const,
      ...(device.rawPayload ? { payload: device.rawPayload as Prisma.InputJsonValue } : {}),
    })),
    ...normalized.events.map((event, index) => ({
      trackingProviderSyncRunId: input.run.id,
      externalEntityType: 'position',
      externalEntityId: event.providerEventId ?? event.externalDeviceId ?? event.vehicleId ?? `position_${index + 1}`,
      status: 'PENDING' as const,
      ...(event.rawPayload ? { payload: event.rawPayload as Prisma.InputJsonValue } : {}),
    })),
  ];

  await fastify.prisma.$transaction(async (tx) => {
    await tx.trackingProviderSyncRun.update({
      where: { id: input.run.id },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        finishedAt: null,
        ...(input.body?.metadata
          ? {
              metadata: {
                ...((input.run.metadata && typeof input.run.metadata === 'object'
                  ? (input.run.metadata as Record<string, unknown>)
                  : {}) as Record<string, unknown>),
                ...input.body.metadata,
              } as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    if (syncItemInputs.length > 0) {
      await tx.trackingProviderSyncItem.createMany({
        data: syncItemInputs,
      });
    }
  });

  try {
    const result = await ingestNormalizedTrackingBatch(fastify, {
      provider: input.provider,
      devices: normalized.devices,
      events: normalized.events,
      auditAction: input.auditAction,
      auditMetadata: {
        syncRunId: input.run.id,
        runType: input.run.runType,
      },
      requestContext: {
        ipAddress: input.request.ip,
        ...(typeof input.request.headers['user-agent'] === 'string'
          ? { userAgent: input.request.headers['user-agent'] }
          : {}),
      },
    });

    await fastify.prisma.$transaction(async (tx) => {
      await tx.trackingProviderSyncRun.update({
        where: { id: input.run.id },
        data: {
          status: 'COMPLETED',
          finishedAt: new Date(),
          summary: {
            processedCount: result.processedCount,
            deviceCount: normalized.devices.length,
            positionCount: normalized.events.length,
          } as Prisma.InputJsonValue,
        },
      });
      await tx.trackingProviderSyncItem.updateMany({
        where: { trackingProviderSyncRunId: input.run.id, status: 'PENDING' },
        data: {
          status: 'PROCESSED',
          message: 'Processed by tracking sync runner',
        },
      });
    });

    return result;
  } catch (error) {
    await fastify.prisma.$transaction(async (tx) => {
      await tx.trackingProviderSyncRun.update({
        where: { id: input.run.id },
        data: {
          status: 'FAILED',
          finishedAt: new Date(),
          summary: {
            deviceCount: normalized.devices.length,
            positionCount: normalized.events.length,
            error: error instanceof Error ? error.message : 'Unknown sync execution error',
          } as Prisma.InputJsonValue,
        },
      });
      await tx.trackingProviderSyncItem.updateMany({
        where: { trackingProviderSyncRunId: input.run.id, status: 'PENDING' },
        data: {
          status: 'FAILED',
          message: error instanceof Error ? error.message : 'Unknown sync execution error',
        },
      });
    });
    throw error;
  }
}

export const adminTrackingProviderSyncRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/tracking-providers/:providerId/sync-runs',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-provider-sync:read')] },
    async (request, reply) => {
      const { providerId } = validateOrThrow(providerIdParamSchema, request.params);
      const query = validateOrThrow(listSyncRunsQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);

      const where = {
        trackingProviderId: providerId,
        ...(query.status ? { status: query.status } : {}),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.trackingProviderSyncRun.findMany({
          where,
          skip,
          take,
          orderBy: [{ createdAt: 'desc' }],
          include: { items: true },
        }),
        fastify.prisma.trackingProviderSyncRun.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeTrackingProviderSyncRun) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.post(
    '/admin/tracking-providers/:providerId/sync-runs',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-provider-sync:manage')] },
    async (request, reply) => {
      const { providerId } = validateOrThrow(providerIdParamSchema, request.params);
      const body = validateOrThrow(createSyncRunSchema, request.body);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);

      const run = await fastify.prisma.trackingProviderSyncRun.create({
        data: {
          organizationId: provider.organizationId,
          trackingProviderId: providerId,
          runType: body.runType,
          status: body.status ?? 'PENDING',
          ...(body.startedAt ? { startedAt: body.startedAt } : {}),
          ...(body.finishedAt ? { finishedAt: body.finishedAt } : {}),
          ...(request.currentUser?.id ? { triggeredByUserId: request.currentUser.id } : {}),
          ...(body.summary ? { summary: body.summary as Prisma.InputJsonValue } : {}),
          ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
        },
        include: { items: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_provider_sync.create',
        entityType: 'TrackingProviderSyncRun',
        entityId: run.id,
        metadata: { trackingProviderId: providerId, runType: run.runType, status: run.status },
      });

      return reply.status(201).success({ item: serializeTrackingProviderSyncRun(run) });
    }
  );

  fastify.get(
    '/admin/tracking-providers/:providerId/sync-runs/:syncRunId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-provider-sync:read')] },
    async (request, reply) => {
      const { providerId, syncRunId } = validateOrThrow(providerSyncRunIdParamSchema, request.params);
      const run = await findTrackingProviderSyncRunOrThrow(fastify.prisma, syncRunId);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);

      if (run.trackingProviderId !== providerId) {
        throw new ConflictError('Sync run does not belong to the requested provider');
      }

      return reply.success({
        item: serializeTrackingProviderSyncRun(run),
        items: run.items.map(serializeTrackingProviderSyncItem),
      });
    }
  );

  fastify.post(
    '/admin/tracking-providers/:providerId/sync-runs/:syncRunId/items',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-provider-sync:manage')] },
    async (request, reply) => {
      const { providerId, syncRunId } = validateOrThrow(providerSyncRunIdParamSchema, request.params);
      const body = validateOrThrow(createSyncItemSchema, request.body);
      const run = await findTrackingProviderSyncRunOrThrow(fastify.prisma, syncRunId);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);

      if (run.trackingProviderId !== providerId) {
        throw new ConflictError('Sync run does not belong to the requested provider');
      }

      const item = await fastify.prisma.trackingProviderSyncItem.create({
        data: {
          trackingProviderSyncRunId: syncRunId,
          externalEntityType: body.externalEntityType,
          externalEntityId: body.externalEntityId,
          status: body.status ?? 'PENDING',
          ...(body.message ? { message: body.message } : {}),
          ...(body.payload ? { payload: body.payload as Prisma.InputJsonValue } : {}),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_provider_sync.item_create',
        entityType: 'TrackingProviderSyncItem',
        entityId: item.id,
        metadata: { syncRunId, externalEntityType: item.externalEntityType, externalEntityId: item.externalEntityId, status: item.status },
      });

      return reply.status(201).success({ item: serializeTrackingProviderSyncItem(item) });
    }
  );

  fastify.patch(
    '/admin/tracking-providers/:providerId/sync-runs/:syncRunId/items/:syncItemId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-provider-sync:manage')] },
    async (request, reply) => {
      const { providerId, syncRunId, syncItemId } = validateOrThrow(syncItemIdParamSchema, request.params);
      const body = validateOrThrow(updateSyncItemSchema, request.body);
      const run = await findTrackingProviderSyncRunOrThrow(fastify.prisma, syncRunId);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      const item = await findTrackingProviderSyncItemOrThrow(fastify.prisma, syncItemId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);

      if (run.trackingProviderId !== providerId || item.trackingProviderSyncRunId !== syncRunId) {
        throw new ConflictError('Sync item does not belong to the requested provider sync run');
      }

      const updateData = {
        ...(body.status ? { status: body.status } : {}),
        ...(body.message !== undefined ? { message: body.message ?? null } : {}),
        ...(body.payload !== undefined
          ? { payload: body.payload === null ? Prisma.JsonNull : (body.payload as Prisma.InputJsonValue) }
          : {}),
      };

      const updatedItem = await fastify.prisma.trackingProviderSyncItem.update({
        where: { id: syncItemId },
        data: updateData,
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_provider_sync.item_update',
        entityType: 'TrackingProviderSyncItem',
        entityId: syncItemId,
        metadata: updateData,
      });

      return reply.success({ item: serializeTrackingProviderSyncItem(updatedItem) });
    }
  );

  fastify.post(
    '/admin/tracking-providers/:providerId/sync-runs/:syncRunId/run',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-sync:manage')] },
    async (request, reply) => {
      const { providerId, syncRunId } = validateOrThrow(providerSyncRunIdParamSchema, request.params);
      const body = validateOrThrow(syncExecutionSchema, request.body ?? {});
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      const run = await findTrackingProviderSyncRunOrThrow(fastify.prisma, syncRunId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);

      if (run.trackingProviderId !== providerId) {
        throw new ConflictError('Sync run does not belong to the requested provider');
      }

      const result = await executeProviderSyncRun(fastify, {
        provider,
        run,
        request,
        body,
        auditAction: 'admin.tracking_sync.run',
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_sync.run',
        entityType: 'TrackingProviderSyncRun',
        entityId: syncRunId,
        metadata: {
          providerId,
          processedCount: result.processedCount,
        },
      });

      return reply.status(202).success({
        accepted: true,
        syncRunId,
        ...result,
      });
    }
  );

  fastify.post(
    '/admin/tracking-providers/:providerId/sync-now',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-sync:manage')] },
    async (request, reply) => {
      const { providerId } = validateOrThrow(providerIdParamSchema, request.params);
      const body = validateOrThrow(syncExecutionSchema, request.body ?? {});
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);

      const run = await fastify.prisma.trackingProviderSyncRun.create({
        data: {
          organizationId: provider.organizationId,
          trackingProviderId: provider.id,
          runType: body.runType ?? 'MANUAL_SYNC',
          status: 'PENDING',
          ...(request.currentUser?.id ? { triggeredByUserId: request.currentUser.id } : {}),
          metadata: {
            providerType: body.providerType ?? provider.providerType,
            devicePayloads: body.devicePayloads ?? [],
            positionPayloads: body.positionPayloads ?? [],
            ...(body.metadata ?? {}),
          } as Prisma.InputJsonValue,
        },
        include: { items: true },
      });

      const result = await executeProviderSyncRun(fastify, {
        provider,
        run,
        request,
        body,
        auditAction: 'admin.tracking_sync.sync_now',
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_sync.sync_now',
        entityType: 'TrackingProviderSyncRun',
        entityId: run.id,
        metadata: {
          providerId,
          processedCount: result.processedCount,
          runType: run.runType,
        },
      });

      return reply.status(202).success({
        accepted: true,
        syncRunId: run.id,
        ...result,
      });
    }
  );

  fastify.post(
    '/admin/tracking-providers/:providerId/traccar/pull',
    { preHandler: [fastify.authenticate, fastify.requirePermission('traccar-pull:manage')] },
    async (request, reply) => {
      const { providerId } = validateOrThrow(providerIdParamSchema, request.params);
      const body = validateOrThrow(syncExecutionSchema, request.body ?? {});
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);

      const run = await fastify.prisma.trackingProviderSyncRun.create({
        data: {
          organizationId: provider.organizationId,
          trackingProviderId: provider.id,
          runType: 'TRACCAR_PULL',
          status: 'PENDING',
          ...(request.currentUser?.id ? { triggeredByUserId: request.currentUser.id } : {}),
          metadata: {
            providerType: 'TRACCAR',
            devicePayloads: body.devicePayloads ?? [],
            positionPayloads: body.positionPayloads ?? [],
            ...(body.metadata ?? {}),
          } as Prisma.InputJsonValue,
        },
        include: { items: true },
      });

      const result = await executeProviderSyncRun(fastify, {
        provider,
        run,
        request,
        body: {
          ...body,
          providerType: 'TRACCAR',
        },
        auditAction: 'admin.traccar.pull',
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.traccar.pull',
        entityType: 'TrackingProviderSyncRun',
        entityId: run.id,
        metadata: {
          providerId,
          processedCount: result.processedCount,
        },
      });

      return reply.status(202).success({
        accepted: true,
        syncRunId: run.id,
        ...result,
      });
    }
  );
};
