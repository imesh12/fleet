import type { FastifyInstance } from 'fastify';
import { Prisma } from '@trackigniter8/db';

type App = FastifyInstance;

export async function evaluateFuelAlerts(
  fastify: App,
  input: {
    organizationId?: string;
    daysAhead?: number;
    lowTankPercent?: number;
    createNotifications?: boolean;
    notificationProviderId?: string;
    notificationRecipient?: string;
  } = {}
) {
  const now = new Date();
  const cardExpiryDate = new Date(now.getTime() + (input.daysAhead ?? 30) * 24 * 60 * 60 * 1000);
  const lowTankPercent = input.lowTankPercent ?? 20;

  const [cards, tanks, draftEntries] = await Promise.all([
    fastify.prisma.fuelCard.findMany({
      where: {
        status: 'ACTIVE',
        expiryDate: { lte: cardExpiryDate },
        ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      },
      orderBy: [{ expiryDate: 'asc' }],
    }),
    fastify.prisma.fuelTank.findMany({
      where: {
        status: 'ACTIVE',
        currentLevel: { not: null },
        ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      },
      include: { fuelType: true },
    }),
    fastify.prisma.fuelEntry.findMany({
      where: {
        status: 'SUBMITTED',
        ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      },
      take: 100,
      orderBy: [{ createdAt: 'desc' }],
    }),
  ]);

  const alerts = [];

  for (const card of cards) {
    const isExpired = Boolean(card.expiryDate && card.expiryDate < now);
    alerts.push({
      type: 'CARD_EXPIRY',
      severity: isExpired ? 'HIGH' : 'MEDIUM',
      organizationId: card.organizationId,
      fuelCardId: card.id,
      title: isExpired ? 'Fuel card expired' : 'Fuel card expiring soon',
      message: `Fuel card ${card.cardNumberMasked} ${isExpired ? 'expired' : 'expires'} on ${card.expiryDate?.toISOString() ?? 'unknown date'}.`,
    });
  }

  for (const tank of tanks) {
    if (!tank.currentLevel || Number(tank.capacity.toString()) <= 0) {
      continue;
    }
    const percent = (Number(tank.currentLevel.toString()) / Number(tank.capacity.toString())) * 100;
    if (percent <= lowTankPercent) {
      alerts.push({
        type: 'TANK_LOW_LEVEL',
        severity: percent <= 10 ? 'HIGH' : 'MEDIUM',
        organizationId: tank.organizationId,
        fuelTankId: tank.id,
        title: 'Fuel tank low level',
        message: `Fuel tank ${tank.name} is at ${percent.toFixed(1)}% capacity.`,
        currentLevelPercent: percent,
      });
    }
  }

  for (const entry of draftEntries) {
    if (!entry.odometer) {
      alerts.push({
        type: 'POLICY_VIOLATION_PLACEHOLDER',
        severity: 'LOW',
        organizationId: entry.organizationId,
        fuelEntryId: entry.id,
        title: 'Fuel entry policy review',
        message: 'Fuel entry is submitted without odometer metadata.',
      });
    }
  }

  const deliveries = [];
  if (input.createNotifications && input.notificationRecipient) {
    for (const alert of alerts) {
      const delivery = await fastify.prisma.notificationDelivery.create({
        data: {
          organizationId: alert.organizationId,
          channel: 'EMAIL',
          status: 'PENDING',
          recipient: input.notificationRecipient,
          subject: alert.title,
          body: alert.message,
          ...(input.notificationProviderId ? { notificationProviderId: input.notificationProviderId } : {}),
          metadata: {
            source: 'fuel_alert_evaluation',
            alert,
          } as Prisma.InputJsonValue,
        },
      });
      deliveries.push(delivery);
    }
  }

  return {
    items: alerts,
    summary: {
      cardExpiryCount: alerts.filter((alert) => alert.type === 'CARD_EXPIRY').length,
      tankLowLevelCount: alerts.filter((alert) => alert.type === 'TANK_LOW_LEVEL').length,
      policyViolationPlaceholderCount: alerts.filter((alert) => alert.type === 'POLICY_VIOLATION_PLACEHOLDER').length,
      notificationDeliveryCount: deliveries.length,
      totalCount: alerts.length,
    },
    deliveries,
  };
}
