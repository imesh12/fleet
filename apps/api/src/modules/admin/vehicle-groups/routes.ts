import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findVehicleGroupOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeVehicleGroup,
} from '../utils.js';

const vehicleGroupIdParamSchema = z.object({
  vehicleGroupId: z.string().min(1),
});

const listVehicleGroupsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createVehicleGroupSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateVehicleGroupSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one vehicle group field must be supplied' });

export const adminVehicleGroupRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/vehicle-groups',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-groups:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listVehicleGroupsQuerySchema, request.query);
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
        fastify.prisma.vehicleGroup.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { vehicles: true },
        }),
        fastify.prisma.vehicleGroup.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeVehicleGroup) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/vehicle-groups/:vehicleGroupId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-groups:read')],
    },
    async (request, reply) => {
      const { vehicleGroupId } = validateOrThrow(vehicleGroupIdParamSchema, request.params);
      const vehicleGroup = await findVehicleGroupOrThrow(fastify.prisma, vehicleGroupId);
      await fastify.requireOrganizationAccess(request, vehicleGroup.organizationId);

      return reply.success({ item: serializeVehicleGroup(vehicleGroup) });
    }
  );

  fastify.post(
    '/admin/vehicle-groups',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-groups:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createVehicleGroupSchema, request.body);
      const code = normalizeEntityCode(body.code);
      await fastify.requireOrganizationAccess(request, body.organizationId);

      const existing = await fastify.prisma.vehicleGroup.findUnique({
        where: {
          organizationId_code: {
            organizationId: body.organizationId,
            code,
          },
        },
      });

      if (existing) {
        throw new ConflictError('A vehicle group with that code already exists for this organization');
      }

      const vehicleGroup = await fastify.prisma.vehicleGroup.create({
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
        action: 'admin.vehicle_group.create',
        entityType: 'VehicleGroup',
        entityId: vehicleGroup.id,
        metadata: { organizationId: vehicleGroup.organizationId, code: vehicleGroup.code, status: vehicleGroup.status },
      });

      return reply.status(201).success({ item: serializeVehicleGroup(vehicleGroup) });
    }
  );

  fastify.patch(
    '/admin/vehicle-groups/:vehicleGroupId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-groups:manage')],
    },
    async (request, reply) => {
      const { vehicleGroupId } = validateOrThrow(vehicleGroupIdParamSchema, request.params);
      const body = validateOrThrow(updateVehicleGroupSchema, request.body);
      const vehicleGroup = await findVehicleGroupOrThrow(fastify.prisma, vehicleGroupId);
      await fastify.requireOrganizationAccess(request, vehicleGroup.organizationId);

      const updateData = {
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      };

      const updatedVehicleGroup = await fastify.prisma.vehicleGroup.update({
        where: { id: vehicleGroupId },
        data: updateData,
        include: { vehicles: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_group.update',
        entityType: 'VehicleGroup',
        entityId: vehicleGroupId,
        metadata: updateData,
      });

      return reply.success({ item: serializeVehicleGroup(updatedVehicleGroup) });
    }
  );

  fastify.post(
    '/admin/vehicle-groups/:vehicleGroupId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-groups:manage')],
    },
    async (request, reply) => {
      const { vehicleGroupId } = validateOrThrow(vehicleGroupIdParamSchema, request.params);
      const vehicleGroup = await findVehicleGroupOrThrow(fastify.prisma, vehicleGroupId);
      await fastify.requireOrganizationAccess(request, vehicleGroup.organizationId);

      const updatedVehicleGroup = await fastify.prisma.vehicleGroup.update({
        where: { id: vehicleGroupId },
        data: { status: 'ACTIVE' },
        include: { vehicles: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_group.activate',
        entityType: 'VehicleGroup',
        entityId: vehicleGroupId,
      });

      return reply.success({ item: serializeVehicleGroup(updatedVehicleGroup) });
    }
  );

  fastify.post(
    '/admin/vehicle-groups/:vehicleGroupId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-groups:manage')],
    },
    async (request, reply) => {
      const { vehicleGroupId } = validateOrThrow(vehicleGroupIdParamSchema, request.params);
      const vehicleGroup = await findVehicleGroupOrThrow(fastify.prisma, vehicleGroupId);
      await fastify.requireOrganizationAccess(request, vehicleGroup.organizationId);

      const updatedVehicleGroup = await fastify.prisma.vehicleGroup.update({
        where: { id: vehicleGroupId },
        data: { status: 'INACTIVE' },
        include: { vehicles: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_group.deactivate',
        entityType: 'VehicleGroup',
        entityId: vehicleGroupId,
      });

      return reply.success({ item: serializeVehicleGroup(updatedVehicleGroup) });
    }
  );
};
