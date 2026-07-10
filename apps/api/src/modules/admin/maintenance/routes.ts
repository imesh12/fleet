import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { evaluateMaintenanceDue } from '../../../lib/maintenance-due.js';
import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findDriverOrThrow,
  findVehicleOrThrow,
  findVendorOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
} from '../utils.js';

const jsonRecordSchema = z.record(z.string(), z.unknown());
const prioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']);
const requestStatusSchema = z.enum(['DRAFT', 'REQUESTED', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS_PLACEHOLDER', 'COMPLETED_PLACEHOLDER', 'CANCELLED']);
const workOrderStatusSchema = requestStatusSchema;
const checklistItemTypeSchema = z.enum(['BOOLEAN', 'TEXT', 'NUMBER', 'PHOTO', 'PASS_FAIL']);

const idParamSchema = z.object({ id: z.string().min(1) });
const vehicleParamSchema = z.object({ vehicleId: z.string().min(1) });
const vehiclePlanParamSchema = z.object({ vehicleId: z.string().min(1), planId: z.string().min(1) });
const vehiclePlanTaskParamSchema = z.object({ vehicleId: z.string().min(1), planId: z.string().min(1), taskId: z.string().min(1) });
const checklistItemParamSchema = z.object({ id: z.string().min(1), itemId: z.string().min(1) });
const workOrderTaskParamSchema = z.object({ id: z.string().min(1), taskId: z.string().min(1) });

const listOrgQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const listServiceTasksQuerySchema = listOrgQuerySchema.extend({
  categoryId: z.string().min(1).optional(),
});

const createCategorySchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    code: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be supplied' });

const createServiceTaskSchema = z.object({
  organizationId: z.string().min(1),
  categoryId: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  code: z.string().trim().optional(),
  description: z.string().trim().optional(),
  defaultIntervalKm: z.coerce.number().int().positive().optional(),
  defaultIntervalDays: z.coerce.number().int().positive().optional(),
  estimatedDurationMinutes: z.coerce.number().int().positive().optional(),
  estimatedCost: z.coerce.number().nonnegative().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateServiceTaskSchema = z
  .object({
    categoryId: z.string().min(1).nullable().optional(),
    name: z.string().trim().min(1).optional(),
    code: z.string().trim().nullable().optional(),
    description: z.string().trim().nullable().optional(),
    defaultIntervalKm: z.coerce.number().int().positive().nullable().optional(),
    defaultIntervalDays: z.coerce.number().int().positive().nullable().optional(),
    estimatedDurationMinutes: z.coerce.number().int().positive().nullable().optional(),
    estimatedCost: z.coerce.number().nonnegative().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be supplied' });

const createChecklistSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateChecklistSchema = updateCategorySchema;

const createChecklistItemSchema = z.object({
  label: z.string().trim().min(1),
  description: z.string().trim().optional(),
  itemType: checklistItemTypeSchema.default('BOOLEAN'),
  isRequired: z.boolean().default(false),
  sequence: z.coerce.number().int().min(0).default(0),
  metadata: jsonRecordSchema.optional(),
});

const updateChecklistItemSchema = z
  .object({
    label: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    itemType: checklistItemTypeSchema.optional(),
    isRequired: z.boolean().optional(),
    sequence: z.coerce.number().int().min(0).optional(),
    metadata: jsonRecordSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one item field must be supplied' });

const createPlanSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  startDate: z.coerce.date(),
  lastCompletedAt: z.coerce.date().optional(),
  nextDueAt: z.coerce.date().optional(),
  nextDueOdometer: z.coerce.number().int().nonnegative().optional(),
});

const updatePlanSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    startDate: z.coerce.date().optional(),
    lastCompletedAt: z.coerce.date().nullable().optional(),
    nextDueAt: z.coerce.date().nullable().optional(),
    nextDueOdometer: z.coerce.number().int().nonnegative().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one plan field must be supplied' });

const createPlanTaskSchema = z.object({
  maintenanceServiceTaskId: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  intervalKm: z.coerce.number().int().positive().optional(),
  intervalDays: z.coerce.number().int().positive().optional(),
  estimatedDurationMinutes: z.coerce.number().int().positive().optional(),
  estimatedCost: z.coerce.number().nonnegative().optional(),
  lastCompletedAt: z.coerce.date().optional(),
  nextDueAt: z.coerce.date().optional(),
  nextDueOdometer: z.coerce.number().int().nonnegative().optional(),
  sequence: z.coerce.number().int().min(0).default(0),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updatePlanTaskSchema = z
  .object({
    maintenanceServiceTaskId: z.string().min(1).nullable().optional(),
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    intervalKm: z.coerce.number().int().positive().nullable().optional(),
    intervalDays: z.coerce.number().int().positive().nullable().optional(),
    estimatedDurationMinutes: z.coerce.number().int().positive().nullable().optional(),
    estimatedCost: z.coerce.number().nonnegative().nullable().optional(),
    lastCompletedAt: z.coerce.date().nullable().optional(),
    nextDueAt: z.coerce.date().nullable().optional(),
    nextDueOdometer: z.coerce.number().int().nonnegative().nullable().optional(),
    sequence: z.coerce.number().int().min(0).optional(),
    status: masterDataStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one plan task field must be supplied' });

const listRequestsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(),
  status: requestStatusSchema.optional(),
  priority: prioritySchema.optional(),
});

const requestBodySchema = z.object({
  organizationId: z.string().min(1),
  vehicleId: z.string().min(1),
  driverId: z.string().min(1).optional(),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  priority: prioritySchema.default('NORMAL'),
  status: requestStatusSchema.default('REQUESTED'),
  requestedAt: z.coerce.date().optional(),
  scheduledAt: z.coerce.date().optional(),
  metadata: jsonRecordSchema.optional(),
});

const updateRequestSchema = z
  .object({
    driverId: z.string().min(1).nullable().optional(),
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    priority: prioritySchema.optional(),
    status: requestStatusSchema.optional(),
    requestedAt: z.coerce.date().optional(),
    scheduledAt: z.coerce.date().nullable().optional(),
    metadata: jsonRecordSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one request field must be supplied' });

const listWorkOrdersQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(),
  vendorId: z.string().min(1).optional(),
  status: workOrderStatusSchema.optional(),
});

const workOrderBodySchema = z.object({
  organizationId: z.string().min(1),
  vehicleId: z.string().min(1),
  driverId: z.string().min(1).optional(),
  vendorId: z.string().min(1).optional(),
  maintenanceRequestId: z.string().min(1).optional(),
  inspectionChecklistTemplateId: z.string().min(1).optional(),
  workOrderNumber: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  priority: prioritySchema.default('NORMAL'),
  status: workOrderStatusSchema.default('DRAFT'),
  scheduledStartAt: z.coerce.date().optional(),
  scheduledEndAt: z.coerce.date().optional(),
  metadata: jsonRecordSchema.optional(),
});

const updateWorkOrderSchema = z
  .object({
    driverId: z.string().min(1).nullable().optional(),
    vendorId: z.string().min(1).nullable().optional(),
    maintenanceRequestId: z.string().min(1).nullable().optional(),
    inspectionChecklistTemplateId: z.string().min(1).nullable().optional(),
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    priority: prioritySchema.optional(),
    status: workOrderStatusSchema.optional(),
    scheduledStartAt: z.coerce.date().nullable().optional(),
    scheduledEndAt: z.coerce.date().nullable().optional(),
    metadata: jsonRecordSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one work order field must be supplied' });

const workOrderTaskSchema = z.object({
  maintenanceServiceTaskId: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  estimatedDurationMinutes: z.coerce.number().int().positive().optional(),
  estimatedCost: z.coerce.number().nonnegative().optional(),
  sequence: z.coerce.number().int().min(0).default(0),
  status: masterDataStatusSchema.default('ACTIVE'),
  metadata: jsonRecordSchema.optional(),
});

const updateWorkOrderTaskSchema = z
  .object({
    maintenanceServiceTaskId: z.string().min(1).nullable().optional(),
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    estimatedDurationMinutes: z.coerce.number().int().positive().nullable().optional(),
    estimatedCost: z.coerce.number().nonnegative().nullable().optional(),
    sequence: z.coerce.number().int().min(0).optional(),
    status: masterDataStatusSchema.optional(),
    metadata: jsonRecordSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one work order task field must be supplied' });

const dueQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  daysAhead: z.coerce.number().int().positive().max(365).optional(),
  odometerAheadKm: z.coerce.number().int().positive().max(100000).optional(),
  createNotifications: z.coerce.boolean().optional(),
  notificationProviderId: z.string().min(1).optional(),
  notificationRecipient: z.string().trim().optional(),
});

function serialize(item: Record<string, unknown>) {
  return item;
}

async function assertServiceTaskOrganization(fastify: Parameters<FastifyPluginAsync>[0], serviceTaskId: string, organizationId: string) {
  const serviceTask = await fastify.prisma.maintenanceServiceTask.findUnique({ where: { id: serviceTaskId } });
  if (!serviceTask) throw new NotFoundError('Maintenance service task not found');
  if (serviceTask.organizationId !== organizationId) throw new ConflictError('Maintenance service task must belong to the same organization');
}

async function assertChecklistOrganization(fastify: Parameters<FastifyPluginAsync>[0], checklistId: string, organizationId: string) {
  const checklist = await fastify.prisma.inspectionChecklistTemplate.findUnique({ where: { id: checklistId } });
  if (!checklist) throw new NotFoundError('Inspection checklist template not found');
  if (checklist.organizationId !== organizationId) throw new ConflictError('Inspection checklist template must belong to the same organization');
}

async function assertVehicleOrganization(fastify: Parameters<FastifyPluginAsync>[0], vehicleId: string, organizationId: string) {
  const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
  if (vehicle.organizationId !== organizationId) throw new ConflictError('Vehicle must belong to the same organization');
  return vehicle;
}

async function assertOptionalRelations(fastify: Parameters<FastifyPluginAsync>[0], organizationId: string, input: {
  driverId?: string | null | undefined;
  vendorId?: string | null | undefined;
  maintenanceRequestId?: string | null | undefined;
  inspectionChecklistTemplateId?: string | null | undefined;
  maintenanceServiceTaskId?: string | null | undefined;
}) {
  if (input.driverId) {
    const driver = await findDriverOrThrow(fastify.prisma, input.driverId);
    if (driver.organizationId !== organizationId) throw new ConflictError('Driver must belong to the same organization');
  }
  if (input.vendorId) {
    const vendor = await findVendorOrThrow(fastify.prisma, input.vendorId);
    if (vendor.organizationId !== organizationId) throw new ConflictError('Vendor must belong to the same organization');
  }
  if (input.maintenanceRequestId) {
    const request = await fastify.prisma.maintenanceRequest.findUnique({ where: { id: input.maintenanceRequestId } });
    if (!request) throw new NotFoundError('Maintenance request not found');
    if (request.organizationId !== organizationId) throw new ConflictError('Maintenance request must belong to the same organization');
  }
  if (input.inspectionChecklistTemplateId) {
    await assertChecklistOrganization(fastify, input.inspectionChecklistTemplateId, organizationId);
  }
  if (input.maintenanceServiceTaskId) {
    await assertServiceTaskOrganization(fastify, input.maintenanceServiceTaskId, organizationId);
  }
}

function scopedWhere(request: Parameters<FastifyPluginAsync>[0]['server'] extends never ? never : any, requestedOrganizationId?: string) {
  const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
  return !isSuperAdmin && !requestedOrganizationId
    ? { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } }
    : {};
}

export const adminMaintenanceRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/maintenance-categories', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-categories:read')] }, async (request, reply) => {
    const query = validateOrThrow(listOrgQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = {
      ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }, { code: { contains: query.search, mode: 'insensitive' as const } }] } : {}),
      ...scopedWhere(request, requestedOrganizationId),
    };
    const [items, total] = await Promise.all([
      fastify.prisma.maintenanceCategory.findMany({ where, skip, take, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.maintenanceCategory.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/maintenance-categories', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-categories:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createCategorySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    const item = await fastify.prisma.maintenanceCategory.create({
      data: { organizationId: body.organizationId, name: body.name, code: normalizeEntityCode(body.code), status: body.status ?? 'ACTIVE', ...(body.description ? { description: body.description } : {}) },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.maintenance_category.create', entityType: 'MaintenanceCategory', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/maintenance-categories/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-categories:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.maintenanceCategory.findUnique({ where: { id }, include: { serviceTasks: true } });
    if (!item) throw new NotFoundError('Maintenance category not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/maintenance-categories/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-categories:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateCategorySchema, request.body);
    const existing = await fastify.prisma.maintenanceCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Maintenance category not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.maintenanceCategory.update({
      where: { id },
      data: { ...(body.name ? { name: body.name } : {}), ...(body.code ? { code: normalizeEntityCode(body.code) } : {}), ...(body.description !== undefined ? { description: body.description ?? null } : {}) },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.maintenance_category.update', entityType: 'MaintenanceCategory', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const action of ['activate', 'deactivate'] as const) {
    fastify.post(`/admin/maintenance-categories/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-categories:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.maintenanceCategory.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Maintenance category not found');
      await fastify.requireOrganizationAccess(request, existing.organizationId);
      const item = await fastify.prisma.maintenanceCategory.update({ where: { id }, data: { status: action === 'activate' ? 'ACTIVE' : 'INACTIVE' } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.maintenance_category.${action}`, entityType: 'MaintenanceCategory', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }

  fastify.get('/admin/maintenance-service-tasks', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-service-tasks:read')] }, async (request, reply) => {
    const query = validateOrThrow(listServiceTasksQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = {
      ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }, { code: { contains: query.search, mode: 'insensitive' as const } }] } : {}),
      ...scopedWhere(request, requestedOrganizationId),
    };
    const [items, total] = await Promise.all([
      fastify.prisma.maintenanceServiceTask.findMany({ where, skip, take, include: { category: true }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.maintenanceServiceTask.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/maintenance-service-tasks', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-service-tasks:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createServiceTaskSchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    if (body.categoryId) {
      const category = await fastify.prisma.maintenanceCategory.findUnique({ where: { id: body.categoryId } });
      if (!category) throw new NotFoundError('Maintenance category not found');
      if (category.organizationId !== body.organizationId) throw new ConflictError('Maintenance category must belong to the same organization');
    }
    const item = await fastify.prisma.maintenanceServiceTask.create({
      data: {
        organizationId: body.organizationId,
        name: body.name,
        ...(body.code ? { code: normalizeEntityCode(body.code) } : {}),
        status: body.status ?? 'ACTIVE',
        ...(body.categoryId ? { categoryId: body.categoryId } : {}),
        ...(body.description ? { description: body.description } : {}),
        ...(body.defaultIntervalKm ? { defaultIntervalKm: body.defaultIntervalKm } : {}),
        ...(body.defaultIntervalDays ? { defaultIntervalDays: body.defaultIntervalDays } : {}),
        ...(body.estimatedDurationMinutes ? { estimatedDurationMinutes: body.estimatedDurationMinutes } : {}),
        ...(body.estimatedCost !== undefined ? { estimatedCost: body.estimatedCost } : {}),
      } as Prisma.MaintenanceServiceTaskUncheckedCreateInput,
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.maintenance_service_task.create', entityType: 'MaintenanceServiceTask', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/maintenance-service-tasks/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-service-tasks:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.maintenanceServiceTask.findUnique({ where: { id }, include: { category: true } });
    if (!item) throw new NotFoundError('Maintenance service task not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/maintenance-service-tasks/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-service-tasks:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateServiceTaskSchema, request.body);
    const existing = await fastify.prisma.maintenanceServiceTask.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Maintenance service task not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    if (body.categoryId) {
      const category = await fastify.prisma.maintenanceCategory.findUnique({ where: { id: body.categoryId } });
      if (!category) throw new NotFoundError('Maintenance category not found');
      if (category.organizationId !== existing.organizationId) throw new ConflictError('Maintenance category must belong to the same organization');
    }
    const item = await fastify.prisma.maintenanceServiceTask.update({
      where: { id },
      data: {
        ...(body.categoryId !== undefined ? { categoryId: body.categoryId } : {}),
        ...(body.name ? { name: body.name } : {}),
        ...(body.code !== undefined ? { code: body.code ? normalizeEntityCode(body.code) : null } : {}),
        ...(body.description !== undefined ? { description: body.description ?? null } : {}),
        ...(body.defaultIntervalKm !== undefined ? { defaultIntervalKm: body.defaultIntervalKm } : {}),
        ...(body.defaultIntervalDays !== undefined ? { defaultIntervalDays: body.defaultIntervalDays } : {}),
        ...(body.estimatedDurationMinutes !== undefined ? { estimatedDurationMinutes: body.estimatedDurationMinutes } : {}),
        ...(body.estimatedCost !== undefined ? { estimatedCost: body.estimatedCost } : {}),
      },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.maintenance_service_task.update', entityType: 'MaintenanceServiceTask', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const action of ['activate', 'deactivate'] as const) {
    fastify.post(`/admin/maintenance-service-tasks/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-service-tasks:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.maintenanceServiceTask.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Maintenance service task not found');
      await fastify.requireOrganizationAccess(request, existing.organizationId);
      const item = await fastify.prisma.maintenanceServiceTask.update({ where: { id }, data: { status: action === 'activate' ? 'ACTIVE' : 'INACTIVE' } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.maintenance_service_task.${action}`, entityType: 'MaintenanceServiceTask', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }

  fastify.get('/admin/inspection-checklists', { preHandler: [fastify.authenticate, fastify.requirePermission('inspection-checklists:read')] }, async (request, reply) => {
    const query = validateOrThrow(listOrgQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = {
      ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }, { code: { contains: query.search, mode: 'insensitive' as const } }] } : {}),
      ...scopedWhere(request, requestedOrganizationId),
    };
    const [items, total] = await Promise.all([
      fastify.prisma.inspectionChecklistTemplate.findMany({ where, skip, take, include: { items: { orderBy: { sequence: 'asc' } } }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.inspectionChecklistTemplate.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/inspection-checklists', { preHandler: [fastify.authenticate, fastify.requirePermission('inspection-checklists:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createChecklistSchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    const item = await fastify.prisma.inspectionChecklistTemplate.create({
      data: { organizationId: body.organizationId, name: body.name, code: normalizeEntityCode(body.code), status: body.status ?? 'ACTIVE', ...(body.description ? { description: body.description } : {}) },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.inspection_checklist.create', entityType: 'InspectionChecklistTemplate', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/inspection-checklists/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('inspection-checklists:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.inspectionChecklistTemplate.findUnique({ where: { id }, include: { items: { orderBy: { sequence: 'asc' } } } });
    if (!item) throw new NotFoundError('Inspection checklist template not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/inspection-checklists/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('inspection-checklists:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateChecklistSchema, request.body);
    const existing = await fastify.prisma.inspectionChecklistTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Inspection checklist template not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.inspectionChecklistTemplate.update({
      where: { id },
      data: { ...(body.name ? { name: body.name } : {}), ...(body.code ? { code: normalizeEntityCode(body.code) } : {}), ...(body.description !== undefined ? { description: body.description ?? null } : {}) },
      include: { items: { orderBy: { sequence: 'asc' } } },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.inspection_checklist.update', entityType: 'InspectionChecklistTemplate', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const action of ['activate', 'deactivate'] as const) {
    fastify.post(`/admin/inspection-checklists/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('inspection-checklists:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.inspectionChecklistTemplate.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Inspection checklist template not found');
      await fastify.requireOrganizationAccess(request, existing.organizationId);
      const item = await fastify.prisma.inspectionChecklistTemplate.update({ where: { id }, data: { status: action === 'activate' ? 'ACTIVE' : 'INACTIVE' } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.inspection_checklist.${action}`, entityType: 'InspectionChecklistTemplate', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }

  fastify.post('/admin/inspection-checklists/:id/items', { preHandler: [fastify.authenticate, fastify.requirePermission('inspection-checklists:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(createChecklistItemSchema, request.body);
    const checklist = await fastify.prisma.inspectionChecklistTemplate.findUnique({ where: { id } });
    if (!checklist) throw new NotFoundError('Inspection checklist template not found');
    await fastify.requireOrganizationAccess(request, checklist.organizationId);
    const item = await fastify.prisma.inspectionChecklistItem.create({
      data: { checklistTemplateId: id, label: body.label, itemType: body.itemType ?? 'BOOLEAN', isRequired: body.isRequired ?? false, sequence: body.sequence ?? 0, ...(body.description ? { description: body.description } : {}), ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}) },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.inspection_checklist_item.create', entityType: 'InspectionChecklistItem', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.patch('/admin/inspection-checklists/:id/items/:itemId', { preHandler: [fastify.authenticate, fastify.requirePermission('inspection-checklists:manage')] }, async (request, reply) => {
    const { id, itemId } = validateOrThrow(checklistItemParamSchema, request.params);
    const body = validateOrThrow(updateChecklistItemSchema, request.body);
    const checklist = await fastify.prisma.inspectionChecklistTemplate.findUnique({ where: { id } });
    if (!checklist) throw new NotFoundError('Inspection checklist template not found');
    await fastify.requireOrganizationAccess(request, checklist.organizationId);
    const item = await fastify.prisma.inspectionChecklistItem.update({
      where: { id: itemId },
      data: { ...(body.label ? { label: body.label } : {}), ...(body.description !== undefined ? { description: body.description ?? null } : {}), ...(body.itemType ? { itemType: body.itemType } : {}), ...(body.isRequired !== undefined ? { isRequired: body.isRequired } : {}), ...(body.sequence !== undefined ? { sequence: body.sequence } : {}), ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.inspection_checklist_item.update', entityType: 'InspectionChecklistItem', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.delete('/admin/inspection-checklists/:id/items/:itemId', { preHandler: [fastify.authenticate, fastify.requirePermission('inspection-checklists:manage')] }, async (request, reply) => {
    const { id, itemId } = validateOrThrow(checklistItemParamSchema, request.params);
    const checklist = await fastify.prisma.inspectionChecklistTemplate.findUnique({ where: { id } });
    if (!checklist) throw new NotFoundError('Inspection checklist template not found');
    await fastify.requireOrganizationAccess(request, checklist.organizationId);
    await fastify.prisma.inspectionChecklistItem.delete({ where: { id: itemId } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.inspection_checklist_item.delete', entityType: 'InspectionChecklistItem', entityId: itemId });
    return reply.success({ deleted: true });
  });

  fastify.get('/admin/maintenance/due', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-due:read')] }, async (request, reply) => {
    const query = validateOrThrow(dueQuerySchema, request.query);
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const result = await evaluateMaintenanceDue(fastify, {
      ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
      ...(query.daysAhead ? { daysAhead: query.daysAhead } : {}),
      ...(query.odometerAheadKm ? { odometerAheadKm: query.odometerAheadKm } : {}),
      createNotifications: query.createNotifications === true,
      ...(query.notificationProviderId ? { notificationProviderId: query.notificationProviderId } : {}),
      ...(query.notificationRecipient ? { notificationRecipient: query.notificationRecipient } : {}),
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.maintenance_due.read', entityType: 'MaintenanceDue', entityId: requestedOrganizationId ?? 'global' });
    return reply.success(result);
  });

  fastify.get('/admin/vehicles/:vehicleId/maintenance/due', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-due:read')] }, async (request, reply) => {
    const { vehicleId } = validateOrThrow(vehicleParamSchema, request.params);
    const query = validateOrThrow(dueQuerySchema.omit({ organizationId: true }), request.query);
    const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
    await fastify.requireOrganizationAccess(request, vehicle.organizationId);
    const result = await evaluateMaintenanceDue(fastify, {
      organizationId: vehicle.organizationId,
      vehicleId,
      ...(query.daysAhead ? { daysAhead: query.daysAhead } : {}),
      ...(query.odometerAheadKm ? { odometerAheadKm: query.odometerAheadKm } : {}),
      createNotifications: query.createNotifications === true,
      ...(query.notificationProviderId ? { notificationProviderId: query.notificationProviderId } : {}),
      ...(query.notificationRecipient ? { notificationRecipient: query.notificationRecipient } : {}),
    });
    return reply.success(result);
  });

  fastify.get('/admin/vehicles/:vehicleId/maintenance-plans', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-maintenance-plans:read')] }, async (request, reply) => {
    const { vehicleId } = validateOrThrow(vehicleParamSchema, request.params);
    const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
    await fastify.requireOrganizationAccess(request, vehicle.organizationId);
    const items = await fastify.prisma.vehicleMaintenancePlan.findMany({ where: { vehicleId }, include: { tasks: { orderBy: { sequence: 'asc' } } }, orderBy: [{ createdAt: 'desc' }] });
    return reply.success({ items: items.map(serialize) });
  });

  fastify.post('/admin/vehicles/:vehicleId/maintenance-plans', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-maintenance-plans:manage')] }, async (request, reply) => {
    const { vehicleId } = validateOrThrow(vehicleParamSchema, request.params);
    const body = validateOrThrow(createPlanSchema, request.body);
    await assertVehicleOrganization(fastify, vehicleId, body.organizationId);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    const item = await fastify.prisma.vehicleMaintenancePlan.create({
      data: { organizationId: body.organizationId, vehicleId, name: body.name, status: body.status ?? 'ACTIVE', startDate: body.startDate, ...(body.description ? { description: body.description } : {}), ...(body.lastCompletedAt ? { lastCompletedAt: body.lastCompletedAt } : {}), ...(body.nextDueAt ? { nextDueAt: body.nextDueAt } : {}), ...(body.nextDueOdometer !== undefined ? { nextDueOdometer: body.nextDueOdometer } : {}) },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.vehicle_maintenance_plan.create', entityType: 'VehicleMaintenancePlan', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/vehicles/:vehicleId/maintenance-plans/:planId', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-maintenance-plans:read')] }, async (request, reply) => {
    const { vehicleId, planId } = validateOrThrow(vehiclePlanParamSchema, request.params);
    const item = await fastify.prisma.vehicleMaintenancePlan.findUnique({ where: { id: planId }, include: { tasks: { orderBy: { sequence: 'asc' } } } });
    if (!item || item.vehicleId !== vehicleId) throw new NotFoundError('Vehicle maintenance plan not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    const due = await evaluateMaintenanceDue(fastify, { organizationId: item.organizationId, vehicleId });
    return reply.success({ item: serialize(item), dueSummary: due.summary });
  });

  fastify.patch('/admin/vehicles/:vehicleId/maintenance-plans/:planId', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-maintenance-plans:manage')] }, async (request, reply) => {
    const { vehicleId, planId } = validateOrThrow(vehiclePlanParamSchema, request.params);
    const body = validateOrThrow(updatePlanSchema, request.body);
    const existing = await fastify.prisma.vehicleMaintenancePlan.findUnique({ where: { id: planId } });
    if (!existing || existing.vehicleId !== vehicleId) throw new NotFoundError('Vehicle maintenance plan not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.vehicleMaintenancePlan.update({ where: { id: planId }, data: body as Prisma.VehicleMaintenancePlanUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.vehicle_maintenance_plan.update', entityType: 'VehicleMaintenancePlan', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const action of ['activate', 'deactivate'] as const) {
    fastify.post(`/admin/vehicles/:vehicleId/maintenance-plans/:planId/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-maintenance-plans:manage')] }, async (request, reply) => {
      const { vehicleId, planId } = validateOrThrow(vehiclePlanParamSchema, request.params);
      const existing = await fastify.prisma.vehicleMaintenancePlan.findUnique({ where: { id: planId } });
      if (!existing || existing.vehicleId !== vehicleId) throw new NotFoundError('Vehicle maintenance plan not found');
      await fastify.requireOrganizationAccess(request, existing.organizationId);
      const item = await fastify.prisma.vehicleMaintenancePlan.update({ where: { id: planId }, data: { status: action === 'activate' ? 'ACTIVE' : 'INACTIVE' } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.vehicle_maintenance_plan.${action}`, entityType: 'VehicleMaintenancePlan', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }

  fastify.post('/admin/vehicles/:vehicleId/maintenance-plans/:planId/tasks', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-maintenance-plans:manage')] }, async (request, reply) => {
    const { vehicleId, planId } = validateOrThrow(vehiclePlanParamSchema, request.params);
    const body = validateOrThrow(createPlanTaskSchema, request.body);
    const plan = await fastify.prisma.vehicleMaintenancePlan.findUnique({ where: { id: planId } });
    if (!plan || plan.vehicleId !== vehicleId) throw new NotFoundError('Vehicle maintenance plan not found');
    await fastify.requireOrganizationAccess(request, plan.organizationId);
    if (body.maintenanceServiceTaskId) await assertServiceTaskOrganization(fastify, body.maintenanceServiceTaskId, plan.organizationId);
    const item = await fastify.prisma.vehicleMaintenancePlanTask.create({ data: { vehicleMaintenancePlanId: planId, ...body, status: body.status ?? 'ACTIVE', ...(body.estimatedCost !== undefined ? { estimatedCost: body.estimatedCost } : {}) } as Prisma.VehicleMaintenancePlanTaskUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.vehicle_maintenance_plan_task.create', entityType: 'VehicleMaintenancePlanTask', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.patch('/admin/vehicles/:vehicleId/maintenance-plans/:planId/tasks/:taskId', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-maintenance-plans:manage')] }, async (request, reply) => {
    const { vehicleId, planId, taskId } = validateOrThrow(vehiclePlanTaskParamSchema, request.params);
    const body = validateOrThrow(updatePlanTaskSchema, request.body);
    const plan = await fastify.prisma.vehicleMaintenancePlan.findUnique({ where: { id: planId } });
    if (!plan || plan.vehicleId !== vehicleId) throw new NotFoundError('Vehicle maintenance plan not found');
    await fastify.requireOrganizationAccess(request, plan.organizationId);
    if (body.maintenanceServiceTaskId) await assertServiceTaskOrganization(fastify, body.maintenanceServiceTaskId, plan.organizationId);
    const item = await fastify.prisma.vehicleMaintenancePlanTask.update({ where: { id: taskId }, data: body as Prisma.VehicleMaintenancePlanTaskUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.vehicle_maintenance_plan_task.update', entityType: 'VehicleMaintenancePlanTask', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.delete('/admin/vehicles/:vehicleId/maintenance-plans/:planId/tasks/:taskId', { preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-maintenance-plans:manage')] }, async (request, reply) => {
    const { vehicleId, planId, taskId } = validateOrThrow(vehiclePlanTaskParamSchema, request.params);
    const plan = await fastify.prisma.vehicleMaintenancePlan.findUnique({ where: { id: planId } });
    if (!plan || plan.vehicleId !== vehicleId) throw new NotFoundError('Vehicle maintenance plan not found');
    await fastify.requireOrganizationAccess(request, plan.organizationId);
    await fastify.prisma.vehicleMaintenancePlanTask.delete({ where: { id: taskId } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.vehicle_maintenance_plan_task.delete', entityType: 'VehicleMaintenancePlanTask', entityId: taskId });
    return reply.success({ deleted: true });
  });

  fastify.get('/admin/maintenance-requests', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-requests:read')] }, async (request, reply) => {
    const query = validateOrThrow(listRequestsQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}), ...(query.driverId ? { driverId: query.driverId } : {}), ...(query.status ? { status: query.status } : {}), ...(query.priority ? { priority: query.priority } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.maintenanceRequest.findMany({ where, skip, take, include: { vehicle: true, driver: true }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.maintenanceRequest.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/maintenance-requests', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-requests:manage')] }, async (request, reply) => {
    const body = validateOrThrow(requestBodySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    await assertVehicleOrganization(fastify, body.vehicleId, body.organizationId);
    await assertOptionalRelations(fastify, body.organizationId, { driverId: body.driverId });
    const item = await fastify.prisma.maintenanceRequest.create({ data: { ...body, status: body.status ?? 'REQUESTED', priority: body.priority ?? 'NORMAL', ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}) } as Prisma.MaintenanceRequestUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.maintenance_request.create', entityType: 'MaintenanceRequest', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/maintenance-requests/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-requests:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.maintenanceRequest.findUnique({ where: { id }, include: { vehicle: true, driver: true, workOrders: true } });
    if (!item) throw new NotFoundError('Maintenance request not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/maintenance-requests/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-requests:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateRequestSchema, request.body);
    const existing = await fastify.prisma.maintenanceRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Maintenance request not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    await assertOptionalRelations(fastify, existing.organizationId, { driverId: body.driverId });
    const item = await fastify.prisma.maintenanceRequest.update({ where: { id }, data: { ...body, ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.MaintenanceRequestUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.maintenance_request.update', entityType: 'MaintenanceRequest', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.post('/admin/maintenance-requests/:id/cancel', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-requests:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const existing = await fastify.prisma.maintenanceRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Maintenance request not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.maintenanceRequest.update({ where: { id }, data: { status: 'CANCELLED', canceledAt: new Date() } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.maintenance_request.cancel', entityType: 'MaintenanceRequest', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.get('/admin/maintenance-work-orders', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-work-orders:read')] }, async (request, reply) => {
    const query = validateOrThrow(listWorkOrdersQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}), ...(query.driverId ? { driverId: query.driverId } : {}), ...(query.vendorId ? { vendorId: query.vendorId } : {}), ...(query.status ? { status: query.status } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.maintenanceWorkOrder.findMany({ where, skip, take, include: { vehicle: true, driver: true, vendor: true, tasks: { orderBy: { sequence: 'asc' } } }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.maintenanceWorkOrder.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/maintenance-work-orders', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-work-orders:manage')] }, async (request, reply) => {
    const body = validateOrThrow(workOrderBodySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    await assertVehicleOrganization(fastify, body.vehicleId, body.organizationId);
    await assertOptionalRelations(fastify, body.organizationId, body);
    const item = await fastify.prisma.maintenanceWorkOrder.create({ data: { ...body, workOrderNumber: normalizeEntityCode(body.workOrderNumber), status: body.status ?? 'DRAFT', priority: body.priority ?? 'NORMAL', ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}) } as Prisma.MaintenanceWorkOrderUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.maintenance_work_order.create', entityType: 'MaintenanceWorkOrder', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/maintenance-work-orders/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-work-orders:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.maintenanceWorkOrder.findUnique({ where: { id }, include: { vehicle: true, driver: true, vendor: true, maintenanceRequest: true, inspectionChecklistTemplate: true, tasks: { orderBy: { sequence: 'asc' } } } });
    if (!item) throw new NotFoundError('Maintenance work order not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/maintenance-work-orders/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-work-orders:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateWorkOrderSchema, request.body);
    const existing = await fastify.prisma.maintenanceWorkOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Maintenance work order not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    await assertOptionalRelations(fastify, existing.organizationId, body);
    const item = await fastify.prisma.maintenanceWorkOrder.update({ where: { id }, data: { ...body, ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.MaintenanceWorkOrderUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.maintenance_work_order.update', entityType: 'MaintenanceWorkOrder', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.post('/admin/maintenance-work-orders/:id/cancel', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-work-orders:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const existing = await fastify.prisma.maintenanceWorkOrder.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Maintenance work order not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.maintenanceWorkOrder.update({ where: { id }, data: { status: 'CANCELLED', canceledAt: new Date() } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.maintenance_work_order.cancel', entityType: 'MaintenanceWorkOrder', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.post('/admin/maintenance-work-orders/:id/tasks', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-work-orders:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(workOrderTaskSchema, request.body);
    const workOrder = await fastify.prisma.maintenanceWorkOrder.findUnique({ where: { id } });
    if (!workOrder) throw new NotFoundError('Maintenance work order not found');
    await fastify.requireOrganizationAccess(request, workOrder.organizationId);
    if (body.maintenanceServiceTaskId) await assertServiceTaskOrganization(fastify, body.maintenanceServiceTaskId, workOrder.organizationId);
    const item = await fastify.prisma.maintenanceWorkOrderTask.create({ data: { maintenanceWorkOrderId: id, ...body, status: body.status ?? 'ACTIVE', ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}) } as Prisma.MaintenanceWorkOrderTaskUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.maintenance_work_order_task.create', entityType: 'MaintenanceWorkOrderTask', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.patch('/admin/maintenance-work-orders/:id/tasks/:taskId', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-work-orders:manage')] }, async (request, reply) => {
    const { id, taskId } = validateOrThrow(workOrderTaskParamSchema, request.params);
    const body = validateOrThrow(updateWorkOrderTaskSchema, request.body);
    const workOrder = await fastify.prisma.maintenanceWorkOrder.findUnique({ where: { id } });
    if (!workOrder) throw new NotFoundError('Maintenance work order not found');
    await fastify.requireOrganizationAccess(request, workOrder.organizationId);
    if (body.maintenanceServiceTaskId) await assertServiceTaskOrganization(fastify, body.maintenanceServiceTaskId, workOrder.organizationId);
    const item = await fastify.prisma.maintenanceWorkOrderTask.update({ where: { id: taskId }, data: { ...body, ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.MaintenanceWorkOrderTaskUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.maintenance_work_order_task.update', entityType: 'MaintenanceWorkOrderTask', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.delete('/admin/maintenance-work-orders/:id/tasks/:taskId', { preHandler: [fastify.authenticate, fastify.requirePermission('maintenance-work-orders:manage')] }, async (request, reply) => {
    const { id, taskId } = validateOrThrow(workOrderTaskParamSchema, request.params);
    const workOrder = await fastify.prisma.maintenanceWorkOrder.findUnique({ where: { id } });
    if (!workOrder) throw new NotFoundError('Maintenance work order not found');
    await fastify.requireOrganizationAccess(request, workOrder.organizationId);
    await fastify.prisma.maintenanceWorkOrderTask.delete({ where: { id: taskId } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.maintenance_work_order_task.delete', entityType: 'MaintenanceWorkOrderTask', entityId: taskId });
    return reply.success({ deleted: true });
  });
};
