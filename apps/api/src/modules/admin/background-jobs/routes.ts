import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { runBackgroundJob } from '../../../lib/background-jobs.js';
import { buildPaginationMeta } from '../../../lib/response.js';
import { getAuditContext, getPagination, masterDataStatusSchema, paginationQuerySchema } from '../utils.js';

const jsonRecordSchema = z.record(z.string(), z.unknown());
const backgroundJobTypeSchema = z.enum([
  'TRACKING_PROVIDER_SYNC',
  'TRACKING_EVALUATION',
  'GEOFENCE_EVALUATION',
  'NOTIFICATION_DELIVERY',
  'CLEANUP_EXPIRED_INVITATIONS',
]);
const backgroundJobRunStatusSchema = z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED']);

const backgroundJobDefinitionIdParamSchema = z.object({
  jobDefinitionId: z.string().min(1),
});

const backgroundJobRunIdParamSchema = z.object({
  jobDefinitionId: z.string().min(1),
  runId: z.string().min(1),
});

const listBackgroundJobDefinitionsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  status: masterDataStatusSchema.optional(),
  jobType: backgroundJobTypeSchema.optional(),
});

const listBackgroundJobRunsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  status: backgroundJobRunStatusSchema.optional(),
});

const createBackgroundJobDefinitionSchema = z.object({
  organizationId: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  jobType: backgroundJobTypeSchema,
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
  schedule: z.string().trim().optional(),
  config: jsonRecordSchema.optional(),
});

const updateBackgroundJobDefinitionSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    code: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    schedule: z.string().trim().nullable().optional(),
    config: jsonRecordSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one background job field must be supplied' });

const triggerBackgroundJobRunSchema = z.object({
  payload: jsonRecordSchema.optional(),
  idempotencyKey: z.string().trim().min(1).optional(),
});

function normalizeCode(code: string) {
  return code.trim().replace(/[\s-]+/g, '_').replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
}

function serializeBackgroundJobDefinition(definition: {
  id: string;
  organizationId: string | null;
  name: string;
  code: string;
  jobType: string;
  description: string | null;
  status: string;
  schedule: string | null;
  config: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: definition.id,
    organizationId: definition.organizationId,
    name: definition.name,
    code: definition.code,
    jobType: definition.jobType,
    description: definition.description,
    status: definition.status,
    schedule: definition.schedule,
    config: definition.config,
    createdAt: definition.createdAt,
    updatedAt: definition.updatedAt,
  };
}

