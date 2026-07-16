import 'dotenv/config';

import { prisma } from '../packages/db/src/index.js';

const DEMO_ORG_CODE = 'DEMO-TOKYO';

type Check = {
  name: string;
  actual: number | string | boolean;
  expected: string;
  passed: boolean;
};

function minCheck(name: string, actual: number, min: number): Check {
  return {
    name,
    actual,
    expected: `>= ${min}`,
    passed: actual >= min,
  };
}

async function main() {
  const organization = await prisma.organization.findUnique({ where: { code: DEMO_ORG_CODE } });
  const checks: Check[] = [
    {
      name: 'Demo organization exists',
      actual: Boolean(organization),
      expected: 'true',
      passed: Boolean(organization),
    },
  ];

  if (!organization) {
    throw new Error(`Demo organization ${DEMO_ORG_CODE} was not found. Run npm run demo:seed first.`);
  }

  const organizationId = organization.id;
  const [
    vehicles,
    drivers,
    serviceRoutes,
    plannedTrips,
    executedTrips,
    latestPositions,
    telemetryEvents,
    maintenanceRequests,
    maintenanceWorkOrders,
    fuelEntries,
    reportDefinitions,
    dashboardWidgets,
    trackingAlertEvents,
    backgroundJobs,
    files,
    demoUsers,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { organizationId, registrationNumber: { startsWith: 'DEMO-VEH-' } } }),
    prisma.driver.count({ where: { organizationId, employeeNumber: { startsWith: 'DEMO-DRV-' } } }),
    prisma.serviceRoute.count({ where: { organizationId, code: { startsWith: 'ROUTE-' } } }),
    prisma.plannedTrip.count({ where: { organizationId, referenceCode: { startsWith: 'PTRIP-' } } }),
    prisma.trip.count({ where: { organizationId, referenceCode: { startsWith: 'TRIP-' } } }),
    prisma.vehiclePosition.count({ where: { organizationId } }),
    prisma.vehicleTelemetryEvent.count({ where: { organizationId } }),
    prisma.maintenanceRequest.count({ where: { organizationId, title: { startsWith: 'DEMO-MR-' } } }),
    prisma.maintenanceWorkOrder.count({ where: { organizationId, workOrderNumber: { startsWith: 'DEMO-WO-' } } }),
    prisma.fuelEntry.count({ where: { organizationId, notes: { startsWith: 'DEMO-SEED' } } }),
    prisma.reportDefinition.count({ where: { organizationId, code: { startsWith: 'RDEF-' } } }),
    prisma.dashboardWidgetDefinition.count({ where: { organizationId, code: { startsWith: 'DWIDGET-' } } }),
    prisma.trackingAlertEvent.count({ where: { organizationId } }),
    prisma.backgroundJobDefinition.count({ where: { organizationId, code: { startsWith: 'DEMO-JOB-' } } }),
    prisma.fileObject.count({ where: { organizationId, originalFileName: { startsWith: 'demo-' } } }),
    prisma.user.count({ where: { email: { endsWith: '.demo@trackigniter8.local' } } }),
  ]);

  checks.push(
    minCheck('Demo users', demoUsers, 11),
    minCheck('Vehicles', vehicles, 20),
    minCheck('Drivers', drivers, 20),
    minCheck('Service routes', serviceRoutes, 30),
    minCheck('Planned trips', plannedTrips, 60),
    minCheck('Executed trips', executedTrips, 20),
    minCheck('Latest vehicle positions', latestPositions, 20),
    minCheck('Telemetry history events', telemetryEvents, 8000),
    minCheck('Maintenance requests', maintenanceRequests, 40),
    minCheck('Maintenance work orders', maintenanceWorkOrders, 35),
    minCheck('Fuel entries', fuelEntries, 120),
    minCheck('Report definitions', reportDefinitions, 20),
    minCheck('Dashboard widgets', dashboardWidgets, 12),
    minCheck('Tracking alert events', trackingAlertEvents, 60),
    minCheck('Background jobs', backgroundJobs, 9),
    minCheck('File metadata records', files, 20),
  );

  const demoVehicleCodes = (
    await prisma.vehicle.findMany({
      where: { organizationId, registrationNumber: { startsWith: 'DEMO-VEH-' } },
      select: { registrationNumber: true },
    })
  )
    .map((vehicle) => vehicle.registrationNumber)
    .filter(Boolean);
  const demoDriverCodes = (
    await prisma.driver.findMany({
      where: { organizationId, employeeNumber: { startsWith: 'DEMO-DRV-' } },
      select: { employeeNumber: true },
    })
  ).map((driver) => driver.employeeNumber);
  const duplicateVehicleCodes = demoVehicleCodes.length - new Set(demoVehicleCodes).size;
  const duplicateDriverCodes = demoDriverCodes.length - new Set(demoDriverCodes).size;

  checks.push(
    {
      name: 'Duplicate demo vehicle codes',
      actual: duplicateVehicleCodes,
      expected: '0',
      passed: duplicateVehicleCodes === 0,
    },
    {
      name: 'Duplicate demo driver codes',
      actual: duplicateDriverCodes,
      expected: '0',
      passed: duplicateDriverCodes === 0,
    },
  );

  const failed = checks.filter((check) => !check.passed);
  console.table(checks.map(({ name, actual, expected, passed }) => ({ name, actual, expected, status: passed ? 'PASS' : 'FAIL' })));

  if (failed.length > 0) {
    throw new Error(`Demo seed verification failed: ${failed.map((check) => check.name).join(', ')}`);
  }

  console.log('Demo seed verification passed.');
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
