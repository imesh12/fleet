import { createHash } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationAppError,
} from '@trackigniter8/errors';
import {
  createTrackingProviderAdapter,
  type NormalizedTrackingDevice,
  type NormalizedTrackingIngestEvent,
} from '@trackigniter8/tracking-providers';
import { createDeliveriesForTrackingAlertEvent } from './notification-delivery.js';

type App = FastifyInstance;

export type TrackingBatchInput = {
  organizationId: string;
  providerType: string;
  devicePayloads?: Record<string, unknown>[];
  positionPayloads: Record<string, unknown>[];
};

export type NormalizedTelemetryEvent = {
  organizationId: string;
  vehicleId?: string;
  vehicleDeviceId?: string;
  externalDeviceId?: string;
  trackingProviderId?: string;
  tripId?: string;
  providerEventId?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  accuracy?: number;
  ignition?: boolean;
  battery?: number;
  odometer?: number;
  eventType?: string;
  providerTimestamp: Date;
  rawPayload?: unknown;
};

type AuthenticatedProvider = Prisma.TrackingProviderGetPayload<{
  include: {
    credentials: true;
  };
}>;

type ActiveTrackingAlertRule = Prisma.TrackingAlertRuleGetPayload<Record<string, never>>;
type ActiveTrackingNotificationRule = Prisma.TrackingNotificationRuleGetPayload<Record<string, never>>;

function hashSecret(secret: string) {
  return createHash('sha256').update(secret).digest('hex');
}

