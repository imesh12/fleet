import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ConflictError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  complianceRecordStatusSchema,
  findVehicleComplianceRecordOrThrow,
  findVehicleComplianceTypeOrThrow,
  findVehicleOrThrow,
  getAuditContext,
  getPagination,
  paginationQuerySchema,
  serializeVehicleComplianceRecord,
} from '../utils.js';

const vehicleIdParamSchema = z.object({
  vehicleId: z.string().min(1),
});

const vehicleComplianceRecordIdParamSchema = z.object({
  vehicleId: z.string().min(1),
  complianceRecordId: z.string().min(1),
});

const listExpiringVehicleComplianceQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  status: complianceRecordStatusSchema.optional(),
  days: z.coerce.number().int().min(1).max(365).default(30),
});

const createVehicleComplianceRecordSchema = z.object({
  vehicleComplianceTypeId: z.string().min(1),
  referenceNumber: z.string().trim().optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  status: complianceRecordStatusSchema.default('ACTIVE'),
  notes: z.string().trim().optional(),
});

const updateVehicleComplianceRecordSchema = z
  .object({
    vehicleComplianceTypeId: z.string().min(1).optional(),
    referenceNumber: z.string().trim().nullable().optional(),
    issueDate: z.coerce.date().nullable().optional(),
    expiryDate: z.coerce.date().nullable().optional(),
    status: complianceRecordStatusSchema.optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one vehicle compliance record field must be supplied' });

export const adminVehicleComplianceRecordRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/vehicles/compliance-records/expiring', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-compliance-records:read')] }, async (request, reply) => {
    const query = validateOrThrow(listExpiringVehicleComplianceQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (!requestedOrganizationId && !query.vehicleId) {
      throw new ValidationAppError('Organization context or vehicle id is required for compliance expiry queries');
    }
    if (requestedOrganizationId) {
      await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    }

    let vehicle: Awaited<ReturnType<typeof findVehicleOrThrow>> | null = null;
    if (query.vehicleId) {
      vehicle = await findVehicleOrThrow(fastify.prisma, query.vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);
    }

    const untilDate = new Date();
    untilDate.setDate(untilDate.getDate() + (query.days ?? 30));
    const where = {
      ...(query.status ? { status: query.status } : {}),
      expiryDate: { not: null, lte: untilDate },
      ...(vehicle ? { vehicleId: vehicle.id } : {}),
      ...(requestedOrganizationId ? { vehicle: { organizationId: requestedOrganizationId } } : {}),
    };

    const [items, total] = await Promise.all([
      fastify.prisma.vehicleComplianceRecord.findMany({ where, skip, take, orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }], include: { vehicleComplianceType: true } }),
      fastify.prisma.vehicleComplianceRecord.count({ where }),
    ]);

    return reply.success({ items: items.map(serializeVehicleComplianceRecord) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/vehicles/:vehicleId/compliance-records', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-compliance-records:read')] }, async (request, reply) => {
    const { vehicleId } = validateOrThrow(vehicleIdParamSchema, request.params);
    const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
    await fastify.requireOrganizationAccess(request, vehicle.organizationId);
    const items = await fastify.prisma.vehicleComplianceRecord.findMany({ where: { vehicleId }, orderBy: { createdAt: 'desc' }, include: { vehicleComplianceType: true } });
    return reply.success({ items: items.map(serializeVehicleComplianceRecord) });
  });

  fastify.get('/admin/vehicles/:vehicleId/compliance-records/:complianceRecordId', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-compliance-records:read')] }, async (request, reply) => {
    const { vehicleId, complianceRecordId } = validateOrThrow(vehicleComplianceRecordIdParamSchema, request.params);
    const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
    await fastify.requireOrganizationAccess(request, vehicle.organizationId);
    const record = await findVehicleComplianceRecordOrThrow(fastify.prisma, complianceRecordId);
    if (record.vehicleId !== vehicleId) {
      throw new ConflictError('Vehicle compliance record does not belong to the requested vehicle');
    }
    return reply.success({ item: serializeVehicleComplianceRecord(record) });
  });

  fastify.post('/admin/vehicles/:vehicleId/compliance-records', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-compliance-records:manage')] }, async (request, reply) => {
    const { vehicleId } = validateOrThrow(vehicleIdParamSchema, request.params);
    const body = validateOrThrow(createVehicleComplianceRecordSchema, request.body);
    const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
    await fastify.requireOrganizationAccess(request, vehicle.organizationId);
    const type = await findVehicleComplianceTypeOrThrow(fastify.prisma, body.vehicleComplianceTypeId);
    if (type.organizationId !== vehicle.organizationId) {
      throw new ConflictError('Vehicle compliance type must belong to the same organization');
    }

    const record = await fastify.prisma.vehicleComplianceRecord.create({
      data: { vehicleId, vehicleComplianceTypeId: body.vehicleComplianceTypeId, ...(body.referenceNumber ? { referenceNumber: body.referenceNumber } : {}), ...(body.issueDate ? { issueDate: body.issueDate } : {}), ...(body.expiryDate ? { expiryDate: body.expiryDate } : {}), status: body.status ?? 'ACTIVE', ...(body.notes ? { notes: body.notes } : {}) },
      include: { vehicleComplianceType: true },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.vehicle_compliance_record.create', entityType: 'VehicleComplianceRecord', entityId: record.id, metadata: { vehicleId, vehicleComplianceTypeId: record.vehicleComplianceTypeId, status: record.status } });
    return reply.status(201).success({ item: serializeVehicleComplianceRecord(record) });
  });

  fastify.patch('/admin/vehicles/:vehicleId/compliance-records/:complianceRecordId', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-compliance-records:manage')] }, async (request, reply) => {
    const { vehicleId, complianceRecordId } = validateOrThrow(vehicleComplianceRecordIdParamSchema, request.params);
    const body = validateOrThrow(updateVehicleComplianceRecordSchema, request.body);
    const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
    await fastify.requireOrganizationAccess(request, vehicle.organizationId);
    const record = await findVehicleComplianceRecordOrThrow(fastify.prisma, complianceRecordId);
    if (record.vehicleId !== vehicleId) {
      throw new ConflictError('Vehicle compliance record does not belong to the requested vehicle');
    }
    if (body.vehicleComplianceTypeId) {
      const type = await findVehicleComplianceTypeOrThrow(fastify.prisma, body.vehicleComplianceTypeId);
      if (type.organizationId !== vehicle.organizationId) {
        throw new ConflictError('Vehicle compliance type must belong to the same organization');
      }
    }

    const updateData = {
      ...(body.vehicleComplianceTypeId !== undefined
        ? { vehicleComplianceType: { connect: { id: body.vehicleComplianceTypeId } } }
        : {}),
      ...(body.referenceNumber !== undefined ? { referenceNumber: body.referenceNumber } : {}),
      ...(body.issueDate !== undefined ? { issueDate: body.issueDate } : {}),
      ...(body.expiryDate !== undefined ? { expiryDate: body.expiryDate } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    };
    const updated = await fastify.prisma.vehicleComplianceRecord.update({
      where: { id: complianceRecordId },
      data: updateData,
      include: { vehicleComplianceType: true },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.vehicle_compliance_record.update', entityType: 'VehicleComplianceRecord', entityId: complianceRecordId, metadata: updateData });
    return reply.success({ item: serializeVehicleComplianceRecord(updated) });
  });

  fastify.post('/admin/vehicles/:vehicleId/compliance-records/:complianceRecordId/archive', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-compliance-records:manage')] }, async (request, reply) => {
    const { vehicleId, complianceRecordId } = validateOrThrow(vehicleComplianceRecordIdParamSchema, request.params);
    const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
    await fastify.requireOrganizationAccess(request, vehicle.organizationId);
    const record = await findVehicleComplianceRecordOrThrow(fastify.prisma, complianceRecordId);
    if (record.vehicleId !== vehicleId) {
      throw new ConflictError('Vehicle compliance record does not belong to the requested vehicle');
    }
    const updated = await fastify.prisma.vehicleComplianceRecord.update({ where: { id: complianceRecordId }, data: { status: 'ARCHIVED' }, include: { vehicleComplianceType: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.vehicle_compliance_record.archive', entityType: 'VehicleComplianceRecord', entityId: complianceRecordId });
    return reply.success({ item: serializeVehicleComplianceRecord(updated) });
  });
};
