import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  paginationQuerySchema,
} from '../utils.js';

const trackingNotificationRuleIdParamSchema = z.object({
  notificationRuleId: z.string().min(1),
});

const trackingNotificationEventIdParamSchema = z.object({
  notificationEventId: z.string().min(1),
});

const notificationChannelSchema = z.enum(['EMAIL', 'SMS', 'WEBHOOK', 'IN_APP']);
const notificationEventStatusSchema = z.enum(['PENDING', 'GENERATED', 'SKIPPED', 'ACKNOWLEDGED', 'RESOLVED']);

const jsonRecordSchema = z.record(z.string(), z.unknown());

const listNotificationRulesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  status: masterDataStatusSchema.optional(),
  trackingAlertRuleId: z.string().min(1).optional(),
});

const listNotificationEventsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  trackingNotificationRuleId: z.string().min(1).optional(),
  trackingAlertEventId: z.string().min(1).optional(),
  tripId: z.string().min(1).optional(),
  status: notificationEventStatusSchema.optional(),
});

const createNotificationRuleSchema = z.object({
  organizationId: z.string().min(1),
  trackingAlertRuleId: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  channel: notificationChannelSchema,
  status: masterDataStatusSchema.default('ACTIVE'),
  escalationLevel: z.coerce.number().int().min(1).max(10).default(1),
  recipientMetadata: jsonRecordSchema.optional(),
  messageTemplate: z.string().trim().optional(),
  metadata: jsonRecordSchema.optional(),
});

