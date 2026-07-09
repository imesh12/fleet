import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { validateOrThrow } from '@trackigniter8/validation';
import { ValidationAppError } from '@trackigniter8/errors';

import {
  findAssignmentPolicyOrThrow,
  findFleetReadinessProfileOrThrow,
  findPlannedTripOrThrow,
  getAuditContext,
} from '../utils.js';

const validateDispatchSchema = z.object({
  plannedTripId: z.string().min(1),
  assignmentPolicyId: z.string().min(1).optional(),
  readinessProfileId: z.string().min(1).optional(),
});

type ValidationCheck = {
  code: string;
  label: string;
  passed: boolean;
  severity: 'blocker' | 'warning' | 'info';
  details?: string;
};

function addCheck(result: { checks: ValidationCheck[]; blockers: string[]; warnings: string[] }, check: ValidationCheck) {
  result.checks.push(check);
  if (!check.passed) {
    if (check.severity === 'blocker') {
      result.blockers.push(check.details ?? check.label);
    } else if (check.severity === 'warning') {
      result.warnings.push(check.details ?? check.label);
    }
  }
}

export const adminDispatchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/admin/dispatch/validate', { preHandler: [fastify.authenticate, fastify.requirePermission('dispatch-validation:read')] }, async (request, reply) => {
    const body = validateOrThrow(validateDispatchSchema, request.body);
    const trip = await findPlannedTripOrThrow(fastify.prisma, body.plannedTripId);
    await fastify.requireOrganizationAccess(request, trip.organizationId);

    const readinessProfile = body.readinessProfileId
      ? await findFleetReadinessProfileOrThrow(fastify.prisma, body.readinessProfileId)
      : await fastify.prisma.fleetReadinessProfile.findFirst({
          where: { organizationId: trip.organizationId, status: 'ACTIVE' },
          orderBy: { createdAt: 'asc' },
        });

    if (readinessProfile && readinessProfile.organizationId !== trip.organizationId) {
      throw new ValidationAppError('Readiness profile must belong to the planned trip organization');
    }

    const assignmentPolicy = body.assignmentPolicyId
      ? await findAssignmentPolicyOrThrow(fastify.prisma, body.assignmentPolicyId)
      : await fastify.prisma.assignmentPolicy.findFirst({
          where: { organizationId: trip.organizationId, status: 'ACTIVE' },
          include: { rules: { where: { isActive: true }, orderBy: { sequence: 'asc' } } },
          orderBy: { createdAt: 'asc' },
        });

    if (assignmentPolicy && assignmentPolicy.organizationId !== trip.organizationId) {
      throw new ValidationAppError('Assignment policy must belong to the planned trip organization');
    }

    const readinessResult: {
      ready: boolean;
      checks: ValidationCheck[];
      warnings: string[];
      blockers: string[];
    } = {
      ready: false,
      checks: [],
      warnings: [],
      blockers: [],
    };

    const now = new Date();
    const vehicle = trip.vehicle;
    const driver = trip.driver;
    const assignment = trip.assignment;

    if (readinessProfile?.requireActiveVehicle) {
      addCheck(readinessResult, {
        code: 'vehicle.active',
        label: 'Vehicle must be active',
        passed: !!vehicle && vehicle.status === 'ACTIVE',
        severity: 'blocker',
        details: vehicle ? `Vehicle status is ${vehicle.status}` : 'Vehicle is required',
      });
    }

    if (readinessProfile?.requireActiveDriver) {
      addCheck(readinessResult, {
        code: 'driver.active',
        label: 'Driver must be active',
        passed: !!driver && driver.status === 'ACTIVE',
        severity: 'blocker',
        details: driver ? `Driver status is ${driver.status}` : 'Driver is required',
      });
    }

    if (vehicle && readinessProfile?.requireValidVehicleDocuments) {
      const activeDocs = vehicle.documents.filter((entry) => entry.status === 'ACTIVE');
      const validDocs = activeDocs.filter((entry) => !entry.expiryDate || entry.expiryDate >= now);
      const expiredDocs = activeDocs.filter((entry) => !!entry.expiryDate && entry.expiryDate < now);
      addCheck(readinessResult, {
        code: 'vehicle.documents.valid',
        label: 'Vehicle must have valid active documents',
        passed: validDocs.length > 0 && expiredDocs.length === 0,
        severity: 'blocker',
        details:
          expiredDocs.length > 0
            ? `${expiredDocs.length} active vehicle document(s) are expired`
            : validDocs.length === 0
              ? 'No valid active vehicle documents found'
              : 'Vehicle documents are valid',
      });
    }

    if (driver && readinessProfile?.requireValidDriverLicense) {
      const activeLicenses = driver.licenses.filter((entry) => entry.status === 'ACTIVE');
      const validLicenses = activeLicenses.filter((entry) => !entry.expiryDate || entry.expiryDate >= now);
      const expiredLicenses = activeLicenses.filter((entry) => !!entry.expiryDate && entry.expiryDate < now);
      addCheck(readinessResult, {
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

    if (vehicle) {
      const expiredVehicleCompliance = await fastify.prisma.vehicleComplianceRecord.findMany({
        where: {
          vehicleId: vehicle.id,
          status: 'ACTIVE',
          expiryDate: { not: null, lt: now },
        },
        include: { vehicleComplianceType: true },
      });
      addCheck(readinessResult, {
        code: 'vehicle.compliance.expired',
        label: 'Vehicle compliance records should not be expired',
        passed: expiredVehicleCompliance.length === 0,
        severity: expiredVehicleCompliance.length > 0 ? 'blocker' : 'info',
        details:
          expiredVehicleCompliance.length > 0
            ? `Expired vehicle compliance records: ${expiredVehicleCompliance.map((entry) => entry.vehicleComplianceType.name).join(', ')}`
            : 'No expired active vehicle compliance records',
      });
    }

    if (driver) {
      const expiredDriverCompliance = await fastify.prisma.driverComplianceRecord.findMany({
        where: {
          driverId: driver.id,
          status: 'ACTIVE',
          expiryDate: { not: null, lt: now },
        },
        include: { driverComplianceType: true },
      });
      addCheck(readinessResult, {
        code: 'driver.compliance.expired',
        label: 'Driver compliance records should not be expired',
        passed: expiredDriverCompliance.length === 0,
        severity: expiredDriverCompliance.length > 0 ? 'blocker' : 'info',
        details:
          expiredDriverCompliance.length > 0
            ? `Expired driver compliance records: ${expiredDriverCompliance.map((entry) => entry.driverComplianceType.name).join(', ')}`
            : 'No expired active driver compliance records',
      });
    }

    if (vehicle && readinessProfile?.requireActiveDevice) {
      const activeDevices = vehicle.devices.filter((entry) => entry.status === 'ACTIVE');
      addCheck(readinessResult, {
        code: 'vehicle.device.active',
        label: 'Vehicle must have an active device',
        passed: activeDevices.length > 0,
        severity: 'blocker',
        details: activeDevices.length > 0 ? `${activeDevices.length} active device(s) found` : 'No active devices found',
      });
    }

    if (readinessProfile?.requireActiveAssignment) {
      addCheck(readinessResult, {
        code: 'assignment.active',
        label: 'Active assignment required',
        passed: !!assignment && assignment.status === 'ACTIVE',
        severity: 'blocker',
        details: assignment ? `Assignment ${assignment.id} is active` : 'No active assignment found',
      });
    }

    readinessResult.ready = readinessResult.blockers.length === 0;

    const policyChecks: ValidationCheck[] = [];
    const blockers: string[] = [...readinessResult.blockers];
    const warnings: string[] = [...readinessResult.warnings];

    const policyRules = assignmentPolicy?.rules ?? [];
    for (const rule of policyRules) {
      let passed = true;
      let details = 'Rule passed';

      switch (rule.ruleCode) {
        case 'VEHICLE_ACTIVE':
          passed = !!vehicle && vehicle.status === 'ACTIVE';
          details = passed ? 'Vehicle is active' : vehicle ? `Vehicle status is ${vehicle.status}` : 'Vehicle is required';
          break;
        case 'DRIVER_ACTIVE':
          passed = !!driver && driver.status === 'ACTIVE';
          details = passed ? 'Driver is active' : driver ? `Driver status is ${driver.status}` : 'Driver is required';
          break;
        case 'DRIVER_VALID_LICENSE': {
          const validLicense = !!driver?.licenses.some((entry) => entry.status === 'ACTIVE' && (!entry.expiryDate || entry.expiryDate >= now));
          passed = validLicense;
          details = passed ? 'Driver has a valid active license' : 'Driver is missing a valid active license';
          break;
        }
        case 'VEHICLE_VALID_DOCUMENTS': {
          const validDoc = !!vehicle?.documents.some((entry) => entry.status === 'ACTIVE' && (!entry.expiryDate || entry.expiryDate >= now));
          passed = validDoc;
          details = passed ? 'Vehicle has valid active documents' : 'Vehicle is missing valid active documents';
          break;
        }
        case 'VEHICLE_ACTIVE_DEVICE':
          passed = !!vehicle?.devices.some((entry) => entry.status === 'ACTIVE');
          details = passed ? 'Vehicle has an active device' : 'Vehicle is missing an active device';
          break;
        case 'ACTIVE_ASSIGNMENT_REQUIRED':
          passed = !!assignment && assignment.status === 'ACTIVE';
          details = passed ? 'Active assignment exists' : 'No active assignment exists';
          break;
        case 'NO_OVERLAPPING_ACTIVE_ASSIGNMENT': {
          const overlappingTrips = await fastify.prisma.plannedTrip.findMany({
            where: {
              id: { not: trip.id },
              organizationId: trip.organizationId,
              status: { in: ['PLANNED', 'READY', 'BLOCKED', 'DISPATCHED_PLACEHOLDER'] },
              AND: [
                {
                  OR: [
                    ...(trip.driverId ? [{ driverId: trip.driverId }] : []),
                    ...(trip.vehicleId ? [{ vehicleId: trip.vehicleId }] : []),
                  ],
                },
                {
                  plannedStartAt: { lte: trip.plannedEndAt ?? trip.plannedStartAt },
                },
                {
                  OR: [{ plannedEndAt: null }, { plannedEndAt: { gte: trip.plannedStartAt } }],
                },
              ],
            },
          });
          passed = overlappingTrips.length === 0;
          details = passed ? 'No overlapping planned trips found' : `${overlappingTrips.length} overlapping planned trip(s) found`;
          break;
        }
        case 'SAME_ORGANIZATION':
          passed =
            (!vehicle || vehicle.organizationId === trip.organizationId) &&
            (!driver || driver.organizationId === trip.organizationId) &&
            (!assignment || assignment.organizationId === trip.organizationId);
          details = passed ? 'All assignments belong to the same organization' : 'Assigned entities must belong to the same organization';
          break;
        case 'SAME_CUSTOMER': {
          const targetCustomerId = trip.customerAccountId;
          passed =
            !targetCustomerId ||
            ((!vehicle?.customerAccountId || vehicle.customerAccountId === targetCustomerId) &&
              (!driver?.customerAccountId || driver.customerAccountId === targetCustomerId));
          details = passed ? 'Assigned entities are customer-compatible' : 'Assigned entities must match the planned trip customer';
          break;
        }
        case 'CUSTOM':
          passed = true;
          details = 'Custom rules are stored for future runtime enforcement';
          break;
      }

      const check: ValidationCheck = {
        code: `policy.${rule.ruleCode.toLowerCase()}`,
        label: rule.name,
        passed,
        severity: rule.isBlocking ? 'blocker' : 'warning',
        details,
      };

      policyChecks.push(check);
      if (!passed) {
        if (rule.isBlocking) {
          blockers.push(details);
        } else {
          warnings.push(details);
        }
      }
    }

    const result = {
      valid: blockers.length === 0,
      readinessResult,
      policyChecks,
      blockers,
      warnings,
      context: {
        plannedTripId: trip.id,
        organizationId: trip.organizationId,
        readinessProfileId: readinessProfile?.id ?? null,
        assignmentPolicyId: assignmentPolicy?.id ?? null,
      },
    };

    await fastify.audit.write({
      ...getAuditContext(request),
      action: 'admin.dispatch.validate',
      entityType: 'PlannedTrip',
      entityId: trip.id,
      metadata: {
        readinessProfileId: readinessProfile?.id ?? null,
        assignmentPolicyId: assignmentPolicy?.id ?? null,
        valid: result.valid,
        blockerCount: result.blockers.length,
        warningCount: result.warnings.length,
      },
    });

    return reply.success(result);
  });
};
