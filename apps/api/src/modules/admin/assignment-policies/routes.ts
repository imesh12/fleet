import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  assignmentPolicyRuleCodeSchema,
  findAssignmentPolicyOrThrow,
  findAssignmentPolicyRuleOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  paginationQuerySchema,
  serializeAssignmentPolicy,
  serializeAssignmentPolicyRule,
} from '../utils.js';

const jsonRecordSchema = z.record(z.string(), z.unknown());

const assignmentPolicyIdParamSchema = z.object({
  assignmentPolicyId: z.string().min(1),
});

const assignmentPolicyRuleIdParamSchema = z.object({
  assignmentPolicyId: z.string().min(1),
  ruleId: z.string().min(1),
});

const listAssignmentPoliciesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createAssignmentPolicySchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateAssignmentPolicySchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one assignment policy field must be supplied' });

const createAssignmentPolicyRuleSchema = z.object({
  ruleCode: assignmentPolicyRuleCodeSchema,
  name: z.string().min(2),
  description: z.string().trim().optional(),
  sequence: z.coerce.number().int().positive().optional(),
  isBlocking: z.boolean().default(true),
  isActive: z.boolean().default(true),
  config: jsonRecordSchema.optional(),
});

const updateAssignmentPolicyRuleSchema = z
  .object({
    ruleCode: assignmentPolicyRuleCodeSchema.optional(),
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
    sequence: z.coerce.number().int().positive().optional(),
    isBlocking: z.boolean().optional(),
    isActive: z.boolean().optional(),
    config: jsonRecordSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one assignment policy rule field must be supplied' });

const reorderAssignmentPolicyRulesSchema = z.object({
  orderedRuleIds: z.array(z.string().min(1)).min(1),
});

export const adminAssignmentPolicyRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/assignment-policies', { preHandler: [fastify.authenticate, fastify.requirePermission('assignment-policies:read')] }, async (request, reply) => {
    const query = validateOrThrow(listAssignmentPoliciesQuerySchema, request.query);
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
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
      ...(!isSuperAdmin && !requestedOrganizationId ? { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } } : {}),
    };
    const [items, total] = await Promise.all([
      fastify.prisma.assignmentPolicy.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { rules: true } }),
      fastify.prisma.assignmentPolicy.count({ where }),
    ]);
    return reply.success({ items: items.map(serializeAssignmentPolicy) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/assignment-policies/:assignmentPolicyId', { preHandler: [fastify.authenticate, fastify.requirePermission('assignment-policies:read')] }, async (request, reply) => {
    const { assignmentPolicyId } = validateOrThrow(assignmentPolicyIdParamSchema, request.params);
    const policy = await findAssignmentPolicyOrThrow(fastify.prisma, assignmentPolicyId);
    await fastify.requireOrganizationAccess(request, policy.organizationId);
    return reply.success({ item: { ...serializeAssignmentPolicy(policy), rules: policy.rules.map(serializeAssignmentPolicyRule) } });
  });

  fastify.post('/admin/assignment-policies', { preHandler: [fastify.authenticate, fastify.requirePermission('assignment-policies:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createAssignmentPolicySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    const existing = await fastify.prisma.assignmentPolicy.findUnique({ where: { organizationId_name: { organizationId: body.organizationId, name: body.name } } });
    if (existing) {
      throw new ConflictError('An assignment policy with that name already exists for this organization');
    }
    const policy = await fastify.prisma.assignmentPolicy.create({
      data: {
        organizationId: body.organizationId,
        name: body.name,
        status: body.status ?? 'ACTIVE',
        ...(body.description ? { description: body.description } : {}),
      },
      include: { rules: true },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.assignment_policy.create', entityType: 'AssignmentPolicy', entityId: policy.id, metadata: { organizationId: policy.organizationId, name: policy.name, status: policy.status } });
    return reply.status(201).success({ item: serializeAssignmentPolicy(policy) });
  });

  fastify.patch('/admin/assignment-policies/:assignmentPolicyId', { preHandler: [fastify.authenticate, fastify.requirePermission('assignment-policies:manage')] }, async (request, reply) => {
    const { assignmentPolicyId } = validateOrThrow(assignmentPolicyIdParamSchema, request.params);
    const body = validateOrThrow(updateAssignmentPolicySchema, request.body);
    const policy = await findAssignmentPolicyOrThrow(fastify.prisma, assignmentPolicyId);
    await fastify.requireOrganizationAccess(request, policy.organizationId);
    const updateData = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
    };
    const updated = await fastify.prisma.assignmentPolicy.update({ where: { id: assignmentPolicyId }, data: updateData, include: { rules: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.assignment_policy.update', entityType: 'AssignmentPolicy', entityId: assignmentPolicyId, metadata: updateData });
    return reply.success({ item: serializeAssignmentPolicy(updated) });
  });

  fastify.post('/admin/assignment-policies/:assignmentPolicyId/activate', { preHandler: [fastify.authenticate, fastify.requirePermission('assignment-policies:manage')] }, async (request, reply) => {
    const { assignmentPolicyId } = validateOrThrow(assignmentPolicyIdParamSchema, request.params);
    const policy = await findAssignmentPolicyOrThrow(fastify.prisma, assignmentPolicyId);
    await fastify.requireOrganizationAccess(request, policy.organizationId);
    const updated = await fastify.prisma.assignmentPolicy.update({ where: { id: assignmentPolicyId }, data: { status: 'ACTIVE' }, include: { rules: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.assignment_policy.activate', entityType: 'AssignmentPolicy', entityId: assignmentPolicyId });
    return reply.success({ item: serializeAssignmentPolicy(updated) });
  });

  fastify.post('/admin/assignment-policies/:assignmentPolicyId/deactivate', { preHandler: [fastify.authenticate, fastify.requirePermission('assignment-policies:manage')] }, async (request, reply) => {
    const { assignmentPolicyId } = validateOrThrow(assignmentPolicyIdParamSchema, request.params);
    const policy = await findAssignmentPolicyOrThrow(fastify.prisma, assignmentPolicyId);
    await fastify.requireOrganizationAccess(request, policy.organizationId);
    const updated = await fastify.prisma.assignmentPolicy.update({ where: { id: assignmentPolicyId }, data: { status: 'INACTIVE' }, include: { rules: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.assignment_policy.deactivate', entityType: 'AssignmentPolicy', entityId: assignmentPolicyId });
    return reply.success({ item: serializeAssignmentPolicy(updated) });
  });

  fastify.post('/admin/assignment-policies/:assignmentPolicyId/rules', { preHandler: [fastify.authenticate, fastify.requirePermission('assignment-policies:manage')] }, async (request, reply) => {
    const { assignmentPolicyId } = validateOrThrow(assignmentPolicyIdParamSchema, request.params);
    const body = validateOrThrow(createAssignmentPolicyRuleSchema, request.body);
    const policy = await findAssignmentPolicyOrThrow(fastify.prisma, assignmentPolicyId);
    await fastify.requireOrganizationAccess(request, policy.organizationId);
    const sequence = body.sequence ?? (policy.rules.length === 0 ? 1 : Math.max(...policy.rules.map((rule: { sequence: number }) => rule.sequence)) + 1);
    if (policy.rules.some((rule: { sequence: number }) => rule.sequence === sequence)) {
      throw new ValidationAppError('An assignment policy rule already exists at that sequence');
    }
    const rule = await fastify.prisma.assignmentPolicyRule.create({
      data: {
        assignmentPolicyId,
        ruleCode: body.ruleCode,
        name: body.name,
        sequence,
        isBlocking: body.isBlocking ?? true,
        isActive: body.isActive ?? true,
        ...(body.description ? { description: body.description } : {}),
        ...(body.config ? { config: body.config as Prisma.InputJsonValue } : {}),
      },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.assignment_policy_rule.create', entityType: 'AssignmentPolicyRule', entityId: rule.id, metadata: { assignmentPolicyId, ruleCode: rule.ruleCode, sequence: rule.sequence } });
    return reply.status(201).success({ item: serializeAssignmentPolicyRule(rule) });
  });

  fastify.patch('/admin/assignment-policies/:assignmentPolicyId/rules/:ruleId', { preHandler: [fastify.authenticate, fastify.requirePermission('assignment-policies:manage')] }, async (request, reply) => {
    const { assignmentPolicyId, ruleId } = validateOrThrow(assignmentPolicyRuleIdParamSchema, request.params);
    const body = validateOrThrow(updateAssignmentPolicyRuleSchema, request.body);
    const policy = await findAssignmentPolicyOrThrow(fastify.prisma, assignmentPolicyId);
    await fastify.requireOrganizationAccess(request, policy.organizationId);
    const rule = await findAssignmentPolicyRuleOrThrow(fastify.prisma, ruleId);
    if (rule.assignmentPolicyId !== assignmentPolicyId) {
      throw new ConflictError('Assignment policy rule does not belong to the requested policy');
    }
    if (body.sequence !== undefined && body.sequence !== rule.sequence) {
      if (policy.rules.some((entry: { id: string; sequence: number }) => entry.id !== ruleId && entry.sequence === body.sequence)) {
        throw new ValidationAppError('An assignment policy rule already exists at that sequence');
      }
    }
    const updateData = {
      ...(body.ruleCode !== undefined ? { ruleCode: body.ruleCode } : {}),
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.sequence !== undefined ? { sequence: body.sequence } : {}),
      ...(body.isBlocking !== undefined ? { isBlocking: body.isBlocking } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      ...(body.config !== undefined ? { config: body.config === null ? Prisma.JsonNull : (body.config as Prisma.InputJsonValue) } : {}),
    };
    const updated = await fastify.prisma.assignmentPolicyRule.update({ where: { id: ruleId }, data: updateData });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.assignment_policy_rule.update', entityType: 'AssignmentPolicyRule', entityId: ruleId, metadata: updateData });
    return reply.success({ item: serializeAssignmentPolicyRule(updated) });
  });

  fastify.delete('/admin/assignment-policies/:assignmentPolicyId/rules/:ruleId', { preHandler: [fastify.authenticate, fastify.requirePermission('assignment-policies:manage')] }, async (request, reply) => {
    const { assignmentPolicyId, ruleId } = validateOrThrow(assignmentPolicyRuleIdParamSchema, request.params);
    const policy = await findAssignmentPolicyOrThrow(fastify.prisma, assignmentPolicyId);
    await fastify.requireOrganizationAccess(request, policy.organizationId);
    const rule = await findAssignmentPolicyRuleOrThrow(fastify.prisma, ruleId);
    if (rule.assignmentPolicyId !== assignmentPolicyId) {
      throw new ConflictError('Assignment policy rule does not belong to the requested policy');
    }
    await fastify.prisma.$transaction(async (tx) => {
      await tx.assignmentPolicyRule.delete({ where: { id: ruleId } });
      const remainingRules = await tx.assignmentPolicyRule.findMany({ where: { assignmentPolicyId }, orderBy: { sequence: 'asc' } });
      for (const [index, remainingRule] of remainingRules.entries()) {
        const nextSequence = index + 1;
        if (remainingRule.sequence !== nextSequence) {
          await tx.assignmentPolicyRule.update({ where: { id: remainingRule.id }, data: { sequence: nextSequence } });
        }
      }
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.assignment_policy_rule.delete', entityType: 'AssignmentPolicyRule', entityId: ruleId, metadata: { assignmentPolicyId } });
    return reply.success({ deleted: true });
  });

  fastify.post('/admin/assignment-policies/:assignmentPolicyId/rules/reorder', { preHandler: [fastify.authenticate, fastify.requirePermission('assignment-policies:manage')] }, async (request, reply) => {
    const { assignmentPolicyId } = validateOrThrow(assignmentPolicyIdParamSchema, request.params);
    const body = validateOrThrow(reorderAssignmentPolicyRulesSchema, request.body);
    const policy = await findAssignmentPolicyOrThrow(fastify.prisma, assignmentPolicyId);
    await fastify.requireOrganizationAccess(request, policy.organizationId);
    const currentRuleIds = policy.rules.map((rule: { id: string }) => rule.id).sort();
    const submittedRuleIds = [...body.orderedRuleIds].sort();
    if (currentRuleIds.length !== submittedRuleIds.length || currentRuleIds.some((id: string, index: number) => id !== submittedRuleIds[index])) {
      throw new ValidationAppError('Reorder payload must include every assignment policy rule exactly once');
    }
    await fastify.prisma.$transaction(async (tx) => {
      for (const [index, ruleId] of body.orderedRuleIds.entries()) {
        await tx.assignmentPolicyRule.update({ where: { id: ruleId }, data: { sequence: index + 1 } });
      }
    });
    const updatedPolicy = await findAssignmentPolicyOrThrow(fastify.prisma, assignmentPolicyId);
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.assignment_policy_rule.reorder', entityType: 'AssignmentPolicy', entityId: assignmentPolicyId, metadata: { orderedRuleIds: body.orderedRuleIds } });
    return reply.success({ item: { ...serializeAssignmentPolicy(updatedPolicy), rules: updatedPolicy.rules.map(serializeAssignmentPolicyRule) } });
  });
};
