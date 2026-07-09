import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findGeofenceOrThrow,
  findGeofencePointOrThrow,
  getAuditContext,
  getPagination,
  geofenceTypeSchema,
  masterDataStatusSchema,
  paginationQuerySchema,
  serializeGeofence,
  serializeGeofencePoint,
} from '../utils.js';

const geofenceIdParamSchema = z.object({
  geofenceId: z.string().min(1),
});

const geofencePointIdParamSchema = z.object({
  geofenceId: z.string().min(1),
  pointId: z.string().min(1),
});

const listGeofencesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  status: masterDataStatusSchema.optional(),
  geofenceType: geofenceTypeSchema.optional(),
  search: z.string().trim().optional(),
});

const createGeofenceSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  description: z.string().trim().optional(),
  geofenceType: geofenceTypeSchema,
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateGeofenceSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    code: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    geofenceType: geofenceTypeSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one geofence field must be supplied' });

const createGeofencePointSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  sequence: z.coerce.number().int().min(1).optional(),
});

const updateGeofencePointSchema = z
  .object({
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    sequence: z.coerce.number().int().min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one geofence point field must be supplied' });

const reorderGeofencePointsSchema = z.object({
  orderedPointIds: z.array(z.string().min(1)).min(1),
});

const geofenceEventIdParamSchema = z.object({
  eventId: z.string().min(1),
});

const listGeofenceEventsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  geofenceId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  tripId: z.string().min(1).optional(),
  eventType: z.enum(['ENTER', 'EXIT', 'INSIDE', 'OUTSIDE']).optional(),
  happenedFrom: z.coerce.date().optional(),
  happenedTo: z.coerce.date().optional(),
});

const evaluateGeofencesSchema = z.object({
  organizationId: z.string().min(1).optional(),
  geofenceId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  vehiclePositionId: z.string().min(1).optional(),
  emitStateEvents: z.boolean().default(false),
});

function normalizeGeofenceCode(code: string) {
  return code
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();
}

function toNumber(value: Prisma.Decimal | null) {
  return value ? Number(value.toString()) : null;
}