function serializeBackgroundJobRun(run: {
  id: string;
  backgroundJobDefinitionId: string;
  organizationId: string | null;
  status: string;
  idempotencyKey: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  triggeredByUserId: string | null;
  summary: Prisma.JsonValue | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: run.id,
    backgroundJobDefinitionId: run.backgroundJobDefinitionId,
    organizationId: run.organizationId,
    status: run.status,
    idempotencyKey: run.idempotencyKey,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    triggeredByUserId: run.triggeredByUserId,
    summary: run.summary,
    metadata: run.metadata,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

function serializeBackgroundJobRunLog(log: {
  id: string;
  backgroundJobRunId: string;
  level: string;
  message: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}) {
  return {
    id: log.id,
    backgroundJobRunId: log.backgroundJobRunId,
    level: log.level,
    message: log.message,
    metadata: log.metadata,
    createdAt: log.createdAt,
  };
}

export const adminBackgroundJobRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/background-jobs', { preHandler: [fastify.authenticate, fastify.requirePermission('background-jobs:read')] }, async (request, reply) => {
    const query = validateOrThrow(listBackgroundJobDefinitionsQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();

    if (requestedOrganizationId) {
      await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    }

    const where = {
      ...(requestedOrganizationId ? { OR: [{ organizationId: requestedOrganizationId }, { organizationId: null }] } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.jobType ? { jobType: query.jobType } : {}),
      ...(!isSuperAdmin && !requestedOrganizationId ? { OR: [{ organizationId: null }, { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } }] } : {}),
    };

    const [items, total] = await Promise.all([
      fastify.prisma.backgroundJobDefinition.findMany({ where, skip, take, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.backgroundJobDefinition.count({ where }),
    ]);

    return reply.success({ items: items.map(serializeBackgroundJobDefinition) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/background-jobs', { preHandler: [fastify.authenticate, fastify.requirePermission('background-jobs:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createBackgroundJobDefinitionSchema, request.body);
    if (body.organizationId) {
      await fastify.requireOrganizationAccess(request, body.organizationId);
    }
    const code = normalizeCode(body.code);
    const duplicate = await fastify.prisma.backgroundJobDefinition.findFirst({
      where: { organizationId: body.organizationId ?? null, code },
    });
    if (duplicate) {
      throw new ConflictError('A background job definition with that code already exists in this scope');
    }

    const item = await fastify.prisma.backgroundJobDefinition.create({
      data: {
        ...(body.organizationId ? { organizationId: body.organizationId } : {}),
        name: body.name,
        code,
        jobType: body.jobType,
        status: body.status ?? 'ACTIVE',
        ...(body.description ? { description: body.description } : {}),
        ...(body.schedule ? { schedule: body.schedule } : {}),
        ...(body.config ? { config: body.config as Prisma.InputJsonValue } : {}),
      },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.background_job.create', entityType: 'BackgroundJobDefinition', entityId: item.id });
    return reply.status(201).success({ item: serializeBackgroundJobDefinition(item) });
  });

  fastify.get('/admin/background-jobs/:jobDefinitionId', { preHandler: [fastify.authenticate, fastify.requirePermission('background-jobs:read')] }, async (request, reply) => {
    const { jobDefinitionId } = validateOrThrow(backgroundJobDefinitionIdParamSchema, request.params);
    const item = await fastify.prisma.backgroundJobDefinition.findUnique({ where: { id: jobDefinitionId } });
    if (!item) {
      throw new NotFoundError('Background job definition not found');
    }
    if (item.organizationId) {
      await fastify.requireOrganizationAccess(request, item.organizationId);
    }
    return reply.success({ item: serializeBackgroundJobDefinition(item) });
  });

  fastify.patch('/admin/background-jobs/:jobDefinitionId', { preHandler: [fastify.authenticate, fastify.requirePermission('background-jobs:manage')] }, async (request, reply) => {
    const { jobDefinitionId } = validateOrThrow(backgroundJobDefinitionIdParamSchema, request.params);
    const body = validateOrThrow(updateBackgroundJobDefinitionSchema, request.body);
    const definition = await fastify.prisma.backgroundJobDefinition.findUnique({ where: { id: jobDefinitionId } });
    if (!definition) {
      throw new NotFoundError('Background job definition not found');
    }
    if (definition.organizationId) {
      await fastify.requireOrganizationAccess(request, definition.organizationId);
    }
    const nextCode = body.code ? normalizeCode(body.code) : undefined;
    if (nextCode && nextCode !== definition.code) {
      const duplicate = await fastify.prisma.backgroundJobDefinition.findFirst({
        where: { organizationId: definition.organizationId, code: nextCode, id: { not: jobDefinitionId } },
      });
      if (duplicate) {
        throw new ConflictError('A background job definition with that code already exists in this scope');
      }
    }
    const item = await fastify.prisma.backgroundJobDefinition.update({
      where: { id: jobDefinitionId },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(nextCode ? { code: nextCode } : {}),
        ...(body.description !== undefined ? { description: body.description ?? null } : {}),
        ...(body.schedule !== undefined ? { schedule: body.schedule ?? null } : {}),
        ...(body.config !== undefined ? { config: body.config === null ? Prisma.JsonNull : (body.config as Prisma.InputJsonValue) } : {}),
      },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.background_job.update', entityType: 'BackgroundJobDefinition', entityId: item.id });
    return reply.success({ item: serializeBackgroundJobDefinition(item) });
  });

  fastify.post('/admin/background-jobs/:jobDefinitionId/activate', { preHandler: [fastify.authenticate, fastify.requirePermission('background-jobs:manage')] }, async (request, reply) => {
    const { jobDefinitionId } = validateOrThrow(backgroundJobDefinitionIdParamSchema, request.params);
    const definition = await fastify.prisma.backgroundJobDefinition.findUnique({ where: { id: jobDefinitionId } });
    if (!definition) {
      throw new NotFoundError('Background job definition not found');
    }
    if (definition.organizationId) {
      await fastify.requireOrganizationAccess(request, definition.organizationId);
    }
    const item = await fastify.prisma.backgroundJobDefinition.update({ where: { id: jobDefinitionId }, data: { status: 'ACTIVE' } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.background_job.activate', entityType: 'BackgroundJobDefinition', entityId: item.id });
    return reply.success({ item: serializeBackgroundJobDefinition(item) });
  });

  fastify.post('/admin/background-jobs/:jobDefinitionId/deactivate', { preHandler: [fastify.authenticate, fastify.requirePermission('background-jobs:manage')] }, async (request, reply) => {
    const { jobDefinitionId } = validateOrThrow(backgroundJobDefinitionIdParamSchema, request.params);
    const definition = await fastify.prisma.backgroundJobDefinition.findUnique({ where: { id: jobDefinitionId } });
    if (!definition) {
      throw new NotFoundError('Background job definition not found');
    }
    if (definition.organizationId) {
      await fastify.requireOrganizationAccess(request, definition.organizationId);
    }
    const item = await fastify.prisma.backgroundJobDefinition.update({ where: { id: jobDefinitionId }, data: { status: 'INACTIVE' } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.background_job.deactivate', entityType: 'BackgroundJobDefinition', entityId: item.id });
    return reply.success({ item: serializeBackgroundJobDefinition(item) });
  });

  fastify.post('/admin/background-jobs/:jobDefinitionId/run', { preHandler: [fastify.authenticate, fastify.requirePermission('background-jobs:manage')] }, async (request, reply) => {
    const { jobDefinitionId } = validateOrThrow(backgroundJobDefinitionIdParamSchema, request.params);
    const body = validateOrThrow(triggerBackgroundJobRunSchema, request.body ?? {});
    const definition = await fastify.prisma.backgroundJobDefinition.findUnique({ where: { id: jobDefinitionId } });
    if (!definition) {
      throw new NotFoundError('Background job definition not found');
    }
    if (definition.organizationId) {
      await fastify.requireOrganizationAccess(request, definition.organizationId);
    }
    const run = await runBackgroundJob(fastify, {
      backgroundJobDefinitionId: jobDefinitionId,
      ...(body.payload ? { payload: body.payload } : {}),
      ...(body.idempotencyKey ? { idempotencyKey: body.idempotencyKey } : {}),
      ...(request.currentUser?.id ? { triggeredByUserId: request.currentUser.id } : {}),
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.background_job_run.trigger', entityType: 'BackgroundJobRun', entityId: run.id });
    return reply.status(202).success({ item: serializeBackgroundJobRun(run), logs: run.logs.map(serializeBackgroundJobRunLog) });
  });

  fastify.get('/admin/background-jobs/:jobDefinitionId/runs', { preHandler: [fastify.authenticate, fastify.requirePermission('background-job-runs:read')] }, async (request, reply) => {
    const { jobDefinitionId } = validateOrThrow(backgroundJobDefinitionIdParamSchema, request.params);
    const query = validateOrThrow(listBackgroundJobRunsQuerySchema, request.query);
    const definition = await fastify.prisma.backgroundJobDefinition.findUnique({ where: { id: jobDefinitionId } });
    if (!definition) {
      throw new NotFoundError('Background job definition not found');
    }
    if (definition.organizationId) {
      await fastify.requireOrganizationAccess(request, definition.organizationId);
    }
    if (query.organizationId && definition.organizationId && query.organizationId !== definition.organizationId) {
      throw new ValidationAppError('Organization filter must match the background job definition organization');
    }
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const where = {
      backgroundJobDefinitionId: jobDefinitionId,
      ...(query.status ? { status: query.status } : {}),
    };
    const [items, total] = await Promise.all([
      fastify.prisma.backgroundJobRun.findMany({ where, skip, take, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.backgroundJobRun.count({ where }),
    ]);
    return reply.success({ items: items.map(serializeBackgroundJobRun) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/background-jobs/:jobDefinitionId/runs/:runId', { preHandler: [fastify.authenticate, fastify.requirePermission('background-job-runs:read')] }, async (request, reply) => {
    const { jobDefinitionId, runId } = validateOrThrow(backgroundJobRunIdParamSchema, request.params);
    const run = await fastify.prisma.backgroundJobRun.findUnique({
      where: { id: runId },
      include: { logs: true, backgroundJobDefinition: true },
    });
    if (!run || run.backgroundJobDefinitionId !== jobDefinitionId) {
      throw new NotFoundError('Background job run not found');
    }
    if (run.organizationId) {
      await fastify.requireOrganizationAccess(request, run.organizationId);
    } else if (run.backgroundJobDefinition.organizationId) {
      await fastify.requireOrganizationAccess(request, run.backgroundJobDefinition.organizationId);
    }
    return reply.success({ item: serializeBackgroundJobRun(run), logs: run.logs.map(serializeBackgroundJobRunLog) });
  });
};
