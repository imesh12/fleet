import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES, type PlannedTripStatus } from '@trackigniter8/shared';
import { ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findCustomerAccountOrThrow,
  findDriverOrThrow,
  findDriverVehicleAssignmentOrThrow,
  findPlannedTripOrThrow,
  findServiceRouteOrThrow,
  findServiceRouteTemplateOrThrow,
  findTripTemplateOrThrow,
  findVehicleOrThrow,
  getAuditContext,
  getPagination,
  paginationQuerySchema,
  plannedTripPrioritySchema,
  plannedTripStatusSchema,
  serializePlannedTrip,
  serializePlannedTripStop,
} from '../utils.js';

const plannedTripIdParamSchema = z.object({
  plannedTripId: z.string().min(1),
});

const plannedTripStopIdParamSchema = z.object({
  plannedTripId: z.string().min(1),
  stopId: z.string().min(1),
});

const listPlannedTripsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: plannedTripStatusSchema.optional(),
  customerAccountId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(),
  plannedStartFrom: z.coerce.date().optional(),
  plannedStartTo: z.coerce.date().optional(),
});

const createPlannedTripSchema = z
  .object({
    organizationId: z.string().min(1),
    customerAccountId: z.string().min(1).optional(),
    serviceRouteId: z.string().min(1).optional(),
    serviceRouteTemplateId: z.string().min(1).optional(),
    tripTemplateId: z.string().min(1).optional(),
    vehicleId: z.string().min(1).optional(),
    driverId: z.string().min(1).optional(),
    assignmentId: z.string().min(1).optional(),
    title: z.string().min(2),
    referenceCode: z.string().trim().min(1).optional(),
    plannedStartAt: z.coerce.date(),
    plannedEndAt: z.coerce.date().optional(),
    status: plannedTripStatusSchema.default('DRAFT'),
    priority: plannedTripPrioritySchema.default('NORMAL'),
    notes: z.string().trim().optional(),
  })
  .refine((value) => !value.plannedEndAt || value.plannedEndAt >= value.plannedStartAt, {
    message: 'Planned end time must be greater than or equal to planned start time',
    path: ['plannedEndAt'],
  });

