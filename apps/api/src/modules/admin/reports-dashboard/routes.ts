import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { buildDashboardSummary, runReportPlaceholder } from '../../../lib/reports-dashboard.js';
import { buildPaginationMeta } from '../../../lib/response.js';
import { getAuditContext, getPagination, masterDataStatusSchema, normalizeEntityCode, paginationQuerySchema } from '../utils.js';

const jsonRecordSchema = z.record(z.string(), z.unknown());
const idParamSchema = z.object({ id: z.string().min(1) });
const reportTypeSchema = z.enum(['VEHICLE_SUMMARY', 'DRIVER_SUMMARY', 'TRIP_SUMMARY', 'MAINTENANCE_SUMMARY', 'FUEL_SUMMARY', 'TRACKING_HEALTH_SUMMARY', 'ALERT_SUMMARY', 'CUSTOM']);
const exportFormatSchema = z.enum(['CSV', 'EXCEL_PLACEHOLDER', 'PDF_PLACEHOLDER', 'JSON']);
const widgetTypeSchema = reportTypeSchema;

const listOrgQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const categoryBodySchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateCategorySchema = categoryBodySchema.omit({ organizationId: true, status: true }).partial().extend({
  description: z.string().trim().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be supplied' });

const definitionBodySchema = z.object({
  organizationId: z.string().min(1),
  categoryId: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  reportType: reportTypeSchema,
  description: z.string().trim().optional(),
  queryConfig: jsonRecordSchema.optional(),
  defaultFilters: jsonRecordSchema.optional(),
  columns: z.array(z.record(z.string(), z.unknown())).optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateDefinitionSchema = definitionBodySchema.omit({ organizationId: true, status: true }).partial().extend({
  categoryId: z.string().min(1).nullable().optional(),
  description: z.string().trim().nullable().optional(),
  queryConfig: jsonRecordSchema.nullable().optional(),
  defaultFilters: jsonRecordSchema.nullable().optional(),
  columns: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be supplied' });

const presetBodySchema = z.object({
  organizationId: z.string().min(1),
  reportDefinitionId: z.string().min(1),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  filters: jsonRecordSchema,
  isDefault: z.boolean().default(false),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updatePresetSchema = presetBodySchema.omit({ organizationId: true, status: true }).partial().extend({
  filters: jsonRecordSchema.optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one preset field must be supplied' });

const runBodySchema = z.object({
  organizationId: z.string().min(1),
  reportDefinitionId: z.string().min(1).optional(),
  filters: jsonRecordSchema.optional(),
  metadata: jsonRecordSchema.optional(),
});

const exportBodySchema = z.object({
  organizationId: z.string().min(1),
  reportDefinitionId: z.string().min(1).optional(),
  reportRunId: z.string().min(1).optional(),
  format: exportFormatSchema,
  fileName: z.string().trim().optional(),
  metadata: jsonRecordSchema.optional(),
});

const widgetBodySchema = z.object({
  organizationId: z.string().min(1),
  reportDefinitionId: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  widgetType: widgetTypeSchema,
  config: jsonRecordSchema.optional(),
  position: z.coerce.number().int().min(0).default(0),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateWidgetSchema = widgetBodySchema.omit({ organizationId: true, status: true }).partial().extend({
  reportDefinitionId: z.string().min(1).nullable().optional(),
  config: jsonRecordSchema.nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one widget field must be supplied' });

const summaryQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  persistSnapshot: z.coerce.boolean().optional(),
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

async function assertCategoryOrg(fastify: Parameters<FastifyPluginAsync>[0], id: string, organizationId: string) {
  const item = await fastify.prisma.reportCategory.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Report category not found');
  if (item.organizationId !== organizationId) throw new ConflictError('Report category must belong to the same organization');
}

async function assertDefinitionOrg(fastify: Parameters<FastifyPluginAsync>[0], id: string, organizationId: string) {
  const item = await fastify.prisma.reportDefinition.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Report definition not found');
  if (item.organizationId !== organizationId) throw new ConflictError('Report definition must belong to the same organization');
}

async function assertRunOrg(fastify: Parameters<FastifyPluginAsync>[0], id: string, organizationId: string) {
  const item = await fastify.prisma.reportRun.findUnique({ where: { id } });
  if (!item) throw new NotFoundError('Report run not found');
  if (item.organizationId !== organizationId) throw new ConflictError('Report run must belong to the same organization');
}

export const adminReportsDashboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/report-categories', { preHandler: [fastify.authenticate, fastify.requirePermission('reports:read')] }, async (request, reply) => {
    const query = validateOrThrow(listOrgQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.status ? { status: query.status } : {}), ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }, { code: { contains: query.search, mode: 'insensitive' as const } }] } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.reportCategory.findMany({ where, skip, take, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.reportCategory.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/report-categories', { preHandler: [fastify.authenticate, fastify.requirePermission('reports:manage')] }, async (request, reply) => {
    const body = validateOrThrow(categoryBodySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    const item = await fastify.prisma.reportCategory.create({ data: { organizationId: body.organizationId, name: body.name, code: normalizeEntityCode(body.code), status: body.status ?? 'ACTIVE', ...(body.description ? { description: body.description } : {}) } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.report.category.create', entityType: 'ReportCategory', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/report-categories/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('reports:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.reportCategory.findUnique({ where: { id }, include: { reports: true } });
    if (!item) throw new NotFoundError('Report category not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/report-categories/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('reports:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateCategorySchema, request.body);
    const existing = await fastify.prisma.reportCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Report category not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.reportCategory.update({ where: { id }, data: { ...(body.name ? { name: body.name } : {}), ...(body.code ? { code: normalizeEntityCode(body.code) } : {}), ...(body.description !== undefined ? { description: body.description ?? null } : {}) } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.report.category.update', entityType: 'ReportCategory', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.get('/admin/report-definitions', { preHandler: [fastify.authenticate, fastify.requirePermission('reports:read')] }, async (request, reply) => {
    const query = validateOrThrow(listOrgQuerySchema.extend({ reportType: reportTypeSchema.optional() }), request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.status ? { status: query.status } : {}), ...(query.reportType ? { reportType: query.reportType } : {}), ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }, { code: { contains: query.search, mode: 'insensitive' as const } }] } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.reportDefinition.findMany({ where, skip, take, include: { category: true }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.reportDefinition.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/report-definitions', { preHandler: [fastify.authenticate, fastify.requirePermission('reports:manage')] }, async (request, reply) => {
    const body = validateOrThrow(definitionBodySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    if (body.categoryId) await assertCategoryOrg(fastify, body.categoryId, body.organizationId);
    const item = await fastify.prisma.reportDefinition.create({ data: { ...body, code: normalizeEntityCode(body.code), status: body.status ?? 'ACTIVE', ...(body.queryConfig ? { queryConfig: body.queryConfig as Prisma.InputJsonValue } : {}), ...(body.defaultFilters ? { defaultFilters: body.defaultFilters as Prisma.InputJsonValue } : {}), ...(body.columns ? { columns: body.columns as Prisma.InputJsonValue } : {}) } as Prisma.ReportDefinitionUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.report.definition.create', entityType: 'ReportDefinition', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/report-definitions/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('reports:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.reportDefinition.findUnique({ where: { id }, include: { category: true, filterPresets: true } });
    if (!item) throw new NotFoundError('Report definition not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/report-definitions/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('reports:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateDefinitionSchema, request.body);
    const existing = await fastify.prisma.reportDefinition.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Report definition not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    if (body.categoryId) await assertCategoryOrg(fastify, body.categoryId, existing.organizationId);
    const item = await fastify.prisma.reportDefinition.update({ where: { id }, data: { ...body, ...(body.code ? { code: normalizeEntityCode(body.code) } : {}), ...(body.queryConfig !== undefined ? { queryConfig: body.queryConfig === null ? Prisma.JsonNull : (body.queryConfig as Prisma.InputJsonValue) } : {}), ...(body.defaultFilters !== undefined ? { defaultFilters: body.defaultFilters === null ? Prisma.JsonNull : (body.defaultFilters as Prisma.InputJsonValue) } : {}), ...(body.columns !== undefined ? { columns: body.columns === null ? Prisma.JsonNull : (body.columns as Prisma.InputJsonValue) } : {}) } as Prisma.ReportDefinitionUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.report.definition.update', entityType: 'ReportDefinition', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.get('/admin/report-filter-presets', { preHandler: [fastify.authenticate, fastify.requirePermission('reports:read')] }, async (request, reply) => {
    const query = validateOrThrow(listOrgQuerySchema.extend({ reportDefinitionId: z.string().min(1).optional() }), request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.status ? { status: query.status } : {}), ...(query.reportDefinitionId ? { reportDefinitionId: query.reportDefinitionId } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.reportFilterPreset.findMany({ where, skip, take, include: { reportDefinition: true }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.reportFilterPreset.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/report-filter-presets', { preHandler: [fastify.authenticate, fastify.requirePermission('reports:manage')] }, async (request, reply) => {
    const body = validateOrThrow(presetBodySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    await assertDefinitionOrg(fastify, body.reportDefinitionId, body.organizationId);
    const item = await fastify.prisma.reportFilterPreset.create({ data: { ...body, code: normalizeEntityCode(body.code), status: body.status ?? 'ACTIVE', isDefault: body.isDefault ?? false, filters: body.filters as Prisma.InputJsonValue } as Prisma.ReportFilterPresetUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.report.filter_preset.create', entityType: 'ReportFilterPreset', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.patch('/admin/report-filter-presets/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('reports:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updatePresetSchema, request.body);
    const existing = await fastify.prisma.reportFilterPreset.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Report filter preset not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    if (body.reportDefinitionId) await assertDefinitionOrg(fastify, body.reportDefinitionId, existing.organizationId);
    const item = await fastify.prisma.reportFilterPreset.update({ where: { id }, data: { ...body, ...(body.code ? { code: normalizeEntityCode(body.code) } : {}), ...(body.filters ? { filters: body.filters as Prisma.InputJsonValue } : {}) } as Prisma.ReportFilterPresetUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.report.filter_preset.update', entityType: 'ReportFilterPreset', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.get('/admin/report-runs', { preHandler: [fastify.authenticate, fastify.requirePermission('report-runs:read')] }, async (request, reply) => {
    const query = validateOrThrow(paginationQuerySchema.extend({ organizationId: z.string().min(1).optional(), reportDefinitionId: z.string().min(1).optional(), status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED']).optional() }), request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.reportDefinitionId ? { reportDefinitionId: query.reportDefinitionId } : {}), ...(query.status ? { status: query.status } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.reportRun.findMany({ where, skip, take, include: { reportDefinition: true }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.reportRun.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/report-runs', { preHandler: [fastify.authenticate, fastify.requirePermission('reports:read')] }, async (request, reply) => {
    const body = validateOrThrow(runBodySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    if (body.reportDefinitionId) await assertDefinitionOrg(fastify, body.reportDefinitionId, body.organizationId);
    const item = await runReportPlaceholder(fastify, { organizationId: body.organizationId, ...(body.reportDefinitionId ? { reportDefinitionId: body.reportDefinitionId } : {}), ...(body.filters ? { filters: body.filters } : {}), ...(request.currentUser?.id ? { triggeredByUserId: request.currentUser.id } : {}) });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.report_run.create', entityType: 'ReportRun', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/report-export-jobs', { preHandler: [fastify.authenticate, fastify.requirePermission('report-runs:read')] }, async (request, reply) => {
    const query = validateOrThrow(paginationQuerySchema.extend({ organizationId: z.string().min(1).optional(), status: z.enum(['PENDING', 'QUEUED', 'COMPLETED_PLACEHOLDER', 'FAILED', 'CANCELED']).optional() }), request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.status ? { status: query.status } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.reportExportJob.findMany({ where, skip, take, include: { reportDefinition: true, reportRun: true }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.reportExportJob.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/report-export-jobs', { preHandler: [fastify.authenticate, fastify.requirePermission('report-exports:manage')] }, async (request, reply) => {
    const body = validateOrThrow(exportBodySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    if (body.reportDefinitionId) await assertDefinitionOrg(fastify, body.reportDefinitionId, body.organizationId);
    if (body.reportRunId) await assertRunOrg(fastify, body.reportRunId, body.organizationId);
    const item = await fastify.prisma.reportExportJob.create({ data: { ...body, status: 'QUEUED', requestedByUserId: request.currentUser?.id, ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}) } as Prisma.ReportExportJobUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.report_export.create', entityType: 'ReportExportJob', entityId: item.id });
    return reply.status(202).success({ item: serialize(item) });
  });

  fastify.get('/admin/dashboard/widgets', { preHandler: [fastify.authenticate, fastify.requirePermission('dashboard:read')] }, async (request, reply) => {
    const query = validateOrThrow(listOrgQuerySchema.extend({ widgetType: widgetTypeSchema.optional() }), request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.status ? { status: query.status } : {}), ...(query.widgetType ? { widgetType: query.widgetType } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.dashboardWidgetDefinition.findMany({ where, skip, take, include: { reportDefinition: true }, orderBy: [{ position: 'asc' }, { createdAt: 'desc' }] }),
      fastify.prisma.dashboardWidgetDefinition.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/dashboard/widgets', { preHandler: [fastify.authenticate, fastify.requirePermission('dashboard:manage')] }, async (request, reply) => {
    const body = validateOrThrow(widgetBodySchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    if (body.reportDefinitionId) await assertDefinitionOrg(fastify, body.reportDefinitionId, body.organizationId);
    const item = await fastify.prisma.dashboardWidgetDefinition.create({ data: { ...body, code: normalizeEntityCode(body.code), status: body.status ?? 'ACTIVE', position: body.position ?? 0, ...(body.config ? { config: body.config as Prisma.InputJsonValue } : {}) } as Prisma.DashboardWidgetDefinitionUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.dashboard.widget.create', entityType: 'DashboardWidgetDefinition', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.patch('/admin/dashboard/widgets/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('dashboard:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateWidgetSchema, request.body);
    const existing = await fastify.prisma.dashboardWidgetDefinition.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Dashboard widget definition not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    if (body.reportDefinitionId) await assertDefinitionOrg(fastify, body.reportDefinitionId, existing.organizationId);
    const item = await fastify.prisma.dashboardWidgetDefinition.update({ where: { id }, data: { ...body, ...(body.code ? { code: normalizeEntityCode(body.code) } : {}), ...(body.config !== undefined ? { config: body.config === null ? Prisma.JsonNull : (body.config as Prisma.InputJsonValue) } : {}) } as Prisma.DashboardWidgetDefinitionUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.dashboard.widget.update', entityType: 'DashboardWidgetDefinition', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.get('/admin/dashboard/summary', { preHandler: [fastify.authenticate, fastify.requirePermission('dashboard:read')] }, async (request, reply) => {
    const query = validateOrThrow(summaryQuerySchema, request.query);
    const organizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (!organizationId) throw new NotFoundError('Organization context is required');
    await fastify.requireOrganizationAccess(request, organizationId);
    const result = await buildDashboardSummary(fastify, { organizationId, persistSnapshot: query.persistSnapshot === true });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.dashboard.summary.read', entityType: 'DashboardSnapshot', entityId: result.snapshot?.id ?? organizationId });
    return reply.success(result);
  });
};
