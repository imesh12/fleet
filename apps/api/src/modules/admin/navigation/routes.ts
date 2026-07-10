import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { buildPaginationMeta } from '../../../lib/response.js';
import { getAuditContext, getPagination, normalizeEntityCode, paginationQuerySchema } from '../utils.js';

const jsonRecordSchema = z.record(z.string(), z.unknown());
const navigationStatusSchema = z.enum(['ACTIVE', 'HIDDEN', 'COMING_SOON', 'DISABLED']);
const rolloutStatusSchema = z.enum(['PLANNED', 'PREVIEW', 'ENABLED', 'DISABLED']);
const idParamSchema = z.object({ id: z.string().min(1) });
const listQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  status: navigationStatusSchema.optional(),
  moduleKey: z.string().trim().optional(),
});

const menuGroupSchema = z.object({
  organizationId: z.string().min(1).nullable().optional(),
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  path: z.string().trim().nullable().optional(),
  icon: z.string().trim().nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  status: navigationStatusSchema.default('ACTIVE'),
  requiredPermission: z.string().trim().nullable().optional(),
  moduleKey: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  comingSoonMessage: z.string().trim().nullable().optional(),
});

const menuItemSchema = menuGroupSchema.extend({
  menuGroupId: z.string().min(1).nullable().optional(),
  parentId: z.string().min(1).nullable().optional(),
  appPageId: z.string().min(1).nullable().optional(),
});

const pageSchema = menuGroupSchema.extend({
  parentId: z.string().min(1).nullable().optional(),
  path: z.string().trim().min(1),
});

const partialMenuGroupSchema = menuGroupSchema.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be supplied' });
const partialMenuItemSchema = menuItemSchema.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be supplied' });
const partialPageSchema = pageSchema.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be supplied' });

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), sortOrder: z.coerce.number().int().min(0) })).min(1),
});

const featureFlagSchema = z.object({
  organizationId: z.string().min(1).nullable().optional(),
  key: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  enabled: z.boolean().default(false),
  rolloutStatus: rolloutStatusSchema.default('PLANNED'),
  metadata: jsonRecordSchema.nullable().optional(),
});

const partialFeatureFlagSchema = featureFlagSchema.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be supplied' });

function normalizeSlug(slug: string) {
  return slug.trim().replace(/[\s_]+/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase();
}

function serialize(item: Record<string, unknown>) {
  return item;
}

function scopedWhere(request: any, requestedOrganizationId?: string) {
  const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
  return !isSuperAdmin && !requestedOrganizationId
    ? { OR: [{ organizationId: null }, { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } }] }
    : {};
}

async function requireOptionalOrgAccess(fastify: Parameters<FastifyPluginAsync>[0], request: any, organizationId?: string | null) {
  if (organizationId) {
    await fastify.requireOrganizationAccess(request, organizationId);
  }
}

async function assertNavigationRelations(fastify: Parameters<FastifyPluginAsync>[0], organizationId: string | null | undefined, input: {
  menuGroupId?: string | null | undefined;
  parentId?: string | null | undefined;
  appPageId?: string | null | undefined;
}) {
  if (input.menuGroupId) {
    const group = await fastify.prisma.appMenuGroup.findUnique({ where: { id: input.menuGroupId } });
    if (!group) throw new NotFoundError('Menu group not found');
    if ((group.organizationId ?? null) !== (organizationId ?? null)) throw new ConflictError('Menu group scope must match');
  }
  if (input.parentId) {
    const parent = await fastify.prisma.appMenuItem.findUnique({ where: { id: input.parentId } });
    if (!parent) throw new NotFoundError('Parent menu item not found');
    if ((parent.organizationId ?? null) !== (organizationId ?? null)) throw new ConflictError('Parent menu item scope must match');
  }
  if (input.appPageId) {
    const page = await fastify.prisma.appPage.findUnique({ where: { id: input.appPageId } });
    if (!page) throw new NotFoundError('App page not found');
    if ((page.organizationId ?? null) !== (organizationId ?? null)) throw new ConflictError('App page scope must match');
  }
}