function isPointInsidePolygon(
  point: { latitude: number; longitude: number },
  polygon: Array<{ latitude: number; longitude: number }>
) {
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const current = polygon[index]!;
    const prior = polygon[previous]!;
    const intersects =
      current.longitude > point.longitude !== prior.longitude > point.longitude &&
      point.latitude <
        ((prior.latitude - current.latitude) * (point.longitude - current.longitude)) /
          ((prior.longitude - current.longitude) || Number.EPSILON) +
          current.latitude;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function serializeGeofenceEvent(event: {
  id: string;
  organizationId: string;
  geofenceId: string;
  vehicleId: string;
  vehiclePositionId: string;
  geofenceEvaluationRunId: string | null;
  tripId: string | null;
  eventType: string;
  latitude: Prisma.Decimal;
  longitude: Prisma.Decimal;
  happenedAt: Date;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: event.id,
    organizationId: event.organizationId,
    geofenceId: event.geofenceId,
    vehicleId: event.vehicleId,
    vehiclePositionId: event.vehiclePositionId,
    geofenceEvaluationRunId: event.geofenceEvaluationRunId,
    tripId: event.tripId,
    eventType: event.eventType,
    latitude: Number(event.latitude.toString()),
    longitude: Number(event.longitude.toString()),
    happenedAt: event.happenedAt,
    metadata: event.metadata,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

function serializeGeofenceEvaluationRun(run: {
  id: string;
  organizationId: string;
  geofenceId: string | null;
  vehicleId: string | null;
  vehiclePositionId: string | null;
  status: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  summary: Prisma.JsonValue | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: run.id,
    organizationId: run.organizationId,
    geofenceId: run.geofenceId,
    vehicleId: run.vehicleId,
    vehiclePositionId: run.vehiclePositionId,
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    summary: run.summary,
    metadata: run.metadata,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

export const adminGeofenceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/geofences',
    { preHandler: [fastify.authenticate, fastify.requirePermission('geofences:read')] },
    async (request, reply) => {
      const query = validateOrThrow(listGeofencesQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
      const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();

      if (requestedOrganizationId) {
        await fastify.requireOrganizationAccess(request, requestedOrganizationId);
      }

      const where = {
        ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.geofenceType ? { geofenceType: query.geofenceType } : {}),
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
                  some: { userId: request.currentUser!.id, status: 'ACTIVE' as const },
                },
              },
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.geofence.findMany({
          where,
          skip,
          take,
          orderBy: [{ createdAt: 'desc' }],
          include: { points: true },
        }),
        fastify.prisma.geofence.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeGeofence) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/geofences/:geofenceId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('geofences:read')] },
    async (request, reply) => {
      const { geofenceId } = validateOrThrow(geofenceIdParamSchema, request.params);
      const geofence = await findGeofenceOrThrow(fastify.prisma, geofenceId);
      await fastify.requireOrganizationAccess(request, geofence.organizationId);

      return reply.success({
        item: serializeGeofence(geofence),
        points: geofence.points.map(serializeGeofencePoint),
      });
    }
  );

  fastify.post(
    '/admin/geofences',
    { preHandler: [fastify.authenticate, fastify.requirePermission('geofences:manage')] },
    async (request, reply) => {
      const body = validateOrThrow(createGeofenceSchema, request.body);
      await fastify.requireOrganizationAccess(request, body.organizationId);
      const code = normalizeGeofenceCode(body.code);

      const duplicate = await fastify.prisma.geofence.findFirst({
        where: { organizationId: body.organizationId, code },
      });

      if (duplicate) {
        throw new ConflictError('A geofence with that code already exists for this organization');
      }

      const geofence = await fastify.prisma.geofence.create({
        data: {
          organizationId: body.organizationId,
          name: body.name,
          code,
          geofenceType: body.geofenceType,
          status: body.status ?? 'ACTIVE',
          ...(body.description ? { description: body.description } : {}),
        },
        include: { points: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.geofence.create',
        entityType: 'Geofence',
        entityId: geofence.id,
        metadata: { organizationId: geofence.organizationId, code: geofence.code, geofenceType: geofence.geofenceType, status: geofence.status },
      });

      return reply.status(201).success({ item: serializeGeofence(geofence) });
    }
  );

  fastify.patch(
    '/admin/geofences/:geofenceId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('geofences:manage')] },
    async (request, reply) => {
      const { geofenceId } = validateOrThrow(geofenceIdParamSchema, request.params);
      const body = validateOrThrow(updateGeofenceSchema, request.body);
      const geofence = await findGeofenceOrThrow(fastify.prisma, geofenceId);
      await fastify.requireOrganizationAccess(request, geofence.organizationId);

      const nextCode = body.code ? normalizeGeofenceCode(body.code) : undefined;
      if (nextCode && nextCode !== geofence.code) {
        const duplicate = await fastify.prisma.geofence.findFirst({
          where: { organizationId: geofence.organizationId, code: nextCode, id: { not: geofenceId } },
        });

        if (duplicate) {
          throw new ConflictError('A geofence with that code already exists for this organization');
        }
      }

      const updateData = {
        ...(body.name ? { name: body.name } : {}),
        ...(nextCode ? { code: nextCode } : {}),
        ...(body.description !== undefined ? { description: body.description ?? null } : {}),
        ...(body.geofenceType ? { geofenceType: body.geofenceType } : {}),
      };

      const updatedGeofence = await fastify.prisma.geofence.update({
        where: { id: geofenceId },
        data: updateData,
        include: { points: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.geofence.update',
        entityType: 'Geofence',
        entityId: geofenceId,
        metadata: updateData,
      });

      return reply.success({ item: serializeGeofence(updatedGeofence) });
    }
  );

  fastify.post(
    '/admin/geofences/:geofenceId/activate',
    { preHandler: [fastify.authenticate, fastify.requirePermission('geofences:manage')] },
    async (request, reply) => {
      const { geofenceId } = validateOrThrow(geofenceIdParamSchema, request.params);
      const geofence = await findGeofenceOrThrow(fastify.prisma, geofenceId);
      await fastify.requireOrganizationAccess(request, geofence.organizationId);
      const updatedGeofence = await fastify.prisma.geofence.update({
        where: { id: geofenceId },
        data: { status: 'ACTIVE' },
        include: { points: true },
      });

      await fastify.audit.write({ ...getAuditContext(request), action: 'admin.geofence.activate', entityType: 'Geofence', entityId: geofenceId });
      return reply.success({ item: serializeGeofence(updatedGeofence) });
    }
  );

  fastify.post(
    '/admin/geofences/:geofenceId/deactivate',
    { preHandler: [fastify.authenticate, fastify.requirePermission('geofences:manage')] },
    async (request, reply) => {
      const { geofenceId } = validateOrThrow(geofenceIdParamSchema, request.params);
      const geofence = await findGeofenceOrThrow(fastify.prisma, geofenceId);
      await fastify.requireOrganizationAccess(request, geofence.organizationId);
      const updatedGeofence = await fastify.prisma.geofence.update({
        where: { id: geofenceId },
        data: { status: 'INACTIVE' },
        include: { points: true },
      });

      await fastify.audit.write({ ...getAuditContext(request), action: 'admin.geofence.deactivate', entityType: 'Geofence', entityId: geofenceId });
      return reply.success({ item: serializeGeofence(updatedGeofence) });
    }
  );

  fastify.post(
    '/admin/geofences/:geofenceId/points',
    { preHandler: [fastify.authenticate, fastify.requirePermission('geofences:manage')] },
    async (request, reply) => {
      const { geofenceId } = validateOrThrow(geofenceIdParamSchema, request.params);
      const body = validateOrThrow(createGeofencePointSchema, request.body);
      const geofence = await findGeofenceOrThrow(fastify.prisma, geofenceId);
      await fastify.requireOrganizationAccess(request, geofence.organizationId);

      const sequence = body.sequence ?? geofence.points.length + 1;
      const point = await fastify.prisma.geofencePoint.create({
        data: {
          geofenceId,
          sequence,
          latitude: body.latitude,
          longitude: body.longitude,
        },
      });

      await fastify.audit.write({ ...getAuditContext(request), action: 'admin.geofence_point.create', entityType: 'GeofencePoint', entityId: point.id, metadata: { geofenceId, sequence } });
      return reply.status(201).success({ item: serializeGeofencePoint(point) });
    }
  );

  fastify.patch(
    '/admin/geofences/:geofenceId/points/:pointId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('geofences:manage')] },
    async (request, reply) => {
      const { geofenceId, pointId } = validateOrThrow(geofencePointIdParamSchema, request.params);
      const body = validateOrThrow(updateGeofencePointSchema, request.body);
      const geofence = await findGeofenceOrThrow(fastify.prisma, geofenceId);
      await fastify.requireOrganizationAccess(request, geofence.organizationId);
      const point = await findGeofencePointOrThrow(fastify.prisma, pointId);

      if (point.geofenceId !== geofenceId) {
        throw new ConflictError('Geofence point does not belong to the requested geofence');
      }

      const updateData = {
        ...(body.sequence !== undefined ? { sequence: body.sequence } : {}),
        ...(body.latitude !== undefined ? { latitude: body.latitude } : {}),
        ...(body.longitude !== undefined ? { longitude: body.longitude } : {}),
      };

      const updatedPoint = await fastify.prisma.geofencePoint.update({
        where: { id: pointId },
        data: updateData,
      });

      await fastify.audit.write({ ...getAuditContext(request), action: 'admin.geofence_point.update', entityType: 'GeofencePoint', entityId: pointId, metadata: updateData });
      return reply.success({ item: serializeGeofencePoint(updatedPoint) });
    }
  );

  fastify.delete(
    '/admin/geofences/:geofenceId/points/:pointId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('geofences:manage')] },
    async (request, reply) => {
      const { geofenceId, pointId } = validateOrThrow(geofencePointIdParamSchema, request.params);
      const geofence = await findGeofenceOrThrow(fastify.prisma, geofenceId);
      await fastify.requireOrganizationAccess(request, geofence.organizationId);
      const point = await findGeofencePointOrThrow(fastify.prisma, pointId);

      if (point.geofenceId !== geofenceId) {
        throw new ConflictError('Geofence point does not belong to the requested geofence');
      }

      await fastify.prisma.geofencePoint.delete({ where: { id: pointId } });
      await fastify.audit.write({ ...getAuditContext(request), action: 'admin.geofence_point.delete', entityType: 'GeofencePoint', entityId: pointId });
      return reply.success({ deleted: true });
    }
  );

  fastify.post(
    '/admin/geofences/:geofenceId/points/reorder',
    { preHandler: [fastify.authenticate, fastify.requirePermission('geofences:manage')] },
    async (request, reply) => {
      const { geofenceId } = validateOrThrow(geofenceIdParamSchema, request.params);
      const body = validateOrThrow(reorderGeofencePointsSchema, request.body);
      const geofence = await findGeofenceOrThrow(fastify.prisma, geofenceId);
      await fastify.requireOrganizationAccess(request, geofence.organizationId);

      const currentPointIds = geofence.points.map((entry) => entry.id).sort();
      const submittedPointIds = [...body.orderedPointIds].sort();
      if (currentPointIds.length !== submittedPointIds.length || currentPointIds.some((id, index) => id !== submittedPointIds[index])) {
        throw new ValidationAppError('Reorder payload must include every geofence point exactly once');
      }

      await fastify.prisma.$transaction(async (tx) => {
        for (const [index, pointId] of body.orderedPointIds.entries()) {
          await tx.geofencePoint.update({
            where: { id: pointId },
            data: { sequence: index + 1 },
          });
        }
      });

      await fastify.audit.write({ ...getAuditContext(request), action: 'admin.geofence_point.reorder', entityType: 'Geofence', entityId: geofenceId, metadata: { orderedPointIds: body.orderedPointIds } });
      const updatedGeofence = await findGeofenceOrThrow(fastify.prisma, geofenceId);
      return reply.success({ item: serializeGeofence(updatedGeofence), points: updatedGeofence.points.map(serializeGeofencePoint) });
    }
  );

  fastify.post(
    '/admin/geofences/evaluate',
    { preHandler: [fastify.authenticate, fastify.requirePermission('geofence-evaluation:manage')] },
    async (request, reply) => {
      const body = validateOrThrow(evaluateGeofencesSchema, request.body ?? {});
      const requestedOrganizationId = body.organizationId ?? request.headers['x-organization-id']?.toString();

      if (!requestedOrganizationId) {
        throw new ValidationAppError('Organization context is required', { header: 'x-organization-id' });
      }

      await fastify.requireOrganizationAccess(request, requestedOrganizationId);

      if (body.geofenceId) {
        const geofence = await findGeofenceOrThrow(fastify.prisma, body.geofenceId);
        if (geofence.organizationId !== requestedOrganizationId) {
          throw new ConflictError('Geofence must belong to the requested organization');
        }
      }

      if (body.vehicleId) {
        const vehicle = await fastify.prisma.vehicle.findUnique({ where: { id: body.vehicleId } });
        if (!vehicle || vehicle.organizationId !== requestedOrganizationId) {
          throw new ConflictError('Vehicle must belong to the requested organization');
        }
      }

      const [geofences, positions] = await Promise.all([
        fastify.prisma.geofence.findMany({
          where: {
            organizationId: requestedOrganizationId,
            status: 'ACTIVE',
            ...(body.geofenceId ? { id: body.geofenceId } : {}),
          },
          include: { points: { orderBy: { sequence: 'asc' } } },
        }),
        body.vehiclePositionId
          ? fastify.prisma.vehiclePosition.findMany({
              where: {
                id: body.vehiclePositionId,
                organizationId: requestedOrganizationId,
              },
            })
          : fastify.prisma.vehiclePosition.findMany({
              where: {
                organizationId: requestedOrganizationId,
                ...(body.vehicleId ? { vehicleId: body.vehicleId } : {}),
              },
            }),
      ]);

      const run = await fastify.prisma.geofenceEvaluationRun.create({
        data: {
          organizationId: requestedOrganizationId,
          ...(body.geofenceId ? { geofenceId: body.geofenceId } : {}),
          ...(body.vehicleId ? { vehicleId: body.vehicleId } : {}),
          ...(body.vehiclePositionId ? { vehiclePositionId: body.vehiclePositionId } : {}),
          status: 'RUNNING',
          startedAt: new Date(),
          metadata: {
            emitStateEvents: body.emitStateEvents,
            geofenceCount: geofences.length,
            positionCount: positions.length,
          } as Prisma.InputJsonValue,
        },
      });

      let createdEvents = 0;
      const emittedEvents: Awaited<ReturnType<typeof fastify.prisma.geofenceEvent.create>>[] = [];

      try {
        for (const geofence of geofences) {
          if (geofence.geofenceType !== 'POLYGON' || geofence.points.length < 3) {
            continue;
          }

          const polygon = geofence.points
            .map((point) => ({
              latitude: Number(point.latitude.toString()),
              longitude: Number(point.longitude.toString()),
            }));

          for (const position of positions) {
            const inside = isPointInsidePolygon(
              {
                latitude: Number(position.latitude.toString()),
                longitude: Number(position.longitude.toString()),
              },
              polygon
            );

            const previousEvent = await fastify.prisma.geofenceEvent.findFirst({
              where: {
                geofenceId: geofence.id,
                vehicleId: position.vehicleId,
              },
              orderBy: [{ happenedAt: 'desc' }, { createdAt: 'desc' }],
            });

            const previousInside = previousEvent ? ['ENTER', 'INSIDE'].includes(previousEvent.eventType) : null;
            let nextEventType: 'ENTER' | 'EXIT' | 'INSIDE' | 'OUTSIDE' | null = null;

            if (previousInside === null) {
              nextEventType = inside ? 'INSIDE' : 'OUTSIDE';
            } else if (inside && !previousInside) {
              nextEventType = 'ENTER';
            } else if (!inside && previousInside) {
              nextEventType = 'EXIT';
            } else if (body.emitStateEvents) {
              nextEventType = inside ? 'INSIDE' : 'OUTSIDE';
            }

            if (!nextEventType) {
              continue;
            }

            const createdEvent = await fastify.prisma.geofenceEvent.create({
              data: {
                organizationId: requestedOrganizationId,
                geofenceId: geofence.id,
                vehicleId: position.vehicleId,
                vehiclePositionId: position.id,
                geofenceEvaluationRunId: run.id,
                ...(position.tripId ? { tripId: position.tripId } : {}),
                eventType: nextEventType,
                latitude: position.latitude,
                longitude: position.longitude,
                happenedAt: position.providerTimestamp,
                metadata: {
                  previousEventType: previousEvent?.eventType ?? null,
                  evaluatedAt: new Date().toISOString(),
                } as Prisma.InputJsonValue,
              },
            });

            emittedEvents.push(createdEvent);
            createdEvents += 1;
          }
        }

        const completedRun = await fastify.prisma.geofenceEvaluationRun.update({
          where: { id: run.id },
          data: {
            status: 'COMPLETED',
            finishedAt: new Date(),
            summary: {
              geofenceCount: geofences.length,
              positionCount: positions.length,
              createdEventCount: createdEvents,
            } as Prisma.InputJsonValue,
          },
        });

        await fastify.audit.write({
          ...getAuditContext(request),
          action: 'admin.geofence_evaluation.run',
          entityType: 'GeofenceEvaluationRun',
          entityId: run.id,
          metadata: {
            organizationId: requestedOrganizationId,
            createdEventCount: createdEvents,
          },
        });

        return reply.status(202).success({
          accepted: true,
          run: serializeGeofenceEvaluationRun(completedRun),
          events: emittedEvents.map(serializeGeofenceEvent),
        });
      } catch (error) {
        await fastify.prisma.geofenceEvaluationRun.update({
          where: { id: run.id },
          data: {
            status: 'FAILED',
            finishedAt: new Date(),
            summary: {
              geofenceCount: geofences.length,
              positionCount: positions.length,
              createdEventCount: createdEvents,
              error: error instanceof Error ? error.message : 'Unknown geofence evaluation error',
            } as Prisma.InputJsonValue,
          },
        });
        throw error;
      }
    }
  );

  fastify.get(
    '/admin/geofence-events',
    { preHandler: [fastify.authenticate, fastify.requirePermission('geofence-events:read')] },
    async (request, reply) => {
      const query = validateOrThrow(listGeofenceEventsQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
      const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();

      if (!requestedOrganizationId && !isSuperAdmin) {
        throw new ValidationAppError('Organization context is required', { header: 'x-organization-id' });
      }

      if (requestedOrganizationId) {
        await fastify.requireOrganizationAccess(request, requestedOrganizationId);
      }

      const where = {
        ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
        ...(query.geofenceId ? { geofenceId: query.geofenceId } : {}),
        ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
        ...(query.tripId ? { tripId: query.tripId } : {}),
        ...(query.eventType ? { eventType: query.eventType } : {}),
        ...(query.happenedFrom || query.happenedTo
          ? {
              happenedAt: {
                ...(query.happenedFrom ? { gte: query.happenedFrom } : {}),
                ...(query.happenedTo ? { lte: query.happenedTo } : {}),
              },
            }
          : {}),
        ...(!isSuperAdmin && !requestedOrganizationId
          ? {
              organization: {
                users: {
                  some: { userId: request.currentUser!.id, status: 'ACTIVE' as const },
                },
              },
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.geofenceEvent.findMany({
          where,
          skip,
          take,
          orderBy: [{ happenedAt: 'desc' }, { createdAt: 'desc' }],
        }),
        fastify.prisma.geofenceEvent.count({ where }),
      ]);

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.geofence_event.read',
        entityType: 'Organization',
        ...(requestedOrganizationId ? { entityId: requestedOrganizationId } : {}),
        metadata: {
          itemCount: items.length,
        },
      });

      return reply.success({ items: items.map(serializeGeofenceEvent) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/geofence-events/:eventId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('geofence-events:read')] },
    async (request, reply) => {
      const { eventId } = validateOrThrow(geofenceEventIdParamSchema, request.params);
      const event = await fastify.prisma.geofenceEvent.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new ValidationAppError('Geofence event not found');
      }

      await fastify.requireOrganizationAccess(request, event.organizationId);
      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.geofence_event.read',
        entityType: 'GeofenceEvent',
        entityId: eventId,
      });
      return reply.success({ item: serializeGeofenceEvent(event) });
    }
  );
};
