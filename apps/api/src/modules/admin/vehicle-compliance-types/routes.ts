import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findVehicleComplianceTypeOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeVehicleComplianceType,
} from '../utils.js';

const vehicleComplianceTypeIdParamSchema = z.object({
  vehicleComplianceTypeId: z.string().min(1),
});

const listVehicleComplianceTypesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createVehicleComplianceTypeSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateVehicleComplianceTypeSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one vehicle compliance type field must be supplied' });

export const adminVehicleComplianceTypeRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/vehicle-compliance-types', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-compliance-types:read')] }, async (request, reply) => {
    const query = validateOrThrow(listVehicleComplianceTypesQuerySchema, request.query);
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
      fastify.prisma.vehicleComplianceType.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { records: true } }),
      fastify.prisma.vehicleComplianceType.count({ where }),
    ]);

    return reply.success({ items: items.map(serializeVehicleComplianceType) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/vehicle-compliance-types/:vehicleComplianceTypeId', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-compliance-types:read')] }, async (request, reply) => {
    const { vehicleComplianceTypeId } = validateOrThrow(vehicleComplianceTypeIdParamSchema, request.params);
    const type = await findVehicleComplianceTypeOrThrow(fastify.prisma, vehicleComplianceTypeId);
    await fastify.requireOrganizationAccess(request, type.organizationId);
    return reply.success({ item: serializeVehicleComplianceType(type) });
  });

  fastify.post('/admin/vehicle-compliance-types', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-compliance-types:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createVehicleComplianceTypeSchema, request.body);
    const code = normalizeEntityCode(body.code);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    const existing = await fastify.prisma.vehicleComplianceType.findUnique({ where: { organizationId_code: { organizationId: body.organizationId, code } } });
    if (existing) {
      throw new ConflictError('A vehicle compliance type with that code already exists for this organization');
    }

    const type = await fastify.prisma.vehicleComplianceType.create({
      data: {
        organizationId: body.organizationId,
        name: body.name,
        code,
        status: body.status ?? 'ACTIVE',
        ...(body.description ? { description: body.description } : {}),
      },
      include: { records: true },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.vehicle_compliance_type.create', entityType: 'VehicleComplianceType', entityId: type.id, metadata: { organizationId: type.organizationId, code: type.code, status: type.status } });
    return reply.status(201).success({ item: serializeVehicleComplianceType(type) });
  });

  fastify.patch('/admin/vehicle-compliance-types/:vehicleComplianceTypeId', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-compliance-types:manage')] }, async (request, reply) => {
    const { vehicleComplianceTypeId } = validateOrThrow(vehicleComplianceTypeIdParamSchema, request.params);
    const body = validateOrThrow(updateVehicleComplianceTypeSchema, request.body);
    const type = await findVehicleComplianceTypeOrThrow(fastify.prisma, vehicleComplianceTypeId);
    await fastify.requireOrganizationAccess(request, type.organizationId);
    const updateData = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
    };
    const updated = await fastify.prisma.vehicleComplianceType.update({ where: { id: vehicleComplianceTypeId }, data: updateData, include: { records: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.vehicle_compliance_type.update', entityType: 'VehicleComplianceType', entityId: vehicleComplianceTypeId, metadata: updateData });
    return reply.success({ item: serializeVehicleComplianceType(updated) });
  });

  fastify.post('/admin/vehicle-compliance-types/:vehicleComplianceTypeId/activate', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-compliance-types:manage')] }, async (request, reply) => {
    const { vehicleComplianceTypeId } = validateOrThrow(vehicleComplianceTypeIdParamSchema, request.params);
    const type = await findVehicleComplianceTypeOrThrow(fastify.prisma, vehicleComplianceTypeId);
    await fastify.requireOrganizationAccess(request, type.organizationId);
    const updated = await fastify.prisma.vehicleComplianceType.update({ where: { id: vehicleComplianceTypeId }, data: { status: 'ACTIVE' }, include: { records: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.vehicle_compliance_type.activate', entityType: 'VehicleComplianceType', entityId: vehicleComplianceTypeId });
    return reply.success({ item: serializeVehicleComplianceType(updated) });
  });

  fastify.post('/admin/vehicle-compliance-types/:vehicleComplianceTypeId/deactivate', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-compliance-types:manage')] }, async (request, reply) => {
    const { vehicleComplianceTypeId } = validateOrThrow(vehicleComplianceTypeIdParamSchema, request.params);
    const type = await findVehicleComplianceTypeOrThrow(fastify.prisma, vehicleComplianceTypeId);
    await fastify.requireOrganizationAccess(request, type.organizationId);
    const updated = await fastify.prisma.vehicleComplianceType.update({ where: { id: vehicleComplianceTypeId }, data: { status: 'INACTIVE' }, include: { records: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.vehicle_compliance_type.deactivate', entityType: 'VehicleComplianceType', entityId: vehicleComplianceTypeId });
    return reply.success({ item: serializeVehicleComplianceType(updated) });
  });
};
