import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { z } from 'zod';

import { ROLE_CODES, type TripStatus } from '@trackigniter8/shared';
import { ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  dispatchActionTypeSchema,
  findAssignmentPolicyOrThrow,
  findDispatchQueueItemOrThrow,
  findFleetReadinessProfileOrThrow,
  findPlannedTripOrThrow,
  findTripOrThrow,
  findTripStopOrThrow,
  getAuditContext,
  getPagination,
  paginationQuerySchema,
  serializeDispatchAction,
  serializeTrip,
  serializeTripEvent,
  serializeTripStop,
  serializeVehiclePosition,
  serializeVehicleTelemetryEvent,
  tripStatusSchema,
  tripStopStatusSchema,
} from '../utils.js';

const jsonRecordSchema = z.record(z.string(), z.unknown());

const tripIdParamSchema = z.object({
  tripId: z.string().min(1),
});

const tripStopIdParamSchema = z.object({
  tripId: z.string().min(1),
  stopId: z.string().min(1),
});

const listTripsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: tripStatusSchema.optional(),
  customerAccountId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(),
  plannedTripId: z.string().min(1).optional(),
  scheduledStartFrom: z.coerce.date().optional(),
  scheduledStartTo: z.coerce.date().optional(),
});

const createTripFromPlannedTripSchema = z.object({
  plannedTripId: z.string().min(1),
  dispatchQueueItemId: z.string().min(1).optional(),
  referenceCode: z.string().trim().min(1).optional(),
  note: z.string().trim().optional(),
});

const startTripSchema = z.object({
  readinessProfileId: z.string().min(1).optional(),
  assignmentPolicyId: z.string().min(1).optional(),
  force: z.boolean().default(false),
  note: z.string().trim().optional(),
});

const holdTripSchema = z.object({
  reason: z.string().trim().min(1),
  note: z.string().trim().optional(),
});

const lifecycleNoteSchema = z.object({
  note: z.string().trim().optional(),
});

const updateTripStopSchema = z
  .object({
    status: tripStopStatusSchema.optional(),
    note: z.string().trim().nullable().optional(),
    actualArrivalAt: z.coerce.date().nullable().optional(),
    actualDepartureAt: z.coerce.date().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one trip stop field must be supplied' });

const reorderTripStopsSchema = z.object({
  orderedStopIds: z.array(z.string().min(1)).min(1),
});

const replayQuerySchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  tripId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(200),
  order: z.enum(['asc', 'desc']).default('asc'),
  includeTelemetryEvents: z.coerce.boolean().default(false),
});

const TRIP_STATUS_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  SCHEDULED: ['READY', 'DISPATCHED', 'STARTED', 'CANCELLED', 'FAILED'],
  READY: ['DISPATCHED', 'STARTED', 'CANCELLED', 'FAILED'],
  DISPATCHED: ['STARTED', 'ON_HOLD', 'CANCELLED', 'FAILED'],
  STARTED: ['ON_HOLD', 'COMPLETED', 'CANCELLED', 'FAILED'],
  ON_HOLD: ['RESUMED', 'CANCELLED', 'FAILED', 'COMPLETED'],
  RESUMED: ['ON_HOLD', 'COMPLETED', 'CANCELLED', 'FAILED'],
  COMPLETED: [],
  CANCELLED: [],
  FAILED: [],
};

type ReadinessCheck = {
  code: string;
  label: string;
  passed: boolean;
  severity: 'blocker' | 'warning' | 'info';
  details?: string;
};

function assertTripStatusTransition(currentStatus: TripStatus, nextStatus: TripStatus) {
  if (currentStatus === nextStatus) {
    return;
  }

  if (!TRIP_STATUS_TRANSITIONS[currentStatus].includes(nextStatus)) {
    throw new ValidationAppError(`Cannot transition trip from ${currentStatus} to ${nextStatus}`);
  }
}

function assertStopReorderable(status: TripStatus) {
  if (!['SCHEDULED', 'READY', 'DISPATCHED'].includes(status)) {
    throw new ValidationAppError('Trip stops can only be reordered before the trip starts');
  }
}

async function assertTripReferenceCodeUnique(
  fastify: Parameters<FastifyPluginAsync>[0],
  input: { organizationId: string; referenceCode?: string | null | undefined; excludeTripId?: string }
) {
  const referenceCode = input.referenceCode?.trim();
  if (!referenceCode) {
    return;
  }

  const existing = await fastify.prisma.trip.findFirst({
    where: {
      organizationId: input.organizationId,
      referenceCode,
      ...(input.excludeTripId ? { id: { not: input.excludeTripId } } : {}),
    },
  });

  if (existing) {
    throw new ConflictError('A trip with that reference code already exists for this organization');
  }
}

