import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ConflictError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  complianceRecordStatusSchema,
  findDriverComplianceRecordOrThrow,
  findDriverComplianceTypeOrThrow,
  findDriverOrThrow,
  getAuditContext,
  getPagination,
  paginationQuerySchema,
  serializeDriverComplianceRecord,
} from '../utils.js';

const driverIdParamSchema = z.object({
  driverId: z.string().min(1),
});

const driverComplianceRecordIdParamSchema = z.object({
  driverId: z.string().min(1),
  complianceRecordId: z.string().min(1),
});

const listExpiringDriverComplianceQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(),
  status: complianceRecordStatusSchema.optional(),
  days: z.coerce.number().int().min(1).max(365).default(30),
});

const createDriverComplianceRecordSchema = z.object({
  driverComplianceTypeId: z.string().min(1),
  referenceNumber: z.string().trim().optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  status: complianceRecordStatusSchema.default('ACTIVE'),
  notes: z.string().trim().optional(),
});

const updateDriverComplianceRecordSchema = z
  .object({
    driverComplianceTypeId: z.string().min(1).optional(),
    referenceNumber: z.string().trim().nullable().optional(),
    issueDate: z.coerce.date().nullable().optional(),
    expiryDate: z.coerce.date().nullable().optional(),
    status: complianceRecordStatusSchema.optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one driver compliance record field must be supplied' });

export const adminDriverComplianceRecordRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/drivers/compliance-records/expiring', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-compliance-records:read')] }, async (request, reply) => {
    const query = validateOrThrow(listExpiringDriverComplianceQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (!requestedOrganizationId && !query.driverId) {
      throw new ValidationAppError('Organization context or driver id is required for compliance expiry queries');
    }
    if (requestedOrganizationId) {
      await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    }
    let driver: Awaited<ReturnType<typeof findDriverOrThrow>> | null = null;
    if (query.driverId) {
      driver = await findDriverOrThrow(fastify.prisma, query.driverId);
      await fastify.requireOrganizationAccess(request, driver.organizationId);
    }
    const untilDate = new Date();
    untilDate.setDate(untilDate.getDate() + (query.days ?? 30));
    const where = {
      ...(query.status ? { status: query.status } : {}),
      expiryDate: { not: null, lte: untilDate },
      ...(driver ? { driverId: driver.id } : {}),
      ...(requestedOrganizationId ? { driver: { organizationId: requestedOrganizationId } } : {}),
    };
    const [items, total] = await Promise.all([
      fastify.prisma.driverComplianceRecord.findMany({ where, skip, take, orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }], include: { driverComplianceType: true } }),
      fastify.prisma.driverComplianceRecord.count({ where }),
    ]);
    return reply.success({ items: items.map(serializeDriverComplianceRecord) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/drivers/:driverId/compliance-records', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-compliance-records:read')] }, async (request, reply) => {
    const { driverId } = validateOrThrow(driverIdParamSchema, request.params);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const items = await fastify.prisma.driverComplianceRecord.findMany({ where: { driverId }, orderBy: { createdAt: 'desc' }, include: { driverComplianceType: true } });
    return reply.success({ items: items.map(serializeDriverComplianceRecord) });
  });

  fastify.get('/admin/drivers/:driverId/compliance-records/:complianceRecordId', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-compliance-records:read')] }, async (request, reply) => {
    const { driverId, complianceRecordId } = validateOrThrow(driverComplianceRecordIdParamSchema, request.params);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const record = await findDriverComplianceRecordOrThrow(fastify.prisma, complianceRecordId);
    if (record.driverId !== driverId) {
      throw new ConflictError('Driver compliance record does not belong to the requested driver');
    }
    return reply.success({ item: serializeDriverComplianceRecord(record) });
  });

  fastify.post('/admin/drivers/:driverId/compliance-records', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-compliance-records:manage')] }, async (request, reply) => {
    const { driverId } = validateOrThrow(driverIdParamSchema, request.params);
    const body = validateOrThrow(createDriverComplianceRecordSchema, request.body);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const type = await findDriverComplianceTypeOrThrow(fastify.prisma, body.driverComplianceTypeId);
    if (type.organizationId !== driver.organizationId) {
      throw new ConflictError('Driver compliance type must belong to the same organization');
    }
    const record = await fastify.prisma.driverComplianceRecord.create({
      data: { driverId, driverComplianceTypeId: body.driverComplianceTypeId, ...(body.referenceNumber ? { referenceNumber: body.referenceNumber } : {}), ...(body.issueDate ? { issueDate: body.issueDate } : {}), ...(body.expiryDate ? { expiryDate: body.expiryDate } : {}), status: body.status ?? 'ACTIVE', ...(body.notes ? { notes: body.notes } : {}) },
      include: { driverComplianceType: true },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_compliance_record.create', entityType: 'DriverComplianceRecord', entityId: record.id, metadata: { driverId, driverComplianceTypeId: record.driverComplianceTypeId, status: record.status } });
    return reply.status(201).success({ item: serializeDriverComplianceRecord(record) });
  });

  fastify.patch('/admin/drivers/:driverId/compliance-records/:complianceRecordId', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-compliance-records:manage')] }, async (request, reply) => {
    const { driverId, complianceRecordId } = validateOrThrow(driverComplianceRecordIdParamSchema, request.params);
    const body = validateOrThrow(updateDriverComplianceRecordSchema, request.body);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const record = await findDriverComplianceRecordOrThrow(fastify.prisma, complianceRecordId);
    if (record.driverId !== driverId) {
      throw new ConflictError('Driver compliance record does not belong to the requested driver');
    }
    if (body.driverComplianceTypeId) {
      const type = await findDriverComplianceTypeOrThrow(fastify.prisma, body.driverComplianceTypeId);
      if (type.organizationId !== driver.organizationId) {
        throw new ConflictError('Driver compliance type must belong to the same organization');
      }
    }
    const updateData = {
      ...(body.driverComplianceTypeId !== undefined
        ? { driverComplianceType: { connect: { id: body.driverComplianceTypeId } } }
        : {}),
      ...(body.referenceNumber !== undefined ? { referenceNumber: body.referenceNumber } : {}),
      ...(body.issueDate !== undefined ? { issueDate: body.issueDate } : {}),
      ...(body.expiryDate !== undefined ? { expiryDate: body.expiryDate } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    };
    const updated = await fastify.prisma.driverComplianceRecord.update({ where: { id: complianceRecordId }, data: updateData, include: { driverComplianceType: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_compliance_record.update', entityType: 'DriverComplianceRecord', entityId: complianceRecordId, metadata: updateData });
    return reply.success({ item: serializeDriverComplianceRecord(updated) });
  });

  fastify.post('/admin/drivers/:driverId/compliance-records/:complianceRecordId/archive', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-compliance-records:manage')] }, async (request, reply) => {
    const { driverId, complianceRecordId } = validateOrThrow(driverComplianceRecordIdParamSchema, request.params);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const record = await findDriverComplianceRecordOrThrow(fastify.prisma, complianceRecordId);
    if (record.driverId !== driverId) {
      throw new ConflictError('Driver compliance record does not belong to the requested driver');
    }
    const updated = await fastify.prisma.driverComplianceRecord.update({ where: { id: complianceRecordId }, data: { status: 'ARCHIVED' }, include: { driverComplianceType: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_compliance_record.archive', entityType: 'DriverComplianceRecord', entityId: complianceRecordId });
    return reply.success({ item: serializeDriverComplianceRecord(updated) });
  });
};
