import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findServiceRouteOrThrow,
  findServiceRouteTemplateOrThrow,
  findTripTemplateOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeTripTemplate,
  serializeTripTemplateStop,
} from '../utils.js';

const tripTemplateIdParamSchema = z.object({
  tripTemplateId: z.string().min(1),
});

const tripTemplateStopIdParamSchema = z.object({
  tripTemplateId: z.string().min(1),
  stopId: z.string().min(1),
});

const listTripTemplatesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createTripTemplateSchema = z.object({
  organizationId: z.string().min(1),
  serviceRouteId: z.string().min(1).optional(),
  serviceRouteTemplateId: z.string().min(1).optional(),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateTripTemplateSchema = z
  .object({
    serviceRouteId: z.string().min(1).nullable().optional(),
    serviceRouteTemplateId: z.string().min(1).nullable().optional(),
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one trip template field must be supplied' });

const createTripTemplateStopSchema = z.object({
  serviceStopId: z.string().min(1).optional(),
  serviceRouteTemplateStopId: z.string().min(1).optional(),
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

const updateTripTemplateStopSchema = z
  .object({
    serviceStopId: z.string().min(1).nullable().optional(),
    serviceRouteTemplateStopId: z.string().min(1).nullable().optional(),
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
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one trip template stop field must be supplied' });

const reorderTripTemplateStopsSchema = z.object({
  orderedStopIds: z.array(z.string().min(1)).min(1),
});

async function assertTripTemplateRelations(
  fastify: Parameters<FastifyPluginAsync>[0],
  organizationId: string,
  input: {
    serviceRouteId?: string | null | undefined;
    serviceRouteTemplateId?: string | null | undefined;
  }
) {
  if (input.serviceRouteId) {
    const route = await findServiceRouteOrThrow(fastify.prisma, input.serviceRouteId);
    if (route.organizationId !== organizationId) {
      throw new ConflictError('Service route must belong to the same organization');
    }
  }

  if (input.serviceRouteTemplateId) {
    const routeTemplate = await findServiceRouteTemplateOrThrow(fastify.prisma, input.serviceRouteTemplateId);
    if (routeTemplate.organizationId !== organizationId) {
      throw new ConflictError('Service route template must belong to the same organization');
    }
  }
}

async function assertTripTemplateCodeUnique(
  fastify: Parameters<FastifyPluginAsync>[0],
  input: { organizationId: string; code: string; excludeTripTemplateId?: string }
) {
  const existing = await fastify.prisma.tripTemplate.findFirst({
    where: {
      organizationId: input.organizationId,
      code: input.code,
      ...(input.excludeTripTemplateId ? { id: { not: input.excludeTripTemplateId } } : {}),
    },
  });

  if (existing) {
    throw new ConflictError('A trip template with that code already exists for this organization');
  }
}

async function assertTripTemplateStopReferences(
  fastify: Parameters<FastifyPluginAsync>[0],
  template: Awaited<ReturnType<typeof findTripTemplateOrThrow>>,
  input: {
    serviceStopId?: string | null | undefined;
    serviceRouteTemplateStopId?: string | null | undefined;
  }
) {
  if (input.serviceStopId) {
    const route = template.serviceRouteId ? await findServiceRouteOrThrow(fastify.prisma, template.serviceRouteId) : null;
    const serviceStop = route?.stops.find((entry) => entry.id === input.serviceStopId);
    if (!serviceStop) {
      throw new ValidationAppError('Trip template stop service stop must belong to the linked service route');
    }
  }

  if (input.serviceRouteTemplateStopId) {
    const routeTemplate = template.serviceRouteTemplateId
      ? await findServiceRouteTemplateOrThrow(fastify.prisma, template.serviceRouteTemplateId)
      : null;
    const templateStop = routeTemplate?.stops.find((entry) => entry.id === input.serviceRouteTemplateStopId);
    if (!templateStop) {
      throw new ValidationAppError('Trip template stop template stop must belong to the linked service route template');
    }
  }
}

export const adminTripTemplateRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/trip-templates', { preHandler: [fastify.authenticate, fastify.requirePermission('trip-templates:read')] }, async (request, reply) => {
    const query = validateOrThrow(listTripTemplatesQuerySchema, request.query);
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
      fastify.prisma.tripTemplate.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { stops: true },
      }),
      fastify.prisma.tripTemplate.count({ where }),
    ]);

    return reply.success({ items: items.map(serializeTripTemplate) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/trip-templates/:tripTemplateId', { preHandler: [fastify.authenticate, fastify.requirePermission('trip-templates:read')] }, async (request, reply) => {
    const { tripTemplateId } = validateOrThrow(tripTemplateIdParamSchema, request.params);
    const template = await findTripTemplateOrThrow(fastify.prisma, tripTemplateId);
    await fastify.requireOrganizationAccess(request, template.organizationId);

    return reply.success({
      item: {
        ...serializeTripTemplate(template),
        stops: template.stops.map(serializeTripTemplateStop),
      },
    });
  });

  fastify.post('/admin/trip-templates', { preHandler: [fastify.authenticate, fastify.requirePermission('trip-templates:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createTripTemplateSchema, request.body);
    const code = normalizeEntityCode(body.code);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    await assertTripTemplateRelations(fastify, body.organizationId, body);
    await assertTripTemplateCodeUnique(fastify, { organizationId: body.organizationId, code });

    const template = await fastify.prisma.tripTemplate.create({
      data: {
        organizationId: body.organizationId,
        name: body.name,
        code,
        status: body.status ?? 'ACTIVE',
        ...(body.serviceRouteId ? { serviceRouteId: body.serviceRouteId } : {}),
        ...(body.serviceRouteTemplateId ? { serviceRouteTemplateId: body.serviceRouteTemplateId } : {}),
        ...(body.description ? { description: body.description } : {}),
      },
      include: { stops: true },
    });

    await fastify.audit.write({
      ...getAuditContext(request),
      action: 'admin.trip_template.create',
      entityType: 'TripTemplate',
      entityId: template.id,
      metadata: { organizationId: template.organizationId, code: template.code, status: template.status },
    });

    return reply.status(201).success({ item: serializeTripTemplate(template) });
  });

  fastify.patch('/admin/trip-templates/:tripTemplateId', { preHandler: [fastify.authenticate, fastify.requirePermission('trip-templates:manage')] }, async (request, reply) => {
    const { tripTemplateId } = validateOrThrow(tripTemplateIdParamSchema, request.params);
    const body = validateOrThrow(updateTripTemplateSchema, request.body);
    const template = await findTripTemplateOrThrow(fastify.prisma, tripTemplateId);
    await fastify.requireOrganizationAccess(request, template.organizationId);
    await assertTripTemplateRelations(fastify, template.organizationId, body);

    const updateData = {
      ...(body.serviceRouteId !== undefined ? { serviceRouteId: body.serviceRouteId } : {}),
      ...(body.serviceRouteTemplateId !== undefined ? { serviceRouteTemplateId: body.serviceRouteTemplateId } : {}),
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
    };

    const updated = await fastify.prisma.tripTemplate.update({
      where: { id: tripTemplateId },
      data: updateData,
      include: { stops: true },
    });

    await fastify.audit.write({
      ...getAuditContext(request),
      action: 'admin.trip_template.update',
      entityType: 'TripTemplate',
      entityId: tripTemplateId,
      metadata: updateData,
    });

    return reply.success({ item: serializeTripTemplate(updated) });
  });

  fastify.post('/admin/trip-templates/:tripTemplateId/activate', { preHandler: [fastify.authenticate, fastify.requirePermission('trip-templates:manage')] }, async (request, reply) => {
    const { tripTemplateId } = validateOrThrow(tripTemplateIdParamSchema, request.params);
    const template = await findTripTemplateOrThrow(fastify.prisma, tripTemplateId);
    await fastify.requireOrganizationAccess(request, template.organizationId);
    const updated = await fastify.prisma.tripTemplate.update({ where: { id: tripTemplateId }, data: { status: 'ACTIVE' }, include: { stops: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.trip_template.activate', entityType: 'TripTemplate', entityId: tripTemplateId });
    return reply.success({ item: serializeTripTemplate(updated) });
  });

  fastify.post('/admin/trip-templates/:tripTemplateId/deactivate', { preHandler: [fastify.authenticate, fastify.requirePermission('trip-templates:manage')] }, async (request, reply) => {
    const { tripTemplateId } = validateOrThrow(tripTemplateIdParamSchema, request.params);
    const template = await findTripTemplateOrThrow(fastify.prisma, tripTemplateId);
    await fastify.requireOrganizationAccess(request, template.organizationId);
    const updated = await fastify.prisma.tripTemplate.update({ where: { id: tripTemplateId }, data: { status: 'INACTIVE' }, include: { stops: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.trip_template.deactivate', entityType: 'TripTemplate', entityId: tripTemplateId });
    return reply.success({ item: serializeTripTemplate(updated) });
  });

  fastify.post('/admin/trip-templates/:tripTemplateId/stops', { preHandler: [fastify.authenticate, fastify.requirePermission('trip-template-stops:manage')] }, async (request, reply) => {
    const { tripTemplateId } = validateOrThrow(tripTemplateIdParamSchema, request.params);
    const body = validateOrThrow(createTripTemplateStopSchema, request.body);
    const template = await findTripTemplateOrThrow(fastify.prisma, tripTemplateId);
    await fastify.requireOrganizationAccess(request, template.organizationId);
    await assertTripTemplateStopReferences(fastify, template, body);

    const sequence =
      body.sequence ??
      (template.stops.length === 0 ? 1 : Math.max(...template.stops.map((entry) => entry.sequence)) + 1);

    if (template.stops.some((entry) => entry.sequence === sequence)) {
      throw new ValidationAppError('A trip template stop already exists at that sequence');
    }

    const stop = await fastify.prisma.tripTemplateStop.create({
      data: {
        tripTemplateId,
        name: body.name,
        sequence,
        isActive: body.isActive ?? true,
        ...(body.serviceStopId ? { serviceStopId: body.serviceStopId } : {}),
        ...(body.serviceRouteTemplateStopId ? { serviceRouteTemplateStopId: body.serviceRouteTemplateStopId } : {}),
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
      action: 'admin.trip_template_stop.create',
      entityType: 'TripTemplateStop',
      entityId: stop.id,
      metadata: { tripTemplateId, sequence: stop.sequence },
    });

    return reply.status(201).success({ item: serializeTripTemplateStop(stop) });
  });

  fastify.patch('/admin/trip-templates/:tripTemplateId/stops/:stopId', { preHandler: [fastify.authenticate, fastify.requirePermission('trip-template-stops:manage')] }, async (request, reply) => {
    const { tripTemplateId, stopId } = validateOrThrow(tripTemplateStopIdParamSchema, request.params);
    const body = validateOrThrow(updateTripTemplateStopSchema, request.body);
    const template = await findTripTemplateOrThrow(fastify.prisma, tripTemplateId);
    await fastify.requireOrganizationAccess(request, template.organizationId);
    await assertTripTemplateStopReferences(fastify, template, body);

    const stop = template.stops.find((entry) => entry.id === stopId);
    if (!stop) {
      throw new NotFoundError('Trip template stop not found');
    }

    if (body.sequence !== undefined && body.sequence !== stop.sequence) {
      if (template.stops.some((entry) => entry.id !== stopId && entry.sequence === body.sequence)) {
        throw new ValidationAppError('A trip template stop already exists at that sequence');
      }
    }

    const updateData = {
      ...(body.serviceStopId !== undefined ? { serviceStopId: body.serviceStopId } : {}),
      ...(body.serviceRouteTemplateStopId !== undefined ? { serviceRouteTemplateStopId: body.serviceRouteTemplateStopId } : {}),
      ...(body.name !== undefined ? { name: body.name } : {}),
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

    const updated = await fastify.prisma.tripTemplateStop.update({ where: { id: stopId }, data: updateData });

    await fastify.audit.write({
      ...getAuditContext(request),
      action: 'admin.trip_template_stop.update',
      entityType: 'TripTemplateStop',
      entityId: stopId,
      metadata: updateData,
    });

    return reply.success({ item: serializeTripTemplateStop(updated) });
  });

  fastify.delete('/admin/trip-templates/:tripTemplateId/stops/:stopId', { preHandler: [fastify.authenticate, fastify.requirePermission('trip-template-stops:manage')] }, async (request, reply) => {
    const { tripTemplateId, stopId } = validateOrThrow(tripTemplateStopIdParamSchema, request.params);
    const template = await findTripTemplateOrThrow(fastify.prisma, tripTemplateId);
    await fastify.requireOrganizationAccess(request, template.organizationId);

    const stop = template.stops.find((entry) => entry.id === stopId);
    if (!stop) {
      throw new NotFoundError('Trip template stop not found');
    }

    await fastify.prisma.$transaction(async (tx) => {
      await tx.tripTemplateStop.delete({ where: { id: stopId } });
      const remaining = await tx.tripTemplateStop.findMany({
        where: { tripTemplateId },
        orderBy: { sequence: 'asc' },
      });
      for (const [index, entry] of remaining.entries()) {
        const nextSequence = index + 1;
        if (entry.sequence !== nextSequence) {
          await tx.tripTemplateStop.update({ where: { id: entry.id }, data: { sequence: nextSequence } });
        }
      }
    });

    await fastify.audit.write({
      ...getAuditContext(request),
      action: 'admin.trip_template_stop.delete',
      entityType: 'TripTemplateStop',
      entityId: stopId,
      metadata: { tripTemplateId },
    });

    return reply.success({ deleted: true });
  });

  fastify.post('/admin/trip-templates/:tripTemplateId/stops/reorder', { preHandler: [fastify.authenticate, fastify.requirePermission('trip-template-stops:manage')] }, async (request, reply) => {
    const { tripTemplateId } = validateOrThrow(tripTemplateIdParamSchema, request.params);
    const body = validateOrThrow(reorderTripTemplateStopsSchema, request.body);
    const template = await findTripTemplateOrThrow(fastify.prisma, tripTemplateId);
    await fastify.requireOrganizationAccess(request, template.organizationId);

    const currentStopIds = template.stops.map((entry) => entry.id).sort();
    const submittedStopIds = [...body.orderedStopIds].sort();

    if (
      currentStopIds.length !== submittedStopIds.length ||
      currentStopIds.some((id, index) => id !== submittedStopIds[index])
    ) {
      throw new ValidationAppError('Reorder payload must include every trip template stop exactly once');
    }

    await fastify.prisma.$transaction(async (tx) => {
      for (const [index, stopId] of body.orderedStopIds.entries()) {
        await tx.tripTemplateStop.update({ where: { id: stopId }, data: { sequence: index + 1 } });
      }
    });

    const updated = await findTripTemplateOrThrow(fastify.prisma, tripTemplateId);

    await fastify.audit.write({
      ...getAuditContext(request),
      action: 'admin.trip_template_stop.reorder',
      entityType: 'TripTemplate',
      entityId: tripTemplateId,
      metadata: { orderedStopIds: body.orderedStopIds },
    });

    return reply.success({
      item: {
        ...serializeTripTemplate(updated),
        stops: updated.stops.map(serializeTripTemplateStop),
      },
    });
  });
};