async function writeTripEvent(
  fastify: Parameters<FastifyPluginAsync>[0],
  input: {
    tripId: string;
    eventType:
      | 'CREATED'
      | 'READINESS_VALIDATED'
      | 'DISPATCHED'
      | 'STARTED'
      | 'FORCE_STARTED'
      | 'HELD'
      | 'RESUMED'
      | 'COMPLETED'
      | 'CANCELLED'
      | 'FAILED'
      | 'STOP_STATUS_UPDATED'
      | 'STOP_REORDERED'
      | 'NOTE_ADDED';
    statusFrom?: TripStatus;
    statusTo?: TripStatus;
    note?: string | undefined;
    metadata?: Prisma.InputJsonValue | undefined;
    actorUserId?: string | undefined;
  }
) {
  return fastify.prisma.tripEvent.create({
    data: {
      tripId: input.tripId,
      eventType: input.eventType,
      ...(input.statusFrom ? { statusFrom: input.statusFrom } : {}),
      ...(input.statusTo ? { statusTo: input.statusTo } : {}),
      ...(input.note ? { note: input.note } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
      ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
    },
    include: {
      actorUser: true,
    },
  });
}

async function writeDispatchAction(
  fastify: Parameters<FastifyPluginAsync>[0],
  input: {
    organizationId: string;
    actionType: z.infer<typeof dispatchActionTypeSchema>;
    tripId?: string;
    plannedTripId?: string;
    dispatchQueueItemId?: string;
    note?: string | undefined;
    metadata?: Prisma.InputJsonValue | undefined;
    actorUserId?: string | undefined;
  }
) {
  return fastify.prisma.dispatchAction.create({
    data: {
      organizationId: input.organizationId,
      actionType: input.actionType,
      ...(input.tripId ? { tripId: input.tripId } : {}),
      ...(input.plannedTripId ? { plannedTripId: input.plannedTripId } : {}),
      ...(input.dispatchQueueItemId ? { dispatchQueueItemId: input.dispatchQueueItemId } : {}),
      ...(input.note ? { note: input.note } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
      ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
    },
    include: {
      actorUser: true,
    },
  });
}

function buildDispatchActionTripRefs(trip: {
  plannedTripId: string | null;
  dispatchQueueItemId: string | null;
}) {
  return {
    ...(trip.plannedTripId ? { plannedTripId: trip.plannedTripId } : {}),
    ...(trip.dispatchQueueItemId ? { dispatchQueueItemId: trip.dispatchQueueItemId } : {}),
  };
}

function addReadinessCheck(result: { checks: ReadinessCheck[]; blockers: string[]; warnings: string[] }, check: ReadinessCheck) {
  result.checks.push(check);
  if (!check.passed) {
    if (check.severity === 'blocker') {
      result.blockers.push(check.details ?? check.label);
    } else if (check.severity === 'warning') {
      result.warnings.push(check.details ?? check.label);
    }
  }
}

async function evaluateTripStartReadiness(
  fastify: Parameters<FastifyPluginAsync>[0],
  trip: Awaited<ReturnType<typeof findTripOrThrow>>,
  options: { readinessProfileId?: string | undefined; assignmentPolicyId?: string | undefined }
) {
  const readinessProfile = options.readinessProfileId
    ? await findFleetReadinessProfileOrThrow(fastify.prisma, options.readinessProfileId)
    : await fastify.prisma.fleetReadinessProfile.findFirst({
        where: { organizationId: trip.organizationId, status: 'ACTIVE' },
        orderBy: { createdAt: 'asc' },
      });

  if (readinessProfile && readinessProfile.organizationId !== trip.organizationId) {
    throw new ValidationAppError('Readiness profile must belong to the trip organization');
  }

  const assignmentPolicy = options.assignmentPolicyId
    ? await findAssignmentPolicyOrThrow(fastify.prisma, options.assignmentPolicyId)
    : await fastify.prisma.assignmentPolicy.findFirst({
        where: { organizationId: trip.organizationId, status: 'ACTIVE' },
        include: { rules: { where: { isActive: true }, orderBy: { sequence: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      });

  if (assignmentPolicy && assignmentPolicy.organizationId !== trip.organizationId) {
    throw new ValidationAppError('Assignment policy must belong to the trip organization');
  }

  const vehicle = trip.vehicle;
  const driver = trip.driver;
  const assignment = trip.assignment;
  const now = new Date();

  const readinessResult: {
    ready: boolean;
    checks: ReadinessCheck[];
    blockers: string[];
    warnings: string[];
  } = {
    ready: false,
    checks: [],
    blockers: [],
    warnings: [],
  };

  if (readinessProfile?.requireActiveVehicle) {
    addReadinessCheck(readinessResult, {
      code: 'vehicle.active',
      label: 'Vehicle must be active',
      passed: !!vehicle && vehicle.status === 'ACTIVE',
      severity: 'blocker',
      details: vehicle ? `Vehicle status is ${vehicle.status}` : 'Vehicle is required',
    });
  }

  if (readinessProfile?.requireActiveDriver) {
    addReadinessCheck(readinessResult, {
      code: 'driver.active',
      label: 'Driver must be active',
      passed: !!driver && driver.status === 'ACTIVE',
      severity: 'blocker',
      details: driver ? `Driver status is ${driver.status}` : 'Driver is required',
    });
  }

  if (vehicle && readinessProfile?.requireValidVehicleDocuments) {
    const activeDocs = vehicle.documents.filter((entry) => entry.status === 'ACTIVE');
    const validDocs = activeDocs.filter((entry) => !entry.expiryDate || entry.expiryDate >= now);
    const expiredDocs = activeDocs.filter((entry) => !!entry.expiryDate && entry.expiryDate < now);
    addReadinessCheck(readinessResult, {
      code: 'vehicle.documents.valid',
      label: 'Vehicle must have valid active documents',
      passed: validDocs.length > 0 && expiredDocs.length === 0,
      severity: 'blocker',
      details:
        expiredDocs.length > 0
          ? `${expiredDocs.length} active vehicle document(s) are expired`
          : validDocs.length === 0
            ? 'No valid active vehicle documents found'
            : 'Vehicle documents are valid',
    });
  }

  if (driver && readinessProfile?.requireValidDriverLicense) {
    const activeLicenses = driver.licenses.filter((entry) => entry.status === 'ACTIVE');
    const validLicenses = activeLicenses.filter((entry) => !entry.expiryDate || entry.expiryDate >= now);
    const expiredLicenses = activeLicenses.filter((entry) => !!entry.expiryDate && entry.expiryDate < now);
    addReadinessCheck(readinessResult, {
      code: 'driver.license.valid',
      label: 'Driver must have a valid active license',
      passed: validLicenses.length > 0 && expiredLicenses.length === 0,
      severity: 'blocker',
      details:
        expiredLicenses.length > 0
          ? `${expiredLicenses.length} active driver license(s) are expired`
          : validLicenses.length === 0
            ? 'No valid active driver licenses found'
            : 'Driver licenses are valid',
    });
  }

  if (vehicle) {
    const expiredVehicleCompliance = await fastify.prisma.vehicleComplianceRecord.findMany({
      where: {
        vehicleId: vehicle.id,
        status: 'ACTIVE',
        expiryDate: { not: null, lt: now },
      },
      include: { vehicleComplianceType: true },
    });
    addReadinessCheck(readinessResult, {
      code: 'vehicle.compliance.expired',
      label: 'Vehicle compliance records should not be expired',
      passed: expiredVehicleCompliance.length === 0,
      severity: expiredVehicleCompliance.length > 0 ? 'blocker' : 'info',
      details:
        expiredVehicleCompliance.length > 0
          ? `Expired vehicle compliance records: ${expiredVehicleCompliance.map((entry) => entry.vehicleComplianceType.name).join(', ')}`
          : 'No expired active vehicle compliance records',
    });
  }

  if (driver) {
    const expiredDriverCompliance = await fastify.prisma.driverComplianceRecord.findMany({
      where: {
        driverId: driver.id,
        status: 'ACTIVE',
        expiryDate: { not: null, lt: now },
      },
      include: { driverComplianceType: true },
    });
    addReadinessCheck(readinessResult, {
      code: 'driver.compliance.expired',
      label: 'Driver compliance records should not be expired',
      passed: expiredDriverCompliance.length === 0,
      severity: expiredDriverCompliance.length > 0 ? 'blocker' : 'info',
      details:
        expiredDriverCompliance.length > 0
          ? `Expired driver compliance records: ${expiredDriverCompliance.map((entry) => entry.driverComplianceType.name).join(', ')}`
          : 'No expired active driver compliance records',
    });
  }

  if (vehicle && readinessProfile?.requireActiveDevice) {
    const activeDevices = vehicle.devices.filter((entry) => entry.status === 'ACTIVE');
    addReadinessCheck(readinessResult, {
      code: 'vehicle.device.active',
      label: 'Vehicle must have an active device',
      passed: activeDevices.length > 0,
      severity: 'blocker',
      details: activeDevices.length > 0 ? `${activeDevices.length} active device(s) found` : 'No active devices found',
    });
  }

  if (readinessProfile?.requireActiveAssignment) {
    addReadinessCheck(readinessResult, {
      code: 'assignment.active',
      label: 'Active assignment required',
      passed: !!assignment && assignment.status === 'ACTIVE',
      severity: 'blocker',
      details: assignment ? `Assignment ${assignment.id} is active` : 'No active assignment found',
    });
  }

  readinessResult.ready = readinessResult.blockers.length === 0;

  const policyChecks: ReadinessCheck[] = [];
  const blockers = [...readinessResult.blockers];
  const warnings = [...readinessResult.warnings];

  for (const rule of assignmentPolicy?.rules ?? []) {
    let passed = true;
    let details = 'Rule passed';

    switch (rule.ruleCode) {
      case 'VEHICLE_ACTIVE':
        passed = !!vehicle && vehicle.status === 'ACTIVE';
        details = passed ? 'Vehicle is active' : vehicle ? `Vehicle status is ${vehicle.status}` : 'Vehicle is required';
        break;
      case 'DRIVER_ACTIVE':
        passed = !!driver && driver.status === 'ACTIVE';
        details = passed ? 'Driver is active' : driver ? `Driver status is ${driver.status}` : 'Driver is required';
        break;
      case 'DRIVER_VALID_LICENSE':
        passed = !!driver?.licenses.some((entry) => entry.status === 'ACTIVE' && (!entry.expiryDate || entry.expiryDate >= now));
        details = passed ? 'Driver has a valid active license' : 'Driver is missing a valid active license';
        break;
      case 'VEHICLE_VALID_DOCUMENTS':
        passed = !!vehicle?.documents.some((entry) => entry.status === 'ACTIVE' && (!entry.expiryDate || entry.expiryDate >= now));
        details = passed ? 'Vehicle has valid active documents' : 'Vehicle is missing valid active documents';
        break;
      case 'VEHICLE_ACTIVE_DEVICE':
        passed = !!vehicle?.devices.some((entry) => entry.status === 'ACTIVE');
        details = passed ? 'Vehicle has an active device' : 'Vehicle is missing an active device';
        break;
      case 'ACTIVE_ASSIGNMENT_REQUIRED':
        passed = !!assignment && assignment.status === 'ACTIVE';
        details = passed ? 'Active assignment exists' : 'No active assignment exists';
        break;
      case 'NO_OVERLAPPING_ACTIVE_ASSIGNMENT': {
        const overlappingTrips = await fastify.prisma.trip.findMany({
          where: {
            id: { not: trip.id },
            organizationId: trip.organizationId,
            status: { in: ['SCHEDULED', 'READY', 'DISPATCHED', 'STARTED', 'ON_HOLD', 'RESUMED'] },
            AND: [
              {
                OR: [
                  ...(trip.driverId ? [{ driverId: trip.driverId }] : []),
                  ...(trip.vehicleId ? [{ vehicleId: trip.vehicleId }] : []),
                ],
              },
              {
                scheduledStartAt: { lte: trip.scheduledEndAt ?? trip.scheduledStartAt },
              },
              {
                OR: [{ scheduledEndAt: null }, { scheduledEndAt: { gte: trip.scheduledStartAt } }],
              },
            ],
          },
        });
        passed = overlappingTrips.length === 0;
        details = passed ? 'No overlapping trips found' : `${overlappingTrips.length} overlapping trip(s) found`;
        break;
      }
      case 'SAME_ORGANIZATION':
        passed =
          (!vehicle || vehicle.organizationId === trip.organizationId) &&
          (!driver || driver.organizationId === trip.organizationId) &&
          (!assignment || assignment.organizationId === trip.organizationId);
        details = passed ? 'All assignments belong to the same organization' : 'Assigned entities must belong to the same organization';
        break;
      case 'SAME_CUSTOMER': {
        const targetCustomerId = trip.customerAccountId;
        passed =
          !targetCustomerId ||
          ((!vehicle?.customerAccountId || vehicle.customerAccountId === targetCustomerId) &&
            (!driver?.customerAccountId || driver.customerAccountId === targetCustomerId));
        details = passed ? 'Assigned entities are customer-compatible' : 'Assigned entities must match the trip customer';
        break;
      }
      case 'CUSTOM':
        passed = true;
        details = 'Custom rules are stored for future runtime enforcement';
        break;
    }

    const check: ReadinessCheck = {
      code: `policy.${rule.ruleCode.toLowerCase()}`,
      label: rule.name,
      passed,
      severity: rule.isBlocking ? 'blocker' : 'warning',
      details,
    };

    policyChecks.push(check);
    if (!passed) {
      if (rule.isBlocking) {
        blockers.push(details);
      } else {
        warnings.push(details);
      }
    }
  }

  return {
    valid: blockers.length === 0,
    readinessResult,
    policyChecks,
    blockers,
    warnings,
    context: {
      tripId: trip.id,
      readinessProfileId: readinessProfile?.id ?? null,
      assignmentPolicyId: assignmentPolicy?.id ?? null,
    },
  };
}

export const adminTripRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/trips', { preHandler: [fastify.authenticate, fastify.requirePermission('trips:read')] }, async (request, reply) => {
    const query = validateOrThrow(listTripsQuerySchema, request.query);
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
      ...(query.plannedTripId ? { plannedTripId: query.plannedTripId } : {}),
      ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
      ...(query.scheduledStartFrom || query.scheduledStartTo
        ? {
            scheduledStartAt: {
              ...(query.scheduledStartFrom ? { gte: query.scheduledStartFrom } : {}),
              ...(query.scheduledStartTo ? { lte: query.scheduledStartTo } : {}),
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
      fastify.prisma.trip.findMany({
        where,
        skip,
        take,
        orderBy: [{ scheduledStartAt: 'asc' }, { createdAt: 'desc' }],
        include: {
          customerAccount: { include: { contacts: true, locations: true } },
          plannedTrip: {
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
          },
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
          events: true,
          dispatchActions: true,
        },
      }),
      fastify.prisma.trip.count({ where }),
    ]);

    return reply.success({ items: items.map(serializeTrip) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/trips/:tripId', { preHandler: [fastify.authenticate, fastify.requirePermission('trips:read')] }, async (request, reply) => {
    const { tripId } = validateOrThrow(tripIdParamSchema, request.params);
    const trip = await findTripOrThrow(fastify.prisma, tripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);

    return reply.success({
      item: {
        ...serializeTrip(trip),
        stops: trip.stops.map(serializeTripStop),
        events: trip.events.map(serializeTripEvent),
        dispatchActions: trip.dispatchActions.map(serializeDispatchAction),
      },
    });
  });

  fastify.post('/admin/trips', { preHandler: [fastify.authenticate, fastify.requirePermission('trips:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createTripFromPlannedTripSchema, request.body);
    const plannedTrip = await findPlannedTripOrThrow(fastify.prisma, body.plannedTripId);
    await fastify.requireOrganizationAccess(request, plannedTrip.organizationId);
    await assertTripReferenceCodeUnique(fastify, { organizationId: plannedTrip.organizationId, referenceCode: body.referenceCode });

    const existing = await fastify.prisma.trip.findFirst({ where: { plannedTripId: plannedTrip.id } });
    if (existing) {
      throw new ConflictError('An execution trip already exists for that planned trip');
    }

    let dispatchQueueItem: Awaited<ReturnType<typeof findDispatchQueueItemOrThrow>> | null = null;
    if (body.dispatchQueueItemId) {
      dispatchQueueItem = await findDispatchQueueItemOrThrow(fastify.prisma, body.dispatchQueueItemId);
      if (dispatchQueueItem.plannedTripId !== plannedTrip.id) {
        throw new ConflictError('Dispatch queue item must belong to the selected planned trip');
      }
      await fastify.requireOrganizationAccess(request, dispatchQueueItem.plannedTrip.organizationId);
    }

    const initialStatus: TripStatus =
      plannedTrip.status === 'READY' || dispatchQueueItem?.status === 'READY' ? 'READY' : 'SCHEDULED';

    const actorUserId = request.currentUser?.id;
    const created = await fastify.prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          organizationId: plannedTrip.organizationId,
          plannedTripId: plannedTrip.id,
          status: initialStatus,
          title: plannedTrip.title,
          scheduledStartAt: plannedTrip.plannedStartAt,
          ...(dispatchQueueItem ? { dispatchQueueItemId: dispatchQueueItem.id } : {}),
          ...(plannedTrip.customerAccountId ? { customerAccountId: plannedTrip.customerAccountId } : {}),
          ...(plannedTrip.serviceRouteId ? { serviceRouteId: plannedTrip.serviceRouteId } : {}),
          ...(plannedTrip.serviceRouteTemplateId ? { serviceRouteTemplateId: plannedTrip.serviceRouteTemplateId } : {}),
          ...(plannedTrip.tripTemplateId ? { tripTemplateId: plannedTrip.tripTemplateId } : {}),
          ...(plannedTrip.vehicleId ? { vehicleId: plannedTrip.vehicleId } : {}),
          ...(plannedTrip.driverId ? { driverId: plannedTrip.driverId } : {}),
          ...(plannedTrip.assignmentId ? { assignmentId: plannedTrip.assignmentId } : {}),
          ...(body.referenceCode ? { referenceCode: body.referenceCode.trim() } : plannedTrip.referenceCode ? { referenceCode: plannedTrip.referenceCode } : {}),
          ...(plannedTrip.plannedEndAt ? { scheduledEndAt: plannedTrip.plannedEndAt } : {}),
          ...(plannedTrip.notes ? { notes: plannedTrip.notes } : {}),
          stops: {
            create: plannedTrip.stops.map((stop) => ({
              plannedTripStopId: stop.id,
              serviceStopId: stop.serviceStopId,
              serviceRouteTemplateStopId: stop.serviceRouteTemplateStopId,
              tripTemplateStopId: stop.tripTemplateStopId,
              name: stop.name,
              code: stop.code,
              description: stop.description,
              sequence: stop.sequence,
              scheduledArrivalAt: stop.plannedArrivalAt,
              scheduledDepartureAt: stop.plannedDepartureAt,
              addressLine1: stop.addressLine1,
              addressLine2: stop.addressLine2,
              city: stop.city,
              state: stop.state,
              postalCode: stop.postalCode,
              country: stop.country,
              latitude: stop.latitude,
              longitude: stop.longitude,
              isActive: stop.isActive,
            })),
          },
        },
        include: {
          customerAccount: { include: { contacts: true, locations: true } },
          plannedTrip: {
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
          },
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
          events: { include: { actorUser: true } },
          dispatchActions: { include: { actorUser: true } },
        },
      });

      await tx.tripEvent.create({
        data: {
          tripId: trip.id,
          eventType: 'CREATED',
          statusTo: initialStatus,
          ...(body.note ? { note: body.note } : {}),
          ...(actorUserId ? { actorUserId } : {}),
        },
      });

      await tx.dispatchAction.create({
        data: {
          organizationId: plannedTrip.organizationId,
          actionType: 'DISPATCHED',
          tripId: trip.id,
          plannedTripId: plannedTrip.id,
          ...(dispatchQueueItem ? { dispatchQueueItemId: dispatchQueueItem.id } : {}),
          ...(body.note ? { note: body.note } : {}),
          ...(actorUserId ? { actorUserId } : {}),
        },
      });

      await tx.plannedTrip.update({
        where: { id: plannedTrip.id },
        data: { status: 'DISPATCHED_PLACEHOLDER' },
      });

      if (dispatchQueueItem) {
        await tx.dispatchQueueItem.update({
          where: { id: dispatchQueueItem.id },
          data: { status: 'DISPATCHED_PLACEHOLDER' },
        });
      }

      return trip;
    });

    await fastify.audit.write({
      ...getAuditContext(request),
      action: 'admin.trip.create',
      entityType: 'Trip',
      entityId: created.id,
      metadata: { plannedTripId: plannedTrip.id, dispatchQueueItemId: dispatchQueueItem?.id ?? null, status: initialStatus },
    });

    return reply.status(201).success({ item: serializeTrip(created) });
  });

  fastify.post('/admin/trips/:tripId/start', { preHandler: [fastify.authenticate, fastify.requirePermission('trips:start')] }, async (request, reply) => {
    const { tripId } = validateOrThrow(tripIdParamSchema, request.params);
    const body = validateOrThrow(startTripSchema, request.body);
    const trip = await findTripOrThrow(fastify.prisma, tripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertTripStatusTransition(trip.status as TripStatus, 'STARTED');

    const validation = await evaluateTripStartReadiness(fastify, trip, body);
    const forceRequested = body.force ?? false;
    const canForceStart = request.currentUser?.permissions.includes('trips:force-start') ?? false;

    if (!validation.valid && (!forceRequested || !canForceStart)) {
      throw new ValidationAppError('Trip readiness validation failed', {
        blockers: validation.blockers,
        warnings: validation.warnings,
        readinessResult: validation.readinessResult,
        policyChecks: validation.policyChecks,
        forceAllowed: canForceStart,
      });
    }

    const now = new Date();
    const actorUserId = request.currentUser?.id;
    const started = await fastify.prisma.$transaction(async (tx) => {
      const updated = await tx.trip.update({
        where: { id: tripId },
        data: {
          status: 'STARTED',
          startedAt: trip.startedAt ?? now,
          dispatchedAt: trip.dispatchedAt ?? now,
          ...(body.note ? { notes: [trip.notes, body.note].filter(Boolean).join('\n') } : {}),
        },
        include: {
          customerAccount: { include: { contacts: true, locations: true } },
          plannedTrip: {
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
          },
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
          events: { include: { actorUser: true } },
          dispatchActions: { include: { actorUser: true } },
        },
      });

      await tx.tripEvent.create({
        data: {
          tripId,
          eventType: forceRequested && !validation.valid ? 'FORCE_STARTED' : 'STARTED',
          statusFrom: trip.status as TripStatus,
          statusTo: 'STARTED',
          ...(body.note ? { note: body.note } : {}),
          ...(actorUserId ? { actorUserId } : {}),
          metadata: {
            blockers: validation.blockers,
            warnings: validation.warnings,
            forced: forceRequested && !validation.valid,
          },
        },
      });

      await tx.dispatchAction.create({
        data: {
          organizationId: trip.organizationId,
          actionType: 'VALIDATED',
          tripId,
          ...(trip.plannedTripId ? { plannedTripId: trip.plannedTripId } : {}),
          ...(trip.dispatchQueueItemId ? { dispatchQueueItemId: trip.dispatchQueueItemId } : {}),
          ...(actorUserId ? { actorUserId } : {}),
          metadata: {
            blockers: validation.blockers,
            warnings: validation.warnings,
            valid: validation.valid,
          },
        },
      });

      await tx.dispatchAction.create({
        data: {
          organizationId: trip.organizationId,
          actionType: forceRequested && !validation.valid ? 'FORCE_STARTED' : 'STARTED',
          tripId,
          ...(trip.plannedTripId ? { plannedTripId: trip.plannedTripId } : {}),
          ...(trip.dispatchQueueItemId ? { dispatchQueueItemId: trip.dispatchQueueItemId } : {}),
          ...(body.note ? { note: body.note } : {}),
          ...(actorUserId ? { actorUserId } : {}),
        },
      });

      return updated;
    });

    await fastify.audit.write({
      ...getAuditContext(request),
      action: forceRequested && !validation.valid ? 'admin.trip.force_start' : 'admin.trip.start',
      entityType: 'Trip',
      entityId: tripId,
      metadata: { blockers: validation.blockers, warnings: validation.warnings },
    });

    return reply.success({
      item: serializeTrip(started),
      validation,
    });
  });

  fastify.post('/admin/trips/:tripId/hold', { preHandler: [fastify.authenticate, fastify.requirePermission('trips:manage')] }, async (request, reply) => {
    const { tripId } = validateOrThrow(tripIdParamSchema, request.params);
    const body = validateOrThrow(holdTripSchema, request.body);
    const trip = await findTripOrThrow(fastify.prisma, tripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertTripStatusTransition(trip.status as TripStatus, 'ON_HOLD');

    const now = new Date();
    const updated = await fastify.prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'ON_HOLD',
        holdStartedAt: now,
        holdReason: body.reason,
        ...(body.note ? { notes: [trip.notes, body.note].filter(Boolean).join('\n') } : {}),
      },
      include: {
        customerAccount: { include: { contacts: true, locations: true } },
        plannedTrip: true,
        serviceRoute: { include: { stops: true } },
        serviceRouteTemplate: { include: { stops: true } },
        tripTemplate: { include: { stops: true } },
        vehicle: { include: { customerAccount: { include: { contacts: true, locations: true } }, department: true, businessUnit: true, vehicleType: true, vehicleGroup: true, make: true, model: true, serviceRouteTemplate: { include: { stops: true } }, documents: true, devices: true } },
        driver: { include: { customerAccount: { include: { contacts: true, locations: true } }, department: true, businessUnit: true, driverGroup: true, skillAssignments: { include: { driverSkill: true } }, licenses: true, documents: true, vehicleAssignments: true } },
        assignment: { include: { driver: true, vehicle: true } },
        stops: true,
        events: { include: { actorUser: true } },
        dispatchActions: { include: { actorUser: true } },
      },
    });

    await writeTripEvent(fastify, { tripId, eventType: 'HELD', statusFrom: trip.status as TripStatus, statusTo: 'ON_HOLD', note: body.note ?? body.reason, actorUserId: request.currentUser?.id, metadata: { reason: body.reason } });
    await writeDispatchAction(fastify, {
      organizationId: trip.organizationId,
      actionType: 'HELD',
      tripId,
      ...buildDispatchActionTripRefs(trip),
      note: body.note ?? body.reason,
      actorUserId: request.currentUser?.id,
      metadata: { reason: body.reason },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.trip.hold', entityType: 'Trip', entityId: tripId, metadata: { reason: body.reason } });
    return reply.success({ item: serializeTrip(updated) });
  });

  fastify.post('/admin/trips/:tripId/resume', { preHandler: [fastify.authenticate, fastify.requirePermission('trips:manage')] }, async (request, reply) => {
    const { tripId } = validateOrThrow(tripIdParamSchema, request.params);
    const body = validateOrThrow(lifecycleNoteSchema, request.body);
    const trip = await findTripOrThrow(fastify.prisma, tripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertTripStatusTransition(trip.status as TripStatus, 'RESUMED');

    const now = new Date();
    const updated = await fastify.prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'RESUMED',
        resumedAt: now,
        holdReason: null,
        ...(body.note ? { notes: [trip.notes, body.note].filter(Boolean).join('\n') } : {}),
      },
      include: {
        customerAccount: { include: { contacts: true, locations: true } },
        plannedTrip: true,
        serviceRoute: { include: { stops: true } },
        serviceRouteTemplate: { include: { stops: true } },
        tripTemplate: { include: { stops: true } },
        vehicle: { include: { customerAccount: { include: { contacts: true, locations: true } }, department: true, businessUnit: true, vehicleType: true, vehicleGroup: true, make: true, model: true, serviceRouteTemplate: { include: { stops: true } }, documents: true, devices: true } },
        driver: { include: { customerAccount: { include: { contacts: true, locations: true } }, department: true, businessUnit: true, driverGroup: true, skillAssignments: { include: { driverSkill: true } }, licenses: true, documents: true, vehicleAssignments: true } },
        assignment: { include: { driver: true, vehicle: true } },
        stops: true,
        events: { include: { actorUser: true } },
        dispatchActions: { include: { actorUser: true } },
      },
    });

    await writeTripEvent(fastify, { tripId, eventType: 'RESUMED', statusFrom: trip.status as TripStatus, statusTo: 'RESUMED', note: body.note, actorUserId: request.currentUser?.id });
    await writeDispatchAction(fastify, {
      organizationId: trip.organizationId,
      actionType: 'RESUMED',
      tripId,
      ...buildDispatchActionTripRefs(trip),
      ...(body.note ? { note: body.note } : {}),
      ...(request.currentUser?.id ? { actorUserId: request.currentUser.id } : {}),
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.trip.resume', entityType: 'Trip', entityId: tripId });
    return reply.success({ item: serializeTrip(updated) });
  });

  fastify.post('/admin/trips/:tripId/complete', { preHandler: [fastify.authenticate, fastify.requirePermission('trips:complete')] }, async (request, reply) => {
    const { tripId } = validateOrThrow(tripIdParamSchema, request.params);
    const body = validateOrThrow(lifecycleNoteSchema, request.body);
    const trip = await findTripOrThrow(fastify.prisma, tripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertTripStatusTransition(trip.status as TripStatus, 'COMPLETED');

    const now = new Date();
    const updated = await fastify.prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'COMPLETED',
        completedAt: now,
        ...(body.note ? { notes: [trip.notes, body.note].filter(Boolean).join('\n') } : {}),
      },
      include: {
        customerAccount: { include: { contacts: true, locations: true } },
        plannedTrip: true,
        serviceRoute: { include: { stops: true } },
        serviceRouteTemplate: { include: { stops: true } },
        tripTemplate: { include: { stops: true } },
        vehicle: { include: { customerAccount: { include: { contacts: true, locations: true } }, department: true, businessUnit: true, vehicleType: true, vehicleGroup: true, make: true, model: true, serviceRouteTemplate: { include: { stops: true } }, documents: true, devices: true } },
        driver: { include: { customerAccount: { include: { contacts: true, locations: true } }, department: true, businessUnit: true, driverGroup: true, skillAssignments: { include: { driverSkill: true } }, licenses: true, documents: true, vehicleAssignments: true } },
        assignment: { include: { driver: true, vehicle: true } },
        stops: true,
        events: { include: { actorUser: true } },
        dispatchActions: { include: { actorUser: true } },
      },
    });

    await writeTripEvent(fastify, { tripId, eventType: 'COMPLETED', statusFrom: trip.status as TripStatus, statusTo: 'COMPLETED', note: body.note, actorUserId: request.currentUser?.id });
    await writeDispatchAction(fastify, {
      organizationId: trip.organizationId,
      actionType: 'COMPLETED',
      tripId,
      ...buildDispatchActionTripRefs(trip),
      ...(body.note ? { note: body.note } : {}),
      ...(request.currentUser?.id ? { actorUserId: request.currentUser.id } : {}),
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.trip.complete', entityType: 'Trip', entityId: tripId });
    return reply.success({ item: serializeTrip(updated) });
  });

  fastify.post('/admin/trips/:tripId/cancel', { preHandler: [fastify.authenticate, fastify.requirePermission('trips:cancel')] }, async (request, reply) => {
    const { tripId } = validateOrThrow(tripIdParamSchema, request.params);
    const body = validateOrThrow(lifecycleNoteSchema, request.body);
    const trip = await findTripOrThrow(fastify.prisma, tripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertTripStatusTransition(trip.status as TripStatus, 'CANCELLED');

    const now = new Date();
    const updated = await fastify.prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'CANCELLED',
        cancelledAt: now,
        ...(body.note ? { notes: [trip.notes, body.note].filter(Boolean).join('\n') } : {}),
      },
      include: {
        customerAccount: { include: { contacts: true, locations: true } },
        plannedTrip: true,
        serviceRoute: { include: { stops: true } },
        serviceRouteTemplate: { include: { stops: true } },
        tripTemplate: { include: { stops: true } },
        vehicle: { include: { customerAccount: { include: { contacts: true, locations: true } }, department: true, businessUnit: true, vehicleType: true, vehicleGroup: true, make: true, model: true, serviceRouteTemplate: { include: { stops: true } }, documents: true, devices: true } },
        driver: { include: { customerAccount: { include: { contacts: true, locations: true } }, department: true, businessUnit: true, driverGroup: true, skillAssignments: { include: { driverSkill: true } }, licenses: true, documents: true, vehicleAssignments: true } },
        assignment: { include: { driver: true, vehicle: true } },
        stops: true,
        events: { include: { actorUser: true } },
        dispatchActions: { include: { actorUser: true } },
      },
    });

    await writeTripEvent(fastify, { tripId, eventType: 'CANCELLED', statusFrom: trip.status as TripStatus, statusTo: 'CANCELLED', note: body.note, actorUserId: request.currentUser?.id });
    await writeDispatchAction(fastify, {
      organizationId: trip.organizationId,
      actionType: 'CANCELLED',
      tripId,
      ...buildDispatchActionTripRefs(trip),
      ...(body.note ? { note: body.note } : {}),
      ...(request.currentUser?.id ? { actorUserId: request.currentUser.id } : {}),
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.trip.cancel', entityType: 'Trip', entityId: tripId });
    return reply.success({ item: serializeTrip(updated) });
  });

  fastify.post('/admin/trips/:tripId/fail', { preHandler: [fastify.authenticate, fastify.requirePermission('trips:cancel')] }, async (request, reply) => {
    const { tripId } = validateOrThrow(tripIdParamSchema, request.params);
    const body = validateOrThrow(lifecycleNoteSchema, request.body);
    const trip = await findTripOrThrow(fastify.prisma, tripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertTripStatusTransition(trip.status as TripStatus, 'FAILED');

    const now = new Date();
    const updated = await fastify.prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'FAILED',
        failedAt: now,
        ...(body.note ? { notes: [trip.notes, body.note].filter(Boolean).join('\n') } : {}),
      },
      include: {
        customerAccount: { include: { contacts: true, locations: true } },
        plannedTrip: true,
        serviceRoute: { include: { stops: true } },
        serviceRouteTemplate: { include: { stops: true } },
        tripTemplate: { include: { stops: true } },
        vehicle: { include: { customerAccount: { include: { contacts: true, locations: true } }, department: true, businessUnit: true, vehicleType: true, vehicleGroup: true, make: true, model: true, serviceRouteTemplate: { include: { stops: true } }, documents: true, devices: true } },
        driver: { include: { customerAccount: { include: { contacts: true, locations: true } }, department: true, businessUnit: true, driverGroup: true, skillAssignments: { include: { driverSkill: true } }, licenses: true, documents: true, vehicleAssignments: true } },
        assignment: { include: { driver: true, vehicle: true } },
        stops: true,
        events: { include: { actorUser: true } },
        dispatchActions: { include: { actorUser: true } },
      },
    });

    await writeTripEvent(fastify, { tripId, eventType: 'FAILED', statusFrom: trip.status as TripStatus, statusTo: 'FAILED', note: body.note, actorUserId: request.currentUser?.id });
    await writeDispatchAction(fastify, {
      organizationId: trip.organizationId,
      actionType: 'FAILED',
      tripId,
      ...buildDispatchActionTripRefs(trip),
      ...(body.note ? { note: body.note } : {}),
      ...(request.currentUser?.id ? { actorUserId: request.currentUser.id } : {}),
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.trip.fail', entityType: 'Trip', entityId: tripId });
    return reply.success({ item: serializeTrip(updated) });
  });

  fastify.get('/admin/trips/:tripId/stops', { preHandler: [fastify.authenticate, fastify.requirePermission('trips:read')] }, async (request, reply) => {
    const { tripId } = validateOrThrow(tripIdParamSchema, request.params);
    const trip = await findTripOrThrow(fastify.prisma, tripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    return reply.success({ items: trip.stops.map(serializeTripStop) });
  });

  fastify.patch('/admin/trips/:tripId/stops/:stopId', { preHandler: [fastify.authenticate, fastify.requirePermission('trip-stops:manage')] }, async (request, reply) => {
    const { tripId, stopId } = validateOrThrow(tripStopIdParamSchema, request.params);
    const body = validateOrThrow(updateTripStopSchema, request.body);
    const trip = await findTripOrThrow(fastify.prisma, tripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    const stop = await findTripStopOrThrow(fastify.prisma, stopId);

    if (stop.tripId !== tripId) {
      throw new ConflictError('Trip stop does not belong to the requested trip');
    }

    const now = new Date();
    const updateData = {
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.note !== undefined ? { note: body.note } : {}),
      ...(body.actualArrivalAt !== undefined
        ? { actualArrivalAt: body.actualArrivalAt }
        : body.status === 'ARRIVED' && !stop.actualArrivalAt
          ? { actualArrivalAt: now }
          : {}),
      ...(body.actualDepartureAt !== undefined
        ? { actualDepartureAt: body.actualDepartureAt }
        : body.status === 'COMPLETED' && !stop.actualDepartureAt
          ? { actualDepartureAt: now }
          : {}),
    };

    const updated = await fastify.prisma.tripStop.update({ where: { id: stopId }, data: updateData });

    if (body.status && body.status !== stop.status) {
      await writeTripEvent(fastify, {
        tripId,
        eventType: 'STOP_STATUS_UPDATED',
        note: body.note ?? undefined,
        actorUserId: request.currentUser?.id,
        metadata: {
          tripStopId: stopId,
          stopName: stop.name,
          statusFrom: stop.status,
          statusTo: body.status,
        } as Prisma.InputJsonValue,
      });
    } else if (body.note !== undefined) {
      await writeTripEvent(fastify, {
        tripId,
        eventType: 'NOTE_ADDED',
        note: body.note ?? undefined,
        actorUserId: request.currentUser?.id,
        metadata: { tripStopId: stopId, stopName: stop.name } as Prisma.InputJsonValue,
      });
    }

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.trip_stop.update', entityType: 'TripStop', entityId: stopId, metadata: updateData });
    return reply.success({ item: serializeTripStop(updated) });
  });

  fastify.post('/admin/trips/:tripId/stops/reorder', { preHandler: [fastify.authenticate, fastify.requirePermission('trip-stops:manage')] }, async (request, reply) => {
    const { tripId } = validateOrThrow(tripIdParamSchema, request.params);
    const body = validateOrThrow(reorderTripStopsSchema, request.body);
    const trip = await findTripOrThrow(fastify.prisma, tripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);
    assertStopReorderable(trip.status as TripStatus);

    const currentStopIds = trip.stops.map((entry) => entry.id).sort();
    const submittedStopIds = [...body.orderedStopIds].sort();
    if (currentStopIds.length !== submittedStopIds.length || currentStopIds.some((id, index) => id !== submittedStopIds[index])) {
      throw new ValidationAppError('Reorder payload must include every trip stop exactly once');
    }

    await fastify.prisma.$transaction(async (tx) => {
      for (const [index, stopId] of body.orderedStopIds.entries()) {
        await tx.tripStop.update({ where: { id: stopId }, data: { sequence: index + 1 } });
      }
    });

    await writeTripEvent(fastify, {
      tripId,
      eventType: 'STOP_REORDERED',
      actorUserId: request.currentUser?.id,
      metadata: { orderedStopIds: body.orderedStopIds } as Prisma.InputJsonValue,
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.trip_stop.reorder', entityType: 'Trip', entityId: tripId, metadata: { orderedStopIds: body.orderedStopIds } });

    const updatedTrip = await findTripOrThrow(fastify.prisma, tripId);
    return reply.success({ item: { ...serializeTrip(updatedTrip), stops: updatedTrip.stops.map(serializeTripStop) } });
  });

  fastify.get('/admin/trips/:tripId/timeline', { preHandler: [fastify.authenticate, fastify.requirePermission('trip-events:read')] }, async (request, reply) => {
    const { tripId } = validateOrThrow(tripIdParamSchema, request.params);
    const trip = await findTripOrThrow(fastify.prisma, tripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);

    const timeline = [
      ...trip.events.map((event) => ({
        id: event.id,
        kind: 'trip_event' as const,
        happenedAt: event.happenedAt,
        item: serializeTripEvent(event),
      })),
      ...trip.dispatchActions.map((action) => ({
        id: action.id,
        kind: 'dispatch_action' as const,
        happenedAt: action.happenedAt,
        item: serializeDispatchAction(action),
      })),
    ].sort((left, right) => left.happenedAt.getTime() - right.happenedAt.getTime());

    return reply.success({ items: timeline });
  });

  fastify.get('/admin/trips/:tripId/positions', { preHandler: [fastify.authenticate, fastify.requirePermission('trip-replay:read')] }, async (request, reply) => {
    const { tripId } = validateOrThrow(tripIdParamSchema, request.params);
    const query = validateOrThrow(replayQuerySchema, request.query);
    const order = query.order ?? 'asc';
    const limit = query.limit ?? 200;
    const trip = await findTripOrThrow(fastify.prisma, tripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);

    const items = await fastify.prisma.vehiclePosition.findMany({
      where: {
        tripId,
        ...(query.dateFrom || query.dateTo
          ? {
              providerTimestamp: {
                ...(query.dateFrom ? { gte: query.dateFrom } : {}),
                ...(query.dateTo ? { lte: query.dateTo } : {}),
              },
            }
          : {}),
      },
      take: limit,
      orderBy: [{ providerTimestamp: order }],
    });

    return reply.success({
      trip: serializeTrip(trip),
      items: items.map(serializeVehiclePosition),
      meta: { limit, order },
    });
  });

  fastify.get('/admin/trips/:tripId/replay', { preHandler: [fastify.authenticate, fastify.requirePermission('trip-replay:read')] }, async (request, reply) => {
    const { tripId } = validateOrThrow(tripIdParamSchema, request.params);
    const query = validateOrThrow(replayQuerySchema, request.query);
    const order = query.order ?? 'asc';
    const limit = query.limit ?? 200;
    const trip = await findTripOrThrow(fastify.prisma, tripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);

    const positions = await fastify.prisma.vehiclePosition.findMany({
      where: {
        tripId,
        ...(query.dateFrom || query.dateTo
          ? {
              providerTimestamp: {
                ...(query.dateFrom ? { gte: query.dateFrom } : {}),
                ...(query.dateTo ? { lte: query.dateTo } : {}),
              },
            }
          : {}),
      },
      take: limit,
      orderBy: [{ providerTimestamp: order }],
    });

    const telemetryEvents = query.includeTelemetryEvents
      ? await fastify.prisma.vehicleTelemetryEvent.findMany({
          where: {
            tripId,
            ...(query.dateFrom || query.dateTo
              ? {
                  providerTimestamp: {
                    ...(query.dateFrom ? { gte: query.dateFrom } : {}),
                    ...(query.dateTo ? { lte: query.dateTo } : {}),
                  },
                }
              : {}),
          },
          take: limit,
          orderBy: [{ providerTimestamp: order }],
        })
      : [];

    return reply.success({
      trip: serializeTrip(trip),
      replay: {
        items: positions.map(serializeVehiclePosition),
        telemetryEvents: telemetryEvents.map(serializeVehicleTelemetryEvent),
      },
      meta: {
          limit,
          order,
          includeTelemetryEvents: query.includeTelemetryEvents,
        },
      });
  });

  fastify.get('/admin/vehicles/:vehicleId/replay', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-replay:read')] }, async (request, reply) => {
    const { vehicleId } = validateOrThrow(z.object({ vehicleId: z.string().min(1) }), request.params);
    const query = validateOrThrow(replayQuerySchema, request.query);
    const order = query.order ?? 'asc';
    const limit = query.limit ?? 200;
    const vehicle = await fastify.prisma.vehicle.findUnique({ where: { id: vehicleId } });

    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    await fastify.requireOrganizationAccess(request, vehicle.organizationId);

    const positions = await fastify.prisma.vehiclePosition.findMany({
      where: {
        vehicleId,
        ...(query.tripId ? { tripId: query.tripId } : {}),
        ...(query.dateFrom || query.dateTo
          ? {
              providerTimestamp: {
                ...(query.dateFrom ? { gte: query.dateFrom } : {}),
                ...(query.dateTo ? { lte: query.dateTo } : {}),
              },
            }
          : {}),
      },
      take: limit,
      orderBy: [{ providerTimestamp: order }],
    });

    const telemetryEvents = query.includeTelemetryEvents
      ? await fastify.prisma.vehicleTelemetryEvent.findMany({
          where: {
            vehicleId,
            ...(query.tripId ? { tripId: query.tripId } : {}),
            ...(query.dateFrom || query.dateTo
              ? {
                  providerTimestamp: {
                    ...(query.dateFrom ? { gte: query.dateFrom } : {}),
                    ...(query.dateTo ? { lte: query.dateTo } : {}),
                  },
                }
              : {}),
          },
          take: limit,
          orderBy: [{ providerTimestamp: order }],
        })
      : [];

    return reply.success({
      vehicle: {
        id: vehicle.id,
        registrationNumber: vehicle.registrationNumber,
        plateNumber: vehicle.plateNumber,
        status: vehicle.status,
      },
      replay: {
        items: positions.map(serializeVehiclePosition),
        telemetryEvents: telemetryEvents.map(serializeVehicleTelemetryEvent),
      },
      meta: {
          limit,
          order,
          includeTelemetryEvents: query.includeTelemetryEvents,
        },
      });
  });
};