const updateNotificationRuleSchema = z
  .object({
    trackingAlertRuleId: z.string().min(1).nullable().optional(),
    name: z.string().trim().min(1).optional(),
    code: z.string().trim().min(1).optional(),
    channel: notificationChannelSchema.optional(),
    escalationLevel: z.coerce.number().int().min(1).max(10).optional(),
    recipientMetadata: jsonRecordSchema.nullable().optional(),
    messageTemplate: z.string().trim().nullable().optional(),
    metadata: jsonRecordSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one notification rule field must be supplied' });

const notificationEventStatusBodySchema = z.object({
  note: z.string().trim().optional(),
});

function normalizeCode(code: string) {
  return code
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();
}

function serializeTrackingNotificationRule(rule: {
  id: string;
  organizationId: string;
  trackingAlertRuleId: string | null;
  name: string;
  code: string;
  channel: string;
  status: string;
  escalationLevel: number;
  recipientMetadata: Prisma.JsonValue | null;
  messageTemplate: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: rule.id,
    organizationId: rule.organizationId,
    trackingAlertRuleId: rule.trackingAlertRuleId,
    name: rule.name,
    code: rule.code,
    channel: rule.channel,
    status: rule.status,
    escalationLevel: rule.escalationLevel,
    recipientMetadata: rule.recipientMetadata,
    messageTemplate: rule.messageTemplate,
    metadata: rule.metadata,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };
}

function serializeTrackingNotificationEvent(event: {
  id: string;
  organizationId: string;
  trackingNotificationRuleId: string | null;
  trackingAlertEventId: string | null;
  tripId: string | null;
  channel: string;
  status: string;
  title: string;
  message: string;
  escalationLevel: number;
  recipientMetadata: Prisma.JsonValue | null;
  metadata: Prisma.JsonValue | null;
  triggeredAt: Date;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: event.id,
    organizationId: event.organizationId,
    trackingNotificationRuleId: event.trackingNotificationRuleId,
    trackingAlertEventId: event.trackingAlertEventId,
    tripId: event.tripId,
    channel: event.channel,
    status: event.status,
    title: event.title,
    message: event.message,
    escalationLevel: event.escalationLevel,
    recipientMetadata: event.recipientMetadata,
    metadata: event.metadata,
    triggeredAt: event.triggeredAt,
    acknowledgedAt: event.acknowledgedAt,
    resolvedAt: event.resolvedAt,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

export const adminTrackingNotificationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/tracking-notification-rules',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-notification-rules:read')] },
    async (request, reply) => {
      const query = validateOrThrow(listNotificationRulesQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
      const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();

      if (requestedOrganizationId) {
        await fastify.requireOrganizationAccess(request, requestedOrganizationId);
      }

      const where = {
        ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.trackingAlertRuleId ? { trackingAlertRuleId: query.trackingAlertRuleId } : {}),
        ...(!isSuperAdmin && !requestedOrganizationId
          ? {
              organization: {
                users: {
                  some: { userId: request.currentUser!.id, status: 'ACTIVE' as const },
                },
              },
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.trackingNotificationRule.findMany({
          where,
          skip,
          take,
          orderBy: [{ createdAt: 'desc' }],
        }),
        fastify.prisma.trackingNotificationRule.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeTrackingNotificationRule) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/tracking-notification-rules/:notificationRuleId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-notification-rules:read')] },
    async (request, reply) => {
      const { notificationRuleId } = validateOrThrow(trackingNotificationRuleIdParamSchema, request.params);
      const rule = await fastify.prisma.trackingNotificationRule.findUnique({
        where: { id: notificationRuleId },
      });

      if (!rule) {
        throw new NotFoundError('Tracking notification rule not found');
      }

      await fastify.requireOrganizationAccess(request, rule.organizationId);
      return reply.success({ item: serializeTrackingNotificationRule(rule) });
    }
  );

  fastify.post(
    '/admin/tracking-notification-rules',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-notification-rules:manage')] },
    async (request, reply) => {
      const body = validateOrThrow(createNotificationRuleSchema, request.body);
      await fastify.requireOrganizationAccess(request, body.organizationId);

      if (body.trackingAlertRuleId) {
        const alertRule = await fastify.prisma.trackingAlertRule.findUnique({ where: { id: body.trackingAlertRuleId } });
        if (!alertRule || alertRule.organizationId !== body.organizationId) {
          throw new ConflictError('Tracking alert rule must belong to the same organization');
        }
      }

      const code = normalizeCode(body.code);
      const duplicate = await fastify.prisma.trackingNotificationRule.findFirst({
        where: { organizationId: body.organizationId, code },
      });

      if (duplicate) {
        throw new ConflictError('A tracking notification rule with that code already exists for this organization');
      }

      const rule = await fastify.prisma.trackingNotificationRule.create({
        data: {
          organizationId: body.organizationId,
          ...(body.trackingAlertRuleId ? { trackingAlertRuleId: body.trackingAlertRuleId } : {}),
          name: body.name,
          code,
          channel: body.channel,
          status: body.status ?? 'ACTIVE',
          escalationLevel: body.escalationLevel ?? 1,
          ...(body.recipientMetadata ? { recipientMetadata: body.recipientMetadata as Prisma.InputJsonValue } : {}),
          ...(body.messageTemplate ? { messageTemplate: body.messageTemplate } : {}),
          ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_notification_rule.create',
        entityType: 'TrackingNotificationRule',
        entityId: rule.id,
        metadata: { organizationId: rule.organizationId, code: rule.code, channel: rule.channel },
      });

      return reply.status(201).success({ item: serializeTrackingNotificationRule(rule) });
    }
  );

  fastify.patch(
    '/admin/tracking-notification-rules/:notificationRuleId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-notification-rules:manage')] },
    async (request, reply) => {
      const { notificationRuleId } = validateOrThrow(trackingNotificationRuleIdParamSchema, request.params);
      const body = validateOrThrow(updateNotificationRuleSchema, request.body);
      const rule = await fastify.prisma.trackingNotificationRule.findUnique({
        where: { id: notificationRuleId },
      });

      if (!rule) {
        throw new NotFoundError('Tracking notification rule not found');
      }

      await fastify.requireOrganizationAccess(request, rule.organizationId);

      if (body.trackingAlertRuleId) {
        const alertRule = await fastify.prisma.trackingAlertRule.findUnique({ where: { id: body.trackingAlertRuleId } });
        if (!alertRule || alertRule.organizationId !== rule.organizationId) {
          throw new ConflictError('Tracking alert rule must belong to the same organization');
        }
      }

      const nextCode = body.code ? normalizeCode(body.code) : undefined;
      if (nextCode && nextCode !== rule.code) {
        const duplicate = await fastify.prisma.trackingNotificationRule.findFirst({
          where: { organizationId: rule.organizationId, code: nextCode, id: { not: notificationRuleId } },
        });

        if (duplicate) {
          throw new ConflictError('A tracking notification rule with that code already exists for this organization');
        }
      }

      const updatedRule = await fastify.prisma.trackingNotificationRule.update({
        where: { id: notificationRuleId },
        data: {
          ...(body.trackingAlertRuleId !== undefined ? { trackingAlertRuleId: body.trackingAlertRuleId ?? null } : {}),
          ...(body.name ? { name: body.name } : {}),
          ...(nextCode ? { code: nextCode } : {}),
          ...(body.channel ? { channel: body.channel } : {}),
          ...(body.escalationLevel !== undefined ? { escalationLevel: body.escalationLevel } : {}),
          ...(body.recipientMetadata !== undefined
            ? { recipientMetadata: body.recipientMetadata === null ? Prisma.JsonNull : (body.recipientMetadata as Prisma.InputJsonValue) }
            : {}),
          ...(body.messageTemplate !== undefined ? { messageTemplate: body.messageTemplate ?? null } : {}),
          ...(body.metadata !== undefined
            ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) }
            : {}),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_notification_rule.update',
        entityType: 'TrackingNotificationRule',
        entityId: notificationRuleId,
      });

      return reply.success({ item: serializeTrackingNotificationRule(updatedRule) });
    }
  );

  fastify.post(
    '/admin/tracking-notification-rules/:notificationRuleId/activate',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-notification-rules:manage')] },
    async (request, reply) => {
      const { notificationRuleId } = validateOrThrow(trackingNotificationRuleIdParamSchema, request.params);
      const rule = await fastify.prisma.trackingNotificationRule.findUnique({
        where: { id: notificationRuleId },
      });

      if (!rule) {
        throw new NotFoundError('Tracking notification rule not found');
      }

      await fastify.requireOrganizationAccess(request, rule.organizationId);
      const updatedRule = await fastify.prisma.trackingNotificationRule.update({
        where: { id: notificationRuleId },
        data: { status: 'ACTIVE' },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_notification_rule.activate',
        entityType: 'TrackingNotificationRule',
        entityId: notificationRuleId,
      });

      return reply.success({ item: serializeTrackingNotificationRule(updatedRule) });
    }
  );

  fastify.post(
    '/admin/tracking-notification-rules/:notificationRuleId/deactivate',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-notification-rules:manage')] },
    async (request, reply) => {
      const { notificationRuleId } = validateOrThrow(trackingNotificationRuleIdParamSchema, request.params);
      const rule = await fastify.prisma.trackingNotificationRule.findUnique({
        where: { id: notificationRuleId },
      });

      if (!rule) {
        throw new NotFoundError('Tracking notification rule not found');
      }

      await fastify.requireOrganizationAccess(request, rule.organizationId);
      const updatedRule = await fastify.prisma.trackingNotificationRule.update({
        where: { id: notificationRuleId },
        data: { status: 'INACTIVE' },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_notification_rule.deactivate',
        entityType: 'TrackingNotificationRule',
        entityId: notificationRuleId,
      });

      return reply.success({ item: serializeTrackingNotificationRule(updatedRule) });
    }
  );

  fastify.get(
    '/admin/tracking-notification-events',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-notification-events:read')] },
    async (request, reply) => {
      const query = validateOrThrow(listNotificationEventsQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
      const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();

      if (requestedOrganizationId) {
        await fastify.requireOrganizationAccess(request, requestedOrganizationId);
      }

      const where = {
        ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
        ...(query.trackingNotificationRuleId ? { trackingNotificationRuleId: query.trackingNotificationRuleId } : {}),
        ...(query.trackingAlertEventId ? { trackingAlertEventId: query.trackingAlertEventId } : {}),
        ...(query.tripId ? { tripId: query.tripId } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(!isSuperAdmin && !requestedOrganizationId
          ? {
              organization: {
                users: {
                  some: { userId: request.currentUser!.id, status: 'ACTIVE' as const },
                },
              },
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.trackingNotificationEvent.findMany({
          where,
          skip,
          take,
          orderBy: [{ triggeredAt: 'desc' }],
        }),
        fastify.prisma.trackingNotificationEvent.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeTrackingNotificationEvent) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/tracking-notification-events/:notificationEventId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-notification-events:read')] },
    async (request, reply) => {
      const { notificationEventId } = validateOrThrow(trackingNotificationEventIdParamSchema, request.params);
      const event = await fastify.prisma.trackingNotificationEvent.findUnique({
        where: { id: notificationEventId },
      });

      if (!event) {
        throw new NotFoundError('Tracking notification event not found');
      }

      await fastify.requireOrganizationAccess(request, event.organizationId);
      return reply.success({ item: serializeTrackingNotificationEvent(event) });
    }
  );

  fastify.post(
    '/admin/tracking-notification-events/:notificationEventId/acknowledge',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-notification-rules:manage')] },
    async (request, reply) => {
      const { notificationEventId } = validateOrThrow(trackingNotificationEventIdParamSchema, request.params);
      const body = validateOrThrow(notificationEventStatusBodySchema, request.body ?? {});
      const event = await fastify.prisma.trackingNotificationEvent.findUnique({
        where: { id: notificationEventId },
      });

      if (!event) {
        throw new NotFoundError('Tracking notification event not found');
      }

      await fastify.requireOrganizationAccess(request, event.organizationId);
      const updatedEvent = await fastify.prisma.trackingNotificationEvent.update({
        where: { id: notificationEventId },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date(),
          metadata: {
            ...(event.metadata && typeof event.metadata === 'object' ? event.metadata : {}),
            acknowledgementNote: body.note ?? null,
          } as Prisma.InputJsonValue,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_notification_event.acknowledge',
        entityType: 'TrackingNotificationEvent',
        entityId: notificationEventId,
      });

      return reply.success({ item: serializeTrackingNotificationEvent(updatedEvent) });
    }
  );

  fastify.post(
    '/admin/tracking-notification-events/:notificationEventId/resolve',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-notification-rules:manage')] },
    async (request, reply) => {
      const { notificationEventId } = validateOrThrow(trackingNotificationEventIdParamSchema, request.params);
      const body = validateOrThrow(notificationEventStatusBodySchema, request.body ?? {});
      const event = await fastify.prisma.trackingNotificationEvent.findUnique({
        where: { id: notificationEventId },
      });

      if (!event) {
        throw new NotFoundError('Tracking notification event not found');
      }

      await fastify.requireOrganizationAccess(request, event.organizationId);
      const updatedEvent = await fastify.prisma.trackingNotificationEvent.update({
        where: { id: notificationEventId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          metadata: {
            ...(event.metadata && typeof event.metadata === 'object' ? event.metadata : {}),
            resolutionNote: body.note ?? null,
          } as Prisma.InputJsonValue,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_notification_event.resolve',
        entityType: 'TrackingNotificationEvent',
        entityId: notificationEventId,
      });

      return reply.success({ item: serializeTrackingNotificationEvent(updatedEvent) });
    }
  );
};
