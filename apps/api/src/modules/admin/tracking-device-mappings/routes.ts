import type { FastifyPluginAsync } from 'fastify';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findExternalTrackingDeviceOrThrow,
  findTrackingProviderOrThrow,
  findVehicleDeviceMappingOrThrow,
  findVehicleDeviceOrThrow,
  findVehicleOrThrow,
  getAuditContext,
  getPagination,
  paginationQuerySchema,
  serializeVehicleDeviceMapping,
  vehicleDeviceMappingStatusSchema,
} from '../utils.js';

const mappingIdParamSchema = z.object({
  mappingId: z.string().min(1),
});

const listMappingsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  trackingProviderId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  status: vehicleDeviceMappingStatusSchema.optional(),
});

const createMappingSchema = z.object({
  organizationId: z.string().min(1),
  trackingProviderId: z.string().min(1),
  externalTrackingDeviceId: z.string().min(1),
  vehicleId: z.string().min(1),
  vehicleDeviceId: z.string().min(1).optional(),
  status: vehicleDeviceMappingStatusSchema.default('ACTIVE'),
  notes: z.string().trim().optional(),
});

const updateMappingSchema = z
  .object({
    vehicleId: z.string().min(1).optional(),
    vehicleDeviceId: z.string().min(1).nullable().optional(),
    status: vehicleDeviceMappingStatusSchema.optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one mapping field must be supplied' });

export const adminTrackingDeviceMappingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/tracking/device-mappings',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-device-mappings:read')] },
    async (request, reply) => {
      const query = validateOrThrow(listMappingsQuerySchema, request.query);
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
        ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
        ...(query.status ? { status: query.status } : {}),
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
        fastify.prisma.vehicleDeviceMapping.findMany({
          where,
          skip,
          take,
          orderBy: [{ updatedAt: 'desc' }],
        }),
        fastify.prisma.vehicleDeviceMapping.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeVehicleDeviceMapping) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/tracking/device-mappings/:mappingId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-device-mappings:read')] },
    async (request, reply) => {
      const { mappingId } = validateOrThrow(mappingIdParamSchema, request.params);
      const mapping = await findVehicleDeviceMappingOrThrow(fastify.prisma, mappingId);
      await fastify.requireOrganizationAccess(request, mapping.organizationId);
      return reply.success({ item: serializeVehicleDeviceMapping(mapping) });
    }
  );

  fastify.post(
    '/admin/tracking/device-mappings',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-device-mappings:manage')] },
    async (request, reply) => {
      const body = validateOrThrow(createMappingSchema, request.body);
      await fastify.requireOrganizationAccess(request, body.organizationId);
      const [provider, externalDevice, vehicle] = await Promise.all([
        findTrackingProviderOrThrow(fastify.prisma, body.trackingProviderId),
        findExternalTrackingDeviceOrThrow(fastify.prisma, body.externalTrackingDeviceId),
        findVehicleOrThrow(fastify.prisma, body.vehicleId),
      ]);

      if (provider.organizationId !== body.organizationId || externalDevice.organizationId !== body.organizationId || vehicle.organizationId !== body.organizationId) {
        throw new ConflictError('Tracking provider, external device, and vehicle must belong to the same organization');
      }

      let vehicleDeviceId: string | null = null;
      if (body.vehicleDeviceId) {
        const vehicleDevice = await findVehicleDeviceOrThrow(fastify.prisma, body.vehicleDeviceId);
        if (vehicleDevice.vehicleId !== body.vehicleId) {
          throw new ConflictError('Vehicle device must belong to the selected vehicle');
        }
        vehicleDeviceId = vehicleDevice.id;
      }

      const mapping = await fastify.prisma.vehicleDeviceMapping.upsert({
        where: { externalTrackingDeviceId: body.externalTrackingDeviceId },
        update: {
          trackingProviderId: body.trackingProviderId,
          vehicleId: body.vehicleId,
          vehicleDeviceId,
          status: body.status ?? 'ACTIVE',
          mappedAt: new Date(),
          unmappedAt: null,
          ...(body.notes ? { notes: body.notes } : {}),
        },
        create: {
          organizationId: body.organizationId,
          trackingProviderId: body.trackingProviderId,
          externalTrackingDeviceId: body.externalTrackingDeviceId,
          vehicleId: body.vehicleId,
          status: body.status ?? 'ACTIVE',
          ...(vehicleDeviceId ? { vehicleDeviceId } : {}),
          ...(body.notes ? { notes: body.notes } : {}),
        },
      });

      await fastify.prisma.externalTrackingDevice.update({
        where: { id: externalDevice.id },
        data: { status: 'MAPPED' },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_device_mapping.upsert',
        entityType: 'VehicleDeviceMapping',
        entityId: mapping.id,
        metadata: {
          organizationId: mapping.organizationId,
          trackingProviderId: mapping.trackingProviderId,
          externalTrackingDeviceId: mapping.externalTrackingDeviceId,
          vehicleId: mapping.vehicleId,
          vehicleDeviceId: mapping.vehicleDeviceId,
          status: mapping.status,
        },
      });

      return reply.success({ item: serializeVehicleDeviceMapping(mapping) });
    }
  );

  fastify.patch(
    '/admin/tracking/device-mappings/:mappingId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-device-mappings:manage')] },
    async (request, reply) => {
      const { mappingId } = validateOrThrow(mappingIdParamSchema, request.params);
      const body = validateOrThrow(updateMappingSchema, request.body);
      const mapping = await findVehicleDeviceMappingOrThrow(fastify.prisma, mappingId);
      await fastify.requireOrganizationAccess(request, mapping.organizationId);

      if (body.vehicleId) {
        const vehicle = await findVehicleOrThrow(fastify.prisma, body.vehicleId);
        if (vehicle.organizationId !== mapping.organizationId) {
          throw new ConflictError('Vehicle must belong to the same organization');
        }
      }

      let resolvedVehicleDeviceId: string | null | undefined;
      if (body.vehicleDeviceId !== undefined) {
        if (body.vehicleDeviceId === null) {
          resolvedVehicleDeviceId = null;
        } else {
          const vehicleDevice = await findVehicleDeviceOrThrow(fastify.prisma, body.vehicleDeviceId);
          const targetVehicleId = body.vehicleId ?? mapping.vehicleId;
          if (vehicleDevice.vehicleId !== targetVehicleId) {
            throw new ConflictError('Vehicle device must belong to the selected vehicle');
          }
          resolvedVehicleDeviceId = vehicleDevice.id;
        }
      }

      const updateData = {
        ...(body.vehicleId ? { vehicleId: body.vehicleId } : {}),
        ...(resolvedVehicleDeviceId !== undefined ? { vehicleDeviceId: resolvedVehicleDeviceId } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.notes !== undefined ? { notes: body.notes ?? null } : {}),
      };

      const updatedMapping = await fastify.prisma.vehicleDeviceMapping.update({
        where: { id: mappingId },
        data: updateData,
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_device_mapping.update',
        entityType: 'VehicleDeviceMapping',
        entityId: mappingId,
        metadata: updateData,
      });

      return reply.success({ item: serializeVehicleDeviceMapping(updatedMapping) });
    }
  );

  fastify.post(
    '/admin/tracking/device-mappings/:mappingId/deactivate',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-device-mappings:manage')] },
    async (request, reply) => {
      const { mappingId } = validateOrThrow(mappingIdParamSchema, request.params);
      const mapping = await findVehicleDeviceMappingOrThrow(fastify.prisma, mappingId);
      await fastify.requireOrganizationAccess(request, mapping.organizationId);

      const updatedMapping = await fastify.prisma.vehicleDeviceMapping.update({
        where: { id: mappingId },
        data: { status: 'INACTIVE' },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_device_mapping.deactivate',
        entityType: 'VehicleDeviceMapping',
        entityId: mappingId,
      });

      return reply.success({ item: serializeVehicleDeviceMapping(updatedMapping) });
    }
  );

  fastify.post(
    '/admin/tracking/device-mappings/:mappingId/unmap',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-device-mappings:manage')] },
    async (request, reply) => {
      const { mappingId } = validateOrThrow(mappingIdParamSchema, request.params);
      const mapping = await findVehicleDeviceMappingOrThrow(fastify.prisma, mappingId);
      await fastify.requireOrganizationAccess(request, mapping.organizationId);

      const updatedMapping = await fastify.prisma.vehicleDeviceMapping.update({
        where: { id: mappingId },
        data: {
          status: 'UNMAPPED',
          unmappedAt: new Date(),
        },
      });

      await fastify.prisma.externalTrackingDevice.update({
        where: { id: mapping.externalTrackingDeviceId },
        data: { status: 'INACTIVE' },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_device_mapping.unmap',
        entityType: 'VehicleDeviceMapping',
        entityId: mappingId,
      });

      return reply.success({ item: serializeVehicleDeviceMapping(updatedMapping) });
    }
  );
};
