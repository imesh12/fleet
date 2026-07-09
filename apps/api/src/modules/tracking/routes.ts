import { createHash } from 'node:crypto';

import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import {
  createTrackingProviderAdapter,
  type NormalizedTrackingDevice,
  type NormalizedTrackingIngestEvent,
} from '@trackigniter8/tracking-providers';
import { AuthenticationError, ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';
import {
  assertProviderTypeMatches,
  authenticateTrackingProvider,
  ingestNormalizedTrackingBatch,
  normalizeProviderBatch,
  parseBearerToken as parseProviderBearerToken,
} from '../../lib/tracking-execution.js';

const jsonRecordSchema = z.record(z.string(), z.unknown());

const ingestHeadersSchema = z.object({
  'x-tracking-provider-code': z.string().min(1),
  'x-tracking-key-id': z.string().min(1),
  'x-tracking-api-key': z.string().min(1).optional(),
  authorization: z.string().optional(),
});

const telemetryEventSchema = z
  .object({
    organizationId: z.string().min(1),
    vehicleId: z.string().min(1).optional(),
    vehicleDeviceId: z.string().min(1).optional(),
    externalDeviceId: z.string().min(1).optional(),
    trackingProviderId: z.string().min(1).optional(),
    tripId: z.string().min(1).optional(),
    providerEventId: z.string().min(1).optional(),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    speed: z.coerce.number().min(0).optional(),
    heading: z.coerce.number().min(0).max(360).optional(),
    altitude: z.coerce.number().optional(),
    accuracy: z.coerce.number().min(0).optional(),
    ignition: z.boolean().optional(),
    battery: z.coerce.number().min(0).max(100).optional(),
    odometer: z.coerce.number().int().min(0).optional(),
    eventType: z.string().trim().optional(),
    providerTimestamp: z.coerce.date(),
    rawPayload: z.unknown().optional(),
  })
  .refine((value) => value.vehicleId || value.vehicleDeviceId || value.externalDeviceId, {
    message: 'vehicleId, vehicleDeviceId, or externalDeviceId is required',
  });

const adapterBatchBodySchema = z.object({
  organizationId: z.string().min(1),
  providerType: z.string().trim().min(1),
  devicePayloads: z.array(jsonRecordSchema).default([]),
  positionPayloads: z.array(jsonRecordSchema).min(1),
});

const traccarWebhookBodySchema = z.object({
  organizationId: z.string().min(1),
  devicePayloads: z.array(jsonRecordSchema).default([]),
  positionPayloads: z.array(jsonRecordSchema).min(1),
});

const ingestBodySchema = z.union([
  telemetryEventSchema,
  z.object({
    events: z.array(telemetryEventSchema).min(1),
  }),
  adapterBatchBodySchema,
]);

type NormalizedTelemetryEvent = z.infer<typeof telemetryEventSchema>;

function hashSecret(secret: string) {
  return createHash('sha256').update(secret).digest('hex');
}

function parseBearerToken(header?: string) {
  if (!header) {
    return undefined;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function normalizeProviderCode(code: string) {
  return code
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();
}

function normalizeMasterDataCode(code: string) {
  return code
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();
}

function asNormalizedTelemetryEvent(event: NormalizedTrackingIngestEvent): NormalizedTelemetryEvent {
  return {
    organizationId: event.organizationId,
    ...(event.vehicleId ? { vehicleId: event.vehicleId } : {}),
    ...(event.vehicleDeviceId ? { vehicleDeviceId: event.vehicleDeviceId } : {}),
    ...(event.externalDeviceId ? { externalDeviceId: event.externalDeviceId } : {}),
    ...(event.trackingProviderId ? { trackingProviderId: event.trackingProviderId } : {}),
    ...(event.tripId ? { tripId: event.tripId } : {}),
    ...(event.providerEventId ? { providerEventId: event.providerEventId } : {}),
    latitude: event.latitude,
    longitude: event.longitude,
    ...(event.speed !== undefined ? { speed: event.speed } : {}),
    ...(event.heading !== undefined ? { heading: event.heading } : {}),
    ...(event.altitude !== undefined ? { altitude: event.altitude } : {}),
    ...(event.accuracy !== undefined ? { accuracy: event.accuracy } : {}),
    ...(event.ignition !== undefined ? { ignition: event.ignition } : {}),
    ...(event.battery !== undefined ? { battery: event.battery } : {}),
    ...(event.odometer !== undefined ? { odometer: event.odometer } : {}),
    ...(event.eventType ? { eventType: event.eventType } : {}),
    providerTimestamp: event.providerTimestamp,
    ...(event.rawPayload !== undefined ? { rawPayload: event.rawPayload } : {}),
  };
}

function normalizeAdapterPayload(body: z.infer<typeof adapterBatchBodySchema>) {
  const adapter = createTrackingProviderAdapter(body.providerType);
  const devices = body.devicePayloads.map((payload) =>
    adapter.normalizeDevicePayload({
      organizationId: body.organizationId,
      payload,
    })
  );
  const events = body.positionPayloads.map((payload) =>
    asNormalizedTelemetryEvent(
      adapter.normalizePositionPayload({
        organizationId: body.organizationId,
        payload,
      })
    )
  );

  return { devices, events };
}

async function upsertExternalTrackingDevice(
  fastify: Parameters<FastifyPluginAsync>[0],
  provider: {
    id: string;
    organizationId: string;
  },
  input: NormalizedTrackingDevice
) {
  const mappingCount = await fastify.prisma.vehicleDeviceMapping.count({
    where: {
      trackingProviderId: provider.id,
      externalTrackingDevice: {
        externalDeviceId: input.externalDeviceId,
      },
      status: 'ACTIVE',
    },
  });

  return fastify.prisma.externalTrackingDevice.upsert({
    where: {
      trackingProviderId_externalDeviceId: {
        trackingProviderId: provider.id,
        externalDeviceId: input.externalDeviceId,
      },
    },
    update: {
      ...(input.providerUniqueId ? { providerUniqueId: input.providerUniqueId } : {}),
      ...(input.name ? { name: input.name } : {}),
      ...(input.imei ? { imei: input.imei } : {}),
      ...(input.model ? { model: input.model } : {}),
      ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
      ...(input.lastSeenAt ? { lastSeenAt: input.lastSeenAt } : {}),
      ...(input.rawPayload !== undefined ? { lastPayload: input.rawPayload as Prisma.InputJsonValue } : {}),
      ...(input.metadata ? { metadata: input.metadata as Prisma.InputJsonValue } : {}),
      status: mappingCount > 0 ? 'MAPPED' : 'DISCOVERED',
    },
    create: {
      organizationId: provider.organizationId,
      trackingProviderId: provider.id,
      externalDeviceId: input.externalDeviceId,
      status: mappingCount > 0 ? 'MAPPED' : 'DISCOVERED',
      ...(input.providerUniqueId ? { providerUniqueId: input.providerUniqueId } : {}),
      ...(input.name ? { name: input.name } : {}),
      ...(input.imei ? { imei: input.imei } : {}),
      ...(input.model ? { model: input.model } : {}),
      ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
      ...(input.lastSeenAt ? { lastSeenAt: input.lastSeenAt } : {}),
      ...(input.rawPayload !== undefined ? { lastPayload: input.rawPayload as Prisma.InputJsonValue } : {}),
      ...(input.metadata ? { metadata: input.metadata as Prisma.InputJsonValue } : {}),
    },
  });
}

async function resolveVehicleContext(
  fastify: Parameters<FastifyPluginAsync>[0],
  provider: {
    id: string;
    organizationId: string;
    code: string;
  },
  event: NormalizedTelemetryEvent
) {
  let vehicle = event.vehicleId
    ? await fastify.prisma.vehicle.findUnique({
        where: { id: event.vehicleId },
      })
    : null;

  let vehicleDevice = event.vehicleDeviceId
    ? await fastify.prisma.vehicleDevice.findUnique({
        where: { id: event.vehicleDeviceId },
      })
    : null;

  let externalTrackingDevice = event.externalDeviceId
    ? await fastify.prisma.externalTrackingDevice.findFirst({
        where: {
          trackingProviderId: provider.id,
          externalDeviceId: event.externalDeviceId,
        },
      })
    : null;

  if (!externalTrackingDevice && event.externalDeviceId) {
    externalTrackingDevice = await upsertExternalTrackingDevice(fastify, provider, {
      externalDeviceId: event.externalDeviceId,
      lastSeenAt: event.providerTimestamp,
      rawPayload: event.rawPayload,
      metadata: { discoveredBy: 'tracking_ingest' },
    });
  }

  if (!vehicle && externalTrackingDevice) {
    const mapping = await fastify.prisma.vehicleDeviceMapping.findFirst({
      where: {
        externalTrackingDeviceId: externalTrackingDevice.id,
        status: 'ACTIVE',
      },
      include: {
        vehicle: true,
        vehicleDevice: true,
      },
    });

    if (mapping) {
      vehicle = mapping.vehicle;
      vehicleDevice = mapping.vehicleDevice;
    }
  }

  if (!vehicleDevice && event.externalDeviceId) {
    vehicleDevice = await fastify.prisma.vehicleDevice.findFirst({
      where: {
        externalDeviceId: event.externalDeviceId,
        provider: provider.code,
        status: { in: ['ACTIVE', 'INACTIVE'] },
        vehicle: {
          organizationId: provider.organizationId,
        },
      },
    });
  }

  if (!vehicle && vehicleDevice) {
    vehicle = await fastify.prisma.vehicle.findUnique({
      where: { id: vehicleDevice.vehicleId },
    });
  }

  if (!vehicle) {
    throw new ValidationAppError('Unable to resolve a vehicle for the telemetry event');
  }

  if (vehicle.organizationId !== provider.organizationId || event.organizationId !== provider.organizationId) {
    throw new ConflictError('Telemetry event organization does not match the tracking provider organization');
  }

  if (vehicleDevice) {
    if (vehicleDevice.vehicleId !== vehicle.id) {
      throw new ConflictError('Vehicle device must belong to the resolved vehicle');
    }

    if (vehicleDevice.provider !== provider.code) {
      throw new ConflictError('Vehicle device provider must match the tracking provider code');
    }
  }

  return {
    vehicle,
    vehicleDevice,
    externalTrackingDevice,
  };
}

async function resolveTrip(
  fastify: Parameters<FastifyPluginAsync>[0],
  input: {
    organizationId: string;
    vehicleId: string;
    tripId?: string;
  }
) {
  if (input.tripId) {
    const trip = await fastify.prisma.trip.findUnique({
      where: { id: input.tripId },
    });

    if (!trip) {
      throw new NotFoundError('Trip not found for telemetry ingest');
    }

    if (trip.organizationId !== input.organizationId) {
      throw new ConflictError('Trip must belong to the same organization as the telemetry event');
    }

    if (trip.vehicleId && trip.vehicleId !== input.vehicleId) {
      throw new ConflictError('Trip vehicle must match the telemetry event vehicle');
    }

    return trip;
  }

  return fastify.prisma.trip.findFirst({
    where: {
      organizationId: input.organizationId,
      vehicleId: input.vehicleId,
      status: {
        in: ['READY', 'DISPATCHED', 'STARTED', 'ON_HOLD', 'RESUMED'],
      },
    },
    orderBy: [{ startedAt: 'desc' }, { scheduledStartAt: 'desc' }],
  });
}

function isMoving(speed?: number | null) {
  return (speed ?? 0) > 1;
}

async function writeTripMovementEvents(
  tx: Prisma.TransactionClient,
  input: {
    tripId: string | null;
    event: NormalizedTelemetryEvent;
    previousLatest:
      | {
          tripId: string | null;
          speed: Prisma.Decimal | null;
        }
      | null;
  }
) {
  if (!input.tripId) {
    return;
  }

  const previousTripId = input.previousLatest?.tripId ?? null;
  const previousSpeed = input.previousLatest?.speed ? Number(input.previousLatest.speed.toString()) : null;
  const previousMoving = isMoving(previousSpeed);
  const currentMoving = isMoving(input.event.speed ?? null);

  if (!input.previousLatest || previousTripId !== input.tripId) {
    await tx.tripEvent.create({
      data: {
        tripId: input.tripId,
        eventType: 'TELEMETRY_RECEIVED',
        metadata: {
          source: 'tracking_ingest',
          speed: input.event.speed ?? null,
          ignition: input.event.ignition ?? null,
        },
      },
    });
  }

  if (!previousMoving && currentMoving) {
    await tx.tripEvent.create({
      data: {
        tripId: input.tripId,
        eventType: 'MOVEMENT_STARTED',
        metadata: {
          source: 'tracking_ingest',
          speed: input.event.speed ?? null,
        },
      },
    });
  }

  if (previousMoving && !currentMoving) {
    await tx.tripEvent.create({
      data: {
        tripId: input.tripId,
        eventType: 'MOVEMENT_STOPPED',
        metadata: {
          source: 'tracking_ingest',
          speed: input.event.speed ?? null,
        },
      },
    });
  }
}

type ActiveTrackingAlertRule = Awaited<ReturnType<Parameters<FastifyPluginAsync>[0]['prisma']['trackingAlertRule']['findMany']>>[number];

function buildTrackingAlertEvents(input: {
  activeRules: ActiveTrackingAlertRule[];
  organizationId: string;
  trackingProviderId: string;
  vehicleId: string;
  tripId: string | null;
  vehiclePositionId: string | null;
  vehicleTelemetryEventId: string;
  previousLatest:
    | {
        tripId: string | null;
        speed: Prisma.Decimal | null;
        ignition: boolean | null;
      }
    | null;
  event: NormalizedTelemetryEvent;
  resolvedTripStatus?: string | null;
}) {
  const previousSpeed = input.previousLatest?.speed ? Number(input.previousLatest.speed.toString()) : null;
  const previousIgnition = input.previousLatest?.ignition ?? null;

  return input.activeRules
    .filter((rule) => (!rule.trackingProviderId || rule.trackingProviderId === input.trackingProviderId) && (!rule.vehicleId || rule.vehicleId === input.vehicleId))
    .flatMap((rule) => {
      switch (rule.ruleType) {
        case 'SPEED_THRESHOLD': {
          const threshold =
            rule.condition && typeof rule.condition === 'object' && 'speedThreshold' in rule.condition && typeof rule.condition.speedThreshold === 'number'
              ? rule.condition.speedThreshold
              : null;
          if (threshold === null || input.event.speed === undefined || input.event.speed <= threshold || (previousSpeed !== null && previousSpeed > threshold)) {
            return [];
          }
          return [
            {
              organizationId: input.organizationId,
              trackingAlertRuleId: rule.id,
              vehicleId: input.vehicleId,
              ...(input.tripId ? { tripId: input.tripId } : {}),
              ...(input.vehiclePositionId ? { vehiclePositionId: input.vehiclePositionId } : {}),
              vehicleTelemetryEventId: input.vehicleTelemetryEventId,
              title: `${rule.name} triggered`,
              message: `Vehicle speed ${input.event.speed} exceeded threshold ${threshold}`,
              metadata: {
                ruleType: rule.ruleType,
                severity: rule.severity,
                threshold,
                speed: input.event.speed,
              } as Prisma.InputJsonValue,
            },
          ];
        }
        case 'IGNITION_ON':
          return input.event.ignition === true && previousIgnition !== true
            ? [
                {
                  organizationId: input.organizationId,
                  trackingAlertRuleId: rule.id,
                  vehicleId: input.vehicleId,
                  ...(input.tripId ? { tripId: input.tripId } : {}),
                  ...(input.vehiclePositionId ? { vehiclePositionId: input.vehiclePositionId } : {}),
                  vehicleTelemetryEventId: input.vehicleTelemetryEventId,
                  title: `${rule.name} triggered`,
                  message: 'Ignition switched on',
                  metadata: { ruleType: rule.ruleType, severity: rule.severity } as Prisma.InputJsonValue,
                },
              ]
            : [];
        case 'IGNITION_OFF':
          return input.event.ignition === false && previousIgnition !== false
            ? [
                {
                  organizationId: input.organizationId,
                  trackingAlertRuleId: rule.id,
                  vehicleId: input.vehicleId,
                  ...(input.tripId ? { tripId: input.tripId } : {}),
                  ...(input.vehiclePositionId ? { vehiclePositionId: input.vehiclePositionId } : {}),
                  vehicleTelemetryEventId: input.vehicleTelemetryEventId,
                  title: `${rule.name} triggered`,
                  message: 'Ignition switched off',
                  metadata: { ruleType: rule.ruleType, severity: rule.severity } as Prisma.InputJsonValue,
                },
              ]
            : [];
        case 'TRIP_STARTED':
          return input.tripId && input.previousLatest?.tripId !== input.tripId
            ? [
                {
                  organizationId: input.organizationId,
                  trackingAlertRuleId: rule.id,
                  vehicleId: input.vehicleId,
                  tripId: input.tripId,
                  ...(input.vehiclePositionId ? { vehiclePositionId: input.vehiclePositionId } : {}),
                  vehicleTelemetryEventId: input.vehicleTelemetryEventId,
                  title: `${rule.name} triggered`,
                  message: 'Trip telemetry started for the linked trip',
                  metadata: { ruleType: rule.ruleType, severity: rule.severity } as Prisma.InputJsonValue,
                },
              ]
            : [];
        case 'TRIP_COMPLETED':
          return input.tripId && input.resolvedTripStatus === 'COMPLETED'
            ? [
                {
                  organizationId: input.organizationId,
                  trackingAlertRuleId: rule.id,
                  vehicleId: input.vehicleId,
                  tripId: input.tripId,
                  ...(input.vehiclePositionId ? { vehiclePositionId: input.vehiclePositionId } : {}),
                  vehicleTelemetryEventId: input.vehicleTelemetryEventId,
                  title: `${rule.name} triggered`,
                  message: 'Telemetry received for a completed trip',
                  metadata: { ruleType: rule.ruleType, severity: rule.severity } as Prisma.InputJsonValue,
                },
              ]
            : [];
        default:
          return [];
      }
    });
}

export const trackingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/tracking/ingest', async (request, reply) => {
    const headers = validateOrThrow(ingestHeadersSchema, request.headers);
    const rawBody = validateOrThrow(ingestBodySchema, request.body);
    const providerCode = normalizeProviderCode(headers['x-tracking-provider-code']);
    const keyId = headers['x-tracking-key-id'].trim();
    const providedSecret = headers['x-tracking-api-key']?.trim() || parseBearerToken(headers.authorization);

    if (!providedSecret) {
      throw new AuthenticationError('Tracking ingest secret is required');
    }

    const normalized = 'providerType' in rawBody
      ? normalizeAdapterPayload({
          organizationId: rawBody.organizationId,
          providerType: rawBody.providerType,
          devicePayloads: rawBody.devicePayloads ?? [],
          positionPayloads: rawBody.positionPayloads,
        })
      : {
          devices: [] as NormalizedTrackingDevice[],
          events: 'events' in rawBody ? rawBody.events : [rawBody],
        };

    const organizationIds = Array.from(new Set(normalized.events.map((event) => event.organizationId)));
    if (organizationIds.length !== 1) {
      throw new ValidationAppError('Telemetry batch ingest must contain exactly one organizationId');
    }

    const organizationId = organizationIds[0]!;
    const provider = await fastify.prisma.trackingProvider.findFirst({
      where: {
        organizationId,
        code: providerCode,
      },
      include: {
        credentials: {
          where: {
            keyId,
            status: 'ACTIVE',
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!provider || provider.status !== 'ACTIVE') {
      throw new AuthenticationError('Tracking provider is invalid or inactive');
    }

    if ('providerType' in rawBody && normalizeMasterDataCode(rawBody.providerType) !== normalizeMasterDataCode(provider.providerType)) {
      throw new ConflictError('Adapter providerType must match the authenticated tracking provider type');
    }

    const credential = provider.credentials.find((entry) => {
      const notExpired = !entry.expiresAt || entry.expiresAt >= new Date();
      return notExpired && entry.secretHash === hashSecret(providedSecret);
    });

    if (!credential) {
      throw new AuthenticationError('Tracking ingest credential is invalid or expired');
    }

    for (const device of normalized.devices) {
      await upsertExternalTrackingDevice(fastify, provider, device);
    }

    const activeRules = await fastify.prisma.trackingAlertRule.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        OR: [{ trackingProviderId: null }, { trackingProviderId: provider.id }],
      },
    });

    const ingestedEvents: Array<{
      telemetryEventId: string;
      vehiclePositionId: string | null;
      vehicleId: string;
      tripId: string | null;
      providerTimestamp: Date;
      alertEventCount: number;
    }> = [];

    for (const event of normalized.events) {
      if (event.trackingProviderId && event.trackingProviderId !== provider.id) {
        throw new ConflictError('trackingProviderId must match the authenticated tracking provider');
      }

      const { vehicle, vehicleDevice, externalTrackingDevice } = await resolveVehicleContext(fastify, provider, event);
      const resolvedTrip = await resolveTrip(fastify, {
        organizationId,
        vehicleId: vehicle.id,
        ...(event.tripId ? { tripId: event.tripId } : {}),
      });

      const result = await fastify.prisma.$transaction(async (tx) => {
        const previousLatest = await tx.vehiclePosition.findUnique({
          where: { vehicleId: vehicle.id },
        });

        const telemetryEvent = await tx.vehicleTelemetryEvent.create({
          data: {
            organizationId,
            vehicleId: vehicle.id,
            latitude: event.latitude,
            longitude: event.longitude,
            providerTimestamp: event.providerTimestamp,
            ...(vehicleDevice ? { vehicleDeviceId: vehicleDevice.id } : {}),
            trackingProviderId: provider.id,
            ...(resolvedTrip ? { tripId: resolvedTrip.id } : {}),
            ...(event.providerEventId ? { providerEventId: event.providerEventId } : {}),
            ...(event.speed !== undefined ? { speed: event.speed } : {}),
            ...(event.heading !== undefined ? { heading: event.heading } : {}),
            ...(event.altitude !== undefined ? { altitude: event.altitude } : {}),
            ...(event.accuracy !== undefined ? { accuracy: event.accuracy } : {}),
            ...(event.ignition !== undefined ? { ignition: event.ignition } : {}),
            ...(event.battery !== undefined ? { battery: event.battery } : {}),
            ...(event.odometer !== undefined ? { odometer: event.odometer } : {}),
            ...(event.eventType ? { eventType: event.eventType } : {}),
            ...(event.rawPayload !== undefined ? { rawPayload: event.rawPayload as Prisma.InputJsonValue } : {}),
          },
        });

        let latestPositionId: string | null = null;
        if (!previousLatest || previousLatest.providerTimestamp <= event.providerTimestamp) {
          const latestPosition = await tx.vehiclePosition.upsert({
            where: { vehicleId: vehicle.id },
            update: {
              organizationId,
              latitude: event.latitude,
              longitude: event.longitude,
              providerTimestamp: event.providerTimestamp,
              receivedAt: new Date(),
              ...(vehicleDevice ? { vehicleDeviceId: vehicleDevice.id } : { vehicleDeviceId: null }),
              trackingProviderId: provider.id,
              ...(resolvedTrip ? { tripId: resolvedTrip.id } : { tripId: null }),
              ...(event.speed !== undefined ? { speed: event.speed } : { speed: null }),
              ...(event.heading !== undefined ? { heading: event.heading } : { heading: null }),
              ...(event.altitude !== undefined ? { altitude: event.altitude } : { altitude: null }),
              ...(event.accuracy !== undefined ? { accuracy: event.accuracy } : { accuracy: null }),
              ...(event.ignition !== undefined ? { ignition: event.ignition } : { ignition: null }),
              ...(event.battery !== undefined ? { battery: event.battery } : { battery: null }),
              ...(event.odometer !== undefined ? { odometer: event.odometer } : { odometer: null }),
              ...(event.eventType ? { eventType: event.eventType } : { eventType: null }),
              ...(event.rawPayload !== undefined
                ? { rawPayload: event.rawPayload as Prisma.InputJsonValue }
                : { rawPayload: Prisma.JsonNull }),
            },
            create: {
              organizationId,
              vehicleId: vehicle.id,
              latitude: event.latitude,
              longitude: event.longitude,
              providerTimestamp: event.providerTimestamp,
              ...(vehicleDevice ? { vehicleDeviceId: vehicleDevice.id } : {}),
              trackingProviderId: provider.id,
              ...(resolvedTrip ? { tripId: resolvedTrip.id } : {}),
              ...(event.speed !== undefined ? { speed: event.speed } : {}),
              ...(event.heading !== undefined ? { heading: event.heading } : {}),
              ...(event.altitude !== undefined ? { altitude: event.altitude } : {}),
              ...(event.accuracy !== undefined ? { accuracy: event.accuracy } : {}),
              ...(event.ignition !== undefined ? { ignition: event.ignition } : {}),
              ...(event.battery !== undefined ? { battery: event.battery } : {}),
              ...(event.odometer !== undefined ? { odometer: event.odometer } : {}),
              ...(event.eventType ? { eventType: event.eventType } : {}),
              ...(event.rawPayload !== undefined ? { rawPayload: event.rawPayload as Prisma.InputJsonValue } : {}),
            },
          });

          latestPositionId = latestPosition.id;
        }

        if (externalTrackingDevice) {
          await tx.externalTrackingDevice.update({
            where: { id: externalTrackingDevice.id },
            data: {
              lastSeenAt: event.providerTimestamp,
              ...(event.rawPayload !== undefined ? { lastPayload: event.rawPayload as Prisma.InputJsonValue } : {}),
            },
          });
        }

        await writeTripMovementEvents(tx, {
          tripId: resolvedTrip?.id ?? null,
          event,
          previousLatest,
        });

        const alertEvents = buildTrackingAlertEvents({
          activeRules,
          organizationId,
          trackingProviderId: provider.id,
          vehicleId: vehicle.id,
          tripId: resolvedTrip?.id ?? null,
          vehiclePositionId: latestPositionId,
          vehicleTelemetryEventId: telemetryEvent.id,
          previousLatest,
          event,
          resolvedTripStatus: resolvedTrip?.status ?? null,
        });

        if (alertEvents.length > 0) {
          await tx.trackingAlertEvent.createMany({
            data: alertEvents,
          });
        }

        return {
          telemetryEventId: telemetryEvent.id,
          vehiclePositionId: latestPositionId,
          tripId: resolvedTrip?.id ?? null,
          alertEventCount: alertEvents.length,
        };
      });

      ingestedEvents.push({
        ...result,
        vehicleId: vehicle.id,
        providerTimestamp: event.providerTimestamp,
      });
    }

    await Promise.all([
      fastify.prisma.trackingProviderCredential.update({
        where: { id: credential.id },
        data: { lastUsedAt: new Date() },
      }),
      fastify.prisma.trackingProviderHealth.upsert({
        where: { trackingProviderId: provider.id },
        update: {
          status: 'ONLINE',
          lastCheckedAt: new Date(),
          lastSuccessAt: new Date(),
          lastIngestAt: new Date(),
          message: null,
          metadata: {
            lastBatchSize: normalized.events.length,
            latestVehicleId: ingestedEvents[ingestedEvents.length - 1]?.vehicleId ?? null,
            generatedAlertEvents: ingestedEvents.reduce((sum, entry) => sum + entry.alertEventCount, 0),
          } as Prisma.InputJsonValue,
        },
        create: {
          trackingProviderId: provider.id,
          status: 'ONLINE',
          lastCheckedAt: new Date(),
          lastSuccessAt: new Date(),
          lastIngestAt: new Date(),
          metadata: {
            lastBatchSize: normalized.events.length,
            latestVehicleId: ingestedEvents[ingestedEvents.length - 1]?.vehicleId ?? null,
            generatedAlertEvents: ingestedEvents.reduce((sum, entry) => sum + entry.alertEventCount, 0),
          } as Prisma.InputJsonValue,
        },
      }),
      fastify.audit.write({
        action: normalized.events.length > 1 ? 'tracking.ingest.batch' : 'tracking.ingest.event',
        actorType: 'SYSTEM',
        entityType: 'TrackingProvider',
        entityId: provider.id,
        metadata: {
          organizationId,
          vehicleCount: Array.from(new Set(ingestedEvents.map((entry) => entry.vehicleId))).length,
          eventCount: ingestedEvents.length,
          providerCode: provider.code,
          generatedAlertEvents: ingestedEvents.reduce((sum, entry) => sum + entry.alertEventCount, 0),
        },
        ipAddress: request.ip,
        ...(typeof request.headers['user-agent'] === 'string' ? { userAgent: request.headers['user-agent'] } : {}),
      }),
    ]);

    return reply.status(202).success({
      accepted: true,
      organizationId,
      trackingProviderId: provider.id,
      processedCount: ingestedEvents.length,
      items: ingestedEvents.map((entry) => ({
        telemetryEventId: entry.telemetryEventId,
        vehiclePositionId: entry.vehiclePositionId,
        vehicleId: entry.vehicleId,
        tripId: entry.tripId,
        providerTimestamp: entry.providerTimestamp,
        alertEventCount: entry.alertEventCount,
      })),
    });
  });

  fastify.post('/tracking/traccar/webhook', async (request, reply) => {
    const headers = validateOrThrow(ingestHeadersSchema, request.headers);
    const body = validateOrThrow(traccarWebhookBodySchema, request.body);
    const providedSecret = headers['x-tracking-api-key']?.trim() || parseProviderBearerToken(headers.authorization);

    if (!providedSecret) {
      throw new AuthenticationError('Tracking ingest secret is required');
    }

    const { provider } = await authenticateTrackingProvider(fastify, {
      organizationId: body.organizationId,
      providerCode: headers['x-tracking-provider-code'],
      keyId: headers['x-tracking-key-id'],
      secret: providedSecret,
    });

    assertProviderTypeMatches('TRACCAR', provider);

    const normalized = normalizeProviderBatch({
      organizationId: body.organizationId,
      providerType: 'TRACCAR',
      devicePayloads: body.devicePayloads ?? [],
      positionPayloads: body.positionPayloads,
    });

    const result = await ingestNormalizedTrackingBatch(fastify, {
      provider,
      devices: normalized.devices,
      events: normalized.events,
      auditAction: 'tracking.traccar.webhook',
      auditMetadata: {
        source: 'traccar_webhook',
      },
      requestContext: {
        ipAddress: request.ip,
        ...(typeof request.headers['user-agent'] === 'string' ? { userAgent: request.headers['user-agent'] } : {}),
      },
    });

    return reply.status(202).success({
      accepted: true,
      ...result,
    });
  });
};
