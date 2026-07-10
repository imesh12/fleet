import type { FastifyInstance } from 'fastify';
import { ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';

import { runBackgroundJob } from './background-jobs.js';
import {
  executeQueuedJob,
  getQueueProvider,
  registerQueueHandler,
  type QueueBackoffStrategy,
} from './queue.js';

type App = FastifyInstance;

type ScheduleType = 'MANUAL' | 'INTERVAL' | 'CRON';
type BackoffStrategy = 'NONE' | 'FIXED' | 'EXPONENTIAL';

const BACKGROUND_JOB_QUEUE_NAME = 'background-job.execute';

function toQueueBackoff(strategy: BackoffStrategy): QueueBackoffStrategy {
  if (strategy === 'FIXED') {
    return 'fixed';
  }
  if (strategy === 'NONE') {
    return 'none';
  }
  return 'exponential';
}

function parseStepCronMinutes(cronExpression: string) {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression.trim().split(/\s+/);
  if (!minute || !hour || !dayOfMonth || !month || !dayOfWeek) {
    throw new ValidationAppError('Cron expression must contain five fields');
  }
  const step = minute.match(/^\*\/([1-9][0-9]*)$/);
  if (step && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return Number(step[1]);
  }
  if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 1;
  }
  return null;
}

export function calculateNextRunAt(input: {
  scheduleType: ScheduleType;
  intervalSeconds?: number | null;
  cronExpression?: string | null;
  from?: Date;
}) {
  const from = input.from ?? new Date();

  if (input.scheduleType === 'MANUAL') {
    return null;
  }

  if (input.scheduleType === 'INTERVAL') {
    if (!input.intervalSeconds || input.intervalSeconds <= 0) {
      throw new ValidationAppError('Interval schedules require intervalSeconds greater than zero');
    }
    return new Date(from.getTime() + input.intervalSeconds * 1000);
  }

  if (!input.cronExpression) {
    throw new ValidationAppError('Cron schedules require cronExpression');
  }

  const everyMinutes = parseStepCronMinutes(input.cronExpression);
  if (!everyMinutes) {
    throw new ValidationAppError('Only every-minute cron expressions such as */5 * * * * are supported by the foundation runner');
  }

  return new Date(from.getTime() + everyMinutes * 60_000);
}

export async function enableBackgroundJobSchedule(
  fastify: App,
  input: {
    backgroundJobDefinitionId: string;
    scheduleType: ScheduleType;
    intervalSeconds?: number | null;
    cronExpression?: string | null;
  }
) {
  const definition = await fastify.prisma.backgroundJobDefinition.findUnique({
    where: { id: input.backgroundJobDefinitionId },
  });
  if (!definition) {
    throw new NotFoundError('Background job definition not found');
  }
  if (input.scheduleType === 'MANUAL') {
    throw new ValidationAppError('Use disable schedule for manual-only jobs');
  }
  const nextRunAt = calculateNextRunAt({
    scheduleType: input.scheduleType,
    ...(input.intervalSeconds !== undefined ? { intervalSeconds: input.intervalSeconds } : {}),
    ...(input.cronExpression !== undefined ? { cronExpression: input.cronExpression } : {}),
  });

  const updated = await fastify.prisma.backgroundJobDefinition.update({
    where: { id: definition.id },
    data: {
      scheduleType: input.scheduleType,
      intervalSeconds: input.scheduleType === 'INTERVAL' ? input.intervalSeconds ?? null : null,
      cronExpression: input.scheduleType === 'CRON' ? input.cronExpression ?? null : null,
      nextRunAt,
    },
  });

  await getQueueProvider().scheduleRecurring({
    recurringKey: updated.id,
    name: BACKGROUND_JOB_QUEUE_NAME,
    payload: { backgroundJobDefinitionId: updated.id },
    ...(updated.cronExpression ? { cronExpression: updated.cronExpression } : {}),
    ...(updated.intervalSeconds ? { intervalSeconds: updated.intervalSeconds } : {}),
    maxAttempts: updated.maxRetries,
    backoffStrategy: toQueueBackoff(updated.backoffStrategy),
  });

  return updated;
}

export async function disableBackgroundJobSchedule(fastify: App, backgroundJobDefinitionId: string) {
  const definition = await fastify.prisma.backgroundJobDefinition.findUnique({
    where: { id: backgroundJobDefinitionId },
  });
  if (!definition) {
    throw new NotFoundError('Background job definition not found');
  }
  await getQueueProvider().cancelRecurring(definition.id);
  return fastify.prisma.backgroundJobDefinition.update({
    where: { id: definition.id },
    data: {
      scheduleType: 'MANUAL',
      cronExpression: null,
      intervalSeconds: null,
      nextRunAt: null,
      lockedAt: null,
      lockedBy: null,
    },
  });
}

export async function listDueBackgroundJobs(
  fastify: App,
  input: {
    organizationId?: string;
    now?: Date;
  } = {}
) {
  const now = input.now ?? new Date();
  return fastify.prisma.backgroundJobDefinition.findMany({
    where: {
      status: 'ACTIVE',
      scheduleType: { not: 'MANUAL' },
      nextRunAt: { lte: now },
      OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(now.getTime() - 15 * 60_000) } }],
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
    },
    orderBy: [{ nextRunAt: 'asc' }, { createdAt: 'asc' }],
  });
}

