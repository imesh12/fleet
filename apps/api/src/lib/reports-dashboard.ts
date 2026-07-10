import type { FastifyInstance } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { NotFoundError } from '@trackigniter8/errors';

type App = FastifyInstance;

export async function buildDashboardSummary(
  fastify: App,
  input: {
    organizationId: string;
    persistSnapshot?: boolean;
  }
) {
  const organizationId = input.organizationId;
  const [
    vehiclesTotal,
    vehiclesActive,
    driversTotal,
    driversActive,
    tripsTotal,
    tripsActive,
    maintenanceRequestsOpen,
    maintenanceWorkOrdersOpen,
    fuelEntriesSubmitted,
    fuelCardsExpiring,
    trackingProvidersOffline,
    openTrackingAlerts,
  ] = await Promise.all([
    fastify.prisma.vehicle.count({ where: { organizationId } }),
    fastify.prisma.vehicle.count({ where: { organizationId, status: 'ACTIVE' } }),
    fastify.prisma.driver.count({ where: { organizationId } }),
    fastify.prisma.driver.count({ where: { organizationId, status: 'ACTIVE' } }),
    fastify.prisma.trip.count({ where: { organizationId } }),
    fastify.prisma.trip.count({ where: { organizationId, status: { in: ['SCHEDULED', 'READY', 'DISPATCHED', 'STARTED', 'ON_HOLD', 'RESUMED'] } } }),
    fastify.prisma.maintenanceRequest.count({ where: { organizationId, status: { in: ['REQUESTED', 'APPROVED', 'SCHEDULED'] } } }),
    fastify.prisma.maintenanceWorkOrder.count({ where: { organizationId, status: { in: ['REQUESTED', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS_PLACEHOLDER'] } } }),
    fastify.prisma.fuelEntry.count({ where: { organizationId, status: 'SUBMITTED' } }),
    fastify.prisma.fuelCard.count({
      where: {
        organizationId,
        status: 'ACTIVE',
        expiryDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    fastify.prisma.trackingProviderHealth.count({ where: { trackingProvider: { organizationId }, status: { in: ['OFFLINE', 'ERROR'] } } }),
    fastify.prisma.trackingAlertEvent.count({ where: { organizationId, status: 'OPEN' } }),
  ]);

  const summary = {
    vehicleSummary: { total: vehiclesTotal, active: vehiclesActive },
    driverSummary: { total: driversTotal, active: driversActive },
    tripSummary: { total: tripsTotal, active: tripsActive },
    maintenanceSummary: { openRequests: maintenanceRequestsOpen, openWorkOrders: maintenanceWorkOrdersOpen },
    fuelSummary: { submittedEntries: fuelEntriesSubmitted, cardsExpiringSoon: fuelCardsExpiring },
    trackingHealthSummary: { offlineOrErrorProviders: trackingProvidersOffline },
    alertSummary: { openTrackingAlerts },
  };

  const snapshot = input.persistSnapshot
    ? await fastify.prisma.dashboardSnapshot.create({
        data: {
          organizationId,
          summary: summary as Prisma.InputJsonValue,
          metadata: { source: 'dashboard_summary_api' } as Prisma.InputJsonValue,
        },
      })
    : null;

  return { summary, snapshot };
}

export async function runReportPlaceholder(
  fastify: App,
  input: {
    organizationId: string;
    reportDefinitionId?: string;
    filters?: Record<string, unknown>;
    triggeredByUserId?: string;
  }
) {
  const definition = input.reportDefinitionId
    ? await fastify.prisma.reportDefinition.findUnique({ where: { id: input.reportDefinitionId } })
    : null;

  if (input.reportDefinitionId && !definition) {
    throw new NotFoundError('Report definition not found');
  }

  const summary = await buildDashboardSummary(fastify, {
    organizationId: input.organizationId,
    persistSnapshot: false,
  });

  return fastify.prisma.reportRun.create({
    data: {
      organizationId: input.organizationId,
      ...(input.reportDefinitionId ? { reportDefinitionId: input.reportDefinitionId } : {}),
      status: 'COMPLETED',
      startedAt: new Date(),
      finishedAt: new Date(),
      rowCount: 1,
      resultSummary: summary.summary as Prisma.InputJsonValue,
      ...(input.filters ? { filters: input.filters as Prisma.InputJsonValue } : {}),
      ...(input.triggeredByUserId ? { triggeredByUserId: input.triggeredByUserId } : {}),
      metadata: {
        reportType: definition?.reportType ?? 'CUSTOM',
        placeholder: true,
      } as Prisma.InputJsonValue,
    },
  });
}

export async function completeReportExportPlaceholder(
  fastify: App,
  input: {
    reportExportJobId: string;
  }
) {
  const exportJob = await fastify.prisma.reportExportJob.findUnique({ where: { id: input.reportExportJobId } });
  if (!exportJob) {
    throw new NotFoundError('Report export job not found');
  }

  return fastify.prisma.reportExportJob.update({
    where: { id: exportJob.id },
    data: {
      status: 'COMPLETED_PLACEHOLDER',
      completedAt: new Date(),
      fileName: exportJob.fileName ?? `report-export-${exportJob.id}.${exportJob.format.toLowerCase()}`,
      metadata: {
        placeholder: true,
        message: 'Export generation is intentionally deferred until a later stage.',
      } as Prisma.InputJsonValue,
    },
  });
}
