import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { attemptNotificationDelivery, buildTestDelivery } from '../../../lib/notification-delivery.js';
import { buildPaginationMeta } from '../../../lib/response.js';
import { getAuditContext, getPagination, masterDataStatusSchema, paginationQuerySchema } from '../utils.js';

const idParamSchema = z.object({ providerId: z.string().min(1) });
const jsonRecordSchema = z.record(z.string(), z.unknown());
const providerTypeSchema = z.enum(['CONSOLE', 'EMAIL', 'WEBHOOK', 'IN_APP', 'SMS']);
const notificationChannelSchema = z.enum(['EMAIL', 'WEBHOOK', 'IN_APP', 'SMS']);

const listQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  status: masterDataStatusSchema.optional(),
  channel: notificationChannelSchema.optional(),
});

const createSchema = z.object({
  organizationId: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  providerType: providerTypeSchema,
  channel: notificationChannelSchema,
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
  config: jsonRecordSchema.optional(),
});

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
  providerType: providerTypeSchema.optional(),
  channel: notificationChannelSchema.optional(),
  description: z.string().trim().nullable().optional(),
  config: jsonRecordSchema.nullable().optional(),
}).refine((v) => Object.keys(v).length > 0, { message: 'At least one notification provider field must be supplied' });

const testSendSchema = z.object({
  recipient: z.string().trim().optional(),
  subject: z.string().trim().optional(),
  body: z.string().trim().min(1),
});

function normalizeCode(code: string) {
  return code.trim().replace(/[\s-]+/g, '_').replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
}

function serialize(item: {
  id: string; organizationId: string | null; name: string; code: string; providerType: string; channel: string;
  description: string | null; status: string; config: Prisma.JsonValue | null; createdAt: Date; updatedAt: Date;
}) {
  return { ...item };
}

export const adminNotificationProviderRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/notification-providers', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-providers:read')] }, async (request, reply) => {
    const query = validateOrThrow(listQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) {
      await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    }
    const where = {
      ...(requestedOrganizationId ? { OR: [{ organizationId: requestedOrganizationId }, { organizationId: null }] } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.channel ? { channel: query.channel } : {}),
      ...(!isSuperAdmin && !requestedOrganizationId ? { OR: [{ organizationId: null }, { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } }] } : {}),
    };
    const [items, total] = await Promise.all([
      fastify.prisma.notificationProvider.findMany({ where, skip, take, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.notificationProvider.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/notification-providers', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-providers:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createSchema, request.body);
    if (body.organizationId) {
      await fastify.requireOrganizationAccess(request, body.organizationId);
    }
    const code = normalizeCode(body.code);
    const duplicate = await fastify.prisma.notificationProvider.findFirst({ where: { organizationId: body.organizationId ?? null, code } });
    if (duplicate) throw new ConflictError('A notification provider with that code already exists in this scope');
    const item = await fastify.prisma.notificationProvider.create({
      data: {
        ...(body.organizationId ? { organizationId: body.organizationId } : {}),
        name: body.name,
        code,
        providerType: body.providerType,
        channel: body.channel,
        status: body.status ?? 'ACTIVE',
        ...(body.description ? { description: body.description } : {}),
        ...(body.config ? { config: body.config as Prisma.InputJsonValue } : {}),
      },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.notification_provider.create', entityType: 'NotificationProvider', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/notification-providers/:providerId', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-providers:read')] }, async (request, reply) => {
    const { providerId } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.notificationProvider.findUnique({ where: { id: providerId } });
    if (!item) throw new NotFoundError('Notification provider not found');
    if (item.organizationId) await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/notification-providers/:providerId', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-providers:manage')] }, async (request, reply) => {
    const { providerId } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateSchema, request.body);
    const existing = await fastify.prisma.notificationProvider.findUnique({ where: { id: providerId } });
    if (!existing) throw new NotFoundError('Notification provider not found');
    if (existing.organizationId) await fastify.requireOrganizationAccess(request, existing.organizationId);
    const nextCode = body.code ? normalizeCode(body.code) : undefined;
    if (nextCode && nextCode !== existing.code) {
      const duplicate = await fastify.prisma.notificationProvider.findFirst({ where: { organizationId: existing.organizationId, code: nextCode, id: { not: providerId } } });
      if (duplicate) throw new ConflictError('A notification provider with that code already exists in this scope');
    }
    const item = await fastify.prisma.notificationProvider.update({
      where: { id: providerId },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(nextCode ? { code: nextCode } : {}),
        ...(body.providerType ? { providerType: body.providerType } : {}),
        ...(body.channel ? { channel: body.channel } : {}),
        ...(body.description !== undefined ? { description: body.description ?? null } : {}),
        ...(body.config !== undefined ? { config: body.config === null ? Prisma.JsonNull : (body.config as Prisma.InputJsonValue) } : {}),
      },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.notification_provider.update', entityType: 'NotificationProvider', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.post('/admin/notification-providers/:providerId/activate', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-providers:manage')] }, async (request, reply) => {
    const { providerId } = validateOrThrow(idParamSchema, request.params);
    const existing = await fastify.prisma.notificationProvider.findUnique({ where: { id: providerId } });
    if (!existing) throw new NotFoundError('Notification provider not found');
    if (existing.organizationId) await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.notificationProvider.update({ where: { id: providerId }, data: { status: 'ACTIVE' } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.notification_provider.activate', entityType: 'NotificationProvider', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.post('/admin/notification-providers/:providerId/deactivate', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-providers:manage')] }, async (request, reply) => {
    const { providerId } = validateOrThrow(idParamSchema, request.params);
    const existing = await fastify.prisma.notificationProvider.findUnique({ where: { id: providerId } });
    if (!existing) throw new NotFoundError('Notification provider not found');
    if (existing.organizationId) await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.notificationProvider.update({ where: { id: providerId }, data: { status: 'INACTIVE' } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.notification_provider.deactivate', entityType: 'NotificationProvider', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.post('/admin/notification-providers/:providerId/test-send', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-providers:manage')] }, async (request, reply) => {
    const { providerId } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(testSendSchema, request.body);
    const provider = await fastify.prisma.notificationProvider.findUnique({ where: { id: providerId } });
    if (!provider) throw new NotFoundError('Notification provider not found');
    if (provider.organizationId) await fastify.requireOrganizationAccess(request, provider.organizationId);
    const delivery = await buildTestDelivery(fastify, {
      ...(provider.organizationId ? { organizationId: provider.organizationId } : {}),
      notificationProviderId: provider.id,
      channel: provider.channel,
      ...(body.recipient ? { recipient: body.recipient } : {}),
      ...(body.subject ? { subject: body.subject } : {}),
      body: body.body,
    });
    const delivered = await attemptNotificationDelivery(fastify, { deliveryId: delivery.id });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.notification_provider.test_send', entityType: 'NotificationDelivery', entityId: delivered.id });
    return reply.status(202).success({ item: delivered });
  });
};
