import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { attemptNotificationDelivery, createDeliveriesForTrackingAlertEvent } from '../../../lib/notification-delivery.js';
import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findTrackingAlertEventOrThrow,
  findTrackingAlertRuleOrThrow,
  findTrackingProviderOrThrow,
  findTripOrThrow,
  findVehicleOrThrow,
  findVehiclePositionOrThrow,
  findVehicleTelemetryEventOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  paginationQuerySchema,
  serializeTrackingAlertEvent,
  serializeTrackingAlertRule,
  trackingAlertEventStatusSchema,
  trackingAlertRuleTypeSchema,
} from '../utils.js';

const jsonRecordSchema = z.record(z.string(), z.unknown());

const alertRuleIdParamSchema = z.object({
  alertRuleId: z.string().min(1),
});

const alertEventIdParamSchema = z.object({
  alertEventId: z.string().min(1),
});

const listAlertRulesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  trackingProviderId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  status: masterDataStatusSchema.optional(),
  ruleType: trackingAlertRuleTypeSchema.optional(),
});

const listAlertEventsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  trackingAlertRuleId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  tripId: z.string().min(1).optional(),
  status: trackingAlertEventStatusSchema.optional(),
});

const createAlertRuleSchema = z.object({
  organizationId: z.string().min(1),
  trackingProviderId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  ruleType: trackingAlertRuleTypeSchema,
  severity: z.string().trim().min(1),
  condition: jsonRecordSchema.optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateAlertRuleSchema = z
  .object({
    trackingProviderId: z.string().min(1).nullable().optional(),
    vehicleId: z.string().min(1).nullable().optional(),
    name: z.string().trim().min(1).optional(),
    code: z.string().trim().min(1).optional(),
    ruleType: trackingAlertRuleTypeSchema.optional(),
    severity: z.string().trim().min(1).optional(),
    condition: jsonRecordSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one alert rule field must be supplied' });

const createAlertEventSchema = z.object({
  organizationId: z.string().min(1),
  trackingAlertRuleId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  tripId: z.string().min(1).optional(),
  vehiclePositionId: z.string().min(1).optional(),
  vehicleTelemetryEventId: z.string().min(1).optional(),
  status: trackingAlertEventStatusSchema.default('OPEN'),
  title: z.string().trim().min(1),
  message: z.string().trim().min(1),
  triggeredAt: z.coerce.date().optional(),
  metadata: jsonRecordSchema.optional(),
});

const updateAlertEventStatusSchema = z.object({
  message: z.string().trim().optional(),
});

const escalateAlertEventSchema = z.object({
  escalationPolicyId: z.string().min(1).optional(),
  title: z.string().trim().optional(),
  message: z.string().trim().optional(),
});

function normalizeRuleCode(code: string) {
  return code
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();
}

export const adminTrackingAlertRuleRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/tracking-alert-rules',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-alert-rules:read')] },
    async (request, reply) => {
      const query = validateOrThrow(listAlertRulesQuerySchema, request.query);
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
        ...(query.trackingProviderId ? { trackingProviderId: query.trackingProviderId } : {}),
        ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.ruleType ? { ruleType: query.ruleType } : {}),
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
        fastify.prisma.trackingAlertRule.findMany({
          where,
          skip,
          take,
          orderBy: [{ createdAt: 'desc' }],
          include: { events: true },
        }),
        fastify.prisma.trackingAlertRule.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeTrackingAlertRule) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/tracking-alert-rules/:alertRuleId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-alert-rules:read')] },
    async (request, reply) => {
      const { alertRuleId } = validateOrThrow(alertRuleIdParamSchema, request.params);
      const rule = await findTrackingAlertRuleOrThrow(fastify.prisma, alertRuleId);
      await fastify.requireOrganizationAccess(request, rule.organizationId);
      return reply.success({ item: serializeTrackingAlertRule(rule) });
    }
  );

  fastify.post(
    '/admin/tracking-alert-rules',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-alert-rules:manage')] },
    async (request, reply) => {
      const body = validateOrThrow(createAlertRuleSchema, request.body);
      await fastify.requireOrganizationAccess(request, body.organizationId);

      if (body.trackingProviderId) {
        const provider = await findTrackingProviderOrThrow(fastify.prisma, body.trackingProviderId);
        if (provider.organizationId !== body.organizationId) {
          throw new ConflictError('Tracking provider must belong to the same organization');
        }
      }

      if (body.vehicleId) {
        const vehicle = await findVehicleOrThrow(fastify.prisma, body.vehicleId);
        if (vehicle.organizationId !== body.organizationId) {
          throw new ConflictError('Vehicle must belong to the same organization');
        }
      }

      const code = normalizeRuleCode(body.code);
      const duplicate = await fastify.prisma.trackingAlertRule.findFirst({
        where: { organizationId: body.organizationId, code },
      });

      if (duplicate) {
        throw new ConflictError('A tracking alert rule with that code already exists for this organization');
      }

      const rule = await fastify.prisma.trackingAlertRule.create({
        data: {
          organizationId: body.organizationId,
          name: body.name,
          code,
          ruleType: body.ruleType,
          severity: body.severity,
          status: body.status ?? 'ACTIVE',
          ...(body.trackingProviderId ? { trackingProviderId: body.trackingProviderId } : {}),
          ...(body.vehicleId ? { vehicleId: body.vehicleId } : {}),
          ...(body.condition ? { condition: body.condition as Prisma.InputJsonValue } : {}),
        },
        include: { events: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_alert_rule.create',
        entityType: 'TrackingAlertRule',
        entityId: rule.id,
        metadata: { organizationId: rule.organizationId, code: rule.code, ruleType: rule.ruleType, status: rule.status },
      });

      return reply.status(201).success({ item: serializeTrackingAlertRule(rule) });
    }
  );

  fastify.patch(
    '/admin/tracking-alert-rules/:alertRuleId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-alert-rules:manage')] },
    async (request, reply) => {
      const { alertRuleId } = validateOrThrow(alertRuleIdParamSchema, request.params);
      const body = validateOrThrow(updateAlertRuleSchema, request.body);
      const rule = await findTrackingAlertRuleOrThrow(fastify.prisma, alertRuleId);
      await fastify.requireOrganizationAccess(request, rule.organizationId);

      if (body.trackingProviderId) {
        const provider = await findTrackingProviderOrThrow(fastify.prisma, body.trackingProviderId);
        if (provider.organizationId !== rule.organizationId) {
          throw new ConflictError('Tracking provider must belong to the same organization');
        }
      }

      if (body.vehicleId) {
        const vehicle = await findVehicleOrThrow(fastify.prisma, body.vehicleId);
        if (vehicle.organizationId !== rule.organizationId) {
          throw new ConflictError('Vehicle must belong to the same organization');
        }
      }

      const nextCode = body.code ? normalizeRuleCode(body.code) : undefined;
      if (nextCode && nextCode !== rule.code) {
        const duplicate = await fastify.prisma.trackingAlertRule.findFirst({
          where: { organizationId: rule.organizationId, code: nextCode, id: { not: alertRuleId } },
        });

        if (duplicate) {
          throw new ConflictError('A tracking alert rule with that code already exists for this organization');
        }
      }

      const updateData = {
        ...(body.trackingProviderId !== undefined ? { trackingProviderId: body.trackingProviderId ?? null } : {}),
        ...(body.vehicleId !== undefined ? { vehicleId: body.vehicleId ?? null } : {}),
        ...(body.name ? { name: body.name } : {}),
        ...(nextCode ? { code: nextCode } : {}),
        ...(body.ruleType ? { ruleType: body.ruleType } : {}),
        ...(body.severity ? { severity: body.severity } : {}),
        ...(body.condition !== undefined
          ? { condition: body.condition === null ? Prisma.JsonNull : (body.condition as Prisma.InputJsonValue) }
          : {}),
      };

      const updatedRule = await fastify.prisma.trackingAlertRule.update({
        where: { id: alertRuleId },
        data: updateData,
        include: { events: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_alert_rule.update',
        entityType: 'TrackingAlertRule',
        entityId: alertRuleId,
        metadata: updateData,
      });

      return reply.success({ item: serializeTrackingAlertRule(updatedRule) });
    }
  );

  fastify.post(
    '/admin/tracking-alert-rules/:alertRuleId/activate',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-alert-rules:manage')] },
    async (request, reply) => {
      const { alertRuleId } = validateOrThrow(alertRuleIdParamSchema, request.params);
      const rule = await findTrackingAlertRuleOrThrow(fastify.prisma, alertRuleId);
      await fastify.requireOrganizationAccess(request, rule.organizationId);

      const updatedRule = await fastify.prisma.trackingAlertRule.update({
        where: { id: alertRuleId },
        data: { status: 'ACTIVE' },
        include: { events: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_alert_rule.activate',
        entityType: 'TrackingAlertRule',
        entityId: alertRuleId,
      });

      return reply.success({ item: serializeTrackingAlertRule(updatedRule) });
    }
  );

  fastify.post(
    '/admin/tracking-alert-rules/:alertRuleId/deactivate',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-alert-rules:manage')] },
    async (request, reply) => {
      const { alertRuleId } = validateOrThrow(alertRuleIdParamSchema, request.params);
      const rule = await findTrackingAlertRuleOrThrow(fastify.prisma, alertRuleId);
      await fastify.requireOrganizationAccess(request, rule.organizationId);

      const updatedRule = await fastify.prisma.trackingAlertRule.update({
        where: { id: alertRuleId },
        data: { status: 'INACTIVE' },
        include: { events: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_alert_rule.deactivate',
        entityType: 'TrackingAlertRule',
        entityId: alertRuleId,
      });

      return reply.success({ item: serializeTrackingAlertRule(updatedRule) });
    }
  );

  fastify.get(
    '/admin/tracking-alert-events',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-alert-events:read')] },
    async (request, reply) => {
      const query = validateOrThrow(listAlertEventsQuerySchema, request.query);
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
        ...(query.trackingAlertRuleId ? { trackingAlertRuleId: query.trackingAlertRuleId } : {}),
        ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
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
        fastify.prisma.trackingAlertEvent.findMany({
          where,
          skip,
          take,
          orderBy: [{ triggeredAt: 'desc' }],
        }),
        fastify.prisma.trackingAlertEvent.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeTrackingAlertEvent) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/tracking-alert-events/:alertEventId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-alert-events:read')] },
    async (request, reply) => {
      const { alertEventId } = validateOrThrow(alertEventIdParamSchema, request.params);
      const event = await findTrackingAlertEventOrThrow(fastify.prisma, alertEventId);
      await fastify.requireOrganizationAccess(request, event.organizationId);
      return reply.success({ item: serializeTrackingAlertEvent(event) });
    }
  );

  fastify.post(
    '/admin/tracking-alert-events',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-alert-events:manage')] },
    async (request, reply) => {
      const body = validateOrThrow(createAlertEventSchema, request.body);
      await fastify.requireOrganizationAccess(request, body.organizationId);

      if (body.trackingAlertRuleId) {
        const rule = await findTrackingAlertRuleOrThrow(fastify.prisma, body.trackingAlertRuleId);
        if (rule.organizationId !== body.organizationId) {
          throw new ConflictError('Tracking alert rule must belong to the same organization');
        }
      }
      if (body.vehicleId) {
        const vehicle = await findVehicleOrThrow(fastify.prisma, body.vehicleId);
        if (vehicle.organizationId !== body.organizationId) {
          throw new ConflictError('Vehicle must belong to the same organization');
        }
      }
      if (body.tripId) {
        const trip = await findTripOrThrow(fastify.prisma, body.tripId);
        if (trip.organizationId !== body.organizationId) {
          throw new ConflictError('Trip must belong to the same organization');
        }
      }
      if (body.vehiclePositionId) {
        const position = await findVehiclePositionOrThrow(fastify.prisma, body.vehiclePositionId);
        if (position.organizationId !== body.organizationId) {
          throw new ConflictError('Vehicle position must belong to the same organization');
        }
      }
      if (body.vehicleTelemetryEventId) {
        const event = await findVehicleTelemetryEventOrThrow(fastify.prisma, body.vehicleTelemetryEventId);
        if (event.organizationId !== body.organizationId) {
          throw new ConflictError('Vehicle telemetry event must belong to the same organization');
        }
      }

      const alertEvent = await fastify.prisma.trackingAlertEvent.create({
        data: {
          organizationId: body.organizationId,
          title: body.title,
          message: body.message,
          status: body.status ?? 'OPEN',
          ...(body.trackingAlertRuleId ? { trackingAlertRuleId: body.trackingAlertRuleId } : {}),
          ...(body.vehicleId ? { vehicleId: body.vehicleId } : {}),
          ...(body.tripId ? { tripId: body.tripId } : {}),
          ...(body.vehiclePositionId ? { vehiclePositionId: body.vehiclePositionId } : {}),
          ...(body.vehicleTelemetryEventId ? { vehicleTelemetryEventId: body.vehicleTelemetryEventId } : {}),
          ...(body.triggeredAt ? { triggeredAt: body.triggeredAt } : {}),
          ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
        },
      });

      await createDeliveriesForTrackingAlertEvent(fastify, {
        trackingAlertEventId: alertEvent.id,
        organizationId: alertEvent.organizationId,
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_alert_event.create',
        entityType: 'TrackingAlertEvent',
        entityId: alertEvent.id,
        metadata: { organizationId: alertEvent.organizationId, status: alertEvent.status, trackingAlertRuleId: alertEvent.trackingAlertRuleId },
      });

      return reply.status(201).success({ item: serializeTrackingAlertEvent(alertEvent) });
    }
  );

  fastify.post(
    '/admin/tracking-alert-events/:alertEventId/acknowledge',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-alert-events:manage')] },
    async (request, reply) => {
      const { alertEventId } = validateOrThrow(alertEventIdParamSchema, request.params);
      const body = validateOrThrow(updateAlertEventStatusSchema, request.body);
      const event = await findTrackingAlertEventOrThrow(fastify.prisma, alertEventId);
      await fastify.requireOrganizationAccess(request, event.organizationId);

      const updatedEvent = await fastify.prisma.trackingAlertEvent.update({
        where: { id: alertEventId },
        data: {
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date(),
          ...(body.message ? { message: body.message } : {}),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_alert_event.acknowledge',
        entityType: 'TrackingAlertEvent',
        entityId: alertEventId,
      });

      return reply.success({ item: serializeTrackingAlertEvent(updatedEvent) });
    }
  );

  fastify.post(
    '/admin/tracking-alert-events/:alertEventId/resolve',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-alert-events:manage')] },
    async (request, reply) => {
      const { alertEventId } = validateOrThrow(alertEventIdParamSchema, request.params);
      const body = validateOrThrow(updateAlertEventStatusSchema, request.body);
      const event = await findTrackingAlertEventOrThrow(fastify.prisma, alertEventId);
      await fastify.requireOrganizationAccess(request, event.organizationId);

      const updatedEvent = await fastify.prisma.trackingAlertEvent.update({
        where: { id: alertEventId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          ...(body.message ? { message: body.message } : {}),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_alert_event.resolve',
        entityType: 'TrackingAlertEvent',
        entityId: alertEventId,
      });

      return reply.success({ item: serializeTrackingAlertEvent(updatedEvent) });
    }
  );

  fastify.post(
    '/admin/tracking-alert-events/:alertEventId/deliver',
    { preHandler: [fastify.authenticate, fastify.requirePermission('notification-deliveries:manage')] },
    async (request, reply) => {
      const { alertEventId } = validateOrThrow(alertEventIdParamSchema, request.params);
      const event = await findTrackingAlertEventOrThrow(fastify.prisma, alertEventId);
      await fastify.requireOrganizationAccess(request, event.organizationId);

      let deliveries = await fastify.prisma.notificationDelivery.findMany({
        where: {
          trackingAlertEventId: alertEventId,
        },
      });

      if (deliveries.length === 0) {
        deliveries = await createDeliveriesForTrackingAlertEvent(fastify, {
          trackingAlertEventId: alertEventId,
          organizationId: event.organizationId,
        });
      }

      const processed = [];
      for (const delivery of deliveries) {
        processed.push(await attemptNotificationDelivery(fastify, { deliveryId: delivery.id }));
      }

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_alert_event.deliver',
        entityType: 'TrackingAlertEvent',
        entityId: alertEventId,
        metadata: { deliveryCount: processed.length },
      });

      return reply.status(202).success({ items: processed });
    }
  );

  fastify.post(
    '/admin/tracking-alert-events/:alertEventId/escalate',
    { preHandler: [fastify.authenticate, fastify.requirePermission('escalation-events:manage')] },
    async (request, reply) => {
      const { alertEventId } = validateOrThrow(alertEventIdParamSchema, request.params);
      const body = validateOrThrow(escalateAlertEventSchema, request.body ?? {});
      const event = await findTrackingAlertEventOrThrow(fastify.prisma, alertEventId);
      await fastify.requireOrganizationAccess(request, event.organizationId);

      let escalationPolicyId = body.escalationPolicyId;
      if (!escalationPolicyId) {
        const notificationRule = event.trackingAlertRuleId
          ? await fastify.prisma.trackingNotificationRule.findFirst({
              where: {
                organizationId: event.organizationId,
                trackingAlertRuleId: event.trackingAlertRuleId,
                status: 'ACTIVE',
                escalationPolicyId: { not: null },
              },
            })
          : null;
        escalationPolicyId = notificationRule?.escalationPolicyId ?? undefined;
      }

      const escalationEvent = await fastify.prisma.escalationEvent.create({
        data: {
          organizationId: event.organizationId,
          trackingAlertEventId: alertEventId,
          ...(escalationPolicyId ? { escalationPolicyId } : {}),
          ...(request.currentUser?.id ? { actorUserId: request.currentUser.id } : {}),
          title: body.title ?? `Escalation for ${event.title}`,
          message: body.message ?? event.message,
          escalationLevel: 1,
          metadata: {
            source: 'tracking_alert_event',
          } as Prisma.InputJsonValue,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_alert_event.escalate',
        entityType: 'EscalationEvent',
        entityId: escalationEvent.id,
        metadata: { trackingAlertEventId: alertEventId },
      });

      return reply.status(201).success({ item: escalationEvent });
    }
  );
};
