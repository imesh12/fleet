import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { buildPaginationMeta } from '../../../lib/response.js';
import { getAuditContext, getPagination, masterDataStatusSchema, paginationQuerySchema } from '../utils.js';

const idParamSchema = z.object({ templateId: z.string().min(1) });
const channelSchema = z.enum(['EMAIL', 'WEBHOOK', 'IN_APP', 'SMS']);
const jsonRecordSchema = z.record(z.string(), z.unknown());

const listQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  status: masterDataStatusSchema.optional(),
  channel: channelSchema.optional(),
});
const createSchema = z.object({
  organizationId: z.string().min(1).optional(),
  notificationProviderId: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  channel: channelSchema,
  subjectTemplate: z.string().trim().optional(),
  bodyTemplate: z.string().trim().min(1),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
  metadata: jsonRecordSchema.optional(),
});
const updateSchema = z.object({
  notificationProviderId: z.string().min(1).nullable().optional(),
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  channel: channelSchema.optional(),
  subjectTemplate: z.string().trim().nullable().optional(),
  bodyTemplate: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  metadata: jsonRecordSchema.nullable().optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'At least one notification template field must be supplied' });

function normalizeCode(code: string) {
  return code.trim().replace(/[\s-]+/g, '_').replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
}

function serialize(item: { [key: string]: unknown }) { return item; }

export const adminNotificationTemplateRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/notification-templates', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-templates:read')] }, async (request, reply) => {
    const query = validateOrThrow(listQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = {
      ...(requestedOrganizationId ? { OR: [{ organizationId: requestedOrganizationId }, { organizationId: null }] } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.channel ? { channel: query.channel } : {}),
      ...(!isSuperAdmin && !requestedOrganizationId ? { OR: [{ organizationId: null }, { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } }] } : {}),
    };
    const [items, total] = await Promise.all([
      fastify.prisma.notificationTemplate.findMany({ where, skip, take, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.notificationTemplate.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/notification-templates', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-templates:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createSchema, request.body);
    if (body.organizationId) await fastify.requireOrganizationAccess(request, body.organizationId);
    if (body.notificationProviderId) {
      const provider = await fastify.prisma.notificationProvider.findUnique({ where: { id: body.notificationProviderId } });
      if (!provider || provider.organizationId !== (body.organizationId ?? null)) throw new ConflictError('Notification provider must belong to the same scope');
    }
    const code = normalizeCode(body.code);
    const duplicate = await fastify.prisma.notificationTemplate.findFirst({ where: { organizationId: body.organizationId ?? null, code } });
    if (duplicate) throw new ConflictError('A notification template with that code already exists in this scope');
    const item = await fastify.prisma.notificationTemplate.create({
      data: {
        ...(body.organizationId ? { organizationId: body.organizationId } : {}),
        ...(body.notificationProviderId ? { notificationProviderId: body.notificationProviderId } : {}),
        name: body.name,
        code,
        channel: body.channel,
        bodyTemplate: body.bodyTemplate,
        status: body.status ?? 'ACTIVE',
        ...(body.subjectTemplate ? { subjectTemplate: body.subjectTemplate } : {}),
        ...(body.description ? { description: body.description } : {}),
        ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
      },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.notification_template.create', entityType: 'NotificationTemplate', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/notification-templates/:templateId', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-templates:read')] }, async (request, reply) => {
    const { templateId } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.notificationTemplate.findUnique({ where: { id: templateId } });
    if (!item) throw new NotFoundError('Notification template not found');
    if (item.organizationId) await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/notification-templates/:templateId', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-templates:manage')] }, async (request, reply) => {
    const { templateId } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateSchema, request.body);
    const existing = await fastify.prisma.notificationTemplate.findUnique({ where: { id: templateId } });
    if (!existing) throw new NotFoundError('Notification template not found');
    if (existing.organizationId) await fastify.requireOrganizationAccess(request, existing.organizationId);
    if (body.notificationProviderId) {
      const provider = await fastify.prisma.notificationProvider.findUnique({ where: { id: body.notificationProviderId } });
      if (!provider || provider.organizationId !== existing.organizationId) throw new ConflictError('Notification provider must belong to the same scope');
    }
    const nextCode = body.code ? normalizeCode(body.code) : undefined;
    if (nextCode && nextCode !== existing.code) {
      const duplicate = await fastify.prisma.notificationTemplate.findFirst({ where: { organizationId: existing.organizationId, code: nextCode, id: { not: templateId } } });
      if (duplicate) throw new ConflictError('A notification template with that code already exists in this scope');
    }
    const item = await fastify.prisma.notificationTemplate.update({
      where: { id: templateId },
      data: {
        ...(body.notificationProviderId !== undefined ? { notificationProviderId: body.notificationProviderId ?? null } : {}),
        ...(body.name ? { name: body.name } : {}),
        ...(nextCode ? { code: nextCode } : {}),
        ...(body.channel ? { channel: body.channel } : {}),
        ...(body.subjectTemplate !== undefined ? { subjectTemplate: body.subjectTemplate ?? null } : {}),
        ...(body.bodyTemplate ? { bodyTemplate: body.bodyTemplate } : {}),
        ...(body.description !== undefined ? { description: body.description ?? null } : {}),
        ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}),
      },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.notification_template.update', entityType: 'NotificationTemplate', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.post('/admin/notification-templates/:templateId/activate', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-templates:manage')] }, async (request, reply) => {
    const { templateId } = validateOrThrow(idParamSchema, request.params);
    const existing = await fastify.prisma.notificationTemplate.findUnique({ where: { id: templateId } });
    if (!existing) throw new NotFoundError('Notification template not found');
    if (existing.organizationId) await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.notificationTemplate.update({ where: { id: templateId }, data: { status: 'ACTIVE' } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.notification_template.activate', entityType: 'NotificationTemplate', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.post('/admin/notification-templates/:templateId/deactivate', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-templates:manage')] }, async (request, reply) => {
    const { templateId } = validateOrThrow(idParamSchema, request.params);
    const existing = await fastify.prisma.notificationTemplate.findUnique({ where: { id: templateId } });
    if (!existing) throw new NotFoundError('Notification template not found');
    if (existing.organizationId) await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.notificationTemplate.update({ where: { id: templateId }, data: { status: 'INACTIVE' } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.notification_template.deactivate', entityType: 'NotificationTemplate', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });
};
