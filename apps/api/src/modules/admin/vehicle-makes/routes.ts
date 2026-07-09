import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findVehicleMakeOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeVehicleMake,
} from '../utils.js';

const vehicleMakeIdParamSchema = z.object({
  vehicleMakeId: z.string().min(1),
});

const listVehicleMakesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createVehicleMakeSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateVehicleMakeSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one vehicle make field must be supplied' });

export const adminVehicleMakeRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/vehicle-makes',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-makes:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listVehicleMakesQuerySchema, request.query);
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
        fastify.prisma.vehicleMake.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { models: true, vehicles: true },
        }),
        fastify.prisma.vehicleMake.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeVehicleMake) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/vehicle-makes/:vehicleMakeId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-makes:read')],
    },
    async (request, reply) => {
      const { vehicleMakeId } = validateOrThrow(vehicleMakeIdParamSchema, request.params);
      const vehicleMake = await findVehicleMakeOrThrow(fastify.prisma, vehicleMakeId);
      await fastify.requireOrganizationAccess(request, vehicleMake.organizationId);

      return reply.success({ item: serializeVehicleMake(vehicleMake) });
    }
  );

  fastify.post(
    '/admin/vehicle-makes',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-makes:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createVehicleMakeSchema, request.body);
      const code = normalizeEntityCode(body.code);
      await fastify.requireOrganizationAccess(request, body.organizationId);

      const existing = await fastify.prisma.vehicleMake.findUnique({
        where: {
          organizationId_code: {
            organizationId: body.organizationId,
            code,
          },
        },
      });

      if (existing) {
        throw new ConflictError('A vehicle make with that code already exists for this organization');
      }

      const vehicleMake = await fastify.prisma.vehicleMake.create({
        data: {
          organizationId: body.organizationId,
          name: body.name,
          code,
          status: body.status ?? 'ACTIVE',
          ...(body.description ? { description: body.description } : {}),
        },
        include: { models: true, vehicles: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_make.create',
        entityType: 'VehicleMake',
        entityId: vehicleMake.id,
        metadata: { organizationId: vehicleMake.organizationId, code: vehicleMake.code, status: vehicleMake.status },
      });

      return reply.status(201).success({ item: serializeVehicleMake(vehicleMake) });
    }
  );

  fastify.patch(
    '/admin/vehicle-makes/:vehicleMakeId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-makes:manage')],
    },
    async (request, reply) => {
      const { vehicleMakeId } = validateOrThrow(vehicleMakeIdParamSchema, request.params);
      const body = validateOrThrow(updateVehicleMakeSchema, request.body);
      const vehicleMake = await findVehicleMakeOrThrow(fastify.prisma, vehicleMakeId);
      await fastify.requireOrganizationAccess(request, vehicleMake.organizationId);

      const updateData = {
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      };

      const updatedVehicleMake = await fastify.prisma.vehicleMake.update({
        where: { id: vehicleMakeId },
        data: updateData,
        include: { models: true, vehicles: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_make.update',
        entityType: 'VehicleMake',
        entityId: vehicleMakeId,
        metadata: updateData,
      });

      return reply.success({ item: serializeVehicleMake(updatedVehicleMake) });
    }
  );

  fastify.post(
    '/admin/vehicle-makes/:vehicleMakeId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-makes:manage')],
    },
    async (request, reply) => {
      const { vehicleMakeId } = validateOrThrow(vehicleMakeIdParamSchema, request.params);
      const vehicleMake = await findVehicleMakeOrThrow(fastify.prisma, vehicleMakeId);
      await fastify.requireOrganizationAccess(request, vehicleMake.organizationId);

      const updatedVehicleMake = await fastify.prisma.vehicleMake.update({
        where: { id: vehicleMakeId },
        data: { status: 'ACTIVE' },
        include: { models: true, vehicles: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_make.activate',
        entityType: 'VehicleMake',
        entityId: vehicleMakeId,
      });

      return reply.success({ item: serializeVehicleMake(updatedVehicleMake) });
    }
  );

  fastify.post(
    '/admin/vehicle-makes/:vehicleMakeId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-makes:manage')],
    },
    async (request, reply) => {
      const { vehicleMakeId } = validateOrThrow(vehicleMakeIdParamSchema, request.params);
      const vehicleMake = await findVehicleMakeOrThrow(fastify.prisma, vehicleMakeId);
      await fastify.requireOrganizationAccess(request, vehicleMake.organizationId);

      const updatedVehicleMake = await fastify.prisma.vehicleMake.update({
        where: { id: vehicleMakeId },
        data: { status: 'INACTIVE' },
        include: { models: true, vehicles: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_make.deactivate',
        entityType: 'VehicleMake',
        entityId: vehicleMakeId,
      });

      return reply.success({ item: serializeVehicleMake(updatedVehicleMake) });
    }
  );
};
