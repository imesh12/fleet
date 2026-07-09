import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findVehicleTypeOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeVehicleType,
} from '../utils.js';

const vehicleTypeIdParamSchema = z.object({
  vehicleTypeId: z.string().min(1),
});

const listVehicleTypesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createVehicleTypeSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateVehicleTypeSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one vehicle type field must be supplied' });

export const adminVehicleTypeRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/vehicle-types',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-types:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listVehicleTypesQuerySchema, request.query);
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
                  some: { userId: request.currentUser!.id, status: 'ACTIVE' as const },
                },
              },
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.vehicleType.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { vehicles: true },
        }),
        fastify.prisma.vehicleType.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeVehicleType) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/vehicle-types/:vehicleTypeId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-types:read')],
    },
    async (request, reply) => {
      const { vehicleTypeId } = validateOrThrow(vehicleTypeIdParamSchema, request.params);
      const vehicleType = await findVehicleTypeOrThrow(fastify.prisma, vehicleTypeId);
      await fastify.requireOrganizationAccess(request, vehicleType.organizationId);

      return reply.success({ item: serializeVehicleType(vehicleType) });
    }
  );

  fastify.post(
    '/admin/vehicle-types',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-types:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createVehicleTypeSchema, request.body);
      const code = normalizeEntityCode(body.code);
      await fastify.requireOrganizationAccess(request, body.organizationId);

      const existing = await fastify.prisma.vehicleType.findUnique({
        where: {
          organizationId_code: {
            organizationId: body.organizationId,
            code,
          },
        },
      });

      if (existing) {
        throw new ConflictError('A vehicle type with that code already exists for this organization');
      }

      const vehicleType = await fastify.prisma.vehicleType.create({
        data: {
          organizationId: body.organizationId,
          name: body.name,
          code,
          status: body.status ?? 'ACTIVE',
          ...(body.description ? { description: body.description } : {}),
        },
        include: { vehicles: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_type.create',
        entityType: 'VehicleType',
        entityId: vehicleType.id,
        metadata: { organizationId: vehicleType.organizationId, code: vehicleType.code, status: vehicleType.status },
      });

      return reply.status(201).success({ item: serializeVehicleType(vehicleType) });
    }
  );

  fastify.patch(
    '/admin/vehicle-types/:vehicleTypeId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-types:manage')],
    },
    async (request, reply) => {
      const { vehicleTypeId } = validateOrThrow(vehicleTypeIdParamSchema, request.params);
      const body = validateOrThrow(updateVehicleTypeSchema, request.body);
      const vehicleType = await findVehicleTypeOrThrow(fastify.prisma, vehicleTypeId);
      await fastify.requireOrganizationAccess(request, vehicleType.organizationId);

      const updateData = {
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      };

      const updatedVehicleType = await fastify.prisma.vehicleType.update({
        where: { id: vehicleTypeId },
        data: updateData,
        include: { vehicles: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_type.update',
        entityType: 'VehicleType',
        entityId: vehicleTypeId,
        metadata: updateData,
      });

      return reply.success({ item: serializeVehicleType(updatedVehicleType) });
    }
  );

  fastify.post(
    '/admin/vehicle-types/:vehicleTypeId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-types:manage')],
    },
    async (request, reply) => {
      const { vehicleTypeId } = validateOrThrow(vehicleTypeIdParamSchema, request.params);
      const vehicleType = await findVehicleTypeOrThrow(fastify.prisma, vehicleTypeId);
      await fastify.requireOrganizationAccess(request, vehicleType.organizationId);

      const updatedVehicleType = await fastify.prisma.vehicleType.update({
        where: { id: vehicleTypeId },
        data: { status: 'ACTIVE' },
        include: { vehicles: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_type.activate',
        entityType: 'VehicleType',
        entityId: vehicleTypeId,
      });

      return reply.success({ item: serializeVehicleType(updatedVehicleType) });
    }
  );

  fastify.post(
    '/admin/vehicle-types/:vehicleTypeId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-types:manage')],
    },
    async (request, reply) => {
      const { vehicleTypeId } = validateOrThrow(vehicleTypeIdParamSchema, request.params);
      const vehicleType = await findVehicleTypeOrThrow(fastify.prisma, vehicleTypeId);
      await fastify.requireOrganizationAccess(request, vehicleType.organizationId);

      const updatedVehicleType = await fastify.prisma.vehicleType.update({
        where: { id: vehicleTypeId },
        data: { status: 'INACTIVE' },
        include: { vehicles: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_type.deactivate',
        entityType: 'VehicleType',
        entityId: vehicleTypeId,
      });

      return reply.success({ item: serializeVehicleType(updatedVehicleType) });
    }
  );
};
