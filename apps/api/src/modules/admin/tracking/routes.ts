import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findVehicleOrThrow,
  getAuditContext,
  getPagination,
  paginationQuerySchema,
  serializeTrackingProviderHealth,
  serializeVehiclePosition,
  serializeVehicleTelemetryEvent,
} from '../utils.js';

const vehicleIdParamSchema = z.object({
  vehicleId: z.string().min(1),
});

const listLatestVehiclePositionsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  tripId: z.string().min(1).optional(),
  trackingProviderId: z.string().min(1).optional(),
  providerTimestampFrom: z.coerce.date().optional(),
  providerTimestampTo: z.coerce.date().optional(),
});

const listVehiclePositionHistoryQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  tripId: z.string().min(1).optional(),
  eventType: z.string().trim().optional(),
  providerTimestampFrom: z.coerce.date().optional(),
  providerTimestampTo: z.coerce.date().optional(),
});

const trackingHealthQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  staleMinutes: z.coerce.number().int().min(1).max(1440).default(15),
});

export const adminTrackingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/tracking/vehicles/latest',
    { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-positions:read')] },
    async (request, reply) => {
      const query = validateOrThrow(listLatestVehiclePositionsQuerySchema, request.query);
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
        ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
        ...(query.tripId ? { tripId: query.tripId } : {}),
        ...(query.trackingProviderId ? { trackingProviderId: query.trackingProviderId } : {}),
        ...(query.providerTimestampFrom || query.providerTimestampTo
          ? {
              providerTimestamp: {
                ...(query.providerTimestampFrom ? { gte: query.providerTimestampFrom } : {}),
                ...(query.providerTimestampTo ? { lte: query.providerTimestampTo } : {}),
              },
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
        fastify.prisma.vehiclePosition.findMany({
          where,
          skip,
          take,
          orderBy: [{ providerTimestamp: 'desc' }],
          include: {
            vehicle: true,
            vehicleDevice: true,
            trackingProvider: true,
            trip: true,
          },
        }),
        fastify.prisma.vehiclePosition.count({ where }),
      ]);

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_position.read',
        entityType: 'Organization',
        ...(requestedOrganizationId ? { entityId: requestedOrganizationId } : {}),
        metadata: {
          view: 'latest_positions',
          itemCount: items.length,
          filters: {
            vehicleId: query.vehicleId ?? null,
            tripId: query.tripId ?? null,
            trackingProviderId: query.trackingProviderId ?? null,
          },
        },
      });

      return reply.success(
        {
          items: items.map((item) => ({
            ...serializeVehiclePosition(item),
            vehicle: item.vehicle
              ? {
                  id: item.vehicle.id,
                  registrationNumber: item.vehicle.registrationNumber,
                  plateNumber: item.vehicle.plateNumber,
                  status: item.vehicle.status,
                }
              : null,
            vehicleDevice: item.vehicleDevice
              ? {
                  id: item.vehicleDevice.id,
                  provider: item.vehicleDevice.provider,
                  externalDeviceId: item.vehicleDevice.externalDeviceId,
                  status: item.vehicleDevice.status,
                }
              : null,
            trackingProvider: item.trackingProvider
              ? {
                  id: item.trackingProvider.id,
                  code: item.trackingProvider.code,
                  name: item.trackingProvider.name,
                  providerType: item.trackingProvider.providerType,
                }
              : null,
            trip: item.trip
              ? {
                  id: item.trip.id,
                  title: item.trip.title,
                  status: item.trip.status,
                }
              : null,
          })),
        },
        buildPaginationMeta({ page, pageSize, total })
      );
    }
  );

  fastify.get(
    '/admin/tracking/vehicles/:vehicleId/latest',
    { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-positions:read')] },
    async (request, reply) => {
      const { vehicleId } = validateOrThrow(vehicleIdParamSchema, request.params);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);

      const latestPosition = await fastify.prisma.vehiclePosition.findUnique({
        where: { vehicleId },
        include: {
          vehicle: true,
          vehicleDevice: true,
          trackingProvider: true,
          trip: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_position.read',
        entityType: 'Vehicle',
        entityId: vehicleId,
        metadata: { view: 'vehicle_latest_position' },
      });

      return reply.success({
        item: latestPosition
          ? {
              ...serializeVehiclePosition(latestPosition),
              vehicle: {
                id: vehicle.id,
                registrationNumber: vehicle.registrationNumber,
                plateNumber: vehicle.plateNumber,
                status: vehicle.status,
              },
              vehicleDevice: latestPosition.vehicleDevice
                ? {
                    id: latestPosition.vehicleDevice.id,
                    provider: latestPosition.vehicleDevice.provider,
                    externalDeviceId: latestPosition.vehicleDevice.externalDeviceId,
                    status: latestPosition.vehicleDevice.status,
                  }
                : null,
              trackingProvider: latestPosition.trackingProvider
                ? {
                    id: latestPosition.trackingProvider.id,
                    code: latestPosition.trackingProvider.code,
                    name: latestPosition.trackingProvider.name,
                    providerType: latestPosition.trackingProvider.providerType,
                  }
                : null,
              trip: latestPosition.trip
                ? {
                    id: latestPosition.trip.id,
                    title: latestPosition.trip.title,
                    status: latestPosition.trip.status,
                  }
                : null,
            }
          : null,
      });
    }
  );

  fastify.get(
    '/admin/tracking/vehicles/:vehicleId/history',
    { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-telemetry-events:read')] },
    async (request, reply) => {
      const { vehicleId } = validateOrThrow(vehicleIdParamSchema, request.params);
      const query = validateOrThrow(listVehiclePositionHistoryQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);

      if (query.organizationId && query.organizationId !== vehicle.organizationId) {
        throw new ValidationAppError('Organization filter must match the requested vehicle organization');
      }

      const where = {
        vehicleId,
        ...(query.tripId ? { tripId: query.tripId } : {}),
        ...(query.eventType ? { eventType: query.eventType } : {}),
        ...(query.providerTimestampFrom || query.providerTimestampTo
          ? {
              providerTimestamp: {
                ...(query.providerTimestampFrom ? { gte: query.providerTimestampFrom } : {}),
                ...(query.providerTimestampTo ? { lte: query.providerTimestampTo } : {}),
              },
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.vehicleTelemetryEvent.findMany({
          where,
          skip,
          take,
          orderBy: [{ providerTimestamp: 'desc' }, { createdAt: 'desc' }],
        }),
        fastify.prisma.vehicleTelemetryEvent.count({ where }),
      ]);

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_position.read',
        entityType: 'Vehicle',
        entityId: vehicleId,
        metadata: {
          view: 'vehicle_position_history',
          itemCount: items.length,
          filters: {
            tripId: query.tripId ?? null,
            eventType: query.eventType ?? null,
          },
        },
      });

      return reply.success(
        {
          items: items.map(serializeVehicleTelemetryEvent),
        },
        buildPaginationMeta({ page, pageSize, total })
      );
    }
  );

  fastify.get(
    '/admin/tracking/health',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-health:read')] },
    async (request, reply) => {
      const query = validateOrThrow(trackingHealthQuerySchema, request.query);
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

      const now = new Date();
      const staleMs = (query.staleMinutes ?? 15) * 60_000;
      const providerHealthWhere: Prisma.TrackingProviderHealthWhereInput = requestedOrganizationId
        ? {
            trackingProvider: {
              organizationId: requestedOrganizationId,
            },
          }
        : !isSuperAdmin
          ? {
              trackingProvider: {
                organization: {
                  users: {
                    some: {
                      userId: request.currentUser!.id,
                      status: 'ACTIVE',
                    },
                  },
                },
              },
            }
          : {};

      const [providerHealths, latestPositions, totalVehicles] = await Promise.all([
        fastify.prisma.trackingProviderHealth.findMany({
          where: providerHealthWhere,
          include: {
            trackingProvider: true,
          },
          orderBy: [{ updatedAt: 'desc' }],
        }),
        fastify.prisma.vehiclePosition.findMany({
          where: {
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
          },
          skip,
          take,
          orderBy: [{ providerTimestamp: 'desc' }],
          include: {
            vehicle: true,
            vehicleDevice: true,
            trackingProvider: true,
            trip: true,
          },
        }),
        fastify.prisma.vehiclePosition.count({
          where: {
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
          },
        }),
      ]);

      const vehicleStatuses = latestPositions.map((position) => {
        const lastSeenAt = position.providerTimestamp;
        const ageSeconds = Math.max(0, Math.floor((now.getTime() - lastSeenAt.getTime()) / 1000));
        const stale = now.getTime() - lastSeenAt.getTime() > staleMs;

        return {
          vehicleId: position.vehicleId,
          vehicle: {
            id: position.vehicle.id,
            registrationNumber: position.vehicle.registrationNumber,
            plateNumber: position.vehicle.plateNumber,
            status: position.vehicle.status,
          },
          latestPosition: serializeVehiclePosition(position),
          trip: position.trip
            ? {
                id: position.trip.id,
                title: position.trip.title,
                status: position.trip.status,
              }
            : null,
          lastSeenAt,
          ageSeconds,
          stale,
          offline: stale,
        };
      });

      const deviceLastSeen = latestPositions
        .filter((position) => position.vehicleDevice)
        .map((position) => {
          const lastSeenAt = position.providerTimestamp;
          const ageSeconds = Math.max(0, Math.floor((now.getTime() - lastSeenAt.getTime()) / 1000));
          const stale = now.getTime() - lastSeenAt.getTime() > staleMs;

          return {
            vehicleDeviceId: position.vehicleDevice!.id,
            vehicleId: position.vehicleId,
            provider: position.vehicleDevice!.provider,
            externalDeviceId: position.vehicleDevice!.externalDeviceId,
            status: position.vehicleDevice!.status,
            lastSeenAt,
            ageSeconds,
            stale,
          };
        });

      const providers = providerHealths.map((health) => {
        const lastSeenAt = health.lastIngestAt ?? health.lastSuccessAt ?? health.lastCheckedAt;
        const stale = lastSeenAt ? now.getTime() - lastSeenAt.getTime() > staleMs : true;

        return {
          ...serializeTrackingProviderHealth(health),
          trackingProvider: {
            id: health.trackingProvider.id,
            organizationId: health.trackingProvider.organizationId,
            name: health.trackingProvider.name,
            code: health.trackingProvider.code,
            providerType: health.trackingProvider.providerType,
            status: health.trackingProvider.status,
          },
          stale,
          offline: health.status === 'OFFLINE' || stale,
        };
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_health.read',
        entityType: 'Organization',
        ...(requestedOrganizationId ? { entityId: requestedOrganizationId } : {}),
        metadata: {
          view: 'tracking_health',
          providerCount: providers.length,
          vehicleCount: vehicleStatuses.length,
          staleMinutes: query.staleMinutes ?? 15,
        },
      });

      return reply.success(
        {
          providers,
          devices: deviceLastSeen,
          vehicles: vehicleStatuses,
        },
        buildPaginationMeta({ page, pageSize, total: totalVehicles })
      );
    }
  );
};
