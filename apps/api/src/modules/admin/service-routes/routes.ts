import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findServiceRouteOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeServiceRoute,
  serializeServiceStop,
} from '../utils.js';

const serviceRouteIdParamSchema = z.object({
  serviceRouteId: z.string().min(1),
});

const serviceStopIdParamSchema = z.object({
  serviceRouteId: z.string().min(1),
  stopId: z.string().min(1),
});

const listServiceRoutesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createServiceRouteSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateServiceRouteSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one route field must be supplied' });

const createServiceStopSchema = z.object({
  name: z.string().min(1),
  code: z.string().trim().optional(),
  description: z.string().trim().optional(),
  sequence: z.coerce.number().int().positive().optional(),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  isActive: z.boolean().default(true),
});

const updateServiceStopSchema = z
  .object({
    name: z.string().min(1).optional(),
    code: z.string().trim().nullable().optional(),
    description: z.string().trim().nullable().optional(),
    sequence: z.coerce.number().int().positive().optional(),
    addressLine1: z.string().trim().nullable().optional(),
    addressLine2: z.string().trim().nullable().optional(),
    city: z.string().trim().nullable().optional(),
    state: z.string().trim().nullable().optional(),
    postalCode: z.string().trim().nullable().optional(),
    country: z.string().trim().nullable().optional(),
    latitude: z.coerce.number().nullable().optional(),
    longitude: z.coerce.number().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one stop field must be supplied' });

const reorderStopsSchema = z.object({
  orderedStopIds: z.array(z.string().min(1)).min(1),
});

export const adminServiceRouteRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/service-routes',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-routes:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listServiceRoutesQuerySchema, request.query);
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
        fastify.prisma.serviceRoute.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            stops: true,
          },
        }),
        fastify.prisma.serviceRoute.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeServiceRoute) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/service-routes/:serviceRouteId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-routes:read')],
    },
    async (request, reply) => {
      const { serviceRouteId } = validateOrThrow(serviceRouteIdParamSchema, request.params);
      const route = await findServiceRouteOrThrow(fastify.prisma, serviceRouteId);
      await fastify.requireOrganizationAccess(request, route.organizationId);

      return reply.success({
        item: {
          ...serializeServiceRoute(route),
          stops: route.stops.map(serializeServiceStop),
        },
      });
    }
  );

  fastify.post(
    '/admin/service-routes',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-routes:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createServiceRouteSchema, request.body);
      const code = normalizeEntityCode(body.code);
      const status = body.status ?? 'ACTIVE';
      await fastify.requireOrganizationAccess(request, body.organizationId);

      const existing = await fastify.prisma.serviceRoute.findUnique({
        where: {
          organizationId_code: {
            organizationId: body.organizationId,
            code,
          },
        },
      });

      if (existing) {
        throw new ConflictError('A service route with that code already exists for this organization');
      }

      const route = await fastify.prisma.serviceRoute.create({
        data: {
          organizationId: body.organizationId,
          name: body.name,
          code,
          status,
          ...(body.description ? { description: body.description } : {}),
        },
        include: {
          stops: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_route.create',
        entityType: 'ServiceRoute',
        entityId: route.id,
        metadata: { organizationId: route.organizationId, code: route.code, status: route.status },
      });

      return reply.status(201).success({ item: serializeServiceRoute(route) });
    }
  );

  fastify.patch(
    '/admin/service-routes/:serviceRouteId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-routes:manage')],
    },
    async (request, reply) => {
      const { serviceRouteId } = validateOrThrow(serviceRouteIdParamSchema, request.params);
      const body = validateOrThrow(updateServiceRouteSchema, request.body);
      const route = await findServiceRouteOrThrow(fastify.prisma, serviceRouteId);
      await fastify.requireOrganizationAccess(request, route.organizationId);

      const updateData = {
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      };

      const updatedRoute = await fastify.prisma.serviceRoute.update({
        where: { id: serviceRouteId },
        data: updateData,
        include: {
          stops: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_route.update',
        entityType: 'ServiceRoute',
        entityId: serviceRouteId,
        metadata: updateData,
      });

      return reply.success({ item: serializeServiceRoute(updatedRoute) });
    }
  );

  fastify.post(
    '/admin/service-routes/:serviceRouteId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-routes:manage')],
    },
    async (request, reply) => {
      const { serviceRouteId } = validateOrThrow(serviceRouteIdParamSchema, request.params);
      const route = await findServiceRouteOrThrow(fastify.prisma, serviceRouteId);
      await fastify.requireOrganizationAccess(request, route.organizationId);

      const updatedRoute = await fastify.prisma.serviceRoute.update({
        where: { id: serviceRouteId },
        data: { status: 'ACTIVE' },
        include: { stops: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_route.activate',
        entityType: 'ServiceRoute',
        entityId: serviceRouteId,
      });

      return reply.success({ item: serializeServiceRoute(updatedRoute) });
    }
  );

  fastify.post(
    '/admin/service-routes/:serviceRouteId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-routes:manage')],
    },
    async (request, reply) => {
      const { serviceRouteId } = validateOrThrow(serviceRouteIdParamSchema, request.params);
      const route = await findServiceRouteOrThrow(fastify.prisma, serviceRouteId);
      await fastify.requireOrganizationAccess(request, route.organizationId);

      const updatedRoute = await fastify.prisma.serviceRoute.update({
        where: { id: serviceRouteId },
        data: { status: 'INACTIVE' },
        include: { stops: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_route.deactivate',
        entityType: 'ServiceRoute',
        entityId: serviceRouteId,
      });

      return reply.success({ item: serializeServiceRoute(updatedRoute) });
    }
  );

  fastify.post(
    '/admin/service-routes/:serviceRouteId/stops',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-stops:manage')],
    },
    async (request, reply) => {
      const { serviceRouteId } = validateOrThrow(serviceRouteIdParamSchema, request.params);
      const body = validateOrThrow(createServiceStopSchema, request.body);
      const route = await findServiceRouteOrThrow(fastify.prisma, serviceRouteId);
      await fastify.requireOrganizationAccess(request, route.organizationId);

      const sequence =
        body.sequence ??
        (route.stops.length === 0 ? 1 : Math.max(...route.stops.map((stop) => stop.sequence)) + 1);

      const existingAtSequence = route.stops.some((stop) => stop.sequence === sequence);
      if (existingAtSequence) {
        throw new ValidationAppError('A stop already exists at that sequence for the route');
      }

      const stop = await fastify.prisma.serviceStop.create({
        data: {
          serviceRouteId,
          name: body.name,
          sequence,
          isActive: body.isActive ?? true,
          ...(body.code ? { code: body.code } : {}),
          ...(body.description ? { description: body.description } : {}),
          ...(body.addressLine1 ? { addressLine1: body.addressLine1 } : {}),
          ...(body.addressLine2 ? { addressLine2: body.addressLine2 } : {}),
          ...(body.city ? { city: body.city } : {}),
          ...(body.state ? { state: body.state } : {}),
          ...(body.postalCode ? { postalCode: body.postalCode } : {}),
          ...(body.country ? { country: body.country } : {}),
          ...(body.latitude !== undefined ? { latitude: body.latitude } : {}),
          ...(body.longitude !== undefined ? { longitude: body.longitude } : {}),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_stop.create',
        entityType: 'ServiceStop',
        entityId: stop.id,
        metadata: { serviceRouteId, sequence: stop.sequence },
      });

      return reply.status(201).success({ item: serializeServiceStop(stop) });
    }
  );

  fastify.patch(
    '/admin/service-routes/:serviceRouteId/stops/:stopId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-stops:manage')],
    },
    async (request, reply) => {
      const { serviceRouteId, stopId } = validateOrThrow(serviceStopIdParamSchema, request.params);
      const body = validateOrThrow(updateServiceStopSchema, request.body);
      const route = await findServiceRouteOrThrow(fastify.prisma, serviceRouteId);
      await fastify.requireOrganizationAccess(request, route.organizationId);

      const stop = route.stops.find((entry) => entry.id === stopId);
      if (!stop) {
        throw new NotFoundError('Service stop not found');
      }

      if (body.sequence !== undefined && body.sequence !== stop.sequence) {
        const sequenceTaken = route.stops.some((entry) => entry.id !== stopId && entry.sequence === body.sequence);
        if (sequenceTaken) {
          throw new ValidationAppError('A stop already exists at that sequence for the route');
        }
      }

      const updateData = {
        ...(body.name ? { name: body.name } : {}),
        ...(body.code !== undefined ? { code: body.code } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.sequence !== undefined ? { sequence: body.sequence } : {}),
        ...(body.addressLine1 !== undefined ? { addressLine1: body.addressLine1 } : {}),
        ...(body.addressLine2 !== undefined ? { addressLine2: body.addressLine2 } : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(body.state !== undefined ? { state: body.state } : {}),
        ...(body.postalCode !== undefined ? { postalCode: body.postalCode } : {}),
        ...(body.country !== undefined ? { country: body.country } : {}),
        ...(body.latitude !== undefined ? { latitude: body.latitude } : {}),
        ...(body.longitude !== undefined ? { longitude: body.longitude } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      };

      const updatedStop = await fastify.prisma.serviceStop.update({
        where: { id: stopId },
        data: updateData,
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_stop.update',
        entityType: 'ServiceStop',
        entityId: stopId,
        metadata: updateData,
      });

      return reply.success({ item: serializeServiceStop(updatedStop) });
    }
  );

  fastify.delete(
    '/admin/service-routes/:serviceRouteId/stops/:stopId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-stops:manage')],
    },
    async (request, reply) => {
      const { serviceRouteId, stopId } = validateOrThrow(serviceStopIdParamSchema, request.params);
      const route = await findServiceRouteOrThrow(fastify.prisma, serviceRouteId);
      await fastify.requireOrganizationAccess(request, route.organizationId);

      const stop = route.stops.find((entry) => entry.id === stopId);
      if (!stop) {
        throw new NotFoundError('Service stop not found');
      }

      await fastify.prisma.$transaction(async (tx) => {
        await tx.serviceStop.delete({
          where: { id: stopId },
        });

        const remainingStops = await tx.serviceStop.findMany({
          where: { serviceRouteId },
          orderBy: { sequence: 'asc' },
        });

        for (const [index, remainingStop] of remainingStops.entries()) {
          const nextSequence = index + 1;
          if (remainingStop.sequence !== nextSequence) {
            await tx.serviceStop.update({
              where: { id: remainingStop.id },
              data: { sequence: nextSequence },
            });
          }
        }
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_stop.delete',
        entityType: 'ServiceStop',
        entityId: stopId,
        metadata: { serviceRouteId },
      });

      return reply.success({ deleted: true });
    }
  );

  fastify.post(
    '/admin/service-routes/:serviceRouteId/stops/reorder',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-stops:manage')],
    },
    async (request, reply) => {
      const { serviceRouteId } = validateOrThrow(serviceRouteIdParamSchema, request.params);
      const body = validateOrThrow(reorderStopsSchema, request.body);
      const route = await findServiceRouteOrThrow(fastify.prisma, serviceRouteId);
      await fastify.requireOrganizationAccess(request, route.organizationId);

      const currentStopIds = route.stops.map((stop) => stop.id).sort();
      const submittedStopIds = [...body.orderedStopIds].sort();

      if (
        currentStopIds.length !== submittedStopIds.length ||
        currentStopIds.some((stopId, index) => stopId !== submittedStopIds[index])
      ) {
        throw new ValidationAppError('Reorder payload must include every stop for the route exactly once');
      }

      await fastify.prisma.$transaction(async (tx) => {
        for (const [index, stopId] of body.orderedStopIds.entries()) {
          await tx.serviceStop.update({
            where: { id: stopId },
            data: { sequence: index + 1 },
          });
        }
      });

      const updatedRoute = await findServiceRouteOrThrow(fastify.prisma, serviceRouteId);

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_stop.reorder',
        entityType: 'ServiceRoute',
        entityId: serviceRouteId,
        metadata: { orderedStopIds: body.orderedStopIds },
      });

      return reply.success({
        item: {
          ...serializeServiceRoute(updatedRoute),
          stops: updatedRoute.stops.map(serializeServiceStop),
        },
      });
    }
  );
};
