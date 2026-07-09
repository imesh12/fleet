import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findServiceAreaOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeServiceArea,
  serializeServiceAreaLocation,
} from '../utils.js';

const serviceAreaIdParamSchema = z.object({
  serviceAreaId: z.string().min(1),
});

const serviceAreaLocationParamSchema = z.object({
  serviceAreaId: z.string().min(1),
  customerLocationId: z.string().min(1),
});

const listServiceAreasQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createServiceAreaSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateServiceAreaSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one service area field must be supplied' });

const addServiceAreaLocationSchema = z.object({
  customerLocationId: z.string().min(1),
});

export const adminServiceAreaRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/service-areas',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-areas:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listServiceAreasQuerySchema, request.query);
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
        fastify.prisma.serviceArea.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { locations: true },
        }),
        fastify.prisma.serviceArea.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeServiceArea) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/service-areas/:serviceAreaId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-areas:read')],
    },
    async (request, reply) => {
      const { serviceAreaId } = validateOrThrow(serviceAreaIdParamSchema, request.params);
      const area = await findServiceAreaOrThrow(fastify.prisma, serviceAreaId);
      await fastify.requireOrganizationAccess(request, area.organizationId);

      return reply.success({
        item: {
          ...serializeServiceArea(area),
          locations: area.locations.map(serializeServiceAreaLocation),
        },
      });
    }
  );

  fastify.post(
    '/admin/service-areas',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-areas:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createServiceAreaSchema, request.body);
      const code = normalizeEntityCode(body.code);
      const status = body.status ?? 'ACTIVE';
      await fastify.requireOrganizationAccess(request, body.organizationId);

      const existing = await fastify.prisma.serviceArea.findUnique({
        where: {
          organizationId_code: {
            organizationId: body.organizationId,
            code,
          },
        },
      });

      if (existing) {
        throw new ConflictError('A service area with that code already exists for this organization');
      }

      const area = await fastify.prisma.serviceArea.create({
        data: {
          organizationId: body.organizationId,
          name: body.name,
          code,
          status,
          ...(body.description ? { description: body.description } : {}),
        },
        include: { locations: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_area.create',
        entityType: 'ServiceArea',
        entityId: area.id,
        metadata: { organizationId: area.organizationId, code: area.code, status: area.status },
      });

      return reply.status(201).success({ item: serializeServiceArea(area) });
    }
  );

  fastify.patch(
    '/admin/service-areas/:serviceAreaId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-areas:manage')],
    },
    async (request, reply) => {
      const { serviceAreaId } = validateOrThrow(serviceAreaIdParamSchema, request.params);
      const body = validateOrThrow(updateServiceAreaSchema, request.body);
      const area = await findServiceAreaOrThrow(fastify.prisma, serviceAreaId);
      await fastify.requireOrganizationAccess(request, area.organizationId);

      const updateData = {
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      };

      const updatedArea = await fastify.prisma.serviceArea.update({
        where: { id: serviceAreaId },
        data: updateData,
        include: { locations: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_area.update',
        entityType: 'ServiceArea',
        entityId: serviceAreaId,
        metadata: updateData,
      });

      return reply.success({ item: serializeServiceArea(updatedArea) });
    }
  );

  fastify.post(
    '/admin/service-areas/:serviceAreaId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-areas:manage')],
    },
    async (request, reply) => {
      const { serviceAreaId } = validateOrThrow(serviceAreaIdParamSchema, request.params);
      const area = await findServiceAreaOrThrow(fastify.prisma, serviceAreaId);
      await fastify.requireOrganizationAccess(request, area.organizationId);

      const updatedArea = await fastify.prisma.serviceArea.update({
        where: { id: serviceAreaId },
        data: { status: 'ACTIVE' },
        include: { locations: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_area.activate',
        entityType: 'ServiceArea',
        entityId: serviceAreaId,
      });

      return reply.success({ item: serializeServiceArea(updatedArea) });
    }
  );

  fastify.post(
    '/admin/service-areas/:serviceAreaId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-areas:manage')],
    },
    async (request, reply) => {
      const { serviceAreaId } = validateOrThrow(serviceAreaIdParamSchema, request.params);
      const area = await findServiceAreaOrThrow(fastify.prisma, serviceAreaId);
      await fastify.requireOrganizationAccess(request, area.organizationId);

      const updatedArea = await fastify.prisma.serviceArea.update({
        where: { id: serviceAreaId },
        data: { status: 'INACTIVE' },
        include: { locations: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_area.deactivate',
        entityType: 'ServiceArea',
        entityId: serviceAreaId,
      });

      return reply.success({ item: serializeServiceArea(updatedArea) });
    }
  );

  fastify.post(
    '/admin/service-areas/:serviceAreaId/locations',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-area-locations:manage')],
    },
    async (request, reply) => {
      const { serviceAreaId } = validateOrThrow(serviceAreaIdParamSchema, request.params);
      const body = validateOrThrow(addServiceAreaLocationSchema, request.body);
      const area = await findServiceAreaOrThrow(fastify.prisma, serviceAreaId);
      await fastify.requireOrganizationAccess(request, area.organizationId);

      const location = await fastify.prisma.customerLocation.findUnique({
        where: { id: body.customerLocationId },
        include: {
          customerAccount: true,
        },
      });

      if (!location) {
        throw new NotFoundError('Customer location not found');
      }

      if (location.customerAccount.organizationId !== area.organizationId) {
        throw new ConflictError('Customer location must belong to the same organization as the service area');
      }

      const link = await fastify.prisma.serviceAreaLocation.upsert({
        where: {
          serviceAreaId_customerLocationId: {
            serviceAreaId,
            customerLocationId: body.customerLocationId,
          },
        },
        update: {},
        create: {
          serviceAreaId,
          customerLocationId: body.customerLocationId,
        },
        include: {
          customerLocation: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_area_location.add',
        entityType: 'ServiceAreaLocation',
        entityId: link.id,
        metadata: { serviceAreaId, customerLocationId: body.customerLocationId },
      });

      return reply.status(201).success({ item: serializeServiceAreaLocation(link) });
    }
  );

  fastify.delete(
    '/admin/service-areas/:serviceAreaId/locations/:customerLocationId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-area-locations:manage')],
    },
    async (request, reply) => {
      const { serviceAreaId, customerLocationId } = validateOrThrow(serviceAreaLocationParamSchema, request.params);
      const area = await findServiceAreaOrThrow(fastify.prisma, serviceAreaId);
      await fastify.requireOrganizationAccess(request, area.organizationId);

      const link = await fastify.prisma.serviceAreaLocation.findUnique({
        where: {
          serviceAreaId_customerLocationId: {
            serviceAreaId,
            customerLocationId,
          },
        },
      });

      if (!link) {
        throw new NotFoundError('Service area location link not found');
      }

      await fastify.prisma.serviceAreaLocation.delete({
        where: { id: link.id },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_area_location.remove',
        entityType: 'ServiceAreaLocation',
        entityId: link.id,
        metadata: { serviceAreaId, customerLocationId },
      });

      return reply.success({ deleted: true });
    }
  );
};
