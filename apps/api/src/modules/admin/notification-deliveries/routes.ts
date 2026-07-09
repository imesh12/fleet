import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { attemptNotificationDelivery } from '../../../lib/notification-delivery.js';
import { buildPaginationMeta } from '../../../lib/response.js';
import { getAuditContext, getPagination, paginationQuerySchema } from '../utils.js';

const idParamSchema = z.object({ deliveryId: z.string().min(1) });
const statusSchema = z.enum(['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELED']);

const listQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  status: statusSchema.optional(),
  trackingAlertEventId: z.string().min(1).optional(),
  channel: z.enum(['EMAIL', 'WEBHOOK', 'IN_APP', 'SMS']).optional(),
});

function serialize(item: { [key: string]: unknown }) { return item; }

export const adminNotificationDeliveryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/notification-deliveries', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-deliveries:read')] }, async (request, reply) => {
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
      ...(query.trackingAlertEventId ? { trackingAlertEventId: query.trackingAlertEventId } : {}),
      ...(query.channel ? { channel: query.channel } : {}),
      ...(!isSuperAdmin && !requestedOrganizationId ? { OR: [{ organizationId: null }, { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } }] } : {}),
    };
    const [items, total] = await Promise.all([
      fastify.prisma.notificationDelivery.findMany({ where, skip, take, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.notificationDelivery.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/notification-deliveries/:deliveryId', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-deliveries:read')] }, async (request, reply) => {
    const { deliveryId } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.notificationDelivery.findUnique({ where: { id: deliveryId } });
    if (!item) throw new NotFoundError('Notification delivery not found');
    if (item.organizationId) await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.post('/admin/notification-deliveries/:deliveryId/retry', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-deliveries:manage')] }, async (request, reply) => {
    const { deliveryId } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.notificationDelivery.findUnique({ where: { id: deliveryId } });
    if (!item) throw new NotFoundError('Notification delivery not found');
    if (item.organizationId) await fastify.requireOrganizationAccess(request, item.organizationId);
    const updated = await attemptNotificationDelivery(fastify, { deliveryId });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.notification_delivery.retry', entityType: 'NotificationDelivery', entityId: deliveryId });
    return reply.success({ item: serialize(updated) });
  });

  fastify.post('/admin/notification-deliveries/:deliveryId/mark-sent', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-deliveries:manage')] }, async (request, reply) => {
    const { deliveryId } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.notificationDelivery.findUnique({ where: { id: deliveryId } });
    if (!item) throw new NotFoundError('Notification delivery not found');
    if (item.organizationId) await fastify.requireOrganizationAccess(request, item.organizationId);
    const updated = await fastify.prisma.notificationDelivery.update({ where: { id: deliveryId }, data: { status: 'SENT', sentAt: new Date() } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.notification_delivery.mark_sent', entityType: 'NotificationDelivery', entityId: deliveryId });
    return reply.success({ item: serialize(updated) });
  });

  fastify.post('/admin/notification-deliveries/:deliveryId/mark-failed', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-deliveries:manage')] }, async (request, reply) => {
    const { deliveryId } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.notificationDelivery.findUnique({ where: { id: deliveryId } });
    if (!item) throw new NotFoundError('Notification delivery not found');
    if (item.organizationId) await fastify.requireOrganizationAccess(request, item.organizationId);
    const updated = await fastify.prisma.notificationDelivery.update({ where: { id: deliveryId }, data: { status: 'FAILED', failedAt: new Date() } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.notification_delivery.mark_failed', entityType: 'NotificationDelivery', entityId: deliveryId });
    return reply.success({ item: serialize(updated) });
  });

  fastify.post('/admin/notification-deliveries/:deliveryId/cancel', { preHandler: [fastify.authenticate, fastify.requirePermission('notification-deliveries:manage')] }, async (request, reply) => {
    const { deliveryId } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.notificationDelivery.findUnique({ where: { id: deliveryId } });
    if (!item) throw new NotFoundError('Notification delivery not found');
    if (item.organizationId) await fastify.requireOrganizationAccess(request, item.organizationId);
    const updated = await fastify.prisma.notificationDelivery.update({ where: { id: deliveryId }, data: { status: 'CANCELED', canceledAt: new Date() } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.notification_delivery.cancel', entityType: 'NotificationDelivery', entityId: deliveryId });
    return reply.success({ item: serialize(updated) });
  });
};
