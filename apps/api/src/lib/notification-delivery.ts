import type { FastifyInstance } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { getMailer } from '@trackigniter8/mailer';

type App = FastifyInstance;

function renderTemplate(template: string | null | undefined, context: Record<string, unknown>) {
  if (!template) {
    return '';
  }

  return template.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (_, key: string) => {
    const value = context[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

function asObject(value: Prisma.JsonValue | null | undefined) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export async function createDeliveriesForTrackingAlertEvent(
  fastify: App,
  input: {
    trackingAlertEventId: string;
    organizationId: string;
  }
) {
  const alertEvent = await fastify.prisma.trackingAlertEvent.findUnique({
    where: { id: input.trackingAlertEventId },
  });

  if (!alertEvent) {
    throw new NotFoundError('Tracking alert event not found');
  }

  const notificationRules = await fastify.prisma.trackingNotificationRule.findMany({
    where: {
      organizationId: input.organizationId,
      status: 'ACTIVE',
      OR: [{ trackingAlertRuleId: null }, { trackingAlertRuleId: alertEvent.trackingAlertRuleId }],
    },
    include: {
      notificationProvider: true,
      notificationTemplate: true,
    },
  });

  const createdDeliveries = [];

  for (const rule of notificationRules) {
    const recipientMetadata = asObject(rule.recipientMetadata);
    const recipient =
      typeof recipientMetadata.email === 'string'
        ? recipientMetadata.email
        : typeof recipientMetadata.url === 'string'
          ? recipientMetadata.url
          : typeof recipientMetadata.userId === 'string'
            ? recipientMetadata.userId
            : null;

    const subject = renderTemplate(rule.notificationTemplate?.subjectTemplate ?? null, {
      title: alertEvent.title,
      message: alertEvent.message,
    });
    const body = renderTemplate(rule.notificationTemplate?.bodyTemplate ?? rule.messageTemplate ?? alertEvent.message, {
      title: alertEvent.title,
      message: alertEvent.message,
      organizationId: input.organizationId,
      trackingAlertEventId: alertEvent.id,
    });

    const delivery = await fastify.prisma.notificationDelivery.create({
      data: {
        organizationId: input.organizationId,
        trackingAlertEventId: alertEvent.id,
        trackingNotificationRuleId: rule.id,
        channel: rule.channel,
        status: 'PENDING',
        ...(recipient ? { recipient } : {}),
        ...(subject ? { subject } : {}),
        body,
        ...(rule.notificationProviderId ? { notificationProviderId: rule.notificationProviderId } : {}),
        ...(rule.notificationTemplateId ? { notificationTemplateId: rule.notificationTemplateId } : {}),
        metadata: {
          source: 'tracking_alert_automation',
          escalationLevel: rule.escalationLevel,
        } as Prisma.InputJsonValue,
      },
    });

    createdDeliveries.push(delivery);
  }

  return createdDeliveries;
}

export async function attemptNotificationDelivery(
  fastify: App,
  input: {
    deliveryId: string;
  }
) {
  const mailer = getMailer();
  const delivery = await fastify.prisma.notificationDelivery.findUnique({
    where: { id: input.deliveryId },
    include: {
      notificationProvider: true,
      notificationTemplate: true,
      trackingAlertEvent: true,
    },
  });

  if (!delivery) {
    throw new NotFoundError('Notification delivery not found');
  }

  if (delivery.status === 'SENT') {
    return delivery;
  }

  const providerType = delivery.notificationProvider?.providerType ?? 'CONSOLE';
  const now = new Date();

  await fastify.prisma.notificationDelivery.update({
    where: { id: delivery.id },
    data: {
      status: 'PROCESSING',
      lastAttemptAt: now,
      attemptCount: delivery.attemptCount + 1,
    },
  });

  try {
    let externalMessageId: string | undefined;

    switch (delivery.channel) {
      case 'EMAIL': {
        if (!delivery.recipient) {
          throw new ValidationAppError('Email delivery requires a recipient');
        }

        const result = await mailer.sendEmail({
          to: delivery.recipient,
          subject: delivery.subject ?? delivery.trackingAlertEvent?.title ?? 'Trackigniter8 notification',
          text: delivery.body,
          metadata: {
            deliveryId: delivery.id,
            providerType,
          },
        });

        externalMessageId = result.messageId;
        break;
      }
      case 'WEBHOOK':
      case 'IN_APP':
      case 'SMS': {
        const syntheticId = `${delivery.channel.toLowerCase()}-${crypto.randomUUID()}`;
        fastify.appLogger.info(
          {
            deliveryId: delivery.id,
            channel: delivery.channel,
            recipient: delivery.recipient,
            providerType,
          },
          'Simulated notification delivery'
        );
        externalMessageId = syntheticId;
        break;
      }
      default:
        throw new ValidationAppError('Unsupported notification channel');
    }

    return fastify.prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        externalMessageId,
        errorMessage: null,
      },
    });
  } catch (error) {
    return fastify.prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown delivery error',
      },
    });
  }
}

export async function buildTestDelivery(
  fastify: App,
  input: {
    organizationId?: string;
    notificationProviderId?: string;
    notificationTemplateId?: string;
    channel: 'EMAIL' | 'WEBHOOK' | 'IN_APP' | 'SMS';
    recipient?: string;
    subject?: string;
    body: string;
  }
) {
  return fastify.prisma.notificationDelivery.create({
    data: {
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      ...(input.notificationProviderId ? { notificationProviderId: input.notificationProviderId } : {}),
      ...(input.notificationTemplateId ? { notificationTemplateId: input.notificationTemplateId } : {}),
      channel: input.channel,
      status: 'PENDING',
      ...(input.recipient ? { recipient: input.recipient } : {}),
      ...(input.subject ? { subject: input.subject } : {}),
      body: input.body,
      metadata: {
        source: 'test_notification',
      } as Prisma.InputJsonValue,
    },
  });
}
