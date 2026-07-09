import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findDriverSkillOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeDriverSkill,
} from '../utils.js';

const driverSkillIdParamSchema = z.object({
  driverSkillId: z.string().min(1),
});

const listDriverSkillsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createDriverSkillSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateDriverSkillSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one driver skill field must be supplied' });

export const adminDriverSkillRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/driver-skills', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-skills:read')] }, async (request, reply) => {
    const query = validateOrThrow(listDriverSkillsQuerySchema, request.query);
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
        ? { OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }, { code: { contains: query.search, mode: 'insensitive' as const } }] }
        : {}),
      ...(!isSuperAdmin && !requestedOrganizationId
        ? { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } }
        : {}),
    };

    const [items, total] = await Promise.all([
      fastify.prisma.driverSkill.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { assignments: true } }),
      fastify.prisma.driverSkill.count({ where }),
    ]);

    return reply.success({ items: items.map(serializeDriverSkill) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/driver-skills/:driverSkillId', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-skills:read')] }, async (request, reply) => {
    const { driverSkillId } = validateOrThrow(driverSkillIdParamSchema, request.params);
    const skill = await findDriverSkillOrThrow(fastify.prisma, driverSkillId);
    await fastify.requireOrganizationAccess(request, skill.organizationId);
    return reply.success({ item: serializeDriverSkill(skill) });
  });

  fastify.post('/admin/driver-skills', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-skills:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createDriverSkillSchema, request.body);
    const code = normalizeEntityCode(body.code);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    const existing = await fastify.prisma.driverSkill.findUnique({ where: { organizationId_code: { organizationId: body.organizationId, code } } });

    if (existing) {
      throw new ConflictError('A driver skill with that code already exists for this organization');
    }

    const skill = await fastify.prisma.driverSkill.create({
      data: { organizationId: body.organizationId, name: body.name, code, status: body.status ?? 'ACTIVE', ...(body.description ? { description: body.description } : {}) },
      include: { assignments: true },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_skill.create', entityType: 'DriverSkill', entityId: skill.id, metadata: { organizationId: skill.organizationId, code: skill.code, status: skill.status } });
    return reply.status(201).success({ item: serializeDriverSkill(skill) });
  });

  fastify.patch('/admin/driver-skills/:driverSkillId', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-skills:manage')] }, async (request, reply) => {
    const { driverSkillId } = validateOrThrow(driverSkillIdParamSchema, request.params);
    const body = validateOrThrow(updateDriverSkillSchema, request.body);
    const skill = await findDriverSkillOrThrow(fastify.prisma, driverSkillId);
    await fastify.requireOrganizationAccess(request, skill.organizationId);
    const updateData = { ...(body.name ? { name: body.name } : {}), ...(body.description !== undefined ? { description: body.description } : {}) };
    const updated = await fastify.prisma.driverSkill.update({ where: { id: driverSkillId }, data: updateData, include: { assignments: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_skill.update', entityType: 'DriverSkill', entityId: driverSkillId, metadata: updateData });
    return reply.success({ item: serializeDriverSkill(updated) });
  });

  fastify.post('/admin/driver-skills/:driverSkillId/activate', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-skills:manage')] }, async (request, reply) => {
    const { driverSkillId } = validateOrThrow(driverSkillIdParamSchema, request.params);
    const skill = await findDriverSkillOrThrow(fastify.prisma, driverSkillId);
    await fastify.requireOrganizationAccess(request, skill.organizationId);
    const updated = await fastify.prisma.driverSkill.update({ where: { id: driverSkillId }, data: { status: 'ACTIVE' }, include: { assignments: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_skill.activate', entityType: 'DriverSkill', entityId: driverSkillId });
    return reply.success({ item: serializeDriverSkill(updated) });
  });

  fastify.post('/admin/driver-skills/:driverSkillId/deactivate', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-skills:manage')] }, async (request, reply) => {
    const { driverSkillId } = validateOrThrow(driverSkillIdParamSchema, request.params);
    const skill = await findDriverSkillOrThrow(fastify.prisma, driverSkillId);
    await fastify.requireOrganizationAccess(request, skill.organizationId);
    const updated = await fastify.prisma.driverSkill.update({ where: { id: driverSkillId }, data: { status: 'INACTIVE' }, include: { assignments: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_skill.deactivate', entityType: 'DriverSkill', entityId: driverSkillId });
    return reply.success({ item: serializeDriverSkill(updated) });
  });
};
