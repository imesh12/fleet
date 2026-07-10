import type { FastifyInstance } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { createMailer, getMailer } from '@trackigniter8/mailer';

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

function calculateNextAttemptAt(attemptCount: number, maxAttempts: number) {
  if (attemptCount >= maxAttempts) {
    return null;
  }
  const delaySeconds = Math.min(3600, 30 * 2 ** Math.max(0, attemptCount - 1));
  return new Date(Date.now() + delaySeconds * 1000);
}

function getProviderConfig(value: Prisma.JsonValue | null | undefined) {
  return asObject(value);
}

async function deliverWebhook(input: {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body: string;
  timeoutMs?: number;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 10_000);
  try {
    const response = await fetch(input.url, {
      method: input.method ?? 'POST',
      headers: {
        'content-type': 'application/json',
        ...(input.headers ?? {}),
      },
      body: input.body,
      signal: controller.signal,
    });
    const responseBody = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      body: responseBody.slice(0, 5000),
    };
  } finally {
    clearTimeout(timeout);
  }
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
  const providerConfig = getProviderConfig(delivery.notificationProvider?.config);
  const maxAttempts = delivery.maxAttempts || 3;
  const now = new Date();
  const nextAttemptCount = delivery.attemptCount + 1;

  await fastify.prisma.notificationDelivery.update({
    where: { id: delivery.id },
    data: {
      status: 'PROCESSING',
      lastAttemptAt: now,
      attemptCount: nextAttemptCount,
    },
  });

  try {
    let externalMessageId: string | undefined;
    let providerResponse: Record<string, unknown> | undefined;

    switch (delivery.channel) {
      case 'EMAIL': {
        if (!delivery.recipient) {
          throw new ValidationAppError('Email delivery requires a recipient');
        }

        const smtpConfig = asObject(providerConfig.smtp as Prisma.JsonValue | null | undefined);
        const smtpMailerConfig = {
          ...(typeof smtpConfig.host === 'string' ? { host: smtpConfig.host } : {}),
          ...(typeof smtpConfig.port === 'number' ? { port: smtpConfig.port } : {}),
          ...(typeof smtpConfig.secure === 'boolean' ? { secure: smtpConfig.secure } : {}),
          ...(typeof smtpConfig.username === 'string' ? { username: smtpConfig.username } : {}),
          ...(typeof smtpConfig.from === 'string' ? { from: smtpConfig.from } : {}),
        };
        const mailer =
          providerType === 'EMAIL' && Object.keys(smtpConfig).length > 0
            ? createMailer(fastify.appLogger, {
                provider: 'smtp',
                smtp: smtpMailerConfig,
              })
            : getMailer();
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
        providerResponse = result;
        break;
      }
      case 'WEBHOOK': {
        const url = typeof providerConfig.url === 'string' ? providerConfig.url : delivery.recipient;
        if (!url) {
          throw new ValidationAppError('Webhook delivery requires provider config url or recipient URL');
        }
        const headers =
          providerConfig.headers && typeof providerConfig.headers === 'object' && !Array.isArray(providerConfig.headers)
            ? (providerConfig.headers as Record<string, string>)
            : undefined;
        const timeoutMs = typeof providerConfig.timeoutMs === 'number' ? providerConfig.timeoutMs : undefined;
        const webhookResult = await deliverWebhook({
          url,
          method: typeof providerConfig.method === 'string' ? providerConfig.method : 'POST',
          ...(headers ? { headers } : {}),
          body: delivery.body,
          ...(timeoutMs ? { timeoutMs } : {}),
        });
        if (!webhookResult.ok) {
          throw new ValidationAppError(`Webhook delivery failed with status ${webhookResult.status}`);
        }
        providerResponse = webhookResult;
        externalMessageId = `webhook-${crypto.randomUUID()}`;
        break;
      }
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
        providerResponse = {
          provider: providerType,
          simulated: true,
        };
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
        failureReason: null,
        nextAttemptAt: null,
        ...(providerResponse ? { providerResponse: providerResponse as Prisma.InputJsonValue } : {}),
      },
    });
  } catch (error) {
    const failureReason = error instanceof Error ? error.message : 'Unknown delivery error';
    return fastify.prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        errorMessage: failureReason,
        failureReason,
        nextAttemptAt: calculateNextAttemptAt(nextAttemptCount, maxAttempts),
        providerResponse: {
          provider: providerType,
          error: failureReason,
        } as Prisma.InputJsonValue,
      },
    });
  }
}

export async function retryDueNotificationDeliveries(
  fastify: App,
  input: {
    organizationId?: string;
    limit?: number;
  } = {}
) {
  const now = new Date();
  const deliveries = await fastify.prisma.notificationDelivery.findMany({
    where: {
      status: { in: ['PENDING', 'FAILED'] },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
    },
    orderBy: [{ nextAttemptAt: 'asc' }, { createdAt: 'asc' }],
    take: input.limit ?? 100,
  });

  const results = [];
  for (const delivery of deliveries) {
    if (delivery.attemptCount >= delivery.maxAttempts) {
      continue;
    }
    results.push(await attemptNotificationDelivery(fastify, { deliveryId: delivery.id }));
  }

  return {
    processedCount: results.length,
    items: results,
  };
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
        maxAttempts: 3,
        metadata: {
        source: 'test_notification',
      } as Prisma.InputJsonValue,
    },
  });
}
