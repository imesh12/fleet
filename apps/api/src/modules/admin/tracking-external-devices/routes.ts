import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findExternalTrackingDeviceOrThrow,
  findTrackingProviderOrThrow,
  getAuditContext,
  getPagination,
  paginationQuerySchema,
  serializeExternalTrackingDevice,
  trackingDeviceDiscoveryStatusSchema,
} from '../utils.js';

const jsonRecordSchema = z.record(z.string(), z.unknown());

const externalDeviceIdParamSchema = z.object({
  externalDeviceId: z.string().min(1),
});

const listExternalDevicesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  trackingProviderId: z.string().min(1).optional(),
  status: trackingDeviceDiscoveryStatusSchema.optional(),
  search: z.string().trim().optional(),
});

const upsertExternalDeviceSchema = z.object({
  organizationId: z.string().min(1),
  trackingProviderId: z.string().min(1),
  externalDeviceId: z.string().min(1),
  providerUniqueId: z.string().trim().optional(),
  name: z.string().trim().optional(),
  imei: z.string().trim().optional(),
  model: z.string().trim().optional(),
  phoneNumber: z.string().trim().optional(),
  status: trackingDeviceDiscoveryStatusSchema.default('DISCOVERED'),
  lastSeenAt: z.coerce.date().optional(),
  lastPayload: z.unknown().optional(),
  metadata: jsonRecordSchema.optional(),
});

export const adminTrackingExternalDeviceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/tracking/external-devices',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-external-devices:read')] },
    async (request, reply) => {
      const query = validateOrThrow(listExternalDevicesQuerySchema, request.query);
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
        ...(query.trackingProviderId ? { trackingProviderId: query.trackingProviderId } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.search
          ? {
              OR: [
                { externalDeviceId: { contains: query.search, mode: 'insensitive' as const } },
                { providerUniqueId: { contains: query.search, mode: 'insensitive' as const } },
                { name: { contains: query.search, mode: 'insensitive' as const } },
                { imei: { contains: query.search, mode: 'insensitive' as const } },
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
        fastify.prisma.externalTrackingDevice.findMany({
          where,
          skip,
          take,
          orderBy: [{ updatedAt: 'desc' }],
        }),
        fastify.prisma.externalTrackingDevice.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeExternalTrackingDevice) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/tracking/external-devices/:externalDeviceId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-external-devices:read')] },
    async (request, reply) => {
      const { externalDeviceId } = validateOrThrow(externalDeviceIdParamSchema, request.params);
      const device = await findExternalTrackingDeviceOrThrow(fastify.prisma, externalDeviceId);
      await fastify.requireOrganizationAccess(request, device.organizationId);

      return reply.success({ item: serializeExternalTrackingDevice(device) });
    }
  );

  fastify.post(
    '/admin/tracking/external-devices',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-external-devices:manage')] },
    async (request, reply) => {
      const body = validateOrThrow(upsertExternalDeviceSchema, request.body);
      await fastify.requireOrganizationAccess(request, body.organizationId);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, body.trackingProviderId);

      if (provider.organizationId !== body.organizationId) {
        throw new ConflictError('Tracking provider must belong to the same organization');
      }

      const device = await fastify.prisma.externalTrackingDevice.upsert({
        where: {
          trackingProviderId_externalDeviceId: {
            trackingProviderId: body.trackingProviderId,
            externalDeviceId: body.externalDeviceId,
          },
        },
        update: {
          ...(body.providerUniqueId ? { providerUniqueId: body.providerUniqueId } : {}),
          ...(body.name ? { name: body.name } : {}),
          ...(body.imei ? { imei: body.imei } : {}),
          ...(body.model ? { model: body.model } : {}),
          ...(body.phoneNumber ? { phoneNumber: body.phoneNumber } : {}),
          ...(body.status ? { status: body.status } : {}),
          ...(body.lastSeenAt ? { lastSeenAt: body.lastSeenAt } : {}),
          ...(body.lastPayload !== undefined ? { lastPayload: body.lastPayload as Prisma.InputJsonValue } : {}),
          ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
        },
        create: {
          organizationId: body.organizationId,
          trackingProviderId: body.trackingProviderId,
          externalDeviceId: body.externalDeviceId,
          status: body.status ?? 'DISCOVERED',
          ...(body.providerUniqueId ? { providerUniqueId: body.providerUniqueId } : {}),
          ...(body.name ? { name: body.name } : {}),
          ...(body.imei ? { imei: body.imei } : {}),
          ...(body.model ? { model: body.model } : {}),
          ...(body.phoneNumber ? { phoneNumber: body.phoneNumber } : {}),
          ...(body.lastSeenAt ? { lastSeenAt: body.lastSeenAt } : {}),
          ...(body.lastPayload !== undefined ? { lastPayload: body.lastPayload as Prisma.InputJsonValue } : {}),
          ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_external_device.upsert',
        entityType: 'ExternalTrackingDevice',
        entityId: device.id,
        metadata: {
          organizationId: device.organizationId,
          trackingProviderId: device.trackingProviderId,
          externalDeviceId: device.externalDeviceId,
          status: device.status,
        },
      });

      return reply.success({ item: serializeExternalTrackingDevice(device) });
    }
  );
};
