import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { createDeliveriesForTrackingAlertEvent } from '../../../lib/notification-delivery.js';
import { buildPaginationMeta } from '../../../lib/response.js';
import {
  getAuditContext,
  getPagination,
  paginationQuerySchema,
} from '../utils.js';

const trackingEvaluationRunIdParamSchema = z.object({
  runId: z.string().min(1),
});

const listTrackingEvaluationRunsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED']).optional(),
});

const executeTrackingEvaluationSchema = z.object({
  organizationId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  staleMinutes: z.coerce.number().int().min(1).max(1440).default(15),
  offlineMinutes: z.coerce.number().int().min(1).max(10080).default(60),
});

function serializeTrackingEvaluationRun(run: {
  id: string;
  organizationId: string;
  evaluatorType: string;
  status: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  triggeredByUserId: string | null;
  summary: Prisma.JsonValue | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: run.id,
    organizationId: run.organizationId,
    evaluatorType: run.evaluatorType,
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    triggeredByUserId: run.triggeredByUserId,
    summary: run.summary,
    metadata: run.metadata,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

function serializeTrackingEvaluationItem(item: {
  id: string;
  trackingEvaluationRunId: string;
  trackingAlertRuleId: string | null;
  trackingAlertEventId: string | null;
  trackingProviderId: string | null;
  vehicleId: string | null;
  tripId: string | null;
  evaluationType: string;
  status: string;
  message: string | null;
  metadata: Prisma.JsonValue | null;
  evaluatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    trackingEvaluationRunId: item.trackingEvaluationRunId,
    trackingAlertRuleId: item.trackingAlertRuleId,
    trackingAlertEventId: item.trackingAlertEventId,
    trackingProviderId: item.trackingProviderId,
    vehicleId: item.vehicleId,
    tripId: item.tripId,
    evaluationType: item.evaluationType,
    status: item.status,
    message: item.message,
    metadata: item.metadata,
    evaluatedAt: item.evaluatedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function buildNotificationEventPayloads(input: {
  notificationRules: Array<{
    id: string;
    trackingAlertRuleId: string | null;
    channel: 'EMAIL' | 'SMS' | 'WEBHOOK' | 'IN_APP';
    escalationLevel: number;
    recipientMetadata: Prisma.JsonValue | null;
    messageTemplate: string | null;
  }>;
  alertEvent: {
    id: string;
    organizationId: string;
    trackingAlertRuleId: string | null;
    tripId: string | null;
    title: string;
    message: string;
  };
}) {
  return input.notificationRules
    .filter((rule) => !rule.trackingAlertRuleId || rule.trackingAlertRuleId === input.alertEvent.trackingAlertRuleId)
    .map((rule) => ({
      organizationId: input.alertEvent.organizationId,
      trackingNotificationRuleId: rule.id,
      ...(input.alertEvent.tripId ? { tripId: input.alertEvent.tripId } : {}),
      trackingAlertEventId: input.alertEvent.id,
      channel: rule.channel,
      status: 'GENERATED' as const,
      title: input.alertEvent.title,
      message: rule.messageTemplate?.trim() || input.alertEvent.message,
      escalationLevel: rule.escalationLevel,
      ...(rule.recipientMetadata ? { recipientMetadata: rule.recipientMetadata as Prisma.InputJsonValue } : {}),
      metadata: {
        source: 'tracking_evaluation',
      } as Prisma.InputJsonValue,
    }));
}

export const adminTrackingEvaluationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/admin/tracking/evaluate',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-evaluation:manage')] },
    async (request, reply) => {
      const body = validateOrThrow(executeTrackingEvaluationSchema, request.body ?? {});
      const requestedOrganizationId = body.organizationId ?? request.headers['x-organization-id']?.toString();

      if (!requestedOrganizationId) {
        throw new ValidationAppError('Organization context is required', { header: 'x-organization-id' });
      }

      await fastify.requireOrganizationAccess(request, requestedOrganizationId);

      if (body.vehicleId) {
        const vehicle = await fastify.prisma.vehicle.findUnique({ where: { id: body.vehicleId } });
        if (!vehicle || vehicle.organizationId !== requestedOrganizationId) {
          throw new ConflictError('Vehicle must belong to the requested organization');
        }
      }

      const run = await fastify.prisma.trackingEvaluationRun.create({
        data: {
          organizationId: requestedOrganizationId,
          evaluatorType: 'TRACKING_ALERT_RULES',
          status: 'RUNNING',
          startedAt: new Date(),
          ...(request.currentUser?.id ? { triggeredByUserId: request.currentUser.id } : {}),
          metadata: {
            staleMinutes: body.staleMinutes,
            offlineMinutes: body.offlineMinutes,
            vehicleId: body.vehicleId ?? null,
          } as Prisma.InputJsonValue,
        },
      });

      try {
        const staleMinutes = body.staleMinutes ?? 15;
        const offlineMinutes = body.offlineMinutes ?? 60;
        const [rules, latestPositions, notificationRules] = await Promise.all([
          fastify.prisma.trackingAlertRule.findMany({
            where: {
              organizationId: requestedOrganizationId,
              status: 'ACTIVE',
              ruleType: {
                in: ['DEVICE_OFFLINE', 'SPEED_THRESHOLD', 'STALE_POSITION', 'IGNITION_ON', 'IGNITION_OFF'],
              },
            },
          }),
          fastify.prisma.vehiclePosition.findMany({
            where: {
              organizationId: requestedOrganizationId,
              ...(body.vehicleId ? { vehicleId: body.vehicleId } : {}),
            },
            include: {
              vehicle: true,
              trip: true,
            },
          }),
          fastify.prisma.trackingNotificationRule.findMany({
            where: {
              organizationId: requestedOrganizationId,
              status: 'ACTIVE',
            },
          }),
        ]);

        const now = new Date();
        const createdItems: Array<{
          trackingAlertRuleId: string;
          trackingProviderId: string | null;
          vehicleId: string;
          tripId: string | null;
          evaluationType: string;
          status: 'PROCESSED' | 'SKIPPED';
          message: string;
          metadata: Prisma.InputJsonValue;
          alertEventData?: Prisma.TrackingAlertEventUncheckedCreateInput;
        }> = [];

        for (const rule of rules) {
          const applicablePositions = latestPositions.filter(
            (position) =>
              (!rule.trackingProviderId || rule.trackingProviderId === position.trackingProviderId) &&
              (!rule.vehicleId || rule.vehicleId === position.vehicleId)
          );

          for (const position of applicablePositions) {
            const positionAgeMinutes = Math.max(0, (now.getTime() - position.providerTimestamp.getTime()) / 60000);
            const speed = position.speed ? Number(position.speed.toString()) : null;
            const threshold =
              rule.condition &&
              typeof rule.condition === 'object' &&
              'speedThreshold' in rule.condition &&
              typeof rule.condition.speedThreshold === 'number'
                ? rule.condition.speedThreshold
                : 80;

            let shouldCreateAlert = false;
            let message = '';
            let evaluationType = rule.ruleType.toLowerCase();

            switch (rule.ruleType) {
              case 'DEVICE_OFFLINE':
                shouldCreateAlert = positionAgeMinutes >= offlineMinutes;
                message = shouldCreateAlert
                  ? `Vehicle has been offline for ${Math.floor(positionAgeMinutes)} minute(s)`
                  : 'Vehicle is not offline';
                evaluationType = 'device_offline';
                break;
              case 'STALE_POSITION':
                shouldCreateAlert = positionAgeMinutes >= staleMinutes;
                message = shouldCreateAlert
                  ? `Vehicle position is stale by ${Math.floor(positionAgeMinutes)} minute(s)`
                  : 'Vehicle position is fresh';
                evaluationType = 'stale_position';
                break;
              case 'SPEED_THRESHOLD':
                shouldCreateAlert = speed !== null && speed > threshold;
                message = shouldCreateAlert
                  ? `Vehicle speed ${speed} exceeded threshold ${threshold}`
                  : 'Vehicle speed is within threshold';
                evaluationType = 'speed_threshold';
                break;
              case 'IGNITION_ON':
                shouldCreateAlert = position.ignition === true;
                message = shouldCreateAlert ? 'Ignition is currently on' : 'Ignition is not on';
                evaluationType = 'ignition_change';
                break;
              case 'IGNITION_OFF':
                shouldCreateAlert = position.ignition === false;
                message = shouldCreateAlert ? 'Ignition is currently off' : 'Ignition is not off';
                evaluationType = 'ignition_change';
                break;
              default:
                break;
            }

            createdItems.push({
              trackingAlertRuleId: rule.id,
              trackingProviderId: position.trackingProviderId,
              vehicleId: position.vehicleId,
              tripId: position.tripId,
              evaluationType,
              status: shouldCreateAlert ? 'PROCESSED' : 'SKIPPED',
              message,
              metadata: {
                ruleType: rule.ruleType,
                providerTimestamp: position.providerTimestamp.toISOString(),
                positionAgeMinutes,
                speed,
              } as Prisma.InputJsonValue,
              ...(shouldCreateAlert
                ? {
                    alertEventData: {
                      organizationId: requestedOrganizationId,
                      trackingAlertRuleId: rule.id,
                      vehicleId: position.vehicleId,
                      ...(position.tripId ? { tripId: position.tripId } : {}),
                      vehiclePositionId: position.id,
                      status: 'OPEN',
                      title: `${rule.name} triggered`,
                      message,
                      triggeredAt: now,
                      metadata: {
                        source: 'tracking_evaluation',
                        evaluatorType: evaluationType,
                        ruleSeverity: rule.severity,
                      } as Prisma.InputJsonValue,
                    },
                  }
                : {}),
            });
          }
        }

        const persistedItems: ReturnType<typeof serializeTrackingEvaluationItem>[] = [];
        let generatedAlertEvents = 0;
        let generatedNotificationEvents = 0;
        let generatedDeliveries = 0;

        await fastify.prisma.$transaction(async (tx) => {
          for (const item of createdItems) {
            let alertEventId: string | undefined;

            if (item.alertEventData) {
              const alertEvent = await tx.trackingAlertEvent.create({
                data: item.alertEventData,
              });
              alertEventId = alertEvent.id;
              generatedAlertEvents += 1;

              const notificationEventPayloads = buildNotificationEventPayloads({
                notificationRules,
                alertEvent: {
                  id: alertEvent.id,
                  organizationId: alertEvent.organizationId,
                  trackingAlertRuleId: alertEvent.trackingAlertRuleId,
                  tripId: alertEvent.tripId,
                  title: alertEvent.title,
                  message: alertEvent.message,
                },
              });

              if (notificationEventPayloads.length > 0) {
                await tx.trackingNotificationEvent.createMany({
                  data: notificationEventPayloads,
                });
                generatedNotificationEvents += notificationEventPayloads.length;
              }

              const deliveries = await createDeliveriesForTrackingAlertEvent(fastify, {
                trackingAlertEventId: alertEvent.id,
                organizationId: alertEvent.organizationId,
              });
              generatedDeliveries += deliveries.length;
            }

            const savedItem = await tx.trackingEvaluationItem.create({
              data: {
                trackingEvaluationRunId: run.id,
                trackingAlertRuleId: item.trackingAlertRuleId,
                ...(alertEventId ? { trackingAlertEventId: alertEventId } : {}),
                ...(item.trackingProviderId ? { trackingProviderId: item.trackingProviderId } : {}),
                vehicleId: item.vehicleId,
                ...(item.tripId ? { tripId: item.tripId } : {}),
                evaluationType: item.evaluationType,
                status: item.status,
                message: item.message,
                metadata: item.metadata,
              },
            });

            persistedItems.push(serializeTrackingEvaluationItem(savedItem));
          }

          await tx.trackingEvaluationRun.update({
            where: { id: run.id },
            data: {
              status: 'COMPLETED',
              finishedAt: new Date(),
              summary: {
                evaluatedItemCount: createdItems.length,
                generatedAlertEvents,
                generatedNotificationEvents,
                generatedDeliveries,
              } as Prisma.InputJsonValue,
            },
          });
        });

        const completedRun = await fastify.prisma.trackingEvaluationRun.findUniqueOrThrow({
          where: { id: run.id },
        });

        await fastify.audit.write({
          ...getAuditContext(request),
          action: 'admin.tracking_evaluation.run',
          entityType: 'TrackingEvaluationRun',
          entityId: run.id,
          metadata: {
            organizationId: requestedOrganizationId,
            evaluatedItemCount: createdItems.length,
            generatedAlertEvents,
            generatedDeliveries,
          },
        });

        return reply.status(202).success({
          accepted: true,
          run: serializeTrackingEvaluationRun(completedRun),
          items: persistedItems,
        });
      } catch (error) {
        await fastify.prisma.trackingEvaluationRun.update({
          where: { id: run.id },
          data: {
            status: 'FAILED',
            finishedAt: new Date(),
            summary: {
              error: error instanceof Error ? error.message : 'Unknown tracking evaluation error',
            } as Prisma.InputJsonValue,
          },
        });
        throw error;
      }
    }
  );

  fastify.get(
    '/admin/tracking/evaluation-runs',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-evaluation:read')] },
    async (request, reply) => {
      const query = validateOrThrow(listTrackingEvaluationRunsQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
      const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();

      if (!requestedOrganizationId && !isSuperAdmin) {
        throw new ValidationAppError('Organization context is required', { header: 'x-organization-id' });
      }

      if (requestedOrganizationId) {
        await fastify.requireOrganizationAccess(request, requestedOrganizationId);
      }

      const where = {
        ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
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
        fastify.prisma.trackingEvaluationRun.findMany({
          where,
          skip,
          take,
          orderBy: [{ createdAt: 'desc' }],
        }),
        fastify.prisma.trackingEvaluationRun.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeTrackingEvaluationRun) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/tracking/evaluation-runs/:runId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-evaluation:read')] },
    async (request, reply) => {
      const { runId } = validateOrThrow(trackingEvaluationRunIdParamSchema, request.params);
      const run = await fastify.prisma.trackingEvaluationRun.findUnique({
        where: { id: runId },
        include: { items: true },
      });

      if (!run) {
        throw new NotFoundError('Tracking evaluation run not found');
      }

      await fastify.requireOrganizationAccess(request, run.organizationId);
      return reply.success({
        run: serializeTrackingEvaluationRun(run),
        items: run.items.map(serializeTrackingEvaluationItem),
      });
    }
  );
};
