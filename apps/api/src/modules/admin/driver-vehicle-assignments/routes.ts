import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  driverVehicleAssignmentStatusSchema,
  driverVehicleAssignmentTypeSchema,
  findDriverOrThrow,
  findDriverVehicleAssignmentOrThrow,
  findVehicleOrThrow,
  getAuditContext,
  getPagination,
  paginationQuerySchema,
  serializeDriverVehicleAssignment,
} from '../utils.js';

const assignmentIdParamSchema = z.object({
  assignmentId: z.string().min(1),
});

const listAssignmentsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  status: driverVehicleAssignmentStatusSchema.optional(),
});

const createAssignmentSchema = z.object({
  organizationId: z.string().min(1),
  driverId: z.string().min(1),
  vehicleId: z.string().min(1),
  assignmentType: driverVehicleAssignmentTypeSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  status: driverVehicleAssignmentStatusSchema.default('ACTIVE'),
  notes: z.string().trim().optional(),
});

const updateAssignmentSchema = z
  .object({
    assignmentType: driverVehicleAssignmentTypeSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().nullable().optional(),
    status: driverVehicleAssignmentStatusSchema.optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one assignment field must be supplied' });

export const adminDriverVehicleAssignmentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/driver-vehicle-assignments', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-vehicle-assignments:read')] }, async (request, reply) => {
    const query = validateOrThrow(listAssignmentsQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();

    if (requestedOrganizationId) {
      await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    }

    const where = {
      ...(query.driverId ? { driverId: query.driverId } : {}),
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
      ...(!isSuperAdmin && !requestedOrganizationId ? { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } } : {}),
    };

    const [items, total] = await Promise.all([
      fastify.prisma.driverVehicleAssignment.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { driver: true, vehicle: true } }),
      fastify.prisma.driverVehicleAssignment.count({ where }),
    ]);

    return reply.success({ items: items.map(serializeDriverVehicleAssignment) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/driver-vehicle-assignments/:assignmentId', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-vehicle-assignments:read')] }, async (request, reply) => {
    const { assignmentId } = validateOrThrow(assignmentIdParamSchema, request.params);
    const assignment = await findDriverVehicleAssignmentOrThrow(fastify.prisma, assignmentId);
    await fastify.requireOrganizationAccess(request, assignment.organizationId);
    return reply.success({ item: serializeDriverVehicleAssignment(assignment) });
  });

  fastify.post('/admin/driver-vehicle-assignments', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-vehicle-assignments:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createAssignmentSchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    const driver = await findDriverOrThrow(fastify.prisma, body.driverId);
    const vehicle = await findVehicleOrThrow(fastify.prisma, body.vehicleId);
    if (driver.organizationId !== body.organizationId || vehicle.organizationId !== body.organizationId) {
      throw new ConflictError('Driver and vehicle must belong to the same organization');
    }

    const assignment = await fastify.prisma.driverVehicleAssignment.create({
      data: { organizationId: body.organizationId, driverId: body.driverId, vehicleId: body.vehicleId, assignmentType: body.assignmentType, startDate: body.startDate, ...(body.endDate ? { endDate: body.endDate } : {}), status: body.status ?? 'ACTIVE', ...(body.notes ? { notes: body.notes } : {}) },
      include: { driver: true, vehicle: true },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_vehicle_assignment.create', entityType: 'DriverVehicleAssignment', entityId: assignment.id, metadata: { organizationId: assignment.organizationId, driverId: assignment.driverId, vehicleId: assignment.vehicleId, status: assignment.status } });
    return reply.status(201).success({ item: serializeDriverVehicleAssignment(assignment) });
  });

  fastify.patch('/admin/driver-vehicle-assignments/:assignmentId', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-vehicle-assignments:manage')] }, async (request, reply) => {
    const { assignmentId } = validateOrThrow(assignmentIdParamSchema, request.params);
    const body = validateOrThrow(updateAssignmentSchema, request.body);
    const assignment = await findDriverVehicleAssignmentOrThrow(fastify.prisma, assignmentId);
    await fastify.requireOrganizationAccess(request, assignment.organizationId);

    const updateData = { ...(body.assignmentType !== undefined ? { assignmentType: body.assignmentType } : {}), ...(body.startDate !== undefined ? { startDate: body.startDate } : {}), ...(body.endDate !== undefined ? { endDate: body.endDate } : {}), ...(body.status !== undefined ? { status: body.status } : {}), ...(body.notes !== undefined ? { notes: body.notes } : {}) };
    const updated = await fastify.prisma.driverVehicleAssignment.update({ where: { id: assignmentId }, data: updateData, include: { driver: true, vehicle: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_vehicle_assignment.update', entityType: 'DriverVehicleAssignment', entityId: assignmentId, metadata: updateData });
    return reply.success({ item: serializeDriverVehicleAssignment(updated) });
  });

  fastify.post('/admin/driver-vehicle-assignments/:assignmentId/activate', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-vehicle-assignments:manage')] }, async (request, reply) => {
    const { assignmentId } = validateOrThrow(assignmentIdParamSchema, request.params);
    const assignment = await findDriverVehicleAssignmentOrThrow(fastify.prisma, assignmentId);
    await fastify.requireOrganizationAccess(request, assignment.organizationId);
    const updated = await fastify.prisma.driverVehicleAssignment.update({ where: { id: assignmentId }, data: { status: 'ACTIVE', endDate: null }, include: { driver: true, vehicle: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_vehicle_assignment.activate', entityType: 'DriverVehicleAssignment', entityId: assignmentId });
    return reply.success({ item: serializeDriverVehicleAssignment(updated) });
  });

  fastify.post('/admin/driver-vehicle-assignments/:assignmentId/end', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-vehicle-assignments:manage')] }, async (request, reply) => {
    const { assignmentId } = validateOrThrow(assignmentIdParamSchema, request.params);
    const assignment = await findDriverVehicleAssignmentOrThrow(fastify.prisma, assignmentId);
    await fastify.requireOrganizationAccess(request, assignment.organizationId);
    const updated = await fastify.prisma.driverVehicleAssignment.update({ where: { id: assignmentId }, data: { status: 'ENDED', endDate: assignment.endDate ?? new Date() }, include: { driver: true, vehicle: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_vehicle_assignment.end', entityType: 'DriverVehicleAssignment', entityId: assignmentId });
    return reply.success({ item: serializeDriverVehicleAssignment(updated) });
  });

  fastify.post('/admin/driver-vehicle-assignments/:assignmentId/cancel', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-vehicle-assignments:manage')] }, async (request, reply) => {
    const { assignmentId } = validateOrThrow(assignmentIdParamSchema, request.params);
    const assignment = await findDriverVehicleAssignmentOrThrow(fastify.prisma, assignmentId);
    await fastify.requireOrganizationAccess(request, assignment.organizationId);
    const updated = await fastify.prisma.driverVehicleAssignment.update({ where: { id: assignmentId }, data: { status: 'CANCELED' }, include: { driver: true, vehicle: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_vehicle_assignment.cancel', entityType: 'DriverVehicleAssignment', entityId: assignmentId });
    return reply.success({ item: serializeDriverVehicleAssignment(updated) });
  });
};