const updatePlannedTripSchema = z
  .object({
    customerAccountId: z.string().min(1).nullable().optional(),
    serviceRouteId: z.string().min(1).nullable().optional(),
    serviceRouteTemplateId: z.string().min(1).nullable().optional(),
    tripTemplateId: z.string().min(1).nullable().optional(),
    title: z.string().min(2).optional(),
    referenceCode: z.string().trim().min(1).nullable().optional(),
    plannedStartAt: z.coerce.date().optional(),
    plannedEndAt: z.coerce.date().nullable().optional(),
    priority: plannedTripPrioritySchema.optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one planned trip field must be supplied' });

const updatePlannedTripStatusSchema = z.object({
  status: plannedTripStatusSchema,
  notes: z.string().trim().optional(),
});

const assignPlannedTripSchema = z
  .object({
    vehicleId: z.string().min(1).optional(),
    driverId: z.string().min(1).optional(),
    assignmentId: z.string().min(1).optional(),
  })
  .refine((value) => value.vehicleId || value.driverId || value.assignmentId, {
    message: 'Vehicle, driver, or assignment must be provided',
  });

const createPlannedTripStopSchema = z.object({
  serviceStopId: z.string().min(1).optional(),
  serviceRouteTemplateStopId: z.string().min(1).optional(),
  tripTemplateStopId: z.string().min(1).optional(),
  name: z.string().min(1),
  code: z.string().trim().optional(),
  description: z.string().trim().optional(),
  sequence: z.coerce.number().int().positive().optional(),
  plannedArrivalAt: z.coerce.date().optional(),
  plannedDepartureAt: z.coerce.date().optional(),
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

const updatePlannedTripStopSchema = z
  .object({
    serviceStopId: z.string().min(1).nullable().optional(),
    serviceRouteTemplateStopId: z.string().min(1).nullable().optional(),
    tripTemplateStopId: z.string().min(1).nullable().optional(),
    name: z.string().min(1).optional(),
    code: z.string().trim().nullable().optional(),
    description: z.string().trim().nullable().optional(),
    sequence: z.coerce.number().int().positive().optional(),
    plannedArrivalAt: z.coerce.date().nullable().optional(),
    plannedDepartureAt: z.coerce.date().nullable().optional(),
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
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one planned trip stop field must be supplied' });

const reorderPlannedTripStopsSchema = z.object({
  orderedStopIds: z.array(z.string().min(1)).min(1),
});

const ALLOWED_TRIP_STATUS_TRANSITIONS: Record<PlannedTripStatus, PlannedTripStatus[]> = {
  DRAFT: ['PLANNED', 'READY', 'BLOCKED', 'CANCELED'],
  PLANNED: ['READY', 'BLOCKED', 'CANCELED', 'DISPATCHED_PLACEHOLDER'],
  READY: ['PLANNED', 'BLOCKED', 'CANCELED', 'DISPATCHED_PLACEHOLDER'],
  BLOCKED: ['PLANNED', 'READY', 'CANCELED'],
  CANCELED: [],
  DISPATCHED_PLACEHOLDER: [],
};

function assertTripMutable(status: string) {
  if (status === 'CANCELED' || status === 'DISPATCHED_PLACEHOLDER') {
    throw new ValidationAppError('This planned trip can no longer be modified');
  }
}

function assertPlannedTripStatusTransition(currentStatus: PlannedTripStatus, nextStatus: PlannedTripStatus) {
  if (currentStatus === nextStatus) {
    return;
  }

  if (!ALLOWED_TRIP_STATUS_TRANSITIONS[currentStatus].includes(nextStatus)) {
    throw new ValidationAppError(`Cannot transition planned trip from ${currentStatus} to ${nextStatus}`);
  }
}

async function assertPlannedTripRelations(
  fastify: Parameters<FastifyPluginAsync>[0],
  organizationId: string,
  input: {
    customerAccountId?: string | null | undefined;
    serviceRouteId?: string | null | undefined;
    serviceRouteTemplateId?: string | null | undefined;
    tripTemplateId?: string | null | undefined;
    vehicleId?: string | null | undefined;
    driverId?: string | null | undefined;
    assignmentId?: string | null | undefined;
  }
) {
  let serviceRouteId = input.serviceRouteId ?? null;
  let serviceRouteTemplateId = input.serviceRouteTemplateId ?? null;
  let vehicleId = input.vehicleId ?? null;
  let driverId = input.driverId ?? null;

  if (input.customerAccountId) {
    const account = await findCustomerAccountOrThrow(fastify.prisma, input.customerAccountId);
    if (account.organizationId !== organizationId) {
      throw new ConflictError('Customer account must belong to the same organization');
    }
  }

  if (serviceRouteId) {
    const route = await findServiceRouteOrThrow(fastify.prisma, serviceRouteId);
    if (route.organizationId !== organizationId) {
      throw new ConflictError('Service route must belong to the same organization');
    }
  }

  if (serviceRouteTemplateId) {
    const routeTemplate = await findServiceRouteTemplateOrThrow(fastify.prisma, serviceRouteTemplateId);
    if (routeTemplate.organizationId !== organizationId) {
      throw new ConflictError('Service route template must belong to the same organization');
    }
  }

  if (input.tripTemplateId) {
    const tripTemplate = await findTripTemplateOrThrow(fastify.prisma, input.tripTemplateId);
    if (tripTemplate.organizationId !== organizationId) {
      throw new ConflictError('Trip template must belong to the same organization');
    }
    if (serviceRouteId && tripTemplate.serviceRouteId && tripTemplate.serviceRouteId !== serviceRouteId) {
      throw new ConflictError('Trip template service route does not match the selected service route');
    }
    if (
      serviceRouteTemplateId &&
      tripTemplate.serviceRouteTemplateId &&
      tripTemplate.serviceRouteTemplateId !== serviceRouteTemplateId
    ) {
      throw new ConflictError('Trip template route template does not match the selected service route template');
    }
    serviceRouteId = serviceRouteId ?? tripTemplate.serviceRouteId ?? null;
    serviceRouteTemplateId = serviceRouteTemplateId ?? tripTemplate.serviceRouteTemplateId ?? null;
  }

  if (input.vehicleId) {
    const vehicle = await findVehicleOrThrow(fastify.prisma, input.vehicleId);
    if (vehicle.organizationId !== organizationId) {
      throw new ConflictError('Vehicle must belong to the same organization');
    }
  }

  if (input.driverId) {
    const driver = await findDriverOrThrow(fastify.prisma, input.driverId);
    if (driver.organizationId !== organizationId) {
      throw new ConflictError('Driver must belong to the same organization');
    }
  }

  if (input.assignmentId) {
    const assignment = await findDriverVehicleAssignmentOrThrow(fastify.prisma, input.assignmentId);
    if (assignment.organizationId !== organizationId) {
      throw new ConflictError('Assignment must belong to the same organization');
    }
    if (vehicleId && assignment.vehicleId !== vehicleId) {
      throw new ConflictError('Assignment vehicle does not match the selected vehicle');
    }
    if (driverId && assignment.driverId !== driverId) {
      throw new ConflictError('Assignment driver does not match the selected driver');
    }
  }
}

async function assertPlannedTripReferenceCodeUnique(
  fastify: Parameters<FastifyPluginAsync>[0],
  input: { organizationId: string; referenceCode?: string | null | undefined; excludePlannedTripId?: string }
) {
  const referenceCode = input.referenceCode?.trim();
  if (!referenceCode) {
    return;
  }

  const existing = await fastify.prisma.plannedTrip.findFirst({
    where: {
      organizationId: input.organizationId,
      referenceCode,
      ...(input.excludePlannedTripId ? { id: { not: input.excludePlannedTripId } } : {}),
    },
  });

  if (existing) {
    throw new ConflictError('A planned trip with that reference code already exists for this organization');
  }
}

async function buildInitialStopsFromTemplate(
  fastify: Parameters<FastifyPluginAsync>[0],
  input: { tripTemplateId?: string | undefined; serviceRouteTemplateId?: string | undefined; serviceRouteId?: string | undefined }
) {
  if (input.tripTemplateId) {
    const template = await findTripTemplateOrThrow(fastify.prisma, input.tripTemplateId);
    return template.stops.map((stop) => ({
      serviceStopId: stop.serviceStopId,
      serviceRouteTemplateStopId: stop.serviceRouteTemplateStopId,
      tripTemplateStopId: stop.id,
      name: stop.name,
      code: stop.code,
      description: stop.description,
      sequence: stop.sequence,
      addressLine1: stop.addressLine1,
      addressLine2: stop.addressLine2,
      city: stop.city,
      state: stop.state,
      postalCode: stop.postalCode,
      country: stop.country,
      latitude: stop.latitude,
      longitude: stop.longitude,
      isActive: stop.isActive,
    }));
  }

  if (input.serviceRouteTemplateId) {
    const routeTemplate = await findServiceRouteTemplateOrThrow(fastify.prisma, input.serviceRouteTemplateId);
    return routeTemplate.stops.map((stop) => ({
      serviceRouteTemplateStopId: stop.id,
      name: stop.name,
      code: stop.code,
      description: stop.description,
      sequence: stop.sequence,
      addressLine1: stop.addressLine1,
      addressLine2: stop.addressLine2,
      city: stop.city,
      state: stop.state,
      postalCode: stop.postalCode,
      country: stop.country,
      latitude: stop.latitude,
      longitude: stop.longitude,
      isActive: stop.isActive,
    }));
  }

  if (input.serviceRouteId) {
    const route = await findServiceRouteOrThrow(fastify.prisma, input.serviceRouteId);
    return route.stops.map((stop) => ({
      serviceStopId: stop.id,
      name: stop.name,
      code: stop.code,
      description: stop.description,
      sequence: stop.sequence,
      addressLine1: stop.addressLine1,
      addressLine2: stop.addressLine2,
      city: stop.city,
      state: stop.state,
      postalCode: stop.postalCode,
      country: stop.country,
      latitude: stop.latitude,
      longitude: stop.longitude,
      isActive: stop.isActive,
    }));
  }

  return [];
}

async function assertPlannedTripStopReferences(
  fastify: Parameters<FastifyPluginAsync>[0],
  trip: Awaited<ReturnType<typeof findPlannedTripOrThrow>>,
  input: {
    serviceStopId?: string | null | undefined;
    serviceRouteTemplateStopId?: string | null | undefined;
    tripTemplateStopId?: string | null | undefined;
  }
) {
  if (input.serviceStopId) {
    const route = trip.serviceRouteId ? await findServiceRouteOrThrow(fastify.prisma, trip.serviceRouteId) : null;
    if (!route?.stops.some((entry) => entry.id === input.serviceStopId)) {
      throw new ValidationAppError('Planned trip stop service stop must belong to the linked service route');
    }
  }

  if (input.serviceRouteTemplateStopId) {
    const routeTemplate = trip.serviceRouteTemplateId
      ? await findServiceRouteTemplateOrThrow(fastify.prisma, trip.serviceRouteTemplateId)
      : null;
    if (!routeTemplate?.stops.some((entry) => entry.id === input.serviceRouteTemplateStopId)) {
      throw new ValidationAppError('Planned trip stop template stop must belong to the linked route template');
    }
  }

  if (input.tripTemplateStopId) {
    const tripTemplate = trip.tripTemplateId ? await findTripTemplateOrThrow(fastify.prisma, trip.tripTemplateId) : null;
    if (!tripTemplate?.stops.some((entry) => entry.id === input.tripTemplateStopId)) {
      throw new ValidationAppError('Planned trip stop template reference must belong to the linked trip template');
    }
  }
}

export const adminPlannedTripRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/planned-trips', { preHandler: [fastify.authenticate, fastify.requirePermission('planned-trips:read')] }, async (request, reply) => {
    const query = validateOrThrow(listPlannedTripsQuerySchema, request.query);
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
      ...(query.customerAccountId ? { customerAccountId: query.customerAccountId } : {}),
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      ...(query.driverId ? { driverId: query.driverId } : {}),
      ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
      ...(query.plannedStartFrom || query.plannedStartTo
        ? {
            plannedStartAt: {
              ...(query.plannedStartFrom ? { gte: query.plannedStartFrom } : {}),
              ...(query.plannedStartTo ? { lte: query.plannedStartTo } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' as const } },
              { referenceCode: { contains: query.search, mode: 'insensitive' as const } },
              { notes: { contains: query.search, mode: 'insensitive' as const } },
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
      fastify.prisma.plannedTrip.findMany({
        where,
        skip,
        take,
        orderBy: [{ plannedStartAt: 'asc' }, { createdAt: 'desc' }],
        include: {
          customerAccount: { include: { contacts: true, locations: true } },
          serviceRoute: { include: { stops: true } },
          serviceRouteTemplate: { include: { stops: true } },
          tripTemplate: { include: { stops: true } },
          vehicle: {
            include: {
              customerAccount: { include: { contacts: true, locations: true } },
              department: true,
              businessUnit: true,
              vehicleType: true,
              vehicleGroup: true,
              make: true,
              model: true,
              serviceRouteTemplate: { include: { stops: true } },
              documents: true,
              devices: true,
            },
          },
          driver: {
            include: {
              customerAccount: { include: { contacts: true, locations: true } },
              department: true,
              businessUnit: true,
              driverGroup: true,
              skillAssignments: { include: { driverSkill: true } },
              licenses: true,
              documents: true,
              vehicleAssignments: true,
            },
          },
          assignment: { include: { driver: true, vehicle: true } },
          stops: true,
          dispatchQueueItems: true,
        },
      }),
      fastify.prisma.plannedTrip.count({ where }),
    ]);

    return reply.success({ items: items.map(serializePlannedTrip) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/planned-trips/:plannedTripId', { preHandler: [fastify.authenticate, fastify.requirePermission('planned-trips:read')] }, async (request, reply) => {
    const { plannedTripId } = validateOrThrow(plannedTripIdParamSchema, request.params);
    const trip = await findPlannedTripOrThrow(fastify.prisma, plannedTripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);

    return reply.success({
      item: {
        ...serializePlannedTrip(trip),
        stops: trip.stops.map(serializePlannedTripStop),
      },
    });
  });

  fastify.post('/admin/planned-trips', { preHandler: [fastify.authenticate, fastify.requirePermission('planned-trips:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createPlannedTripSchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    await assertPlannedTripRelations(fastify, body.organizationId, body);
    await assertPlannedTripReferenceCodeUnique(fastify, { organizationId: body.organizationId, referenceCode: body.referenceCode });

    const initialStops = await buildInitialStopsFromTemplate(fastify, body);

    const trip = await fastify.prisma.plannedTrip.create({
      data: {
        organizationId: body.organizationId,
        title: body.title,
        plannedStartAt: body.plannedStartAt,
        status: body.status ?? 'DRAFT',
        priority: body.priority ?? 'NORMAL',
        ...(body.customerAccountId ? { customerAccountId: body.customerAccountId } : {}),
        ...(body.serviceRouteId ? { serviceRouteId: body.serviceRouteId } : {}),
        ...(body.serviceRouteTemplateId ? { serviceRouteTemplateId: body.serviceRouteTemplateId } : {}),
        ...(body.tripTemplateId ? { tripTemplateId: body.tripTemplateId } : {}),
        ...(body.vehicleId ? { vehicleId: body.vehicleId } : {}),
        ...(body.driverId ? { driverId: body.driverId } : {}),
        ...(body.assignmentId ? { assignmentId: body.assignmentId } : {}),
        ...(body.referenceCode ? { referenceCode: body.referenceCode.trim() } : {}),
        ...(body.plannedEndAt ? { plannedEndAt: body.plannedEndAt } : {}),
        ...(body.notes ? { notes: body.notes } : {}),
        ...(initialStops.length > 0
          ? {
              stops: {
                create: initialStops,
              },
            }
          : {}),
      },
      include: {
        customerAccount: { include: { contacts: true, locations: true } },
        serviceRoute: { include: { stops: true } },
        serviceRouteTemplate: { include: { stops: true } },
        tripTemplate: { include: { stops: true } },
        vehicle: {
          include: {
            customerAccount: { include: { contacts: true, locations: true } },
            department: true,
            businessUnit: true,
            vehicleType: true,
            vehicleGroup: true,
            make: true,
            model: true,
            serviceRouteTemplate: { include: { stops: true } },
            documents: true,
            devices: true,
          },
        },
        driver: {
          include: {
            customerAccount: { include: { contacts: true, locations: true } },
            department: true,
            businessUnit: true,
            driverGroup: true,
            skillAssignments: { include: { driverSkill: true } },
            licenses: true,
            documents: true,
            vehicleAssignments: true,
          },
        },
        assignment: { include: { driver: true, vehicle: true } },
        stops: true,
        dispatchQueueItems: true,
      },
    });

    await fastify.audit.write({
      ...getAuditContext(request),
      action: 'admin.planned_trip.create',
      entityType: 'PlannedTrip',
      entityId: trip.id,
      metadata: { organizationId: trip.organizationId, status: trip.status, priority: trip.priority },
    });

    return reply.status(201).success({ item: serializePlannedTrip(trip) });
  });

  fastify.patch('/admin/planned-trips/:plannedTripId', { preHandler: [fastify.authenticate, fastify.requirePermission('planned-trips:manage')] }, async (request, reply) => {
    const { plannedTripId } = validateOrThrow(plannedTripIdParamSchema, request.params);
    const body = validateOrThrow(updatePlannedTripSchema, request.body);
    const trip = await findPlannedTripOrThrow(fastify.prisma, plannedTripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertTripMutable(trip.status);

    await assertPlannedTripRelations(fastify, trip.organizationId, body);
    await assertPlannedTripReferenceCodeUnique(fastify, {
      organizationId: trip.organizationId,
      referenceCode: body.referenceCode,
      excludePlannedTripId: trip.id,
    });

    const nextStart = body.plannedStartAt ?? trip.plannedStartAt;
    const nextEnd = body.plannedEndAt === undefined ? trip.plannedEndAt : body.plannedEndAt;
    if (nextEnd && nextEnd < nextStart) {
      throw new ValidationAppError('Planned end time must be greater than or equal to planned start time');
    }

    const updateData = {
      ...(body.customerAccountId !== undefined ? { customerAccountId: body.customerAccountId } : {}),
      ...(body.serviceRouteId !== undefined ? { serviceRouteId: body.serviceRouteId } : {}),
      ...(body.serviceRouteTemplateId !== undefined ? { serviceRouteTemplateId: body.serviceRouteTemplateId } : {}),
      ...(body.tripTemplateId !== undefined ? { tripTemplateId: body.tripTemplateId } : {}),
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.referenceCode !== undefined ? { referenceCode: body.referenceCode?.trim() ?? null } : {}),
      ...(body.plannedStartAt !== undefined ? { plannedStartAt: body.plannedStartAt } : {}),
      ...(body.plannedEndAt !== undefined ? { plannedEndAt: body.plannedEndAt } : {}),
      ...(body.priority !== undefined ? { priority: body.priority } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    };

    const updated = await fastify.prisma.plannedTrip.update({
      where: { id: plannedTripId },
      data: updateData,
      include: {
        customerAccount: { include: { contacts: true, locations: true } },
        serviceRoute: { include: { stops: true } },
        serviceRouteTemplate: { include: { stops: true } },
        tripTemplate: { include: { stops: true } },
        vehicle: {
          include: {
            customerAccount: { include: { contacts: true, locations: true } },
            department: true,
            businessUnit: true,
            vehicleType: true,
            vehicleGroup: true,
            make: true,
            model: true,
            serviceRouteTemplate: { include: { stops: true } },
            documents: true,
            devices: true,
          },
        },
        driver: {
          include: {
            customerAccount: { include: { contacts: true, locations: true } },
            department: true,
            businessUnit: true,
            driverGroup: true,
            skillAssignments: { include: { driverSkill: true } },
            licenses: true,
            documents: true,
            vehicleAssignments: true,
          },
        },
        assignment: { include: { driver: true, vehicle: true } },
        stops: true,
        dispatchQueueItems: true,
      },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.planned_trip.update', entityType: 'PlannedTrip', entityId: plannedTripId, metadata: updateData });
    return reply.success({ item: serializePlannedTrip(updated) });
  });

  fastify.post('/admin/planned-trips/:plannedTripId/status', { preHandler: [fastify.authenticate, fastify.requirePermission('dispatch-status:manage')] }, async (request, reply) => {
    const { plannedTripId } = validateOrThrow(plannedTripIdParamSchema, request.params);
    const body = validateOrThrow(updatePlannedTripStatusSchema, request.body);
    const trip = await findPlannedTripOrThrow(fastify.prisma, plannedTripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertPlannedTripStatusTransition(trip.status as PlannedTripStatus, body.status);

    const updated = await fastify.prisma.plannedTrip.update({
      where: { id: plannedTripId },
      data: {
        status: body.status,
        ...(body.notes ? { notes: [trip.notes, body.notes].filter(Boolean).join('\n') } : {}),
      },
      include: {
        customerAccount: { include: { contacts: true, locations: true } },
        serviceRoute: { include: { stops: true } },
        serviceRouteTemplate: { include: { stops: true } },
        tripTemplate: { include: { stops: true } },
        vehicle: {
          include: {
            customerAccount: { include: { contacts: true, locations: true } },
            department: true,
            businessUnit: true,
            vehicleType: true,
            vehicleGroup: true,
            make: true,
            model: true,
            serviceRouteTemplate: { include: { stops: true } },
            documents: true,
            devices: true,
          },
        },
        driver: {
          include: {
            customerAccount: { include: { contacts: true, locations: true } },
            department: true,
            businessUnit: true,
            driverGroup: true,
            skillAssignments: { include: { driverSkill: true } },
            licenses: true,
            documents: true,
            vehicleAssignments: true,
          },
        },
        assignment: { include: { driver: true, vehicle: true } },
        stops: true,
        dispatchQueueItems: true,
      },
    });

    await fastify.audit.write({
      ...getAuditContext(request),
      action: 'admin.planned_trip.status',
      entityType: 'PlannedTrip',
      entityId: plannedTripId,
      metadata: { from: trip.status, to: body.status },
    });

    return reply.success({ item: serializePlannedTrip(updated) });
  });

  fastify.post('/admin/planned-trips/:plannedTripId/cancel', { preHandler: [fastify.authenticate, fastify.requirePermission('planned-trips:manage')] }, async (request, reply) => {
    const { plannedTripId } = validateOrThrow(plannedTripIdParamSchema, request.params);
    const trip = await findPlannedTripOrThrow(fastify.prisma, plannedTripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertPlannedTripStatusTransition(trip.status as PlannedTripStatus, 'CANCELED');

    const updated = await fastify.prisma.plannedTrip.update({
      where: { id: plannedTripId },
      data: { status: 'CANCELED' },
      include: {
        customerAccount: { include: { contacts: true, locations: true } },
        serviceRoute: { include: { stops: true } },
        serviceRouteTemplate: { include: { stops: true } },
        tripTemplate: { include: { stops: true } },
        vehicle: {
          include: {
            customerAccount: { include: { contacts: true, locations: true } },
            department: true,
            businessUnit: true,
            vehicleType: true,
            vehicleGroup: true,
            make: true,
            model: true,
            serviceRouteTemplate: { include: { stops: true } },
            documents: true,
            devices: true,
          },
        },
        driver: {
          include: {
            customerAccount: { include: { contacts: true, locations: true } },
            department: true,
            businessUnit: true,
            driverGroup: true,
            skillAssignments: { include: { driverSkill: true } },
            licenses: true,
            documents: true,
            vehicleAssignments: true,
          },
        },
        assignment: { include: { driver: true, vehicle: true } },
        stops: true,
        dispatchQueueItems: true,
      },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.planned_trip.cancel', entityType: 'PlannedTrip', entityId: plannedTripId });
    return reply.success({ item: serializePlannedTrip(updated) });
  });

  fastify.post('/admin/planned-trips/:plannedTripId/assign', { preHandler: [fastify.authenticate, fastify.requirePermission('planned-trips:manage')] }, async (request, reply) => {
    const { plannedTripId } = validateOrThrow(plannedTripIdParamSchema, request.params);
    const body = validateOrThrow(assignPlannedTripSchema, request.body);
    const trip = await findPlannedTripOrThrow(fastify.prisma, plannedTripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertTripMutable(trip.status);

    await assertPlannedTripRelations(fastify, trip.organizationId, body);

    const updated = await fastify.prisma.plannedTrip.update({
      where: { id: plannedTripId },
      data: {
        ...(body.vehicleId !== undefined ? { vehicleId: body.vehicleId } : {}),
        ...(body.driverId !== undefined ? { driverId: body.driverId } : {}),
        ...(body.assignmentId !== undefined ? { assignmentId: body.assignmentId } : {}),
      },
      include: {
        customerAccount: { include: { contacts: true, locations: true } },
        serviceRoute: { include: { stops: true } },
        serviceRouteTemplate: { include: { stops: true } },
        tripTemplate: { include: { stops: true } },
        vehicle: {
          include: {
            customerAccount: { include: { contacts: true, locations: true } },
            department: true,
            businessUnit: true,
            vehicleType: true,
            vehicleGroup: true,
            make: true,
            model: true,
            serviceRouteTemplate: { include: { stops: true } },
            documents: true,
            devices: true,
          },
        },
        driver: {
          include: {
            customerAccount: { include: { contacts: true, locations: true } },
            department: true,
            businessUnit: true,
            driverGroup: true,
            skillAssignments: { include: { driverSkill: true } },
            licenses: true,
            documents: true,
            vehicleAssignments: true,
          },
        },
        assignment: { include: { driver: true, vehicle: true } },
        stops: true,
        dispatchQueueItems: true,
      },
    });

    await fastify.audit.write({
      ...getAuditContext(request),
      action: 'admin.planned_trip.assign',
      entityType: 'PlannedTrip',
      entityId: plannedTripId,
      metadata: { vehicleId: updated.vehicleId, driverId: updated.driverId, assignmentId: updated.assignmentId },
    });

    return reply.success({ item: serializePlannedTrip(updated) });
  });

  fastify.post('/admin/planned-trips/:plannedTripId/unassign', { preHandler: [fastify.authenticate, fastify.requirePermission('planned-trips:manage')] }, async (request, reply) => {
    const { plannedTripId } = validateOrThrow(plannedTripIdParamSchema, request.params);
    const trip = await findPlannedTripOrThrow(fastify.prisma, plannedTripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertTripMutable(trip.status);

    const updated = await fastify.prisma.plannedTrip.update({
      where: { id: plannedTripId },
      data: { vehicleId: null, driverId: null, assignmentId: null },
      include: {
        customerAccount: { include: { contacts: true, locations: true } },
        serviceRoute: { include: { stops: true } },
        serviceRouteTemplate: { include: { stops: true } },
        tripTemplate: { include: { stops: true } },
        vehicle: {
          include: {
            customerAccount: { include: { contacts: true, locations: true } },
            department: true,
            businessUnit: true,
            vehicleType: true,
            vehicleGroup: true,
            make: true,
            model: true,
            serviceRouteTemplate: { include: { stops: true } },
            documents: true,
            devices: true,
          },
        },
        driver: {
          include: {
            customerAccount: { include: { contacts: true, locations: true } },
            department: true,
            businessUnit: true,
            driverGroup: true,
            skillAssignments: { include: { driverSkill: true } },
            licenses: true,
            documents: true,
            vehicleAssignments: true,
          },
        },
        assignment: { include: { driver: true, vehicle: true } },
        stops: true,
        dispatchQueueItems: true,
      },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.planned_trip.unassign', entityType: 'PlannedTrip', entityId: plannedTripId });
    return reply.success({ item: serializePlannedTrip(updated) });
  });

  fastify.post('/admin/planned-trips/:plannedTripId/stops', { preHandler: [fastify.authenticate, fastify.requirePermission('planned-trip-stops:manage')] }, async (request, reply) => {
    const { plannedTripId } = validateOrThrow(plannedTripIdParamSchema, request.params);
    const body = validateOrThrow(createPlannedTripStopSchema, request.body);
    const trip = await findPlannedTripOrThrow(fastify.prisma, plannedTripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertTripMutable(trip.status);
    await assertPlannedTripStopReferences(fastify, trip, body);

    const sequence = body.sequence ?? (trip.stops.length === 0 ? 1 : Math.max(...trip.stops.map((entry) => entry.sequence)) + 1);
    if (trip.stops.some((entry) => entry.sequence === sequence)) {
      throw new ValidationAppError('A planned trip stop already exists at that sequence');
    }

    const stop = await fastify.prisma.plannedTripStop.create({
      data: {
        plannedTripId,
        name: body.name,
        sequence,
        isActive: body.isActive ?? true,
        ...(body.serviceStopId ? { serviceStopId: body.serviceStopId } : {}),
        ...(body.serviceRouteTemplateStopId ? { serviceRouteTemplateStopId: body.serviceRouteTemplateStopId } : {}),
        ...(body.tripTemplateStopId ? { tripTemplateStopId: body.tripTemplateStopId } : {}),
        ...(body.code ? { code: body.code } : {}),
        ...(body.description ? { description: body.description } : {}),
        ...(body.plannedArrivalAt ? { plannedArrivalAt: body.plannedArrivalAt } : {}),
        ...(body.plannedDepartureAt ? { plannedDepartureAt: body.plannedDepartureAt } : {}),
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

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.planned_trip_stop.create', entityType: 'PlannedTripStop', entityId: stop.id, metadata: { plannedTripId, sequence: stop.sequence } });
    return reply.status(201).success({ item: serializePlannedTripStop(stop) });
  });

  fastify.patch('/admin/planned-trips/:plannedTripId/stops/:stopId', { preHandler: [fastify.authenticate, fastify.requirePermission('planned-trip-stops:manage')] }, async (request, reply) => {
    const { plannedTripId, stopId } = validateOrThrow(plannedTripStopIdParamSchema, request.params);
    const body = validateOrThrow(updatePlannedTripStopSchema, request.body);
    const trip = await findPlannedTripOrThrow(fastify.prisma, plannedTripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertTripMutable(trip.status);
    await assertPlannedTripStopReferences(fastify, trip, body);

    const stop = trip.stops.find((entry) => entry.id === stopId);
    if (!stop) {
      throw new NotFoundError('Planned trip stop not found');
    }

    if (body.sequence !== undefined && body.sequence !== stop.sequence) {
      if (trip.stops.some((entry) => entry.id !== stopId && entry.sequence === body.sequence)) {
        throw new ValidationAppError('A planned trip stop already exists at that sequence');
      }
    }

    const updateData = {
      ...(body.serviceStopId !== undefined ? { serviceStopId: body.serviceStopId } : {}),
      ...(body.serviceRouteTemplateStopId !== undefined ? { serviceRouteTemplateStopId: body.serviceRouteTemplateStopId } : {}),
      ...(body.tripTemplateStopId !== undefined ? { tripTemplateStopId: body.tripTemplateStopId } : {}),
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.code !== undefined ? { code: body.code } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.sequence !== undefined ? { sequence: body.sequence } : {}),
      ...(body.plannedArrivalAt !== undefined ? { plannedArrivalAt: body.plannedArrivalAt } : {}),
      ...(body.plannedDepartureAt !== undefined ? { plannedDepartureAt: body.plannedDepartureAt } : {}),
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

    const updated = await fastify.prisma.plannedTripStop.update({ where: { id: stopId }, data: updateData });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.planned_trip_stop.update', entityType: 'PlannedTripStop', entityId: stopId, metadata: updateData });
    return reply.success({ item: serializePlannedTripStop(updated) });
  });

  fastify.delete('/admin/planned-trips/:plannedTripId/stops/:stopId', { preHandler: [fastify.authenticate, fastify.requirePermission('planned-trip-stops:manage')] }, async (request, reply) => {
    const { plannedTripId, stopId } = validateOrThrow(plannedTripStopIdParamSchema, request.params);
    const trip = await findPlannedTripOrThrow(fastify.prisma, plannedTripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertTripMutable(trip.status);

    const stop = trip.stops.find((entry) => entry.id === stopId);
    if (!stop) {
      throw new NotFoundError('Planned trip stop not found');
    }

    await fastify.prisma.$transaction(async (tx) => {
      await tx.plannedTripStop.delete({ where: { id: stopId } });
      const remaining = await tx.plannedTripStop.findMany({ where: { plannedTripId }, orderBy: { sequence: 'asc' } });
      for (const [index, entry] of remaining.entries()) {
        const nextSequence = index + 1;
        if (entry.sequence !== nextSequence) {
          await tx.plannedTripStop.update({ where: { id: entry.id }, data: { sequence: nextSequence } });
        }
      }
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.planned_trip_stop.delete', entityType: 'PlannedTripStop', entityId: stopId, metadata: { plannedTripId } });
    return reply.success({ deleted: true });
  });

  fastify.post('/admin/planned-trips/:plannedTripId/stops/reorder', { preHandler: [fastify.authenticate, fastify.requirePermission('planned-trip-stops:manage')] }, async (request, reply) => {
    const { plannedTripId } = validateOrThrow(plannedTripIdParamSchema, request.params);
    const body = validateOrThrow(reorderPlannedTripStopsSchema, request.body);
    const trip = await findPlannedTripOrThrow(fastify.prisma, plannedTripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertTripMutable(trip.status);

    const currentStopIds = trip.stops.map((entry) => entry.id).sort();
    const submittedStopIds = [...body.orderedStopIds].sort();
    if (currentStopIds.length !== submittedStopIds.length || currentStopIds.some((id, index) => id !== submittedStopIds[index])) {
      throw new ValidationAppError('Reorder payload must include every planned trip stop exactly once');
    }

    await fastify.prisma.$transaction(async (tx) => {
      for (const [index, stopId] of body.orderedStopIds.entries()) {
        await tx.plannedTripStop.update({ where: { id: stopId }, data: { sequence: index + 1 } });
      }
    });

    const updated = await findPlannedTripOrThrow(fastify.prisma, plannedTripId);
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.planned_trip_stop.reorder', entityType: 'PlannedTrip', entityId: plannedTripId, metadata: { orderedStopIds: body.orderedStopIds } });
    return reply.success({ item: { ...serializePlannedTrip(updated), stops: updated.stops.map(serializePlannedTripStop) } });
  });
};
