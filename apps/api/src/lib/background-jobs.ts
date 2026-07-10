import type { FastifyInstance } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';

import {
  attemptNotificationDelivery,
  createDeliveriesForTrackingAlertEvent,
  retryDueNotificationDeliveries,
} from './notification-delivery.js';
import {
  assertProviderTypeMatches,
  ingestNormalizedTrackingBatch,
  normalizeProviderBatch,
} from './tracking-execution.js';

type App = FastifyInstance;

type JobContext = {
  fastify: App;
  definition: {
    id: string;
    organizationId: string | null;
    jobType: 'TRACKING_PROVIDER_SYNC' | 'TRACKING_EVALUATION' | 'GEOFENCE_EVALUATION' | 'NOTIFICATION_DELIVERY' | 'CLEANUP_EXPIRED_INVITATIONS';
    config: Prisma.JsonValue | null;
  };
  run: {
    id: string;
    organizationId: string | null;
  };
  payload?: Record<string, unknown>;
};

function asObject(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

async function writeRunLog(fastify: App, runId: string, level: string, message: string, metadata?: Record<string, unknown>) {
  await fastify.prisma.backgroundJobRunLog.create({
    data: {
      backgroundJobRunId: runId,
      level,
      message,
      ...(metadata ? { metadata: metadata as Prisma.InputJsonValue } : {}),
    },
  });
}

async function runCleanupExpiredInvitations(context: JobContext) {
  const now = new Date();
  const result = await context.fastify.prisma.organizationInvitation.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lt: now },
      ...(context.definition.organizationId ? { organizationId: context.definition.organizationId } : {}),
    },
    data: {
      status: 'EXPIRED',
    },
  });

  await writeRunLog(context.fastify, context.run.id, 'info', 'Expired organization invitations cleaned up', {
    expiredCount: result.count,
  });

  return {
    expiredCount: result.count,
  };
}

async function runNotificationDeliveryJob(context: JobContext) {
  const payload = context.payload ?? {};
  const deliveryId = typeof payload.deliveryId === 'string' ? payload.deliveryId : undefined;
  if (!deliveryId) {
    const dueResult = await retryDueNotificationDeliveries(context.fastify, {
      ...(context.definition.organizationId ? { organizationId: context.definition.organizationId } : {}),
      limit: 100,
    });

    await writeRunLog(context.fastify, context.run.id, 'info', 'Due notification deliveries processed', {
      processedCount: dueResult.processedCount,
    });

    return {
      processedCount: dueResult.processedCount,
      sentCount: dueResult.items.filter((item) => item.status === 'SENT').length,
      failedCount: dueResult.items.filter((item) => item.status === 'FAILED').length,
    };
  }

  const pendingDeliveries = await context.fastify.prisma.notificationDelivery.findMany({ where: { id: deliveryId } });

  let sentCount = 0;
  let failedCount = 0;

  for (const delivery of pendingDeliveries) {
    const updated = await attemptNotificationDelivery(context.fastify, { deliveryId: delivery.id });
    await writeRunLog(context.fastify, context.run.id, updated.status === 'SENT' ? 'info' : 'error', 'Notification delivery processed', {
      deliveryId: delivery.id,
      status: updated.status,
    });
    if (updated.status === 'SENT') {
      sentCount += 1;
    } else if (updated.status === 'FAILED') {
      failedCount += 1;
    }
  }

  return {
    processedCount: pendingDeliveries.length,
    sentCount,
    failedCount,
  };
}

async function runTrackingProviderSyncJob(context: JobContext) {
  const config = { ...asObject(context.definition.config), ...(context.payload ?? {}) };
  const providerId = typeof config.providerId === 'string' ? config.providerId : undefined;
  const providerType = typeof config.providerType === 'string' ? config.providerType : undefined;
  const devicePayloads = Array.isArray(config.devicePayloads) ? (config.devicePayloads as Record<string, unknown>[]) : [];
  const positionPayloads = Array.isArray(config.positionPayloads) ? (config.positionPayloads as Record<string, unknown>[]) : [];

  if (!providerId || !providerType || positionPayloads.length === 0) {
    throw new ValidationAppError('Tracking provider sync job requires providerId, providerType, and positionPayloads');
  }

  const provider = await context.fastify.prisma.trackingProvider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    throw new NotFoundError('Tracking provider not found');
  }

  if (context.definition.organizationId && provider.organizationId !== context.definition.organizationId) {
    throw new ConflictError('Tracking provider must belong to the background job organization');
  }

  assertProviderTypeMatches(providerType, provider);

  const normalized = normalizeProviderBatch({
    organizationId: provider.organizationId,
    providerType,
    devicePayloads,
    positionPayloads,
  });

  const result = await ingestNormalizedTrackingBatch(context.fastify, {
    provider,
    devices: normalized.devices,
    events: normalized.events,
    auditAction: 'admin.background_job.tracking_provider_sync',
    auditMetadata: {
      backgroundJobRunId: context.run.id,
      backgroundJobDefinitionId: context.definition.id,
    },
  });

  await writeRunLog(context.fastify, context.run.id, 'info', 'Tracking provider sync job completed', {
    processedCount: result.processedCount,
  });

  return result;
}