export const adminNavigationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/navigation/menu-groups', { preHandler: [fastify.authenticate, fastify.requirePermission('navigation:read')] }, async (request, reply) => {
    const query = validateOrThrow(listQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { OR: [{ organizationId: requestedOrganizationId }, { organizationId: null }] } : {}), ...(query.status ? { status: query.status } : {}), ...(query.moduleKey ? { moduleKey: query.moduleKey } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.appMenuGroup.findMany({ where, skip, take, include: { menuItems: true }, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] }),
      fastify.prisma.appMenuGroup.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/navigation/menu-groups', { preHandler: [fastify.authenticate, fastify.requirePermission('navigation:manage')] }, async (request, reply) => {
    const body = validateOrThrow(menuGroupSchema, request.body);
    await requireOptionalOrgAccess(fastify, request, body.organizationId);
    const item = await fastify.prisma.appMenuGroup.create({ data: { ...body, organizationId: body.organizationId ?? null, slug: normalizeSlug(body.slug), sortOrder: body.sortOrder ?? 0, status: body.status ?? 'ACTIVE' } as Prisma.AppMenuGroupUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.menu_group.create', entityType: 'AppMenuGroup', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/navigation/menu-groups/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('navigation:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.appMenuGroup.findUnique({ where: { id }, include: { menuItems: { orderBy: { sortOrder: 'asc' } } } });
    if (!item) throw new NotFoundError('Menu group not found');
    await requireOptionalOrgAccess(fastify, request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/navigation/menu-groups/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('navigation:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(partialMenuGroupSchema, request.body);
    const existing = await fastify.prisma.appMenuGroup.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Menu group not found');
    await requireOptionalOrgAccess(fastify, request, existing.organizationId);
    const item = await fastify.prisma.appMenuGroup.update({ where: { id }, data: { ...body, ...(body.slug ? { slug: normalizeSlug(body.slug) } : {}) } as Prisma.AppMenuGroupUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.menu_group.update', entityType: 'AppMenuGroup', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.get('/admin/navigation/menu-items', { preHandler: [fastify.authenticate, fastify.requirePermission('navigation:read')] }, async (request, reply) => {
    const query = validateOrThrow(listQuerySchema.extend({ menuGroupId: z.string().min(1).optional() }), request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { OR: [{ organizationId: requestedOrganizationId }, { organizationId: null }] } : {}), ...(query.status ? { status: query.status } : {}), ...(query.moduleKey ? { moduleKey: query.moduleKey } : {}), ...(query.menuGroupId ? { menuGroupId: query.menuGroupId } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.appMenuItem.findMany({ where, skip, take, include: { appPage: true, children: true }, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] }),
      fastify.prisma.appMenuItem.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/navigation/menu-items', { preHandler: [fastify.authenticate, fastify.requirePermission('navigation:manage')] }, async (request, reply) => {
    const body = validateOrThrow(menuItemSchema, request.body);
    await requireOptionalOrgAccess(fastify, request, body.organizationId);
    await assertNavigationRelations(fastify, body.organizationId, body);
    const item = await fastify.prisma.appMenuItem.create({ data: { ...body, organizationId: body.organizationId ?? null, slug: normalizeSlug(body.slug), sortOrder: body.sortOrder ?? 0, status: body.status ?? 'ACTIVE' } as Prisma.AppMenuItemUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.menu_item.create', entityType: 'AppMenuItem', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.patch('/admin/navigation/menu-items/reorder', { preHandler: [fastify.authenticate, fastify.requirePermission('navigation:manage')] }, async (request, reply) => {
    const body = validateOrThrow(reorderSchema, request.body);
    const items = [];
    for (const entry of body.items) {
      items.push(await fastify.prisma.appMenuItem.update({ where: { id: entry.id }, data: { sortOrder: entry.sortOrder } }));
    }
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.navigation.reorder_menu_items', entityType: 'AppMenuItem', entityId: 'bulk' });
    return reply.success({ items: items.map(serialize) });
  });

  fastify.get('/admin/navigation/menu-items/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('navigation:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.appMenuItem.findUnique({ where: { id }, include: { appPage: true, children: true } });
    if (!item) throw new NotFoundError('Menu item not found');
    await requireOptionalOrgAccess(fastify, request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/navigation/menu-items/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('navigation:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(partialMenuItemSchema, request.body);
    const existing = await fastify.prisma.appMenuItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Menu item not found');
    await requireOptionalOrgAccess(fastify, request, existing.organizationId);
    await assertNavigationRelations(fastify, existing.organizationId, body);
    const item = await fastify.prisma.appMenuItem.update({ where: { id }, data: { ...body, ...(body.slug ? { slug: normalizeSlug(body.slug) } : {}) } as Prisma.AppMenuItemUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.menu_item.update', entityType: 'AppMenuItem', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const [action, status] of Object.entries({ activate: 'ACTIVE', hide: 'HIDDEN', disable: 'DISABLED', 'coming-soon': 'COMING_SOON' }) as Array<[string, 'ACTIVE' | 'HIDDEN' | 'DISABLED' | 'COMING_SOON']>) {
    fastify.post(`/admin/navigation/menu-items/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('navigation:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.appMenuItem.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Menu item not found');
      await requireOptionalOrgAccess(fastify, request, existing.organizationId);
      const item = await fastify.prisma.appMenuItem.update({ where: { id }, data: { status } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.menu_item.${action}`, entityType: 'AppMenuItem', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }

  fastify.get('/admin/navigation/pages', { preHandler: [fastify.authenticate, fastify.requirePermission('navigation:read')] }, async (request, reply) => {
    const query = validateOrThrow(listQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { OR: [{ organizationId: requestedOrganizationId }, { organizationId: null }] } : {}), ...(query.status ? { status: query.status } : {}), ...(query.moduleKey ? { moduleKey: query.moduleKey } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.appPage.findMany({ where, skip, take, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] }),
      fastify.prisma.appPage.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/navigation/pages', { preHandler: [fastify.authenticate, fastify.requirePermission('navigation:manage')] }, async (request, reply) => {
    const body = validateOrThrow(pageSchema, request.body);
    await requireOptionalOrgAccess(fastify, request, body.organizationId);
    const item = await fastify.prisma.appPage.create({ data: { ...body, organizationId: body.organizationId ?? null, slug: normalizeSlug(body.slug), sortOrder: body.sortOrder ?? 0, status: body.status ?? 'ACTIVE' } as Prisma.AppPageUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.app_page.create', entityType: 'AppPage', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.patch('/admin/navigation/pages/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('navigation:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(partialPageSchema, request.body);
    const existing = await fastify.prisma.appPage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('App page not found');
    await requireOptionalOrgAccess(fastify, request, existing.organizationId);
    const item = await fastify.prisma.appPage.update({ where: { id }, data: { ...body, ...(body.slug ? { slug: normalizeSlug(body.slug) } : {}) } as Prisma.AppPageUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.app_page.update', entityType: 'AppPage', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const [action, status] of Object.entries({ activate: 'ACTIVE', hide: 'HIDDEN', disable: 'DISABLED', 'coming-soon': 'COMING_SOON' }) as Array<[string, 'ACTIVE' | 'HIDDEN' | 'DISABLED' | 'COMING_SOON']>) {
    fastify.post(`/admin/navigation/pages/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('navigation:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.appPage.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('App page not found');
      await requireOptionalOrgAccess(fastify, request, existing.organizationId);
      const item = await fastify.prisma.appPage.update({ where: { id }, data: { status } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.app_page.${action}`, entityType: 'AppPage', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }

  fastify.get('/admin/feature-flags', { preHandler: [fastify.authenticate, fastify.requirePermission('feature-flags:read')] }, async (request, reply) => {
    const query = validateOrThrow(paginationQuerySchema.extend({ organizationId: z.string().min(1).optional(), enabled: z.coerce.boolean().optional(), rolloutStatus: rolloutStatusSchema.optional() }), request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { OR: [{ organizationId: requestedOrganizationId }, { organizationId: null }] } : {}), ...(query.enabled !== undefined ? { enabled: query.enabled } : {}), ...(query.rolloutStatus ? { rolloutStatus: query.rolloutStatus } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.featureFlag.findMany({ where, skip, take, orderBy: [{ key: 'asc' }] }),
      fastify.prisma.featureFlag.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/feature-flags', { preHandler: [fastify.authenticate, fastify.requirePermission('feature-flags:manage')] }, async (request, reply) => {
    const body = validateOrThrow(featureFlagSchema, request.body);
    await requireOptionalOrgAccess(fastify, request, body.organizationId);
    const item = await fastify.prisma.featureFlag.create({ data: { ...body, organizationId: body.organizationId ?? null, key: normalizeEntityCode(body.key), enabled: body.enabled ?? false, rolloutStatus: body.rolloutStatus ?? 'PLANNED', ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.FeatureFlagUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.feature_flag.create', entityType: 'FeatureFlag', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/feature-flags/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('feature-flags:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.featureFlag.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Feature flag not found');
    await requireOptionalOrgAccess(fastify, request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/feature-flags/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('feature-flags:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(partialFeatureFlagSchema, request.body);
    const existing = await fastify.prisma.featureFlag.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Feature flag not found');
    await requireOptionalOrgAccess(fastify, request, existing.organizationId);
    const item = await fastify.prisma.featureFlag.update({ where: { id }, data: { ...body, ...(body.key ? { key: normalizeEntityCode(body.key) } : {}), ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.FeatureFlagUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.feature_flag.update', entityType: 'FeatureFlag', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });
};