export function registerBackgroundJobQueueHandler(fastify: App) {
  registerQueueHandler(BACKGROUND_JOB_QUEUE_NAME, async (job) => {
    const backgroundJobDefinitionId = String(job.payload.backgroundJobDefinitionId ?? '');
    if (!backgroundJobDefinitionId) {
      throw new ValidationAppError('Queued background job requires backgroundJobDefinitionId');
    }
    return runBackgroundJob(fastify, {
      backgroundJobDefinitionId,
      ...(job.payload.payload && typeof job.payload.payload === 'object' ? { payload: job.payload.payload as Record<string, unknown> } : {}),
      ...(typeof job.payload.triggeredByUserId === 'string' ? { triggeredByUserId: job.payload.triggeredByUserId } : {}),
      ...(typeof job.payload.idempotencyKey === 'string' ? { idempotencyKey: job.payload.idempotencyKey } : {}),
    });
  });
}

export async function triggerBackgroundJobNow(
  fastify: App,
  input: {
    backgroundJobDefinitionId: string;
    payload?: Record<string, unknown>;
    triggeredByUserId?: string;
    idempotencyKey?: string;
  }
): Promise<Awaited<ReturnType<typeof runBackgroundJob>>> {
  const definition = await fastify.prisma.backgroundJobDefinition.findUnique({
    where: { id: input.backgroundJobDefinitionId },
  });
  if (!definition) {
    throw new NotFoundError('Background job definition not found');
  }

  registerBackgroundJobQueueHandler(fastify);
  const queued = await getQueueProvider().enqueue({
    name: BACKGROUND_JOB_QUEUE_NAME,
    payload: {
      backgroundJobDefinitionId: definition.id,
      ...(input.payload ? { payload: input.payload } : {}),
      ...(input.triggeredByUserId ? { triggeredByUserId: input.triggeredByUserId } : {}),
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
    },
    maxAttempts: definition.maxRetries,
    backoffStrategy: toQueueBackoff(definition.backoffStrategy),
  });

  return executeQueuedJob(queued) as Promise<Awaited<ReturnType<typeof runBackgroundJob>>>;
}

export async function enqueueDueBackgroundJobs(
  fastify: App,
  input: {
    organizationId?: string;
    lockedBy?: string;
    triggeredByUserId?: string;
  } = {}
) {
  const dueJobs = await listDueBackgroundJobs(fastify, {
    ...(input.organizationId ? { organizationId: input.organizationId } : {}),
  });
  const queuedJobs = [];
  const lockedBy = input.lockedBy ?? `api-${process.pid}`;

  for (const definition of dueJobs) {
    const locked = await fastify.prisma.backgroundJobDefinition.updateMany({
      where: {
        id: definition.id,
        OR: [{ lockedAt: null }, { lockedAt: { lt: new Date(Date.now() - 15 * 60_000) } }],
      },
      data: {
        lockedAt: new Date(),
        lockedBy,
      },
    });
    if (locked.count === 0) {
      continue;
    }

    const queued = await getQueueProvider().enqueue({
      name: BACKGROUND_JOB_QUEUE_NAME,
      payload: {
        backgroundJobDefinitionId: definition.id,
        ...(input.triggeredByUserId ? { triggeredByUserId: input.triggeredByUserId } : {}),
      },
      maxAttempts: definition.maxRetries,
      backoffStrategy: toQueueBackoff(definition.backoffStrategy),
    });
    queuedJobs.push({ definition, queued });
  }

  return queuedJobs;
}

export async function runDueBackgroundJobs(
  fastify: App,
  input: {
    organizationId?: string;
    triggeredByUserId?: string;
    lockedBy?: string;
  } = {}
) {
  registerBackgroundJobQueueHandler(fastify);
  const queuedJobs = await enqueueDueBackgroundJobs(fastify, input);
  const results = [];

  for (const { definition, queued } of queuedJobs) {
    const result = await executeQueuedJob(queued);
    const nextRunAt = calculateNextRunAt({
      scheduleType: definition.scheduleType,
      intervalSeconds: definition.intervalSeconds,
      cronExpression: definition.cronExpression,
    });
    await fastify.prisma.backgroundJobDefinition.update({
      where: { id: definition.id },
      data: {
        lastRunAt: new Date(),
        nextRunAt,
        lockedAt: null,
        lockedBy: null,
      },
    });
    results.push({ definitionId: definition.id, queueJobId: queued.id, result });
  }

  return {
    queuedCount: queuedJobs.length,
    processedCount: results.length,
    results,
  };
}

export async function previewNextBackgroundJobRun(fastify: App, backgroundJobDefinitionId: string) {
  const definition = await fastify.prisma.backgroundJobDefinition.findUnique({
    where: { id: backgroundJobDefinitionId },
  });
  if (!definition) {
    throw new NotFoundError('Background job definition not found');
  }
  return {
    currentNextRunAt: definition.nextRunAt,
    previewNextRunAt: calculateNextRunAt({
      scheduleType: definition.scheduleType,
      intervalSeconds: definition.intervalSeconds,
      cronExpression: definition.cronExpression,
    }),
  };
}

export function assertScheduleEnabled(definition: { scheduleType: ScheduleType; nextRunAt: Date | null }) {
  if (definition.scheduleType === 'MANUAL' || !definition.nextRunAt) {
    throw new ConflictError('Background job schedule is not enabled');
  }
}
