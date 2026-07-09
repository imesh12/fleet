import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import {
  findDriverOrThrow,
  findDriverVehicleAssignmentOrThrow,
  findFleetReadinessProfileOrThrow,
  findVehicleOrThrow,
} from '../utils.js';

const evaluateFleetReadinessQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(),
  assignmentId: z.string().min(1).optional(),
  readinessProfileId: z.string().min(1).optional(),
});

type ReadinessCheck = {
  code: string;
  label: string;
  passed: boolean;
  severity: 'blocker' | 'warning' | 'info';
  details?: string;
};

function addCheck(result: {
  checks: ReadinessCheck[];
  blockers: string[];
  warnings: string[];
}, check: ReadinessCheck) {
  result.checks.push(check);
  if (!check.passed) {
    if (check.severity === 'blocker') {
      result.blockers.push(check.details ?? check.label);
    } else if (check.severity === 'warning') {
      result.warnings.push(check.details ?? check.label);
    }
  }
}

export const adminFleetReadinessRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/fleet-readiness/evaluate', { preHandler: [fastify.authenticate, fastify.requirePermission('fleet-readiness:read')] }, async (request, reply) => {
    const query = validateOrThrow(evaluateFleetReadinessQuerySchema, request.query);
    let resolvedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();

    const result: {
      ready: boolean;
      checks: ReadinessCheck[];
      warnings: string[];
      blockers: string[];
      context: Record<string, unknown>;
    } = {
      ready: false,
      checks: [],
      warnings: [],
      blockers: [],
      context: {},
    };

    let assignment: Awaited<ReturnType<typeof findDriverVehicleAssignmentOrThrow>> | null = null;
    if (query.assignmentId) {
      assignment = await findDriverVehicleAssignmentOrThrow(fastify.prisma, query.assignmentId);
      resolvedOrganizationId = resolvedOrganizationId ?? assignment.organizationId;
      result.context.assignmentId = assignment.id;
    }

    if (!resolvedOrganizationId) {
      throw new ValidationAppError('Organization context is required for fleet readiness evaluation', { header: 'x-organization-id' });
    }

    await fastify.requireOrganizationAccess(request, resolvedOrganizationId);

    const readinessProfile = query.readinessProfileId
      ? await findFleetReadinessProfileOrThrow(fastify.prisma, query.readinessProfileId)
      : await fastify.prisma.fleetReadinessProfile.findFirst({
          where: { organizationId: resolvedOrganizationId, status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
        });

    if (readinessProfile && readinessProfile.organizationId !== resolvedOrganizationId) {
      throw new ValidationAppError('Readiness profile must belong to the requested organization');
    }

    let vehicle = query.vehicleId ? await findVehicleOrThrow(fastify.prisma, query.vehicleId) : null;
    if (!vehicle && assignment) {
      vehicle = await findVehicleOrThrow(fastify.prisma, assignment.vehicleId);
    }
    if (vehicle && vehicle.organizationId !== resolvedOrganizationId) {
      throw new ValidationAppError('Vehicle must belong to the requested organization');
    }

    let driver = query.driverId ? await findDriverOrThrow(fastify.prisma, query.driverId) : null;
    if (!driver && assignment) {
      driver = await findDriverOrThrow(fastify.prisma, assignment.driverId);
    }
    if (driver && driver.organizationId !== resolvedOrganizationId) {
      throw new ValidationAppError('Driver must belong to the requested organization');
    }

    result.context.organizationId = resolvedOrganizationId;
    result.context.readinessProfileId = readinessProfile?.id ?? null;
    result.context.vehicleId = vehicle?.id ?? null;
    result.context.driverId = driver?.id ?? null;

    const now = new Date();

    if (readinessProfile?.requireActiveVehicle) {
      addCheck(result, {
        code: 'vehicle.active',
        label: 'Vehicle must be active',
        passed: !!vehicle && vehicle.status === 'ACTIVE',
        severity: 'blocker',
        details: vehicle ? `Vehicle status is ${vehicle.status}` : 'Vehicle is required for this readiness profile',
      });
    } else if (vehicle) {
      addCheck(result, {
        code: 'vehicle.present',
        label: 'Vehicle context present',
        passed: true,
        severity: 'info',
        details: `Vehicle ${vehicle.id} loaded`,
      });
    }

    if (readinessProfile?.requireActiveDriver) {
      addCheck(result, {
        code: 'driver.active',
        label: 'Driver must be active',
        passed: !!driver && driver.status === 'ACTIVE',
        severity: 'blocker',
        details: driver ? `Driver status is ${driver.status}` : 'Driver is required for this readiness profile',
      });
    } else if (driver) {
      addCheck(result, {
        code: 'driver.present',
        label: 'Driver context present',
        passed: true,
        severity: 'info',
        details: `Driver ${driver.id} loaded`,
      });
    }

    if (vehicle) {
      const activeVehicleDocs = vehicle.documents.filter((document) => document.status === 'ACTIVE');
      const validVehicleDocs = activeVehicleDocs.filter((document) => !document.expiryDate || document.expiryDate >= now);
      const expiredVehicleDocs = activeVehicleDocs.filter((document) => !!document.expiryDate && document.expiryDate < now);

      if (readinessProfile?.requireValidVehicleDocuments) {
        addCheck(result, {
          code: 'vehicle.documents.valid',
          label: 'Vehicle must have valid active documents',
          passed: validVehicleDocs.length > 0 && expiredVehicleDocs.length === 0,
          severity: 'blocker',
          details:
            expiredVehicleDocs.length > 0
              ? `${expiredVehicleDocs.length} active vehicle document(s) are expired`
              : validVehicleDocs.length === 0
                ? 'No valid active vehicle documents found'
                : 'Vehicle documents are valid',
        });
      }

      const expiredVehicleComplianceRecords = await fastify.prisma.vehicleComplianceRecord.findMany({
        where: {
          vehicleId: vehicle.id,
          status: 'ACTIVE',
          expiryDate: { not: null, lt: now },
        },
        include: { vehicleComplianceType: true },
      });

      addCheck(result, {
        code: 'vehicle.compliance.expired',
        label: 'Vehicle compliance records should not be expired',
        passed: expiredVehicleComplianceRecords.length === 0,
        severity: expiredVehicleComplianceRecords.length > 0 ? 'blocker' : 'info',
        details:
          expiredVehicleComplianceRecords.length > 0
            ? `Expired vehicle compliance records: ${expiredVehicleComplianceRecords.map((record: { vehicleComplianceType: { name: string } }) => record.vehicleComplianceType.name).join(', ')}`
            : 'No expired active vehicle compliance records',
      });

      if (readinessProfile?.requireActiveDevice) {
        const activeDevices = vehicle.devices.filter((device) => device.status === 'ACTIVE');
        addCheck(result, {
          code: 'vehicle.device.active',
          label: 'Vehicle must have an active device',
          passed: activeDevices.length > 0,
          severity: 'blocker',
          details: activeDevices.length > 0 ? `${activeDevices.length} active device(s) found` : 'No active devices found',
        });
      }
    }

    if (driver) {
      const activeLicenses = driver.licenses.filter((license) => license.status === 'ACTIVE');
      const validLicenses = activeLicenses.filter((license) => !license.expiryDate || license.expiryDate >= now);
      const expiredLicenses = activeLicenses.filter((license) => !!license.expiryDate && license.expiryDate < now);

      if (readinessProfile?.requireValidDriverLicense) {
        addCheck(result, {
          code: 'driver.license.valid',
          label: 'Driver must have a valid active license',
          passed: validLicenses.length > 0 && expiredLicenses.length === 0,
          severity: 'blocker',
          details:
            expiredLicenses.length > 0
              ? `${expiredLicenses.length} active driver license(s) are expired`
              : validLicenses.length === 0
                ? 'No valid active driver licenses found'
                : 'Driver licenses are valid',
        });
      }

      const expiredDriverComplianceRecords = await fastify.prisma.driverComplianceRecord.findMany({
        where: {
          driverId: driver.id,
          status: 'ACTIVE',
          expiryDate: { not: null, lt: now },
        },
        include: { driverComplianceType: true },
      });

      addCheck(result, {
        code: 'driver.compliance.expired',
        label: 'Driver compliance records should not be expired',
        passed: expiredDriverComplianceRecords.length === 0,
        severity: expiredDriverComplianceRecords.length > 0 ? 'blocker' : 'info',
        details:
          expiredDriverComplianceRecords.length > 0
            ? `Expired driver compliance records: ${expiredDriverComplianceRecords.map((record: { driverComplianceType: { name: string } }) => record.driverComplianceType.name).join(', ')}`
            : 'No expired active driver compliance records',
      });
    }

    if (readinessProfile?.requireActiveAssignment) {
      let activeAssignment = assignment;
      if (!activeAssignment && driver && vehicle) {
        activeAssignment = await fastify.prisma.driverVehicleAssignment.findFirst({
          where: {
            organizationId: resolvedOrganizationId,
            driverId: driver.id,
            vehicleId: vehicle.id,
            status: 'ACTIVE',
          },
          include: {
            driver: true,
            vehicle: true,
          },
        });
      }

      addCheck(result, {
        code: 'assignment.active',
        label: 'Active assignment required',
        passed: !!activeAssignment && activeAssignment.status === 'ACTIVE',
        severity: 'blocker',
        details: activeAssignment ? `Assignment ${activeAssignment.id} is active` : 'No active assignment found',
      });
    } else if (assignment) {
      addCheck(result, {
        code: 'assignment.present',
        label: 'Assignment context present',
        passed: true,
        severity: 'info',
        details: `Assignment ${assignment.id} loaded`,
      });
    }

    result.ready = result.blockers.length === 0;
    return reply.success(result);
  });
};
