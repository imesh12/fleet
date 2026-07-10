import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { evaluateFuelAlerts } from '../../../lib/fuel-alerts.js';
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
const idParamSchema = z.object({ id: z.string().min(1) });
const ruleParamSchema = z.object({ id: z.string().min(1), ruleId: z.string().min(1) });
const statusSchema = masterDataStatusSchema;
const fuelUnitSchema = z.enum(['LITER', 'GALLON', 'KWH']);
const fuelCardStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED', 'ARCHIVED']);
const fuelTankStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);
const fuelPolicyStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);
const fuelRequestStatusSchema = z.enum(['DRAFT', 'REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'FULFILLED_PLACEHOLDER']);
const fuelEntryStatusSchema = z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED', 'ARCHIVED']);

const listOrgQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: statusSchema.optional(),
});

const fuelTypeBodySchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  description: z.string().trim().optional(),
  status: statusSchema.default('ACTIVE'),
});

const updateFuelTypeSchema = fuelTypeBodySchema.omit({ organizationId: true, status: true }).partial().extend({
  description: z.string().trim().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be supplied' });

const vendorProfileBodySchema = z.object({
  organizationId: z.string().min(1),
  vendorId: z.string().min(1),
  stationName: z.string().trim().min(1),
  stationCode: z.string().trim().optional(),
  address: z.string().trim().optional(),
  contactName: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  contactEmail: z.string().email().optional(),
  metadata: jsonRecordSchema.optional(),
  status: statusSchema.default('ACTIVE'),
});

const updateVendorProfileSchema = vendorProfileBodySchema.omit({ organizationId: true, status: true }).partial().extend({
  stationCode: z.string().trim().nullable().optional(),
  address: z.string().trim().nullable().optional(),
  contactName: z.string().trim().nullable().optional(),
  contactPhone: z.string().trim().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  metadata: jsonRecordSchema.nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be supplied' });

const fuelCardBodySchema = z.object({
  organizationId: z.string().min(1),
  vehicleId: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(),
  cardNumberMasked: z.string().trim().min(1),
  providerName: z.string().trim().min(1),
  status: fuelCardStatusSchema.default('ACTIVE'),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  limitAmount: z.coerce.number().nonnegative().optional(),
  notes: z.string().trim().optional(),
});

const updateFuelCardSchema = fuelCardBodySchema.omit({ organizationId: true }).partial().extend({
  vehicleId: z.string().min(1).nullable().optional(),
  driverId: z.string().min(1).nullable().optional(),
  issueDate: z.coerce.date().nullable().optional(),
  expiryDate: z.coerce.date().nullable().optional(),
  limitAmount: z.coerce.number().nonnegative().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be supplied' });

const fuelTankBodySchema = z.object({
  organizationId: z.string().min(1),
  customerLocationId: z.string().min(1).optional(),
  fuelTypeId: z.string().min(1),
  name: z.string().trim().min(1),
  capacity: z.coerce.number().positive(),
  currentLevel: z.coerce.number().nonnegative().optional(),
  unit: fuelUnitSchema.default('LITER'),
  status: fuelTankStatusSchema.default('ACTIVE'),
});

const updateFuelTankSchema = fuelTankBodySchema.omit({ organizationId: true }).partial().extend({
  customerLocationId: z.string().min(1).nullable().optional(),
  currentLevel: z.coerce.number().nonnegative().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be supplied' });

const updateTankLevelSchema = z.object({ currentLevel: z.coerce.number().nonnegative() });

const fuelPolicyBodySchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  description: z.string().trim().optional(),
  status: fuelPolicyStatusSchema.default('ACTIVE'),
});

const updateFuelPolicySchema = fuelPolicyBodySchema.omit({ organizationId: true, status: true }).partial().extend({
  description: z.string().trim().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be supplied' });

const fuelPolicyRuleBodySchema = z.object({
  fuelTypeId: z.string().min(1).optional(),
  ruleCode: z.string().trim().min(1),
  description: z.string().trim().optional(),
  value: jsonRecordSchema.optional(),
  sequence: z.coerce.number().int().min(0).default(0),
  status: statusSchema.default('ACTIVE'),
});

const updateFuelPolicyRuleSchema = fuelPolicyRuleBodySchema.partial().extend({
  fuelTypeId: z.string().min(1).nullable().optional(),
  description: z.string().trim().nullable().optional(),
  value: jsonRecordSchema.nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one rule field must be supplied' });

const fuelRequestBodySchema = z.object({
  organizationId: z.string().min(1),
  vehicleId: z.string().min(1),
  driverId: z.string().min(1).optional(),
  fuelTypeId: z.string().min(1),
  fuelVendorProfileId: z.string().min(1).optional(),
  fuelCardId: z.string().min(1).optional(),
  requestedQuantity: z.coerce.number().positive().optional(),
  unit: fuelUnitSchema.default('LITER'),
  estimatedAmount: z.coerce.number().nonnegative().optional(),
  requestedAt: z.coerce.date().optional(),
  status: fuelRequestStatusSchema.default('REQUESTED'),
  notes: z.string().trim().optional(),
  metadata: jsonRecordSchema.optional(),
});

const updateFuelRequestSchema = fuelRequestBodySchema.omit({ organizationId: true, vehicleId: true }).partial().extend({
  driverId: z.string().min(1).nullable().optional(),
  fuelVendorProfileId: z.string().min(1).nullable().optional(),
  fuelCardId: z.string().min(1).nullable().optional(),
  requestedQuantity: z.coerce.number().positive().nullable().optional(),
  estimatedAmount: z.coerce.number().nonnegative().nullable().optional(),
  requestedAt: z.coerce.date().optional(),
  notes: z.string().trim().nullable().optional(),
  metadata: jsonRecordSchema.nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one request field must be supplied' });

const fuelEntryBodySchema = z.object({
  organizationId: z.string().min(1),
  vehicleId: z.string().min(1),
  driverId: z.string().min(1).optional(),
  fuelTypeId: z.string().min(1),
  fuelVendorProfileId: z.string().min(1).optional(),
  fuelCardId: z.string().min(1).optional(),
  fuelTankId: z.string().min(1).optional(),
  fuelRequestId: z.string().min(1).optional(),
  quantity: z.coerce.number().positive(),
  unit: fuelUnitSchema.default('LITER'),
  unitPrice: z.coerce.number().nonnegative().optional(),
  totalAmount: z.coerce.number().nonnegative().optional(),
  odometer: z.coerce.number().int().nonnegative().optional(),
  filledAt: z.coerce.date(),
  receiptFileName: z.string().trim().optional(),
  receiptFileUrl: z.string().trim().optional(),
  receiptMimeType: z.string().trim().optional(),
  receiptSizeBytes: z.coerce.number().int().nonnegative().optional(),
  status: fuelEntryStatusSchema.default('SUBMITTED'),
  notes: z.string().trim().optional(),
  metadata: jsonRecordSchema.optional(),
});

const updateFuelEntrySchema = fuelEntryBodySchema.omit({ organizationId: true, vehicleId: true, quantity: true, filledAt: true }).partial().extend({
  driverId: z.string().min(1).nullable().optional(),
  fuelVendorProfileId: z.string().min(1).nullable().optional(),
  fuelCardId: z.string().min(1).nullable().optional(),
  fuelTankId: z.string().min(1).nullable().optional(),
  fuelRequestId: z.string().min(1).nullable().optional(),
  quantity: z.coerce.number().positive().optional(),
  filledAt: z.coerce.date().optional(),
  unitPrice: z.coerce.number().nonnegative().nullable().optional(),
  totalAmount: z.coerce.number().nonnegative().nullable().optional(),
  odometer: z.coerce.number().int().nonnegative().nullable().optional(),
  receiptFileName: z.string().trim().nullable().optional(),
  receiptFileUrl: z.string().trim().nullable().optional(),
  receiptMimeType: z.string().trim().nullable().optional(),
  receiptSizeBytes: z.coerce.number().int().nonnegative().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
  metadata: jsonRecordSchema.nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one entry field must be supplied' });

const listCardsQuerySchema = listOrgQuerySchema.extend({
  vehicleId: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(),
  status: fuelCardStatusSchema.optional(),
});

const listFuelOperationsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(),
  fuelTypeId: z.string().min(1).optional(),
  status: z.string().optional(),
});

const alertQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  daysAhead: z.coerce.number().int().positive().max(365).optional(),
  lowTankPercent: z.coerce.number().positive().max(100).optional(),
  createNotifications: z.coerce.boolean().optional(),
  notificationProviderId: z.string().min(1).optional(),
  notificationRecipient: z.string().trim().optional(),
});

function serialize(item: Record<string, unknown>) {
  return item;
}

function scopedWhere(request: any, requestedOrganizationId?: string) {
  const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
  return !isSuperAdmin && !requestedOrganizationId
    ? { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } }
    : {};
}

async function assertFuelTypeOrg(fastify: Parameters<FastifyPluginAsync>[0], id: string, organizationId: string) {
  const item = await fastify.prisma.fuelType.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Fuel type not found');
  if (item.organizationId !== organizationId) throw new ConflictError('Fuel type must belong to the same organization');
}

async function assertFuelVendorProfileOrg(fastify: Parameters<FastifyPluginAsync>[0], id: string, organizationId: string) {
  const item = await fastify.prisma.fuelVendorProfile.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Fuel vendor profile not found');
  if (item.organizationId !== organizationId) throw new ConflictError('Fuel vendor profile must belong to the same organization');
}

async function assertFuelCardOrg(fastify: Parameters<FastifyPluginAsync>[0], id: string, organizationId: string) {
  const item = await fastify.prisma.fuelCard.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Fuel card not found');
  if (item.organizationId !== organizationId) throw new ConflictError('Fuel card must belong to the same organization');
}

async function assertFuelTankOrg(fastify: Parameters<FastifyPluginAsync>[0], id: string, organizationId: string) {
  const item = await fastify.prisma.fuelTank.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Fuel tank not found');
  if (item.organizationId !== organizationId) throw new ConflictError('Fuel tank must belong to the same organization');
}

async function assertFuelRequestOrg(fastify: Parameters<FastifyPluginAsync>[0], id: string, organizationId: string) {
  const item = await fastify.prisma.fuelRequest.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Fuel request not found');
  if (item.organizationId !== organizationId) throw new ConflictError('Fuel request must belong to the same organization');
}

async function assertCustomerLocationOrg(fastify: Parameters<FastifyPluginAsync>[0], id: string, organizationId: string) {
  const item = await fastify.prisma.customerLocation.findUnique({ where: { id }, include: { customerAccount: true } });
  if (!item) throw new NotFoundError('Customer location not found');
  if (item.customerAccount.organizationId !== organizationId) throw new ConflictError('Customer location must belong to the same organization');
}

async function assertFuelRelations(fastify: Parameters<FastifyPluginAsync>[0], organizationId: string, input: {
  vehicleId?: string | null | undefined;
  driverId?: string | null | undefined;
  vendorId?: string | null | undefined;
  fuelTypeId?: string | null | undefined;
  fuelVendorProfileId?: string | null | undefined;
  fuelCardId?: string | null | undefined;
  fuelTankId?: string | null | undefined;
  fuelRequestId?: string | null | undefined;
  customerLocationId?: string | null | undefined;
}) {
  if (input.vehicleId) {
    const vehicle = await findVehicleOrThrow(fastify.prisma, input.vehicleId);
    if (vehicle.organizationId !== organizationId) throw new ConflictError('Vehicle must belong to the same organization');
  }
  if (input.driverId) {
    const driver = await findDriverOrThrow(fastify.prisma, input.driverId);
    if (driver.organizationId !== organizationId) throw new ConflictError('Driver must belong to the same organization');
  }
  if (input.vendorId) {
    const vendor = await findVendorOrThrow(fastify.prisma, input.vendorId);
    if (vendor.organizationId !== organizationId) throw new ConflictError('Vendor must belong to the same organization');
  }
  if (input.fuelTypeId) await assertFuelTypeOrg(fastify, input.fuelTypeId, organizationId);
  if (input.fuelVendorProfileId) await assertFuelVendorProfileOrg(fastify, input.fuelVendorProfileId, organizationId);
  if (input.fuelCardId) await assertFuelCardOrg(fastify, input.fuelCardId, organizationId);
  if (input.fuelTankId) await assertFuelTankOrg(fastify, input.fuelTankId, organizationId);
  if (input.fuelRequestId) await assertFuelRequestOrg(fastify, input.fuelRequestId, organizationId);
  if (input.customerLocationId) await assertCustomerLocationOrg(fastify, input.customerLocationId, organizationId);
}

export const adminFuelRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/fuel/alerts', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-alerts:read')] }, async (request, reply) => {
    const query = validateOrThrow(alertQuerySchema, request.query);
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const result = await evaluateFuelAlerts(fastify, {
      ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
      ...(query.daysAhead ? { daysAhead: query.daysAhead } : {}),
      ...(query.lowTankPercent ? { lowTankPercent: query.lowTankPercent } : {}),
      createNotifications: query.createNotifications === true,
      ...(query.notificationProviderId ? { notificationProviderId: query.notificationProviderId } : {}),
      ...(query.notificationRecipient ? { notificationRecipient: query.notificationRecipient } : {}),
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_alert.read', entityType: 'FuelAlert', entityId: requestedOrganizationId ?? 'global' });
    return reply.success(result);
  });

  fastify.get('/admin/fuel-types', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-types:read')] }, async (request, reply) => {
    const query = validateOrThrow(listOrgQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.status ? { status: query.status } : {}), ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }, { code: { contains: query.search, mode: 'insensitive' as const } }] } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.fuelType.findMany({ where, skip, take, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.fuelType.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/fuel-types', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-types:manage')] }, async (request, reply) => {
    const body = validateOrThrow(fuelTypeBodySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    const item = await fastify.prisma.fuelType.create({ data: { organizationId: body.organizationId, name: body.name, code: normalizeEntityCode(body.code), status: body.status ?? 'ACTIVE', ...(body.description ? { description: body.description } : {}) } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_type.create', entityType: 'FuelType', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/fuel-types/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-types:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.fuelType.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Fuel type not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/fuel-types/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-types:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateFuelTypeSchema, request.body);
    const existing = await fastify.prisma.fuelType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Fuel type not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.fuelType.update({ where: { id }, data: { ...(body.name ? { name: body.name } : {}), ...(body.code ? { code: normalizeEntityCode(body.code) } : {}), ...(body.description !== undefined ? { description: body.description ?? null } : {}) } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_type.update', entityType: 'FuelType', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const action of ['activate', 'deactivate'] as const) {
    fastify.post(`/admin/fuel-types/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-types:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.fuelType.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Fuel type not found');
      await fastify.requireOrganizationAccess(request, existing.organizationId);
      const item = await fastify.prisma.fuelType.update({ where: { id }, data: { status: action === 'activate' ? 'ACTIVE' : 'INACTIVE' } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.fuel_type.${action}`, entityType: 'FuelType', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }

  fastify.get('/admin/fuel-vendor-profiles', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-vendor-profiles:read')] }, async (request, reply) => {
    const query = validateOrThrow(listOrgQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.status ? { status: query.status } : {}), ...(query.search ? { OR: [{ stationName: { contains: query.search, mode: 'insensitive' as const } }, { stationCode: { contains: query.search, mode: 'insensitive' as const } }] } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.fuelVendorProfile.findMany({ where, skip, take, include: { vendor: true }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.fuelVendorProfile.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/fuel-vendor-profiles', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-vendor-profiles:manage')] }, async (request, reply) => {
    const body = validateOrThrow(vendorProfileBodySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    await assertFuelRelations(fastify, body.organizationId, { vendorId: body.vendorId });
    const item = await fastify.prisma.fuelVendorProfile.create({ data: { ...body, status: body.status ?? 'ACTIVE', ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}) } as Prisma.FuelVendorProfileUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_vendor_profile.create', entityType: 'FuelVendorProfile', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/fuel-vendor-profiles/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-vendor-profiles:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.fuelVendorProfile.findUnique({ where: { id }, include: { vendor: true } });
    if (!item) throw new NotFoundError('Fuel vendor profile not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/fuel-vendor-profiles/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-vendor-profiles:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateVendorProfileSchema, request.body);
    const existing = await fastify.prisma.fuelVendorProfile.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Fuel vendor profile not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    await assertFuelRelations(fastify, existing.organizationId, { vendorId: body.vendorId });
    const item = await fastify.prisma.fuelVendorProfile.update({ where: { id }, data: { ...body, ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.FuelVendorProfileUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_vendor_profile.update', entityType: 'FuelVendorProfile', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const action of ['activate', 'deactivate'] as const) {
    fastify.post(`/admin/fuel-vendor-profiles/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-vendor-profiles:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.fuelVendorProfile.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Fuel vendor profile not found');
      await fastify.requireOrganizationAccess(request, existing.organizationId);
      const item = await fastify.prisma.fuelVendorProfile.update({ where: { id }, data: { status: action === 'activate' ? 'ACTIVE' : 'INACTIVE' } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.fuel_vendor_profile.${action}`, entityType: 'FuelVendorProfile', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }

  fastify.get('/admin/fuel-cards', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-cards:read')] }, async (request, reply) => {
    const query = validateOrThrow(listCardsQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.status ? { status: query.status } : {}), ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}), ...(query.driverId ? { driverId: query.driverId } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.fuelCard.findMany({ where, skip, take, include: { vehicle: true, driver: true }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.fuelCard.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/fuel-cards', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-cards:manage')] }, async (request, reply) => {
    const body = validateOrThrow(fuelCardBodySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    await assertFuelRelations(fastify, body.organizationId, body);
    const item = await fastify.prisma.fuelCard.create({ data: { ...body, status: body.status ?? 'ACTIVE' } as Prisma.FuelCardUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_card.create', entityType: 'FuelCard', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/fuel-cards/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-cards:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.fuelCard.findUnique({ where: { id }, include: { vehicle: true, driver: true } });
    if (!item) throw new NotFoundError('Fuel card not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/fuel-cards/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-cards:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateFuelCardSchema, request.body);
    const existing = await fastify.prisma.fuelCard.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Fuel card not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    await assertFuelRelations(fastify, existing.organizationId, body);
    const item = await fastify.prisma.fuelCard.update({ where: { id }, data: body as Prisma.FuelCardUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_card.update', entityType: 'FuelCard', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const [action, status] of Object.entries({ activate: 'ACTIVE', deactivate: 'INACTIVE', block: 'BLOCKED', archive: 'ARCHIVED' }) as Array<[string, 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'ARCHIVED']>) {
    fastify.post(`/admin/fuel-cards/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-cards:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.fuelCard.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Fuel card not found');
      await fastify.requireOrganizationAccess(request, existing.organizationId);
      const item = await fastify.prisma.fuelCard.update({ where: { id }, data: { status } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.fuel_card.${action}`, entityType: 'FuelCard', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }

  fastify.get('/admin/fuel-tanks', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-tanks:read')] }, async (request, reply) => {
    const query = validateOrThrow(listOrgQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.status ? { status: query.status as 'ACTIVE' | 'INACTIVE' } : {}), ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.fuelTank.findMany({ where, skip, take, include: { fuelType: true, customerLocation: true }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.fuelTank.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/fuel-tanks', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-tanks:manage')] }, async (request, reply) => {
    const body = validateOrThrow(fuelTankBodySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    await assertFuelRelations(fastify, body.organizationId, body);
    const item = await fastify.prisma.fuelTank.create({ data: { ...body, status: body.status ?? 'ACTIVE', unit: body.unit ?? 'LITER' } as Prisma.FuelTankUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_tank.create', entityType: 'FuelTank', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/fuel-tanks/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-tanks:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.fuelTank.findUnique({ where: { id }, include: { fuelType: true, customerLocation: true } });
    if (!item) throw new NotFoundError('Fuel tank not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/fuel-tanks/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-tanks:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateFuelTankSchema, request.body);
    const existing = await fastify.prisma.fuelTank.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Fuel tank not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    await assertFuelRelations(fastify, existing.organizationId, body);
    const item = await fastify.prisma.fuelTank.update({ where: { id }, data: body as Prisma.FuelTankUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_tank.update', entityType: 'FuelTank', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.post('/admin/fuel-tanks/:id/update-level', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-tanks:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateTankLevelSchema, request.body);
    const existing = await fastify.prisma.fuelTank.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Fuel tank not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.fuelTank.update({ where: { id }, data: { currentLevel: body.currentLevel } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_tank.update_level', entityType: 'FuelTank', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const action of ['activate', 'deactivate'] as const) {
    fastify.post(`/admin/fuel-tanks/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-tanks:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.fuelTank.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Fuel tank not found');
      await fastify.requireOrganizationAccess(request, existing.organizationId);
      const item = await fastify.prisma.fuelTank.update({ where: { id }, data: { status: action === 'activate' ? 'ACTIVE' : 'INACTIVE' } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.fuel_tank.${action}`, entityType: 'FuelTank', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }

  fastify.get('/admin/fuel-policies', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-policies:read')] }, async (request, reply) => {
    const query = validateOrThrow(listOrgQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.status ? { status: query.status as 'ACTIVE' | 'INACTIVE' } : {}), ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }, { code: { contains: query.search, mode: 'insensitive' as const } }] } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.fuelPolicy.findMany({ where, skip, take, include: { rules: { orderBy: { sequence: 'asc' } } }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.fuelPolicy.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/fuel-policies', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-policies:manage')] }, async (request, reply) => {
    const body = validateOrThrow(fuelPolicyBodySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    const item = await fastify.prisma.fuelPolicy.create({ data: { organizationId: body.organizationId, name: body.name, code: normalizeEntityCode(body.code), status: body.status ?? 'ACTIVE', ...(body.description ? { description: body.description } : {}) } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_policy.create', entityType: 'FuelPolicy', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/fuel-policies/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-policies:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.fuelPolicy.findUnique({ where: { id }, include: { rules: { orderBy: { sequence: 'asc' } } } });
    if (!item) throw new NotFoundError('Fuel policy not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/fuel-policies/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-policies:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateFuelPolicySchema, request.body);
    const existing = await fastify.prisma.fuelPolicy.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Fuel policy not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.fuelPolicy.update({ where: { id }, data: { ...(body.name ? { name: body.name } : {}), ...(body.code ? { code: normalizeEntityCode(body.code) } : {}), ...(body.description !== undefined ? { description: body.description ?? null } : {}) } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_policy.update', entityType: 'FuelPolicy', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const action of ['activate', 'deactivate'] as const) {
    fastify.post(`/admin/fuel-policies/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-policies:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.fuelPolicy.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Fuel policy not found');
      await fastify.requireOrganizationAccess(request, existing.organizationId);
      const item = await fastify.prisma.fuelPolicy.update({ where: { id }, data: { status: action === 'activate' ? 'ACTIVE' : 'INACTIVE' } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.fuel_policy.${action}`, entityType: 'FuelPolicy', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }

  fastify.post('/admin/fuel-policies/:id/rules', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-policies:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(fuelPolicyRuleBodySchema, request.body);
    const policy = await fastify.prisma.fuelPolicy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundError('Fuel policy not found');
    await fastify.requireOrganizationAccess(request, policy.organizationId);
    if (body.fuelTypeId) await assertFuelTypeOrg(fastify, body.fuelTypeId, policy.organizationId);
    const item = await fastify.prisma.fuelPolicyRule.create({ data: { fuelPolicyId: id, ...body, status: body.status ?? 'ACTIVE', sequence: body.sequence ?? 0, ...(body.value ? { value: body.value as Prisma.InputJsonValue } : {}) } as Prisma.FuelPolicyRuleUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_policy_rule.create', entityType: 'FuelPolicyRule', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.patch('/admin/fuel-policies/:id/rules/:ruleId', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-policies:manage')] }, async (request, reply) => {
    const { id, ruleId } = validateOrThrow(ruleParamSchema, request.params);
    const body = validateOrThrow(updateFuelPolicyRuleSchema, request.body);
    const policy = await fastify.prisma.fuelPolicy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundError('Fuel policy not found');
    await fastify.requireOrganizationAccess(request, policy.organizationId);
    if (body.fuelTypeId) await assertFuelTypeOrg(fastify, body.fuelTypeId, policy.organizationId);
    const item = await fastify.prisma.fuelPolicyRule.update({ where: { id: ruleId }, data: { ...body, ...(body.value !== undefined ? { value: body.value === null ? Prisma.JsonNull : (body.value as Prisma.InputJsonValue) } : {}) } as Prisma.FuelPolicyRuleUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_policy_rule.update', entityType: 'FuelPolicyRule', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.delete('/admin/fuel-policies/:id/rules/:ruleId', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-policies:manage')] }, async (request, reply) => {
    const { id, ruleId } = validateOrThrow(ruleParamSchema, request.params);
    const policy = await fastify.prisma.fuelPolicy.findUnique({ where: { id } });
    if (!policy) throw new NotFoundError('Fuel policy not found');
    await fastify.requireOrganizationAccess(request, policy.organizationId);
    await fastify.prisma.fuelPolicyRule.delete({ where: { id: ruleId } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_policy_rule.delete', entityType: 'FuelPolicyRule', entityId: ruleId });
    return reply.success({ deleted: true });
  });

  fastify.get('/admin/fuel-requests', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-requests:read')] }, async (request, reply) => {
    const query = validateOrThrow(listFuelOperationsQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}), ...(query.driverId ? { driverId: query.driverId } : {}), ...(query.fuelTypeId ? { fuelTypeId: query.fuelTypeId } : {}), ...(query.status ? { status: query.status as any } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.fuelRequest.findMany({ where, skip, take, include: { vehicle: true, driver: true, fuelType: true, fuelVendorProfile: true, fuelCard: true }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.fuelRequest.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/fuel-requests', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-requests:manage')] }, async (request, reply) => {
    const body = validateOrThrow(fuelRequestBodySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    await assertFuelRelations(fastify, body.organizationId, body);
    const item = await fastify.prisma.fuelRequest.create({ data: { ...body, status: body.status ?? 'REQUESTED', unit: body.unit ?? 'LITER', ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}) } as Prisma.FuelRequestUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_request.create', entityType: 'FuelRequest', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/fuel-requests/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-requests:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.fuelRequest.findUnique({ where: { id }, include: { vehicle: true, driver: true, fuelType: true, fuelVendorProfile: true, fuelCard: true, fuelEntries: true } });
    if (!item) throw new NotFoundError('Fuel request not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/fuel-requests/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-requests:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateFuelRequestSchema, request.body);
    const existing = await fastify.prisma.fuelRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Fuel request not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    await assertFuelRelations(fastify, existing.organizationId, body);
    const item = await fastify.prisma.fuelRequest.update({ where: { id }, data: { ...body, ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.FuelRequestUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_request.update', entityType: 'FuelRequest', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const [action, status] of Object.entries({ approve: 'APPROVED', reject: 'REJECTED', cancel: 'CANCELLED', fulfill: 'FULFILLED_PLACEHOLDER' }) as Array<[string, 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'FULFILLED_PLACEHOLDER']>) {
    fastify.post(`/admin/fuel-requests/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-requests:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.fuelRequest.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Fuel request not found');
      await fastify.requireOrganizationAccess(request, existing.organizationId);
      const item = await fastify.prisma.fuelRequest.update({ where: { id }, data: { status } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.fuel_request.${action}`, entityType: 'FuelRequest', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }

  fastify.get('/admin/fuel-entries', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-entries:read')] }, async (request, reply) => {
    const query = validateOrThrow(listFuelOperationsQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}), ...(query.driverId ? { driverId: query.driverId } : {}), ...(query.fuelTypeId ? { fuelTypeId: query.fuelTypeId } : {}), ...(query.status ? { status: query.status as any } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.fuelEntry.findMany({ where, skip, take, include: { vehicle: true, driver: true, fuelType: true, fuelVendorProfile: true, fuelCard: true, fuelTank: true, fuelRequest: true }, orderBy: [{ filledAt: 'desc' }] }),
      fastify.prisma.fuelEntry.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/fuel-entries', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-entries:manage')] }, async (request, reply) => {
    const body = validateOrThrow(fuelEntryBodySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    await assertFuelRelations(fastify, body.organizationId, body);
    const item = await fastify.prisma.fuelEntry.create({ data: { ...body, status: body.status ?? 'SUBMITTED', unit: body.unit ?? 'LITER', ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}) } as Prisma.FuelEntryUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_entry.create', entityType: 'FuelEntry', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/fuel-entries/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-entries:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.fuelEntry.findUnique({ where: { id }, include: { vehicle: true, driver: true, fuelType: true, fuelVendorProfile: true, fuelCard: true, fuelTank: true, fuelRequest: true } });
    if (!item) throw new NotFoundError('Fuel entry not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/fuel-entries/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-entries:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateFuelEntrySchema, request.body);
    const existing = await fastify.prisma.fuelEntry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Fuel entry not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    await assertFuelRelations(fastify, existing.organizationId, body);
    const item = await fastify.prisma.fuelEntry.update({ where: { id }, data: { ...body, ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.FuelEntryUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fuel_entry.update', entityType: 'FuelEntry', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const [action, status] of Object.entries({ approve: 'APPROVED', reject: 'REJECTED', cancel: 'CANCELLED', archive: 'ARCHIVED' }) as Array<[string, 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ARCHIVED']>) {
    fastify.post(`/admin/fuel-entries/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('fuel-entries:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.fuelEntry.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Fuel entry not found');
      await fastify.requireOrganizationAccess(request, existing.organizationId);
      const item = await fastify.prisma.fuelEntry.update({ where: { id }, data: { status } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.fuel_entry.${action}`, entityType: 'FuelEntry', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }
};
