import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findDriverGroupOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeDriverGroup,
} from '../utils.js';

const driverGroupIdParamSchema = z.object({
  driverGroupId: z.string().min(1),
});

const listDriverGroupsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createDriverGroupSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateDriverGroupSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one driver group field must be supplied' });

export const adminDriverGroupRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/driver-groups', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-groups:read')] }, async (request, reply) => {
    const query = validateOrThrow(listDriverGroupsQuerySchema, request.query);
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
      fastify.prisma.driverGroup.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { drivers: true } }),
      fastify.prisma.driverGroup.count({ where }),
    ]);

    return reply.success({ items: items.map(serializeDriverGroup) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/driver-groups/:driverGroupId', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-groups:read')] }, async (request, reply) => {
    const { driverGroupId } = validateOrThrow(driverGroupIdParamSchema, request.params);
    const group = await findDriverGroupOrThrow(fastify.prisma, driverGroupId);
    await fastify.requireOrganizationAccess(request, group.organizationId);
    return reply.success({ item: serializeDriverGroup(group) });
  });

  fastify.post('/admin/driver-groups', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-groups:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createDriverGroupSchema, request.body);
    const code = normalizeEntityCode(body.code);
    await fastify.requireOrganizationAccess(request, body.organizationId);

    const existing = await fastify.prisma.driverGroup.findUnique({ where: { organizationId_code: { organizationId: body.organizationId, code } } });
    if (existing) {
      throw new ConflictError('A driver group with that code already exists for this organization');
    }

    const group = await fastify.prisma.driverGroup.create({
      data: { organizationId: body.organizationId, name: body.name, code, status: body.status ?? 'ACTIVE', ...(body.description ? { description: body.description } : {}) },
      include: { drivers: true },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_group.create', entityType: 'DriverGroup', entityId: group.id, metadata: { organizationId: group.organizationId, code: group.code, status: group.status } });
    return reply.status(201).success({ item: serializeDriverGroup(group) });
  });

  fastify.patch('/admin/driver-groups/:driverGroupId', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-groups:manage')] }, async (request, reply) => {
    const { driverGroupId } = validateOrThrow(driverGroupIdParamSchema, request.params);
    const body = validateOrThrow(updateDriverGroupSchema, request.body);
    const group = await findDriverGroupOrThrow(fastify.prisma, driverGroupId);
    await fastify.requireOrganizationAccess(request, group.organizationId);

    const updateData = { ...(body.name ? { name: body.name } : {}), ...(body.description !== undefined ? { description: body.description } : {}) };
    const updated = await fastify.prisma.driverGroup.update({ where: { id: driverGroupId }, data: updateData, include: { drivers: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_group.update', entityType: 'DriverGroup', entityId: driverGroupId, metadata: updateData });
    return reply.success({ item: serializeDriverGroup(updated) });
  });

  fastify.post('/admin/driver-groups/:driverGroupId/activate', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-groups:manage')] }, async (request, reply) => {
    const { driverGroupId } = validateOrThrow(driverGroupIdParamSchema, request.params);
    const group = await findDriverGroupOrThrow(fastify.prisma, driverGroupId);
    await fastify.requireOrganizationAccess(request, group.organizationId);
    const updated = await fastify.prisma.driverGroup.update({ where: { id: driverGroupId }, data: { status: 'ACTIVE' }, include: { drivers: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_group.activate', entityType: 'DriverGroup', entityId: driverGroupId });
    return reply.success({ item: serializeDriverGroup(updated) });
  });

  fastify.post('/admin/driver-groups/:driverGroupId/deactivate', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-groups:manage')] }, async (request, reply) => {
    const { driverGroupId } = validateOrThrow(driverGroupIdParamSchema, request.params);
    const group = await findDriverGroupOrThrow(fastify.prisma, driverGroupId);
    await fastify.requireOrganizationAccess(request, group.organizationId);
    const updated = await fastify.prisma.driverGroup.update({ where: { id: driverGroupId }, data: { status: 'INACTIVE' }, include: { drivers: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_group.deactivate', entityType: 'DriverGroup', entityId: driverGroupId });
    return reply.success({ item: serializeDriverGroup(updated) });
  });
};
