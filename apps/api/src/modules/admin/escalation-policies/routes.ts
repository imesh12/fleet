import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { buildPaginationMeta } from '../../../lib/response.js';
import { getAuditContext, getPagination, masterDataStatusSchema, paginationQuerySchema } from '../utils.js';

const policyIdParamSchema = z.object({ policyId: z.string().min(1) });
const stepIdParamSchema = z.object({ policyId: z.string().min(1), stepId: z.string().min(1) });
const eventIdParamSchema = z.object({ eventId: z.string().min(1) });
const jsonRecordSchema = z.record(z.string(), z.unknown());
const channelSchema = z.enum(['EMAIL', 'WEBHOOK', 'IN_APP', 'SMS']);
const eventStatusBodySchema = z.object({ note: z.string().trim().optional() });

const listPoliciesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  status: masterDataStatusSchema.optional(),
});
const listEventsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  trackingAlertEventId: z.string().min(1).optional(),
  status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELED']).optional(),
});
const createPolicySchema = z.object({
  organizationId: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
  metadata: jsonRecordSchema.optional(),
});
const updatePolicySchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  metadata: jsonRecordSchema.nullable().optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'At least one escalation policy field must be supplied' });
const createStepSchema = z.object({
  channel: channelSchema,
  delayMinutes: z.coerce.number().int().min(0).max(10080).default(0),
  sequence: z.coerce.number().int().min(1).optional(),
  recipientMetadata: jsonRecordSchema.optional(),
  templateOverride: z.string().trim().optional(),
  metadata: jsonRecordSchema.optional(),
});
const updateStepSchema = z.object({
  channel: channelSchema.optional(),
  delayMinutes: z.coerce.number().int().min(0).max(10080).optional(),
  sequence: z.coerce.number().int().min(1).optional(),
  recipientMetadata: jsonRecordSchema.nullable().optional(),
  templateOverride: z.string().trim().nullable().optional(),
  metadata: jsonRecordSchema.nullable().optional(),
  isActive: z.boolean().optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'At least one escalation step field must be supplied' });
const reorderStepsSchema = z.object({ orderedStepIds: z.array(z.string().min(1)).min(1) });
const createEventSchema = z.object({
  organizationId: z.string().min(1).optional(),
  trackingAlertEventId: z.string().min(1).optional(),
  escalationPolicyId: z.string().min(1).optional(),
  escalationLevel: z.coerce.number().int().min(1).default(1),
  title: z.string().trim().min(1),
  message: z.string().trim().min(1),
  metadata: jsonRecordSchema.optional(),
});

function normalizeCode(code: string) {
  return code.trim().replace(/[\s-]+/g, '_').replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
}

function serializePolicy(item: { [key: string]: unknown }) { return item; }
function serializeStep(item: { [key: string]: unknown }) { return item; }
function serializeEvent(item: { [key: string]: unknown }) { return item; }