export function parseBearerToken(header?: string) {
  if (!header) {
    return undefined;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

export function normalizeProviderCode(code: string) {
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

export function normalizeProviderBatch(body: TrackingBatchInput) {
  const adapter = createTrackingProviderAdapter(body.providerType);
  const devices = (body.devicePayloads ?? []).map((payload) =>
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

export async function authenticateTrackingProvider(
  fastify: App,
  input: {
    organizationId: string;
    providerCode: string;
    keyId: string;
    secret: string;
  }
) {
  const provider = await fastify.prisma.trackingProvider.findFirst({
    where: {
      organizationId: input.organizationId,
      code: normalizeProviderCode(input.providerCode),
    },
    include: {
      credentials: {
        where: {
          keyId: input.keyId.trim(),
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!provider || provider.status !== 'ACTIVE') {
    throw new AuthenticationError('Tracking provider is invalid or inactive');
  }

  const credential = provider.credentials.find((entry) => {
    const notExpired = !entry.expiresAt || entry.expiresAt >= new Date();
    return notExpired && entry.secretHash === hashSecret(input.secret);
  });

  if (!credential) {
    throw new AuthenticationError('Tracking ingest credential is invalid or expired');
  }

  return { provider, credential };
}

async function upsertExternalTrackingDevice(app: App, provider: { id: string; organizationId: string }, input: NormalizedTrackingDevice) {
  const mappingCount = await app.prisma.vehicleDeviceMapping.count({
    where: {
      trackingProviderId: provider.id,
      externalTrackingDevice: {
        externalDeviceId: input.externalDeviceId,
      },
      status: 'ACTIVE',
    },
  });

  return app.prisma.externalTrackingDevice.upsert({
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
  app: App,
  provider: { id: string; organizationId: string; code: string },
  event: NormalizedTelemetryEvent
) {
  let vehicle = event.vehicleId
    ? await app.prisma.vehicle.findUnique({
        where: { id: event.vehicleId },
      })
    : null;

  let vehicleDevice = event.vehicleDeviceId
    ? await app.prisma.vehicleDevice.findUnique({
        where: { id: event.vehicleDeviceId },
      })
    : null;

  let externalTrackingDevice = event.externalDeviceId
    ? await app.prisma.externalTrackingDevice.findFirst({
        where: {
          trackingProviderId: provider.id,
          externalDeviceId: event.externalDeviceId,
        },
      })
    : null;

  if (!externalTrackingDevice && event.externalDeviceId) {
    externalTrackingDevice = await upsertExternalTrackingDevice(app, provider, {
      externalDeviceId: event.externalDeviceId,
      lastSeenAt: event.providerTimestamp,
      rawPayload: event.rawPayload,
      metadata: { discoveredBy: 'tracking_execution' },
    });
  }

  if (!vehicle && externalTrackingDevice) {
    const mapping = await app.prisma.vehicleDeviceMapping.findFirst({
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
    vehicleDevice = await app.prisma.vehicleDevice.findFirst({
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
    vehicle = await app.prisma.vehicle.findUnique({
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
  app: App,
  input: {
    organizationId: string;
    vehicleId: string;
    tripId?: string;
  }
) {
  if (input.tripId) {
    const trip = await app.prisma.trip.findUnique({
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

  return app.prisma.trip.findFirst({
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
          source: 'tracking_execution',
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
          source: 'tracking_execution',
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
          source: 'tracking_execution',
          speed: input.event.speed ?? null,
        },
      },
    });
  }
}

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
    .filter(
      (rule) =>
        (!rule.trackingProviderId || rule.trackingProviderId === input.trackingProviderId) &&
        (!rule.vehicleId || rule.vehicleId === input.vehicleId)
    )
    .flatMap((rule) => {
      switch (rule.ruleType) {
        case 'SPEED_THRESHOLD': {
          const threshold =
            rule.condition &&
            typeof rule.condition === 'object' &&
            'speedThreshold' in rule.condition &&
            typeof rule.condition.speedThreshold === 'number'
              ? rule.condition.speedThreshold
              : null;
          if (
            threshold === null ||
            input.event.speed === undefined ||
            input.event.speed <= threshold ||
            (previousSpeed !== null && previousSpeed > threshold)
          ) {
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

function buildTrackingNotificationEvents(input: {
  notificationRules: ActiveTrackingNotificationRule[];
  alertEvent: {
    id: string;
    organizationId: string;
    trackingAlertRuleId: string | null;
    tripId: string | null;
    title: string;
    message: string;
  };
}) {
  return input.notificationRules
    .filter(
      (rule) => !rule.trackingAlertRuleId || rule.trackingAlertRuleId === input.alertEvent.trackingAlertRuleId
    )
    .map((rule) => ({
      organizationId: input.alertEvent.organizationId,
      trackingNotificationRuleId: rule.id,
      ...(input.alertEvent.tripId ? { tripId: input.alertEvent.tripId } : {}),
      trackingAlertEventId: input.alertEvent.id,
      channel: rule.channel,
      status: 'GENERATED' as const,
      title: `${rule.name}: ${input.alertEvent.title}`,
      message: rule.messageTemplate?.trim() || input.alertEvent.message,
      escalationLevel: rule.escalationLevel,
      ...(rule.recipientMetadata ? { recipientMetadata: rule.recipientMetadata as Prisma.InputJsonValue } : {}),
      metadata: {
        source: 'tracking_execution',
        trackingAlertRuleId: input.alertEvent.trackingAlertRuleId,
      } as Prisma.InputJsonValue,
    }));
}

export async function ingestNormalizedTrackingBatch(
  fastify: App,
  input: {
    provider: AuthenticatedProvider | Prisma.TrackingProviderGetPayload<Record<string, never>>;
    devices?: NormalizedTrackingDevice[];
    events: NormalizedTelemetryEvent[];
    auditAction?: string;
    auditMetadata?: Record<string, unknown>;
    requestContext?: {
      ipAddress?: string;
      userAgent?: string;
    };
  }
) {
  const organizationIds = Array.from(new Set(input.events.map((event) => event.organizationId)));
  if (organizationIds.length !== 1 || organizationIds[0] !== input.provider.organizationId) {
    throw new ValidationAppError('Telemetry batch ingest must contain exactly one organizationId matching the provider');
  }

  for (const device of input.devices ?? []) {
    await upsertExternalTrackingDevice(fastify, input.provider, device);
  }

  const [activeRules, notificationRules] = await Promise.all([
    fastify.prisma.trackingAlertRule.findMany({
      where: {
        organizationId: input.provider.organizationId,
        status: 'ACTIVE',
        OR: [{ trackingProviderId: null }, { trackingProviderId: input.provider.id }],
      },
    }),
    fastify.prisma.trackingNotificationRule.findMany({
      where: {
        organizationId: input.provider.organizationId,
        status: 'ACTIVE',
      },
    }),
  ]);

  const ingestedEvents: Array<{
    telemetryEventId: string;
    vehiclePositionId: string | null;
    vehicleId: string;
    tripId: string | null;
    providerTimestamp: Date;
    alertEventCount: number;
    notificationEventCount: number;
    deliveryCount: number;
  }> = [];

  for (const event of input.events) {
    if (event.trackingProviderId && event.trackingProviderId !== input.provider.id) {
      throw new ConflictError('trackingProviderId must match the resolved tracking provider');
    }

    const { vehicle, vehicleDevice, externalTrackingDevice } = await resolveVehicleContext(fastify, input.provider, event);
    const resolvedTrip = await resolveTrip(fastify, {
      organizationId: input.provider.organizationId,
      vehicleId: vehicle.id,
      ...(event.tripId ? { tripId: event.tripId } : {}),
    });

    const result = await fastify.prisma.$transaction(async (tx) => {
      const previousLatest = await tx.vehiclePosition.findUnique({
        where: { vehicleId: vehicle.id },
      });

      const telemetryEvent = await tx.vehicleTelemetryEvent.create({
        data: {
          organizationId: input.provider.organizationId,
          vehicleId: vehicle.id,
          latitude: event.latitude,
          longitude: event.longitude,
          providerTimestamp: event.providerTimestamp,
          ...(vehicleDevice ? { vehicleDeviceId: vehicleDevice.id } : {}),
          trackingProviderId: input.provider.id,
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
            organizationId: input.provider.organizationId,
            latitude: event.latitude,
            longitude: event.longitude,
            providerTimestamp: event.providerTimestamp,
            receivedAt: new Date(),
            ...(vehicleDevice ? { vehicleDeviceId: vehicleDevice.id } : { vehicleDeviceId: null }),
            trackingProviderId: input.provider.id,
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
            organizationId: input.provider.organizationId,
            vehicleId: vehicle.id,
            latitude: event.latitude,
            longitude: event.longitude,
            providerTimestamp: event.providerTimestamp,
            ...(vehicleDevice ? { vehicleDeviceId: vehicleDevice.id } : {}),
            trackingProviderId: input.provider.id,
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
        organizationId: input.provider.organizationId,
        trackingProviderId: input.provider.id,
        vehicleId: vehicle.id,
        tripId: resolvedTrip?.id ?? null,
        vehiclePositionId: latestPositionId,
        vehicleTelemetryEventId: telemetryEvent.id,
        previousLatest,
        event,
        resolvedTripStatus: resolvedTrip?.status ?? null,
      });

        let notificationEventCount = 0;
        let deliveryCount = 0;
        for (const alertEventInput of alertEvents) {
          const alertEvent = await tx.trackingAlertEvent.create({
            data: alertEventInput,
          });

        const notificationEvents = buildTrackingNotificationEvents({
          notificationRules,
          alertEvent: {
            id: alertEvent.id,
            organizationId: alertEvent.organizationId,
            trackingAlertRuleId: alertEvent.trackingAlertRuleId,
            tripId: alertEvent.tripId,
            title: alertEvent.title,
            message: alertEvent.message,
          },
        });

          if (notificationEvents.length > 0) {
            await tx.trackingNotificationEvent.createMany({
              data: notificationEvents,
            });
            notificationEventCount += notificationEvents.length;
          }

          const deliveries = await createDeliveriesForTrackingAlertEvent(fastify, {
            trackingAlertEventId: alertEvent.id,
            organizationId: alertEvent.organizationId,
          });
          deliveryCount += deliveries.length;
        }

        return {
          telemetryEventId: telemetryEvent.id,
          vehiclePositionId: latestPositionId,
          tripId: resolvedTrip?.id ?? null,
          alertEventCount: alertEvents.length,
          notificationEventCount,
          deliveryCount,
        };
      });

    ingestedEvents.push({
      ...result,
      vehicleId: vehicle.id,
      providerTimestamp: event.providerTimestamp,
    });
  }

  await fastify.prisma.trackingProviderHealth.upsert({
    where: { trackingProviderId: input.provider.id },
    update: {
      status: 'ONLINE',
      lastCheckedAt: new Date(),
      lastSuccessAt: new Date(),
      lastIngestAt: new Date(),
      message: null,
      metadata: {
        lastBatchSize: input.events.length,
        latestVehicleId: ingestedEvents[ingestedEvents.length - 1]?.vehicleId ?? null,
        generatedAlertEvents: ingestedEvents.reduce((sum, entry) => sum + entry.alertEventCount, 0),
        generatedNotificationEvents: ingestedEvents.reduce((sum, entry) => sum + entry.notificationEventCount, 0),
        generatedDeliveries: ingestedEvents.reduce((sum, entry) => sum + entry.deliveryCount, 0),
      } as Prisma.InputJsonValue,
    },
    create: {
      trackingProviderId: input.provider.id,
      status: 'ONLINE',
      lastCheckedAt: new Date(),
      lastSuccessAt: new Date(),
      lastIngestAt: new Date(),
      metadata: {
        lastBatchSize: input.events.length,
        latestVehicleId: ingestedEvents[ingestedEvents.length - 1]?.vehicleId ?? null,
        generatedAlertEvents: ingestedEvents.reduce((sum, entry) => sum + entry.alertEventCount, 0),
        generatedNotificationEvents: ingestedEvents.reduce((sum, entry) => sum + entry.notificationEventCount, 0),
        generatedDeliveries: ingestedEvents.reduce((sum, entry) => sum + entry.deliveryCount, 0),
      } as Prisma.InputJsonValue,
    },
  });

  if ('credentials' in input.provider) {
    const credential = input.provider.credentials[0];
    if (credential) {
      await fastify.prisma.trackingProviderCredential.update({
        where: { id: credential.id },
        data: { lastUsedAt: new Date() },
      });
    }
  }

  await fastify.audit.write({
    action: input.auditAction ?? (input.events.length > 1 ? 'tracking.ingest.batch' : 'tracking.ingest.event'),
    actorType: 'SYSTEM',
    entityType: 'TrackingProvider',
    entityId: input.provider.id,
    metadata: {
      organizationId: input.provider.organizationId,
      vehicleCount: Array.from(new Set(ingestedEvents.map((entry) => entry.vehicleId))).length,
      eventCount: ingestedEvents.length,
      providerCode: input.provider.code,
      generatedAlertEvents: ingestedEvents.reduce((sum, entry) => sum + entry.alertEventCount, 0),
      generatedNotificationEvents: ingestedEvents.reduce((sum, entry) => sum + entry.notificationEventCount, 0),
      generatedDeliveries: ingestedEvents.reduce((sum, entry) => sum + entry.deliveryCount, 0),
      ...(input.auditMetadata ?? {}),
    },
    ...(input.requestContext?.ipAddress ? { ipAddress: input.requestContext.ipAddress } : {}),
    ...(input.requestContext?.userAgent ? { userAgent: input.requestContext.userAgent } : {}),
  });

  return {
    organizationId: input.provider.organizationId,
    trackingProviderId: input.provider.id,
    processedCount: ingestedEvents.length,
    items: ingestedEvents,
  };
}

export function assertProviderTypeMatches(providerType: string, provider: { providerType: string }) {
  if (normalizeMasterDataCode(providerType) !== normalizeMasterDataCode(provider.providerType)) {
    throw new ConflictError('Adapter providerType must match the tracking provider type');
  }
}