async function runTrackingEvaluationJob(context: JobContext) {
  const config = { ...asObject(context.definition.config), ...(context.payload ?? {}) };
  const organizationId = context.definition.organizationId;
  if (!organizationId) {
    throw new ValidationAppError('Tracking evaluation jobs require an organization-scoped job definition');
  }

  const staleMinutes = typeof config.staleMinutes === 'number' ? config.staleMinutes : 15;
  const offlineMinutes = typeof config.offlineMinutes === 'number' ? config.offlineMinutes : 60;
  const vehicleId = typeof config.vehicleId === 'string' ? config.vehicleId : undefined;

  const [rules, latestPositions] = await Promise.all([
    context.fastify.prisma.trackingAlertRule.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        ruleType: { in: ['DEVICE_OFFLINE', 'SPEED_THRESHOLD', 'STALE_POSITION', 'IGNITION_ON', 'IGNITION_OFF'] },
      },
    }),
    context.fastify.prisma.vehiclePosition.findMany({
      where: {
        organizationId,
        ...(vehicleId ? { vehicleId } : {}),
      },
    }),
  ]);

  let generatedAlertEvents = 0;

  for (const rule of rules) {
    for (const position of latestPositions.filter((entry) => (!rule.vehicleId || rule.vehicleId === entry.vehicleId) && (!rule.trackingProviderId || rule.trackingProviderId === entry.trackingProviderId))) {
      const ageMinutes = Math.max(0, (Date.now() - position.providerTimestamp.getTime()) / 60000);
      const speed = position.speed ? Number(position.speed.toString()) : null;
      const threshold =
        rule.condition && typeof rule.condition === 'object' && 'speedThreshold' in rule.condition && typeof rule.condition.speedThreshold === 'number'
          ? rule.condition.speedThreshold
          : 80;

      let shouldCreate = false;
      let message = '';
      switch (rule.ruleType) {
        case 'DEVICE_OFFLINE':
          shouldCreate = ageMinutes >= offlineMinutes;
          message = `Vehicle has been offline for ${Math.floor(ageMinutes)} minute(s)`;
          break;
        case 'STALE_POSITION':
          shouldCreate = ageMinutes >= staleMinutes;
          message = `Vehicle position is stale by ${Math.floor(ageMinutes)} minute(s)`;
          break;
        case 'SPEED_THRESHOLD':
          shouldCreate = speed !== null && speed > threshold;
          message = `Vehicle speed ${speed} exceeded threshold ${threshold}`;
          break;
        case 'IGNITION_ON':
          shouldCreate = position.ignition === true;
          message = 'Ignition is currently on';
          break;
        case 'IGNITION_OFF':
          shouldCreate = position.ignition === false;
          message = 'Ignition is currently off';
          break;
      }

      if (!shouldCreate) {
        continue;
      }

      const alertEvent = await context.fastify.prisma.trackingAlertEvent.create({
        data: {
          organizationId,
          trackingAlertRuleId: rule.id,
          vehicleId: position.vehicleId,
          ...(position.tripId ? { tripId: position.tripId } : {}),
          vehiclePositionId: position.id,
          status: 'OPEN',
          title: `${rule.name} triggered`,
          message,
          metadata: {
            source: 'background_job',
            backgroundJobRunId: context.run.id,
          } as Prisma.InputJsonValue,
        },
      });

      generatedAlertEvents += 1;
      const deliveries = await createDeliveriesForTrackingAlertEvent(context.fastify, {
        trackingAlertEventId: alertEvent.id,
        organizationId,
      });
      await writeRunLog(context.fastify, context.run.id, 'info', 'Tracking alert generated from background evaluation', {
        trackingAlertEventId: alertEvent.id,
        deliveryCount: deliveries.length,
      });
    }
  }

  return {
    evaluatedRuleCount: rules.length,
    positionCount: latestPositions.length,
    generatedAlertEvents,
  };
}

