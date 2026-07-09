import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findVehicleMakeOrThrow,
  findVehicleModelOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeVehicleModel,
} from '../utils.js';

const vehicleModelIdParamSchema = z.object({
  vehicleModelId: z.string().min(1),
});

const listVehicleModelsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  vehicleMakeId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createVehicleModelSchema = z.object({
  organizationId: z.string().min(1),
  vehicleMakeId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateVehicleModelSchema = z
  .object({
    vehicleMakeId: z.string().min(1).optional(),
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one vehicle model field must be supplied' });

export const adminVehicleModelRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/vehicle-models',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-models:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listVehicleModelsQuerySchema, request.query);
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
        ...(query.vehicleMakeId ? { vehicleMakeId: query.vehicleMakeId } : {}),
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
        fastify.prisma.vehicleModel.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { vehicleMake: true, vehicles: true },
        }),
        fastify.prisma.vehicleModel.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeVehicleModel) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/vehicle-models/:vehicleModelId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-models:read')],
    },
    async (request, reply) => {
      const { vehicleModelId } = validateOrThrow(vehicleModelIdParamSchema, request.params);
      const vehicleModel = await findVehicleModelOrThrow(fastify.prisma, vehicleModelId);
      await fastify.requireOrganizationAccess(request, vehicleModel.organizationId);

      return reply.success({ item: serializeVehicleModel(vehicleModel) });
    }
  );

  fastify.post(
    '/admin/vehicle-models',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-models:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createVehicleModelSchema, request.body);
      const code = normalizeEntityCode(body.code);
      await fastify.requireOrganizationAccess(request, body.organizationId);
      const vehicleMake = await findVehicleMakeOrThrow(fastify.prisma, body.vehicleMakeId);

      if (vehicleMake.organizationId !== body.organizationId) {
        throw new ConflictError('Vehicle make must belong to the same organization');
      }

      const existing = await fastify.prisma.vehicleModel.findUnique({
        where: {
          organizationId_code: {
            organizationId: body.organizationId,
            code,
          },
        },
      });

      if (existing) {
        throw new ConflictError('A vehicle model with that code already exists for this organization');
      }

      const vehicleModel = await fastify.prisma.vehicleModel.create({
        data: {
          organizationId: body.organizationId,
          vehicleMakeId: body.vehicleMakeId,
          name: body.name,
          code,
          status: body.status ?? 'ACTIVE',
          ...(body.description ? { description: body.description } : {}),
        },
        include: { vehicleMake: true, vehicles: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_model.create',
        entityType: 'VehicleModel',
        entityId: vehicleModel.id,
        metadata: {
          organizationId: vehicleModel.organizationId,
          code: vehicleModel.code,
          vehicleMakeId: vehicleModel.vehicleMakeId,
          status: vehicleModel.status,
        },
      });

      return reply.status(201).success({ item: serializeVehicleModel(vehicleModel) });
    }
  );

  fastify.patch(
    '/admin/vehicle-models/:vehicleModelId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-models:manage')],
    },
    async (request, reply) => {
      const { vehicleModelId } = validateOrThrow(vehicleModelIdParamSchema, request.params);
      const body = validateOrThrow(updateVehicleModelSchema, request.body);
      const vehicleModel = await findVehicleModelOrThrow(fastify.prisma, vehicleModelId);
      await fastify.requireOrganizationAccess(request, vehicleModel.organizationId);

      if (body.vehicleMakeId) {
        const vehicleMake = await findVehicleMakeOrThrow(fastify.prisma, body.vehicleMakeId);
        if (vehicleMake.organizationId !== vehicleModel.organizationId) {
          throw new ConflictError('Vehicle make must belong to the same organization');
        }
      }

      const updateData = {
        ...(body.vehicleMakeId ? { vehicleMakeId: body.vehicleMakeId } : {}),
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      };

      const updatedVehicleModel = await fastify.prisma.vehicleModel.update({
        where: { id: vehicleModelId },
        data: updateData,
        include: { vehicleMake: true, vehicles: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_model.update',
        entityType: 'VehicleModel',
        entityId: vehicleModelId,
        metadata: updateData,
      });

      return reply.success({ item: serializeVehicleModel(updatedVehicleModel) });
    }
  );

  fastify.post(
    '/admin/vehicle-models/:vehicleModelId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-models:manage')],
    },
    async (request, reply) => {
      const { vehicleModelId } = validateOrThrow(vehicleModelIdParamSchema, request.params);
      const vehicleModel = await findVehicleModelOrThrow(fastify.prisma, vehicleModelId);
      await fastify.requireOrganizationAccess(request, vehicleModel.organizationId);

      const updatedVehicleModel = await fastify.prisma.vehicleModel.update({
        where: { id: vehicleModelId },
        data: { status: 'ACTIVE' },
        include: { vehicleMake: true, vehicles: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_model.activate',
        entityType: 'VehicleModel',
        entityId: vehicleModelId,
      });

      return reply.success({ item: serializeVehicleModel(updatedVehicleModel) });
    }
  );

  fastify.post(
    '/admin/vehicle-models/:vehicleModelId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-models:manage')],
    },
    async (request, reply) => {
      const { vehicleModelId } = validateOrThrow(vehicleModelIdParamSchema, request.params);
      const vehicleModel = await findVehicleModelOrThrow(fastify.prisma, vehicleModelId);
      await fastify.requireOrganizationAccess(request, vehicleModel.organizationId);

      const updatedVehicleModel = await fastify.prisma.vehicleModel.update({
        where: { id: vehicleModelId },
        data: { status: 'INACTIVE' },
        include: { vehicleMake: true, vehicles: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_model.deactivate',
        entityType: 'VehicleModel',
        entityId: vehicleModelId,
      });

      return reply.success({ item: serializeVehicleModel(updatedVehicleModel) });
    }
  );
};