export const adminEscalationPolicyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/escalation-policies', { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-policies:read')] }, async (request, reply) => {
    const query = validateOrThrow(listPoliciesQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = {
      ...(requestedOrganizationId ? { OR: [{ organizationId: requestedOrganizationId }, { organizationId: null }] } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(!isSuperAdmin && !requestedOrganizationId ? { OR: [{ organizationId: null }, { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } }] } : {}),
    };
    const [items, total] = await Promise.all([
      fastify.prisma.escalationPolicy.findMany({ where, skip, take, orderBy: [{ createdAt: 'desc' }], include: { steps: true } }),
      fastify.prisma.escalationPolicy.count({ where }),
    ]);
    return reply.success({ items: items.map((item) => ({ ...serializePolicy(item), stepCount: item.steps.length })) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/escalation-policies', { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-policies:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createPolicySchema, request.body);
    if (body.organizationId) await fastify.requireOrganizationAccess(request, body.organizationId);
    const code = normalizeCode(body.code);
    const duplicate = await fastify.prisma.escalationPolicy.findFirst({ where: { organizationId: body.organizationId ?? null, code } });
    if (duplicate) throw new ConflictError('An escalation policy with that code already exists in this scope');
    const item = await fastify.prisma.escalationPolicy.create({
      data: {
        ...(body.organizationId ? { organizationId: body.organizationId } : {}),
        name: body.name,
        code,
        status: body.status ?? 'ACTIVE',
        ...(body.description ? { description: body.description } : {}),
        ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
      },
      include: { steps: true },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.escalation_policy.create', entityType: 'EscalationPolicy', entityId: item.id });
    return reply.status(201).success({ item: serializePolicy(item), steps: item.steps.map(serializeStep) });
  });

  fastify.get('/admin/escalation-policies/:policyId', { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-policies:read')] }, async (request, reply) => {
    const { policyId } = validateOrThrow(policyIdParamSchema, request.params);
    const item = await fastify.prisma.escalationPolicy.findUnique({ where: { id: policyId }, include: { steps: { orderBy: { sequence: 'asc' } } } });
    if (!item) throw new NotFoundError('Escalation policy not found');
    if (item.organizationId) await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serializePolicy(item), steps: item.steps.map(serializeStep) });
  });

  fastify.patch('/admin/escalation-policies/:policyId', { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-policies:manage')] }, async (request, reply) => {
    const { policyId } = validateOrThrow(policyIdParamSchema, request.params);
    const body = validateOrThrow(updatePolicySchema, request.body);
    const existing = await fastify.prisma.escalationPolicy.findUnique({ where: { id: policyId } });
    if (!existing) throw new NotFoundError('Escalation policy not found');
    if (existing.organizationId) await fastify.requireOrganizationAccess(request, existing.organizationId);
    const nextCode = body.code ? normalizeCode(body.code) : undefined;
    if (nextCode && nextCode !== existing.code) {
      const duplicate = await fastify.prisma.escalationPolicy.findFirst({ where: { organizationId: existing.organizationId, code: nextCode, id: { not: policyId } } });
      if (duplicate) throw new ConflictError('An escalation policy with that code already exists in this scope');
    }
    const item = await fastify.prisma.escalationPolicy.update({
      where: { id: policyId },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(nextCode ? { code: nextCode } : {}),
        ...(body.description !== undefined ? { description: body.description ?? null } : {}),
        ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}),
      },
      include: { steps: { orderBy: { sequence: 'asc' } } },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.escalation_policy.update', entityType: 'EscalationPolicy', entityId: item.id });
    return reply.success({ item: serializePolicy(item), steps: item.steps.map(serializeStep) });
  });

  fastify.post('/admin/escalation-policies/:policyId/activate', { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-policies:manage')] }, async (request, reply) => {
    const { policyId } = validateOrThrow(policyIdParamSchema, request.params);
    const existing = await fastify.prisma.escalationPolicy.findUnique({ where: { id: policyId } });
    if (!existing) throw new NotFoundError('Escalation policy not found');
    if (existing.organizationId) await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.escalationPolicy.update({ where: { id: policyId }, data: { status: 'ACTIVE' } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.escalation_policy.activate', entityType: 'EscalationPolicy', entityId: item.id });
    return reply.success({ item: serializePolicy(item) });
  });

  fastify.post('/admin/escalation-policies/:policyId/deactivate', { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-policies:manage')] }, async (request, reply) => {
    const { policyId } = validateOrThrow(policyIdParamSchema, request.params);
    const existing = await fastify.prisma.escalationPolicy.findUnique({ where: { id: policyId } });
    if (!existing) throw new NotFoundError('Escalation policy not found');
    if (existing.organizationId) await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.escalationPolicy.update({ where: { id: policyId }, data: { status: 'INACTIVE' } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.escalation_policy.deactivate', entityType: 'EscalationPolicy', entityId: item.id });
    return reply.success({ item: serializePolicy(item) });
  });

  fastify.post('/admin/escalation-policies/:policyId/steps', { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-policies:manage')] }, async (request, reply) => {
    const { policyId } = validateOrThrow(policyIdParamSchema, request.params);
    const body = validateOrThrow(createStepSchema, request.body);
    const policy = await fastify.prisma.escalationPolicy.findUnique({ where: { id: policyId }, include: { steps: true } });
    if (!policy) throw new NotFoundError('Escalation policy not found');
    if (policy.organizationId) await fastify.requireOrganizationAccess(request, policy.organizationId);
    const sequence = body.sequence ?? policy.steps.length + 1;
    const item = await fastify.prisma.escalationPolicyStep.create({
      data: {
        escalationPolicyId: policyId,
        channel: body.channel,
        delayMinutes: body.delayMinutes ?? 0,
        sequence,
        ...(body.recipientMetadata ? { recipientMetadata: body.recipientMetadata as Prisma.InputJsonValue } : {}),
        ...(body.templateOverride ? { templateOverride: body.templateOverride } : {}),
        ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
      },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.escalation_policy.step_create', entityType: 'EscalationPolicyStep', entityId: item.id });
    return reply.status(201).success({ item: serializeStep(item) });
  });

  fastify.patch('/admin/escalation-policies/:policyId/steps/:stepId', { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-policies:manage')] }, async (request, reply) => {
    const { policyId, stepId } = validateOrThrow(stepIdParamSchema, request.params);
    const body = validateOrThrow(updateStepSchema, request.body);
    const policy = await fastify.prisma.escalationPolicy.findUnique({ where: { id: policyId } });
    const step = await fastify.prisma.escalationPolicyStep.findUnique({ where: { id: stepId } });
    if (!policy || !step || step.escalationPolicyId !== policyId) throw new NotFoundError('Escalation policy step not found');
    if (policy.organizationId) await fastify.requireOrganizationAccess(request, policy.organizationId);
    const item = await fastify.prisma.escalationPolicyStep.update({
      where: { id: stepId },
      data: {
        ...(body.channel ? { channel: body.channel } : {}),
        ...(body.delayMinutes !== undefined ? { delayMinutes: body.delayMinutes } : {}),
        ...(body.sequence !== undefined ? { sequence: body.sequence } : {}),
        ...(body.recipientMetadata !== undefined ? { recipientMetadata: body.recipientMetadata === null ? Prisma.JsonNull : (body.recipientMetadata as Prisma.InputJsonValue) } : {}),
        ...(body.templateOverride !== undefined ? { templateOverride: body.templateOverride ?? null } : {}),
        ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.escalation_policy.step_update', entityType: 'EscalationPolicyStep', entityId: item.id });
    return reply.success({ item: serializeStep(item) });
  });

  fastify.delete('/admin/escalation-policies/:policyId/steps/:stepId', { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-policies:manage')] }, async (request, reply) => {
    const { policyId, stepId } = validateOrThrow(stepIdParamSchema, request.params);
    const policy = await fastify.prisma.escalationPolicy.findUnique({ where: { id: policyId } });
    const step = await fastify.prisma.escalationPolicyStep.findUnique({ where: { id: stepId } });
    if (!policy || !step || step.escalationPolicyId !== policyId) throw new NotFoundError('Escalation policy step not found');
    if (policy.organizationId) await fastify.requireOrganizationAccess(request, policy.organizationId);
    await fastify.prisma.escalationPolicyStep.delete({ where: { id: stepId } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.escalation_policy.step_delete', entityType: 'EscalationPolicyStep', entityId: stepId });
    return reply.success({ deleted: true });
  });

  fastify.post('/admin/escalation-policies/:policyId/steps/reorder', { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-policies:manage')] }, async (request, reply) => {
    const { policyId } = validateOrThrow(policyIdParamSchema, request.params);
    const body = validateOrThrow(reorderStepsSchema, request.body);
    const policy = await fastify.prisma.escalationPolicy.findUnique({ where: { id: policyId }, include: { steps: true } });
    if (!policy) throw new NotFoundError('Escalation policy not found');
    if (policy.organizationId) await fastify.requireOrganizationAccess(request, policy.organizationId);
    const currentIds = policy.steps.map((entry) => entry.id).sort();
    const submitted = [...body.orderedStepIds].sort();
    if (currentIds.length !== submitted.length || currentIds.some((id, index) => id !== submitted[index])) {
      throw new ValidationAppError('Reorder payload must include every escalation policy step exactly once');
    }
    await fastify.prisma.$transaction(async (tx) => {
      for (const [index, stepId] of body.orderedStepIds.entries()) {
        await tx.escalationPolicyStep.update({ where: { id: stepId }, data: { sequence: index + 1 } });
      }
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.escalation_policy.step_reorder', entityType: 'EscalationPolicy', entityId: policyId });
    const updated = await fastify.prisma.escalationPolicy.findUniqueOrThrow({ where: { id: policyId }, include: { steps: { orderBy: { sequence: 'asc' } } } });
    return reply.success({ item: serializePolicy(updated), steps: updated.steps.map(serializeStep) });
  });

  fastify.get('/admin/escalation-events', { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-events:read')] }, async (request, reply) => {
    const query = validateOrThrow(listEventsQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = {
      ...(requestedOrganizationId ? { OR: [{ organizationId: requestedOrganizationId }, { organizationId: null }] } : {}),
      ...(query.trackingAlertEventId ? { trackingAlertEventId: query.trackingAlertEventId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(!isSuperAdmin && !requestedOrganizationId ? { OR: [{ organizationId: null }, { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } }] } : {}),
    };
    const [items, total] = await Promise.all([
      fastify.prisma.escalationEvent.findMany({ where, skip, take, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.escalationEvent.count({ where }),
    ]);
    return reply.success({ items: items.map(serializeEvent) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/escalation-events', { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-events:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createEventSchema, request.body);
    if (body.organizationId) await fastify.requireOrganizationAccess(request, body.organizationId);
    if (body.trackingAlertEventId) {
      const alertEvent = await fastify.prisma.trackingAlertEvent.findUnique({ where: { id: body.trackingAlertEventId } });
      if (!alertEvent || (body.organizationId && alertEvent.organizationId !== body.organizationId)) throw new ConflictError('Tracking alert event must belong to the same organization');
    }
    if (body.escalationPolicyId) {
      const policy = await fastify.prisma.escalationPolicy.findUnique({ where: { id: body.escalationPolicyId } });
      if (!policy || policy.organizationId !== (body.organizationId ?? null)) throw new ConflictError('Escalation policy must belong to the same scope');
    }
    const item = await fastify.prisma.escalationEvent.create({
      data: {
        ...(body.organizationId ? { organizationId: body.organizationId } : {}),
        ...(body.trackingAlertEventId ? { trackingAlertEventId: body.trackingAlertEventId } : {}),
        ...(body.escalationPolicyId ? { escalationPolicyId: body.escalationPolicyId } : {}),
        ...(request.currentUser?.id ? { actorUserId: request.currentUser.id } : {}),
        escalationLevel: body.escalationLevel ?? 1,
        title: body.title,
        message: body.message,
        ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
      },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.escalation_event.create', entityType: 'EscalationEvent', entityId: item.id });
    return reply.status(201).success({ item: serializeEvent(item) });
  });

  fastify.get('/admin/escalation-events/:eventId', { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-events:read')] }, async (request, reply) => {
    const { eventId } = validateOrThrow(eventIdParamSchema, request.params);
    const item = await fastify.prisma.escalationEvent.findUnique({ where: { id: eventId } });
    if (!item) throw new NotFoundError('Escalation event not found');
    if (item.organizationId) await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serializeEvent(item) });
  });

  fastify.post('/admin/escalation-events/:eventId/acknowledge', { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-events:manage')] }, async (request, reply) => {
    const { eventId } = validateOrThrow(eventIdParamSchema, request.params);
    const body = validateOrThrow(eventStatusBodySchema, request.body ?? {});
    const item = await fastify.prisma.escalationEvent.findUnique({ where: { id: eventId } });
    if (!item) throw new NotFoundError('Escalation event not found');
    if (item.organizationId) await fastify.requireOrganizationAccess(request, item.organizationId);
    const updated = await fastify.prisma.escalationEvent.update({
      where: { id: eventId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        metadata: {
          ...((item.metadata && typeof item.metadata === 'object' ? item.metadata : {}) as Record<string, unknown>),
          acknowledgementNote: body.note ?? null,
        } as Prisma.InputJsonValue,
      },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.escalation_event.acknowledge', entityType: 'EscalationEvent', entityId: eventId });
    return reply.success({ item: serializeEvent(updated) });
  });

  fastify.post('/admin/escalation-events/:eventId/resolve', { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-events:manage')] }, async (request, reply) => {
    const { eventId } = validateOrThrow(eventIdParamSchema, request.params);
    const body = validateOrThrow(eventStatusBodySchema, request.body ?? {});
    const item = await fastify.prisma.escalationEvent.findUnique({ where: { id: eventId } });
    if (!item) throw new NotFoundError('Escalation event not found');
    if (item.organizationId) await fastify.requireOrganizationAccess(request, item.organizationId);
    const updated = await fastify.prisma.escalationEvent.update({
      where: { id: eventId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        metadata: {
          ...((item.metadata && typeof item.metadata === 'object' ? item.metadata : {}) as Record<string, unknown>),
          resolutionNote: body.note ?? null,
        } as Prisma.InputJsonValue,
      },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.escalation_event.resolve', entityType: 'EscalationEvent', entityId: eventId });
    return reply.success({ item: serializeEvent(updated) });
  });
};