async function runGeofenceEvaluationJob(context: JobContext) {
  const organizationId = context.definition.organizationId;
  if (!organizationId) {
    throw new ValidationAppError('Geofence evaluation jobs require an organization-scoped job definition');
  }

  const geofences = await context.fastify.prisma.geofence.findMany({
    where: { organizationId, status: 'ACTIVE', geofenceType: 'POLYGON' },
    include: { points: { orderBy: { sequence: 'asc' } } },
  });
  const positions = await context.fastify.prisma.vehiclePosition.findMany({
    where: { organizationId },
  });

  let eventCount = 0;
  for (const geofence of geofences) {
    if (geofence.points.length < 3) {
      continue;
    }

    const polygon = geofence.points.map((point) => ({
      latitude: Number(point.latitude.toString()),
      longitude: Number(point.longitude.toString()),
    }));

    for (const position of positions) {
      let inside = false;
      for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
        const current = polygon[index]!;
        const prior = polygon[previous]!;
        const intersects =
          current.longitude > Number(position.longitude.toString()) !== prior.longitude > Number(position.longitude.toString()) &&
          Number(position.latitude.toString()) <
            ((prior.latitude - current.latitude) * (Number(position.longitude.toString()) - current.longitude)) /
              ((prior.longitude - current.longitude) || Number.EPSILON) +
              current.latitude;
        if (intersects) {
          inside = !inside;
        }
      }

      const previousEvent = await context.fastify.prisma.geofenceEvent.findFirst({
        where: {
          geofenceId: geofence.id,
          vehicleId: position.vehicleId,
        },
        orderBy: [{ happenedAt: 'desc' }],
      });

      const previousInside = previousEvent ? ['ENTER', 'INSIDE'].includes(previousEvent.eventType) : null;
      const nextEventType =
        previousInside === null ? (inside ? 'INSIDE' : 'OUTSIDE') : inside && !previousInside ? 'ENTER' : !inside && previousInside ? 'EXIT' : null;

      if (!nextEventType) {
        continue;
      }

      await context.fastify.prisma.geofenceEvent.create({
        data: {
          organizationId,
          geofenceId: geofence.id,
          vehicleId: position.vehicleId,
          vehiclePositionId: position.id,
          ...(position.tripId ? { tripId: position.tripId } : {}),
          eventType: nextEventType,
          latitude: position.latitude,
          longitude: position.longitude,
          happenedAt: position.providerTimestamp,
          metadata: {
            source: 'background_job',
            backgroundJobRunId: context.run.id,
          } as Prisma.InputJsonValue,
        },
      });
      eventCount += 1;
    }
  }

  await writeRunLog(context.fastify, context.run.id, 'info', 'Geofence evaluation completed', {
    geofenceCount: geofences.length,
    vehiclePositionCount: positions.length,
    eventCount,
  });

  return {
    geofenceCount: geofences.length,
    vehiclePositionCount: positions.length,
    eventCount,
  };
}

const JOB_RUNNERS: Record<JobContext['definition']['jobType'], (context: JobContext) => Promise<Record<string, unknown>>> = {
  TRACKING_PROVIDER_SYNC: runTrackingProviderSyncJob,
  TRACKING_EVALUATION: runTrackingEvaluationJob,
  GEOFENCE_EVALUATION: runGeofenceEvaluationJob,
  NOTIFICATION_DELIVERY: runNotificationDeliveryJob,
  CLEANUP_EXPIRED_INVITATIONS: runCleanupExpiredInvitations,
};

export async function runBackgroundJob(
  fastify: App,
  input: {
    backgroundJobDefinitionId: string;
    payload?: Record<string, unknown>;
    triggeredByUserId?: string;
    idempotencyKey?: string;
  }
) {
  const definition = await fastify.prisma.backgroundJobDefinition.findUnique({
    where: { id: input.backgroundJobDefinitionId },
  });

  if (!definition) {
    throw new NotFoundError('Background job definition not found');
  }

  if (input.idempotencyKey) {
    const existing = await fastify.prisma.backgroundJobRun.findFirst({
      where: {
        backgroundJobDefinitionId: definition.id,
        idempotencyKey: input.idempotencyKey,
      },
      include: { logs: true },
    });
    if (existing) {
      return existing;
    }
  }

  const run = await fastify.prisma.backgroundJobRun.create({
    data: {
      backgroundJobDefinitionId: definition.id,
      ...(definition.organizationId ? { organizationId: definition.organizationId } : {}),
      status: 'RUNNING',
      startedAt: new Date(),
      ...(input.triggeredByUserId ? { triggeredByUserId: input.triggeredByUserId } : {}),
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
      ...(input.payload ? { metadata: input.payload as Prisma.InputJsonValue } : {}),
    },
  });

  try {
    const runner = JOB_RUNNERS[definition.jobType];
    const summary = await runner({
      fastify,
      definition: {
        id: definition.id,
        organizationId: definition.organizationId,
        jobType: definition.jobType,
        config: definition.config,
      },
      run: {
        id: run.id,
        organizationId: run.organizationId,
      },
      ...(input.payload ? { payload: input.payload } : {}),
    });

    await fastify.prisma.backgroundJobDefinition.update({
      where: { id: definition.id },
      data: { lastRunAt: new Date() },
    });

    return fastify.prisma.backgroundJobRun.update({
      where: { id: run.id },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date(),
        summary: summary as Prisma.InputJsonValue,
      },
      include: { logs: true, backgroundJobDefinition: true },
    });
  } catch (error) {
    await writeRunLog(fastify, run.id, 'error', error instanceof Error ? error.message : 'Unknown background job error');
    await fastify.prisma.backgroundJobDefinition.update({
      where: { id: definition.id },
      data: { lastRunAt: new Date() },
    });
    return fastify.prisma.backgroundJobRun.update({
      where: { id: run.id },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        summary: {
          error: error instanceof Error ? error.message : 'Unknown background job error',
        } as Prisma.InputJsonValue,
      },
      include: { logs: true, backgroundJobDefinition: true },
    });
  }
}
