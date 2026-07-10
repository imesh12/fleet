import type { FastifyInstance } from 'fastify';
import { Prisma } from '@trackigniter8/db';

type App = FastifyInstance;

export type MaintenanceDueStatus = 'OVERDUE' | 'DUE' | 'UPCOMING';

export async function evaluateMaintenanceDue(
  fastify: App,
  input: {
    organizationId?: string;
    vehicleId?: string;
    daysAhead?: number;
    odometerAheadKm?: number;
    createNotifications?: boolean;
    notificationProviderId?: string;
    notificationRecipient?: string;
  } = {}
) {
  const now = new Date();
  const upcomingDate = new Date(now.getTime() + (input.daysAhead ?? 30) * 24 * 60 * 60 * 1000);
  const odometerAheadKm = input.odometerAheadKm ?? 1000;

  const plans = await fastify.prisma.vehicleMaintenancePlan.findMany({
    where: {
      status: 'ACTIVE',
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      ...(input.vehicleId ? { vehicleId: input.vehicleId } : {}),
    },
    include: {
      vehicle: true,
      tasks: {
        where: { status: 'ACTIVE' },
        include: { maintenanceServiceTask: true },
        orderBy: [{ sequence: 'asc' }, { createdAt: 'asc' }],
      },
    },
    orderBy: [{ nextDueAt: 'asc' }, { createdAt: 'asc' }],
  });

  const items = [];

  for (const plan of plans) {
    const planOdometer = plan.vehicle.odometer ?? 0;
    for (const task of plan.tasks) {
      const dateDue = task.nextDueAt ?? plan.nextDueAt;
      const odometerDue = task.nextDueOdometer ?? plan.nextDueOdometer;
      const isDateOverdue = Boolean(dateDue && dateDue < now);
      const isDateUpcoming = Boolean(dateDue && dateDue >= now && dateDue <= upcomingDate);
      const isOdometerOverdue = Boolean(odometerDue !== null && odometerDue !== undefined && planOdometer >= odometerDue);
      const isOdometerUpcoming = Boolean(
        odometerDue !== null && odometerDue !== undefined && planOdometer < odometerDue && odometerDue - planOdometer <= odometerAheadKm
      );

      if (!isDateOverdue && !isDateUpcoming && !isOdometerOverdue && !isOdometerUpcoming) {
        continue;
      }

      const status: MaintenanceDueStatus = isDateOverdue || isOdometerOverdue ? 'OVERDUE' : isDateUpcoming || isOdometerUpcoming ? 'UPCOMING' : 'DUE';
      items.push({
        organizationId: plan.organizationId,
        vehicleId: plan.vehicleId,
        vehicleMaintenancePlanId: plan.id,
        vehicleMaintenancePlanTaskId: task.id,
        maintenanceServiceTaskId: task.maintenanceServiceTaskId,
        planName: plan.name,
        taskName: task.name,
        dueStatus: status,
        nextDueAt: dateDue,
        nextDueOdometer: odometerDue,
        currentOdometer: planOdometer,
        dueByDate: isDateOverdue || isDateUpcoming,
        dueByOdometer: isOdometerOverdue || isOdometerUpcoming,
      });
    }
  }

  const deliveries = [];
  if (input.createNotifications && input.notificationRecipient) {
    for (const item of items.filter((entry) => entry.dueStatus === 'OVERDUE' || entry.dueStatus === 'DUE')) {
      const delivery = await fastify.prisma.notificationDelivery.create({
        data: {
          organizationId: item.organizationId,
          channel: 'EMAIL',
          status: 'PENDING',
          recipient: input.notificationRecipient,
          subject: `Maintenance ${item.dueStatus.toLowerCase()}: ${item.taskName}`,
          body: `Maintenance task "${item.taskName}" for plan "${item.planName}" is ${item.dueStatus.toLowerCase()}.`,
          ...(input.notificationProviderId ? { notificationProviderId: input.notificationProviderId } : {}),
          metadata: {
            source: 'maintenance_due_evaluation',
            vehicleId: item.vehicleId,
            vehicleMaintenancePlanId: item.vehicleMaintenancePlanId,
            vehicleMaintenancePlanTaskId: item.vehicleMaintenancePlanTaskId,
            dueStatus: item.dueStatus,
          } as Prisma.InputJsonValue,
        },
      });
      deliveries.push(delivery);
    }
  }

  return {
    items,
    summary: {
      planCount: plans.length,
      dueCount: items.filter((item) => item.dueStatus === 'DUE').length,
      overdueCount: items.filter((item) => item.dueStatus === 'OVERDUE').length,
      upcomingCount: items.filter((item) => item.dueStatus === 'UPCOMING').length,
      notificationDeliveryCount: deliveries.length,
    },
    deliveries,
  };
}
