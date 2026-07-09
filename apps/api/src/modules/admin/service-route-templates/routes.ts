import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findServiceRouteGroupOrThrow,
  findServiceRouteTemplateOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeServiceRouteTemplate,
  serializeServiceRouteTemplateStop,
} from '../utils.js';

const serviceRouteTemplateIdParamSchema = z.object({
  serviceRouteTemplateId: z.string().min(1),
});

const serviceRouteTemplateStopIdParamSchema = z.object({
  serviceRouteTemplateId: z.string().min(1),
  stopId: z.string().min(1),
});

const listServiceRouteTemplatesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  serviceRouteGroupId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createServiceRouteTemplateSchema = z.object({
  organizationId: z.string().min(1),
  serviceRouteGroupId: z.string().min(1).optional(),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateServiceRouteTemplateSchema = z
  .object({
    serviceRouteGroupId: z.string().min(1).nullable().optional(),
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one template field must be supplied' });

const createServiceRouteTemplateStopSchema = z.object({
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

const updateServiceRouteTemplateStopSchema = z
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
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one template stop field must be supplied' });

const reorderTemplateStopsSchema = z.object({
  orderedStopIds: z.array(z.string().min(1)).min(1),
});

export const adminServiceRouteTemplateRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/service-route-templates',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-templates:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listServiceRouteTemplatesQuerySchema, request.query);
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
        ...(query.serviceRouteGroupId ? { serviceRouteGroupId: query.serviceRouteGroupId } : {}),
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
        fastify.prisma.serviceRouteTemplate.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: { stops: true },
        }),
        fastify.prisma.serviceRouteTemplate.count({ where }),
      ]);

      return reply.success(
        { items: items.map(serializeServiceRouteTemplate) },
        buildPaginationMeta({ page, pageSize, total })
      );
    }
  );

  fastify.get(
    '/admin/service-route-templates/:serviceRouteTemplateId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-templates:read')],
    },
    async (request, reply) => {
      const { serviceRouteTemplateId } = validateOrThrow(serviceRouteTemplateIdParamSchema, request.params);
      const template = await findServiceRouteTemplateOrThrow(fastify.prisma, serviceRouteTemplateId);
      await fastify.requireOrganizationAccess(request, template.organizationId);

      return reply.success({
        item: {
          ...serializeServiceRouteTemplate(template),
          stops: template.stops.map(serializeServiceRouteTemplateStop),
        },
      });
    }
  );

  fastify.post(
    '/admin/service-route-templates',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-templates:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createServiceRouteTemplateSchema, request.body);
      const code = normalizeEntityCode(body.code);
      await fastify.requireOrganizationAccess(request, body.organizationId);

      if (body.serviceRouteGroupId) {
        const group = await findServiceRouteGroupOrThrow(fastify.prisma, body.serviceRouteGroupId);
        if (group.organizationId !== body.organizationId) {
          throw new ConflictError('Service route group must belong to the same organization');
        }
      }

      const existing = await fastify.prisma.serviceRouteTemplate.findUnique({
        where: {
          organizationId_code: {
            organizationId: body.organizationId,
            code,
          },
        },
      });

      if (existing) {
        throw new ConflictError('A service route template with that code already exists for this organization');
      }

      const template = await fastify.prisma.serviceRouteTemplate.create({
        data: {
          organizationId: body.organizationId,
          name: body.name,
          code,
          status: body.status ?? 'ACTIVE',
          ...(body.serviceRouteGroupId ? { serviceRouteGroupId: body.serviceRouteGroupId } : {}),
          ...(body.description ? { description: body.description } : {}),
        },
        include: { stops: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_route_template.create',
        entityType: 'ServiceRouteTemplate',
        entityId: template.id,
        metadata: { organizationId: template.organizationId, code: template.code, serviceRouteGroupId: template.serviceRouteGroupId },
      });

      return reply.status(201).success({ item: serializeServiceRouteTemplate(template) });
    }
  );

  fastify.patch(
    '/admin/service-route-templates/:serviceRouteTemplateId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-templates:manage')],
    },
    async (request, reply) => {
      const { serviceRouteTemplateId } = validateOrThrow(serviceRouteTemplateIdParamSchema, request.params);
      const body = validateOrThrow(updateServiceRouteTemplateSchema, request.body);
      const template = await findServiceRouteTemplateOrThrow(fastify.prisma, serviceRouteTemplateId);
      await fastify.requireOrganizationAccess(request, template.organizationId);

      if (body.serviceRouteGroupId) {
        const group = await findServiceRouteGroupOrThrow(fastify.prisma, body.serviceRouteGroupId);
        if (group.organizationId !== template.organizationId) {
          throw new ConflictError('Service route group must belong to the same organization');
        }
      }

      const updateData = {
        ...(body.serviceRouteGroupId !== undefined ? { serviceRouteGroupId: body.serviceRouteGroupId } : {}),
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      };

      const updatedTemplate = await fastify.prisma.serviceRouteTemplate.update({
        where: { id: serviceRouteTemplateId },
        data: updateData,
        include: { stops: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_route_template.update',
        entityType: 'ServiceRouteTemplate',
        entityId: serviceRouteTemplateId,
        metadata: updateData,
      });

      return reply.success({ item: serializeServiceRouteTemplate(updatedTemplate) });
    }
  );

  fastify.post(
    '/admin/service-route-templates/:serviceRouteTemplateId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-templates:manage')],
    },
    async (request, reply) => {
      const { serviceRouteTemplateId } = validateOrThrow(serviceRouteTemplateIdParamSchema, request.params);
      const template = await findServiceRouteTemplateOrThrow(fastify.prisma, serviceRouteTemplateId);
      await fastify.requireOrganizationAccess(request, template.organizationId);

      const updatedTemplate = await fastify.prisma.serviceRouteTemplate.update({
        where: { id: serviceRouteTemplateId },
        data: { status: 'ACTIVE' },
        include: { stops: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_route_template.activate',
        entityType: 'ServiceRouteTemplate',
        entityId: serviceRouteTemplateId,
      });

      return reply.success({ item: serializeServiceRouteTemplate(updatedTemplate) });
    }
  );

  fastify.post(
    '/admin/service-route-templates/:serviceRouteTemplateId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-templates:manage')],
    },
    async (request, reply) => {
      const { serviceRouteTemplateId } = validateOrThrow(serviceRouteTemplateIdParamSchema, request.params);
      const template = await findServiceRouteTemplateOrThrow(fastify.prisma, serviceRouteTemplateId);
      await fastify.requireOrganizationAccess(request, template.organizationId);

      const updatedTemplate = await fastify.prisma.serviceRouteTemplate.update({
        where: { id: serviceRouteTemplateId },
        data: { status: 'INACTIVE' },
        include: { stops: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_route_template.deactivate',
        entityType: 'ServiceRouteTemplate',
        entityId: serviceRouteTemplateId,
      });

      return reply.success({ item: serializeServiceRouteTemplate(updatedTemplate) });
    }
  );

  fastify.post(
    '/admin/service-route-templates/:serviceRouteTemplateId/stops',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-template-stops:manage')],
    },
    async (request, reply) => {
      const { serviceRouteTemplateId } = validateOrThrow(serviceRouteTemplateIdParamSchema, request.params);
      const body = validateOrThrow(createServiceRouteTemplateStopSchema, request.body);
      const template = await findServiceRouteTemplateOrThrow(fastify.prisma, serviceRouteTemplateId);
      await fastify.requireOrganizationAccess(request, template.organizationId);

      const sequence =
        body.sequence ??
        (template.stops.length === 0 ? 1 : Math.max(...template.stops.map((stop) => stop.sequence)) + 1);

      if (template.stops.some((stop) => stop.sequence === sequence)) {
        throw new ValidationAppError('A template stop already exists at that sequence');
      }

      const stop = await fastify.prisma.serviceRouteTemplateStop.create({
        data: {
          serviceRouteTemplateId,
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
        action: 'admin.service_route_template_stop.create',
        entityType: 'ServiceRouteTemplateStop',
        entityId: stop.id,
        metadata: { serviceRouteTemplateId, sequence: stop.sequence },
      });

      return reply.status(201).success({ item: serializeServiceRouteTemplateStop(stop) });
    }
  );

  fastify.patch(
    '/admin/service-route-templates/:serviceRouteTemplateId/stops/:stopId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-template-stops:manage')],
    },
    async (request, reply) => {
      const { serviceRouteTemplateId, stopId } = validateOrThrow(serviceRouteTemplateStopIdParamSchema, request.params);
      const body = validateOrThrow(updateServiceRouteTemplateStopSchema, request.body);
      const template = await findServiceRouteTemplateOrThrow(fastify.prisma, serviceRouteTemplateId);
      await fastify.requireOrganizationAccess(request, template.organizationId);

      const stop = template.stops.find((entry) => entry.id === stopId);
      if (!stop) {
        throw new NotFoundError('Service route template stop not found');
      }

      if (body.sequence !== undefined && body.sequence !== stop.sequence) {
        if (template.stops.some((entry) => entry.id !== stopId && entry.sequence === body.sequence)) {
          throw new ValidationAppError('A template stop already exists at that sequence');
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

      const updatedStop = await fastify.prisma.serviceRouteTemplateStop.update({
        where: { id: stopId },
        data: updateData,
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_route_template_stop.update',
        entityType: 'ServiceRouteTemplateStop',
        entityId: stopId,
        metadata: updateData,
      });

      return reply.success({ item: serializeServiceRouteTemplateStop(updatedStop) });
    }
  );

  fastify.delete(
    '/admin/service-route-templates/:serviceRouteTemplateId/stops/:stopId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-template-stops:manage')],
    },
    async (request, reply) => {
      const { serviceRouteTemplateId, stopId } = validateOrThrow(serviceRouteTemplateStopIdParamSchema, request.params);
      const template = await findServiceRouteTemplateOrThrow(fastify.prisma, serviceRouteTemplateId);
      await fastify.requireOrganizationAccess(request, template.organizationId);

      const stop = template.stops.find((entry) => entry.id === stopId);
      if (!stop) {
        throw new NotFoundError('Service route template stop not found');
      }

      await fastify.prisma.$transaction(async (tx) => {
        await tx.serviceRouteTemplateStop.delete({ where: { id: stopId } });

        const remainingStops = await tx.serviceRouteTemplateStop.findMany({
          where: { serviceRouteTemplateId },
          orderBy: { sequence: 'asc' },
        });

        for (const [index, remainingStop] of remainingStops.entries()) {
          const nextSequence = index + 1;
          if (remainingStop.sequence !== nextSequence) {
            await tx.serviceRouteTemplateStop.update({
              where: { id: remainingStop.id },
              data: { sequence: nextSequence },
            });
          }
        }
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_route_template_stop.delete',
        entityType: 'ServiceRouteTemplateStop',
        entityId: stopId,
        metadata: { serviceRouteTemplateId },
      });

      return reply.success({ deleted: true });
    }
  );

  fastify.post(
    '/admin/service-route-templates/:serviceRouteTemplateId/stops/reorder',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('service-route-template-stops:manage')],
    },
    async (request, reply) => {
      const { serviceRouteTemplateId } = validateOrThrow(serviceRouteTemplateIdParamSchema, request.params);
      const body = validateOrThrow(reorderTemplateStopsSchema, request.body);
      const template = await findServiceRouteTemplateOrThrow(fastify.prisma, serviceRouteTemplateId);
      await fastify.requireOrganizationAccess(request, template.organizationId);

      const currentStopIds = template.stops.map((stop) => stop.id).sort();
      const submittedStopIds = [...body.orderedStopIds].sort();

      if (
        currentStopIds.length !== submittedStopIds.length ||
        currentStopIds.some((stopId, index) => stopId !== submittedStopIds[index])
      ) {
        throw new ValidationAppError('Reorder payload must include every template stop exactly once');
      }

      await fastify.prisma.$transaction(async (tx) => {
        for (const [index, stopId] of body.orderedStopIds.entries()) {
          await tx.serviceRouteTemplateStop.update({
            where: { id: stopId },
            data: { sequence: index + 1 },
          });
        }
      });

      const updatedTemplate = await findServiceRouteTemplateOrThrow(fastify.prisma, serviceRouteTemplateId);

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.service_route_template_stop.reorder',
        entityType: 'ServiceRouteTemplate',
        entityId: serviceRouteTemplateId,
        metadata: { orderedStopIds: body.orderedStopIds },
      });

      return reply.success({
        item: {
          ...serializeServiceRouteTemplate(updatedTemplate),
          stops: updatedTemplate.stops.map(serializeServiceRouteTemplateStop),
        },
      });
    }
  );
};
