import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findServiceRouteGroupOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeServiceRouteGroup,
} from '../utils.js';

const serviceRouteGroupIdParamSchema = z.object({
  serviceRouteGroupId: z.string().min(1),
});

const listServiceRouteGroupsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createServiceRouteGroupSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
  serviceRouteIds: z.array(z.string().min(1)).default([]),
});

const updateServiceRouteGroupSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
    serviceRouteIds: z.array(z.string().min(1)).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one route group field must be supplied' });

async function validateServiceRoutesBelongToOrganization(
  fastify: Parameters<FastifyPluginAsync>[0],
  organizationId: string,
  serviceRouteIds: string[]
) {
  if (serviceRouteIds.length === 0) {
    return;
  }

  const routes = await fastify.prisma.serviceRoute.findMany({
    where: {
      id: { in: serviceRouteIds },
      organizationId,
    },
  });

  if (routes.length !== serviceRouteIds.length) {
    throw new ConflictError('One or more service routes do not belong to the selected organization');
  }
}

export const adminServiceRouteGroupRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/service-route-groups',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-groups:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listServiceRouteGroupsQuerySchema, request.query);
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
        fastify.prisma.serviceRouteGroup.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { routes: true, templates: true },
        }),
        fastify.prisma.serviceRouteGroup.count({ where }),
      ]);

      return reply.success(
        { items: items.map(serializeServiceRouteGroup) },
        buildPaginationMeta({ page, pageSize, total })
      );
    }
  );

  fastify.get(
    '/admin/service-route-groups/:serviceRouteGroupId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-groups:read')],
    },
    async (request, reply) => {
      const { serviceRouteGroupId } = validateOrThrow(serviceRouteGroupIdParamSchema, request.params);
      const group = await findServiceRouteGroupOrThrow(fastify.prisma, serviceRouteGroupId);
      await fastify.requireOrganizationAccess(request, group.organizationId);

      const routeLinks = await fastify.prisma.serviceRouteGroupRoute.findMany({
        where: { serviceRouteGroupId },
        include: { serviceRoute: true },
        orderBy: { createdAt: 'asc' },
      });

      return reply.success({
        item: {
          ...serializeServiceRouteGroup(group),
          routes: routeLinks.map((link) => ({
            id: link.serviceRoute.id,
            name: link.serviceRoute.name,
            code: link.serviceRoute.code,
            status: link.serviceRoute.status,
          })),
        },
      });
    }
  );

  fastify.post(
    '/admin/service-route-groups',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-groups:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createServiceRouteGroupSchema, request.body);
      const code = normalizeEntityCode(body.code);
      await fastify.requireOrganizationAccess(request, body.organizationId);
      await validateServiceRoutesBelongToOrganization(fastify, body.organizationId, body.serviceRouteIds ?? []);

      const existing = await fastify.prisma.serviceRouteGroup.findUnique({
        where: {
          organizationId_code: {
            organizationId: body.organizationId,
            code,
          },
        },
      });

      if (existing) {
        throw new ConflictError('A service route group with that code already exists for this organization');
      }

      const group = await fastify.prisma.$transaction(async (tx) => {
        const created = await tx.serviceRouteGroup.create({
          data: {
            organizationId: body.organizationId,
            name: body.name,
            code,
            status: body.status ?? 'ACTIVE',
            ...(body.description ? { description: body.description } : {}),
          },
        });

        if ((body.serviceRouteIds ?? []).length > 0) {
          await tx.serviceRouteGroupRoute.createMany({
            data: (body.serviceRouteIds ?? []).map((serviceRouteId) => ({
              serviceRouteGroupId: created.id,
              serviceRouteId,
            })),
          });
        }

        return tx.serviceRouteGroup.findUniqueOrThrow({
          where: { id: created.id },
          include: { routes: true, templates: true },
        });
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_route_group.create',
        entityType: 'ServiceRouteGroup',
        entityId: group.id,
        metadata: { organizationId: group.organizationId, code: group.code, serviceRouteIds: body.serviceRouteIds ?? [] },
      });

      return reply.status(201).success({ item: serializeServiceRouteGroup(group) });
    }
  );

  fastify.patch(
    '/admin/service-route-groups/:serviceRouteGroupId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-groups:manage')],
    },
    async (request, reply) => {
      const { serviceRouteGroupId } = validateOrThrow(serviceRouteGroupIdParamSchema, request.params);
      const body = validateOrThrow(updateServiceRouteGroupSchema, request.body);
      const group = await findServiceRouteGroupOrThrow(fastify.prisma, serviceRouteGroupId);
      await fastify.requireOrganizationAccess(request, group.organizationId);
      if (body.serviceRouteIds) {
        await validateServiceRoutesBelongToOrganization(fastify, group.organizationId, body.serviceRouteIds);
      }

      const updatedGroup = await fastify.prisma.$transaction(async (tx) => {
        await tx.serviceRouteGroup.update({
          where: { id: serviceRouteGroupId },
          data: {
            ...(body.name ? { name: body.name } : {}),
            ...(body.description !== undefined ? { description: body.description } : {}),
          },
        });

        if (body.serviceRouteIds) {
          await tx.serviceRouteGroupRoute.deleteMany({
            where: { serviceRouteGroupId },
          });

          if (body.serviceRouteIds.length > 0) {
            await tx.serviceRouteGroupRoute.createMany({
              data: body.serviceRouteIds.map((serviceRouteId) => ({
                serviceRouteGroupId,
                serviceRouteId,
              })),
            });
          }
        }

        return tx.serviceRouteGroup.findUniqueOrThrow({
          where: { id: serviceRouteGroupId },
          include: { routes: true, templates: true },
        });
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_route_group.update',
        entityType: 'ServiceRouteGroup',
        entityId: serviceRouteGroupId,
        metadata: {
          ...(body.name ? { name: body.name } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.serviceRouteIds ? { serviceRouteIds: body.serviceRouteIds } : {}),
        },
      });

      return reply.success({ item: serializeServiceRouteGroup(updatedGroup) });
    }
  );

  fastify.post(
    '/admin/service-route-groups/:serviceRouteGroupId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-groups:manage')],
    },
    async (request, reply) => {
      const { serviceRouteGroupId } = validateOrThrow(serviceRouteGroupIdParamSchema, request.params);
      const group = await findServiceRouteGroupOrThrow(fastify.prisma, serviceRouteGroupId);
      await fastify.requireOrganizationAccess(request, group.organizationId);

      const updatedGroup = await fastify.prisma.serviceRouteGroup.update({
        where: { id: serviceRouteGroupId },
        data: { status: 'ACTIVE' },
        include: { routes: true, templates: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_route_group.activate',
        entityType: 'ServiceRouteGroup',
        entityId: serviceRouteGroupId,
      });

      return reply.success({ item: serializeServiceRouteGroup(updatedGroup) });
    }
  );

  fastify.post(
    '/admin/service-route-groups/:serviceRouteGroupId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-groups:manage')],
    },
    async (request, reply) => {
      const { serviceRouteGroupId } = validateOrThrow(serviceRouteGroupIdParamSchema, request.params);
      const group = await findServiceRouteGroupOrThrow(fastify.prisma, serviceRouteGroupId);
      await fastify.requireOrganizationAccess(request, group.organizationId);

      const updatedGroup = await fastify.prisma.serviceRouteGroup.update({
        where: { id: serviceRouteGroupId },
        data: { status: 'INACTIVE' },
        include: { routes: true, templates: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_route_group.deactivate',
        entityType: 'ServiceRouteGroup',
        entityId: serviceRouteGroupId,
      });

      return reply.success({ item: serializeServiceRouteGroup(updatedGroup) });
    }
  );
};
