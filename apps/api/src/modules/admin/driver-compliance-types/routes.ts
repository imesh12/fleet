import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findDriverComplianceTypeOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeDriverComplianceType,
} from '../utils.js';

const driverComplianceTypeIdParamSchema = z.object({
  driverComplianceTypeId: z.string().min(1),
});

const listDriverComplianceTypesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createDriverComplianceTypeSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateDriverComplianceTypeSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one driver compliance type field must be supplied' });

export const adminDriverComplianceTypeRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/driver-compliance-types', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-compliance-types:read')] }, async (request, reply) => {
    const query = validateOrThrow(listDriverComplianceTypesQuerySchema, request.query);
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
      ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }, { code: { contains: query.search, mode: 'insensitive' as const } }] } : {}),
      ...(!isSuperAdmin && !requestedOrganizationId ? { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } } : {}),
    };
    const [items, total] = await Promise.all([
      fastify.prisma.driverComplianceType.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { records: true } }),
      fastify.prisma.driverComplianceType.count({ where }),
    ]);
    return reply.success({ items: items.map(serializeDriverComplianceType) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/driver-compliance-types/:driverComplianceTypeId', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-compliance-types:read')] }, async (request, reply) => {
    const { driverComplianceTypeId } = validateOrThrow(driverComplianceTypeIdParamSchema, request.params);
    const type = await findDriverComplianceTypeOrThrow(fastify.prisma, driverComplianceTypeId);
    await fastify.requireOrganizationAccess(request, type.organizationId);
    return reply.success({ item: serializeDriverComplianceType(type) });
  });

  fastify.post('/admin/driver-compliance-types', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-compliance-types:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createDriverComplianceTypeSchema, request.body);
    const code = normalizeEntityCode(body.code);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    const existing = await fastify.prisma.driverComplianceType.findUnique({ where: { organizationId_code: { organizationId: body.organizationId, code } } });
    if (existing) {
      throw new ConflictError('A driver compliance type with that code already exists for this organization');
    }
    const type = await fastify.prisma.driverComplianceType.create({
      data: {
        organizationId: body.organizationId,
        name: body.name,
        code,
        status: body.status ?? 'ACTIVE',
        ...(body.description ? { description: body.description } : {}),
      },
      include: { records: true },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_compliance_type.create', entityType: 'DriverComplianceType', entityId: type.id, metadata: { organizationId: type.organizationId, code: type.code, status: type.status } });
    return reply.status(201).success({ item: serializeDriverComplianceType(type) });
  });

  fastify.patch('/admin/driver-compliance-types/:driverComplianceTypeId', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-compliance-types:manage')] }, async (request, reply) => {
    const { driverComplianceTypeId } = validateOrThrow(driverComplianceTypeIdParamSchema, request.params);
    const body = validateOrThrow(updateDriverComplianceTypeSchema, request.body);
    const type = await findDriverComplianceTypeOrThrow(fastify.prisma, driverComplianceTypeId);
    await fastify.requireOrganizationAccess(request, type.organizationId);
    const updateData = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
    };
    const updated = await fastify.prisma.driverComplianceType.update({ where: { id: driverComplianceTypeId }, data: updateData, include: { records: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_compliance_type.update', entityType: 'DriverComplianceType', entityId: driverComplianceTypeId, metadata: updateData });
    return reply.success({ item: serializeDriverComplianceType(updated) });
  });

  fastify.post('/admin/driver-compliance-types/:driverComplianceTypeId/activate', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-compliance-types:manage')] }, async (request, reply) => {
    const { driverComplianceTypeId } = validateOrThrow(driverComplianceTypeIdParamSchema, request.params);
    const type = await findDriverComplianceTypeOrThrow(fastify.prisma, driverComplianceTypeId);
    await fastify.requireOrganizationAccess(request, type.organizationId);
    const updated = await fastify.prisma.driverComplianceType.update({ where: { id: driverComplianceTypeId }, data: { status: 'ACTIVE' }, include: { records: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_compliance_type.activate', entityType: 'DriverComplianceType', entityId: driverComplianceTypeId });
    return reply.success({ item: serializeDriverComplianceType(updated) });
  });

  fastify.post('/admin/driver-compliance-types/:driverComplianceTypeId/deactivate', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-compliance-types:manage')] }, async (request, reply) => {
    const { driverComplianceTypeId } = validateOrThrow(driverComplianceTypeIdParamSchema, request.params);
    const type = await findDriverComplianceTypeOrThrow(fastify.prisma, driverComplianceTypeId);
    await fastify.requireOrganizationAccess(request, type.organizationId);
    const updated = await fastify.prisma.driverComplianceType.update({ where: { id: driverComplianceTypeId }, data: { status: 'INACTIVE' }, include: { records: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_compliance_type.deactivate', entityType: 'DriverComplianceType', entityId: driverComplianceTypeId });
    return reply.success({ item: serializeDriverComplianceType(updated) });
  });
};
