import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { Prisma } from '@trackigniter8/db';
import { ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findBusinessUnitOrThrow,
  findCustomerAccountOrThrow,
  findDepartmentOrThrow,
  findServiceRouteTemplateOrThrow,
  findVehicleDeviceOrThrow,
  findVehicleDocumentOrThrow,
  findVehicleGroupOrThrow,
  findVehicleMakeOrThrow,
  findVehicleModelOrThrow,
  findVehicleOrThrow,
  findVehicleTypeOrThrow,
  getAuditContext,
  getPagination,
  paginationQuerySchema,
  serializeVehicle,
  serializeVehicleDevice,
  serializeVehicleDocument,
  vehicleDeviceStatusSchema,
  vehicleDocumentStatusSchema,
  vehicleFuelTypeSchema,
  vehicleOwnershipTypeSchema,
  vehicleStatusSchema,
} from '../utils.js';

const jsonRecordSchema = z.record(z.string(), z.unknown());

const vehicleIdParamSchema = z.object({
  vehicleId: z.string().min(1),
});

const vehicleDocumentIdParamSchema = z.object({
  vehicleId: z.string().min(1),
  documentId: z.string().min(1),
});

const vehicleDeviceIdParamSchema = z.object({
  vehicleId: z.string().min(1),
  deviceId: z.string().min(1),
});

const listVehiclesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: vehicleStatusSchema.optional(),
  vehicleTypeId: z.string().min(1).optional(),
  vehicleGroupId: z.string().min(1).optional(),
  customerAccountId: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
  businessUnitId: z.string().min(1).optional(),
});

const listExpiringVehicleDocumentsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  vehicleId: z.string().min(1).optional(),
  days: z.coerce.number().int().min(1).max(365).default(30),
  status: vehicleDocumentStatusSchema.optional(),
});

const createVehicleSchema = z
  .object({
    organizationId: z.string().min(1),
    customerAccountId: z.string().min(1).optional(),
    departmentId: z.string().min(1).optional(),
    businessUnitId: z.string().min(1).optional(),
    vehicleTypeId: z.string().min(1).optional(),
    vehicleGroupId: z.string().min(1).optional(),
    makeId: z.string().min(1).optional(),
    modelId: z.string().min(1).optional(),
    serviceRouteTemplateId: z.string().min(1).optional(),
    registrationNumber: z.string().trim().min(1).optional(),
    plateNumber: z.string().trim().min(1).optional(),
    vin: z.string().trim().min(1).optional(),
    chassisNumber: z.string().trim().min(1).optional(),
    engineNumber: z.string().trim().min(1).optional(),
    year: z.coerce.number().int().min(1900).max(2100).optional(),
    color: z.string().trim().min(1).optional(),
    fuelType: vehicleFuelTypeSchema.optional(),
    ownershipType: vehicleOwnershipTypeSchema.optional(),
    status: vehicleStatusSchema.default('ACTIVE'),
    odometer: z.coerce.number().int().min(0).optional(),
    notes: z.string().trim().optional(),
  })
  .refine((value) => value.registrationNumber || value.plateNumber, {
    message: 'Registration number or plate number is required',
    path: ['registrationNumber'],
  });

const updateVehicleSchema = z
  .object({
    customerAccountId: z.string().min(1).nullable().optional(),
    departmentId: z.string().min(1).nullable().optional(),
    businessUnitId: z.string().min(1).nullable().optional(),
    vehicleTypeId: z.string().min(1).nullable().optional(),
    vehicleGroupId: z.string().min(1).nullable().optional(),
    makeId: z.string().min(1).nullable().optional(),
    modelId: z.string().min(1).nullable().optional(),
    serviceRouteTemplateId: z.string().min(1).nullable().optional(),
    registrationNumber: z.string().trim().min(1).nullable().optional(),
    plateNumber: z.string().trim().min(1).nullable().optional(),
    vin: z.string().trim().min(1).nullable().optional(),
    chassisNumber: z.string().trim().min(1).nullable().optional(),
    engineNumber: z.string().trim().min(1).nullable().optional(),
    year: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
    color: z.string().trim().min(1).nullable().optional(),
    fuelType: vehicleFuelTypeSchema.nullable().optional(),
    ownershipType: vehicleOwnershipTypeSchema.nullable().optional(),
    odometer: z.coerce.number().int().min(0).nullable().optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one vehicle field must be supplied' });

const createVehicleDocumentSchema = z.object({
  documentType: z.string().min(1),
  documentNumber: z.string().trim().optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  fileName: z.string().trim().optional(),
  fileUrl: z.string().trim().optional(),
  fileMimeType: z.string().trim().optional(),
  fileSizeBytes: z.coerce.number().int().min(0).optional(),
  status: vehicleDocumentStatusSchema.default('ACTIVE'),
  notes: z.string().trim().optional(),
});

const updateVehicleDocumentSchema = z
  .object({
    documentType: z.string().min(1).optional(),
    documentNumber: z.string().trim().nullable().optional(),
    issueDate: z.coerce.date().nullable().optional(),
    expiryDate: z.coerce.date().nullable().optional(),
    fileName: z.string().trim().nullable().optional(),
    fileUrl: z.string().trim().nullable().optional(),
    fileMimeType: z.string().trim().nullable().optional(),
    fileSizeBytes: z.coerce.number().int().min(0).nullable().optional(),
    status: vehicleDocumentStatusSchema.optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one vehicle document field must be supplied' });

const createVehicleDeviceSchema = z.object({
  provider: z.string().min(1),
  externalDeviceId: z.string().min(1),
  imei: z.string().trim().optional(),
  serialNumber: z.string().trim().optional(),
  status: vehicleDeviceStatusSchema.default('ACTIVE'),
  installedAt: z.coerce.date().optional(),
  removedAt: z.coerce.date().optional(),
  metadata: jsonRecordSchema.optional(),
});

const updateVehicleDeviceSchema = z
  .object({
    provider: z.string().min(1).optional(),
    externalDeviceId: z.string().min(1).optional(),
    imei: z.string().trim().nullable().optional(),
    serialNumber: z.string().trim().nullable().optional(),
    status: vehicleDeviceStatusSchema.optional(),
    installedAt: z.coerce.date().nullable().optional(),
    removedAt: z.coerce.date().nullable().optional(),
    metadata: jsonRecordSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one vehicle device field must be supplied' });

async function assertOrganizationScopedRelationAccess(fastify: Parameters<FastifyPluginAsync>[0], organizationId: string, relationIds: {
  customerAccountId?: string | null | undefined;
  departmentId?: string | null | undefined;
  businessUnitId?: string | null | undefined;
  vehicleTypeId?: string | null | undefined;
  vehicleGroupId?: string | null | undefined;
  makeId?: string | null | undefined;
  modelId?: string | null | undefined;
  serviceRouteTemplateId?: string | null | undefined;
}) {
  if (relationIds.customerAccountId) {
    const customerAccount = await findCustomerAccountOrThrow(fastify.prisma, relationIds.customerAccountId);
    if (customerAccount.organizationId !== organizationId) {
      throw new ConflictError('Customer account must belong to the same organization');
    }
  }

  if (relationIds.departmentId) {
    const department = await findDepartmentOrThrow(fastify.prisma, relationIds.departmentId);
    if (department.organizationId !== organizationId) {
      throw new ConflictError('Department must belong to the same organization');
    }
  }

  if (relationIds.businessUnitId) {
    const businessUnit = await findBusinessUnitOrThrow(fastify.prisma, relationIds.businessUnitId);
    if (businessUnit.organizationId !== organizationId) {
      throw new ConflictError('Business unit must belong to the same organization');
    }
  }

  if (relationIds.vehicleTypeId) {
    const vehicleType = await findVehicleTypeOrThrow(fastify.prisma, relationIds.vehicleTypeId);
    if (vehicleType.organizationId !== organizationId) {
      throw new ConflictError('Vehicle type must belong to the same organization');
    }
  }

  if (relationIds.vehicleGroupId) {
    const vehicleGroup = await findVehicleGroupOrThrow(fastify.prisma, relationIds.vehicleGroupId);
    if (vehicleGroup.organizationId !== organizationId) {
      throw new ConflictError('Vehicle group must belong to the same organization');
    }
  }

  if (relationIds.makeId) {
    const vehicleMake = await findVehicleMakeOrThrow(fastify.prisma, relationIds.makeId);
    if (vehicleMake.organizationId !== organizationId) {
      throw new ConflictError('Vehicle make must belong to the same organization');
    }
  }

  if (relationIds.modelId) {
    const vehicleModel = await findVehicleModelOrThrow(fastify.prisma, relationIds.modelId);
    if (vehicleModel.organizationId !== organizationId) {
      throw new ConflictError('Vehicle model must belong to the same organization');
    }
    if (relationIds.makeId && vehicleModel.vehicleMakeId !== relationIds.makeId) {
      throw new ConflictError('Vehicle model must belong to the selected vehicle make');
    }
  }

  if (relationIds.serviceRouteTemplateId) {
    const serviceRouteTemplate = await findServiceRouteTemplateOrThrow(fastify.prisma, relationIds.serviceRouteTemplateId);
    if (serviceRouteTemplate.organizationId !== organizationId) {
      throw new ConflictError('Service route template must belong to the same organization');
    }
  }
}

async function assertVehicleUniqueFields(
  fastify: Parameters<FastifyPluginAsync>[0],
  input: {
    organizationId: string;
    registrationNumber?: string | null | undefined;
    plateNumber?: string | null | undefined;
    excludeVehicleId?: string | undefined;
  }
) {
  const registrationNumber = input.registrationNumber?.trim() || null;
  const plateNumber = input.plateNumber?.trim() || null;

  if (registrationNumber) {
    const existing = await fastify.prisma.vehicle.findFirst({
      where: {
        organizationId: input.organizationId,
        registrationNumber,
        ...(input.excludeVehicleId ? { id: { not: input.excludeVehicleId } } : {}),
      },
    });

    if (existing) {
      throw new ConflictError('A vehicle with that registration number already exists for this organization');
    }
  }

  if (plateNumber) {
    const existing = await fastify.prisma.vehicle.findFirst({
      where: {
        organizationId: input.organizationId,
        plateNumber,
        ...(input.excludeVehicleId ? { id: { not: input.excludeVehicleId } } : {}),
      },
    });

    if (existing) {
      throw new ConflictError('A vehicle with that plate number already exists for this organization');
    }
  }
}

export const adminVehicleRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/vehicles/documents/expiring',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-documents:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listExpiringVehicleDocumentsQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();

      if (!requestedOrganizationId && !query.vehicleId) {
        throw new ValidationAppError('Organization context or vehicle id is required for document expiry queries');
      }

      if (requestedOrganizationId) {
        await fastify.requireOrganizationAccess(request, requestedOrganizationId);
      }

      let vehicle: Awaited<ReturnType<typeof findVehicleOrThrow>> | null = null;
      if (query.vehicleId) {
        vehicle = await findVehicleOrThrow(fastify.prisma, query.vehicleId);
        await fastify.requireOrganizationAccess(request, vehicle.organizationId);
      }

      const untilDate = new Date();
      untilDate.setDate(untilDate.getDate() + (query.days ?? 30));

      const where = {
        ...(query.status ? { status: query.status } : {}),
        expiryDate: {
          not: null,
          lte: untilDate,
        },
        ...(vehicle ? { vehicleId: vehicle.id } : {}),
        ...(requestedOrganizationId
          ? {
              vehicle: {
                organizationId: requestedOrganizationId,
              },
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.vehicleDocument.findMany({
          where,
          skip,
          take,
          orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }],
        }),
        fastify.prisma.vehicleDocument.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeVehicleDocument) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/vehicles',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicles:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listVehiclesQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
      const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();

      if (requestedOrganizationId) {
        await fastify.requireOrganizationAccess(request, requestedOrganizationId);
      }

      const where = {
        ...(query.status ? { status: query.status } : {}),
        ...(query.vehicleTypeId ? { vehicleTypeId: query.vehicleTypeId } : {}),
        ...(query.vehicleGroupId ? { vehicleGroupId: query.vehicleGroupId } : {}),
        ...(query.customerAccountId ? { customerAccountId: query.customerAccountId } : {}),
        ...(query.departmentId ? { departmentId: query.departmentId } : {}),
        ...(query.businessUnitId ? { businessUnitId: query.businessUnitId } : {}),
        ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
        ...(query.search
          ? {
              OR: [
                { registrationNumber: { contains: query.search, mode: 'insensitive' as const } },
                { plateNumber: { contains: query.search, mode: 'insensitive' as const } },
                { vin: { contains: query.search, mode: 'insensitive' as const } },
                { chassisNumber: { contains: query.search, mode: 'insensitive' as const } },
                { engineNumber: { contains: query.search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
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
        fastify.prisma.vehicle.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            customerAccount: {
              include: {
                contacts: true,
                locations: true,
              },
            },
            department: true,
            businessUnit: true,
            vehicleType: true,
            vehicleGroup: true,
            make: true,
            model: true,
            serviceRouteTemplate: {
              include: {
                stops: true,
              },
            },
            documents: true,
            devices: true,
          },
        }),
        fastify.prisma.vehicle.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeVehicle) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/vehicles/:vehicleId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicles:read')],
    },
    async (request, reply) => {
      const { vehicleId } = validateOrThrow(vehicleIdParamSchema, request.params);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);

      return reply.success({
        item: {
          ...serializeVehicle(vehicle),
          documents: vehicle.documents.map(serializeVehicleDocument),
          devices: vehicle.devices.map(serializeVehicleDevice),
        },
      });
    }
  );

  fastify.post(
    '/admin/vehicles',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicles:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createVehicleSchema, request.body);
      await fastify.requireOrganizationAccess(request, body.organizationId);
      await assertOrganizationScopedRelationAccess(fastify, body.organizationId, body);
      await assertVehicleUniqueFields(fastify, {
        organizationId: body.organizationId,
        registrationNumber: body.registrationNumber,
        plateNumber: body.plateNumber,
      });

      const vehicle = await fastify.prisma.vehicle.create({
        data: {
          organizationId: body.organizationId,
          status: body.status ?? 'ACTIVE',
          ...(body.customerAccountId ? { customerAccountId: body.customerAccountId } : {}),
          ...(body.departmentId ? { departmentId: body.departmentId } : {}),
          ...(body.businessUnitId ? { businessUnitId: body.businessUnitId } : {}),
          ...(body.vehicleTypeId ? { vehicleTypeId: body.vehicleTypeId } : {}),
          ...(body.vehicleGroupId ? { vehicleGroupId: body.vehicleGroupId } : {}),
          ...(body.makeId ? { makeId: body.makeId } : {}),
          ...(body.modelId ? { modelId: body.modelId } : {}),
          ...(body.serviceRouteTemplateId ? { serviceRouteTemplateId: body.serviceRouteTemplateId } : {}),
          ...(body.registrationNumber ? { registrationNumber: body.registrationNumber.trim() } : {}),
          ...(body.plateNumber ? { plateNumber: body.plateNumber.trim() } : {}),
          ...(body.vin ? { vin: body.vin.trim() } : {}),
          ...(body.chassisNumber ? { chassisNumber: body.chassisNumber.trim() } : {}),
          ...(body.engineNumber ? { engineNumber: body.engineNumber.trim() } : {}),
          ...(body.year !== undefined ? { year: body.year } : {}),
          ...(body.color ? { color: body.color.trim() } : {}),
          ...(body.fuelType ? { fuelType: body.fuelType } : {}),
          ...(body.ownershipType ? { ownershipType: body.ownershipType } : {}),
          ...(body.odometer !== undefined ? { odometer: body.odometer } : {}),
          ...(body.notes ? { notes: body.notes.trim() } : {}),
        },
        include: {
          customerAccount: {
            include: {
              contacts: true,
              locations: true,
            },
          },
          department: true,
          businessUnit: true,
          vehicleType: true,
          vehicleGroup: true,
          make: true,
          model: true,
          serviceRouteTemplate: {
            include: {
              stops: true,
            },
          },
          documents: true,
          devices: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle.create',
        entityType: 'Vehicle',
        entityId: vehicle.id,
        metadata: {
          organizationId: vehicle.organizationId,
          registrationNumber: vehicle.registrationNumber,
          plateNumber: vehicle.plateNumber,
          status: vehicle.status,
        },
      });

      return reply.status(201).success({ item: serializeVehicle(vehicle) });
    }
  );

  fastify.patch(
    '/admin/vehicles/:vehicleId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicles:manage')],
    },
    async (request, reply) => {
      const { vehicleId } = validateOrThrow(vehicleIdParamSchema, request.params);
      const body = validateOrThrow(updateVehicleSchema, request.body);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);
      await assertOrganizationScopedRelationAccess(fastify, vehicle.organizationId, body);
      await assertVehicleUniqueFields(fastify, {
        organizationId: vehicle.organizationId,
        registrationNumber: body.registrationNumber !== undefined ? body.registrationNumber : vehicle.registrationNumber,
        plateNumber: body.plateNumber !== undefined ? body.plateNumber : vehicle.plateNumber,
        excludeVehicleId: vehicle.id,
      });

      const updateData = {
        ...(body.customerAccountId !== undefined ? { customerAccountId: body.customerAccountId } : {}),
        ...(body.departmentId !== undefined ? { departmentId: body.departmentId } : {}),
        ...(body.businessUnitId !== undefined ? { businessUnitId: body.businessUnitId } : {}),
        ...(body.vehicleTypeId !== undefined ? { vehicleTypeId: body.vehicleTypeId } : {}),
        ...(body.vehicleGroupId !== undefined ? { vehicleGroupId: body.vehicleGroupId } : {}),
        ...(body.makeId !== undefined ? { makeId: body.makeId } : {}),
        ...(body.modelId !== undefined ? { modelId: body.modelId } : {}),
        ...(body.serviceRouteTemplateId !== undefined ? { serviceRouteTemplateId: body.serviceRouteTemplateId } : {}),
        ...(body.registrationNumber !== undefined ? { registrationNumber: body.registrationNumber?.trim() ?? null } : {}),
        ...(body.plateNumber !== undefined ? { plateNumber: body.plateNumber?.trim() ?? null } : {}),
        ...(body.vin !== undefined ? { vin: body.vin?.trim() ?? null } : {}),
        ...(body.chassisNumber !== undefined ? { chassisNumber: body.chassisNumber?.trim() ?? null } : {}),
        ...(body.engineNumber !== undefined ? { engineNumber: body.engineNumber?.trim() ?? null } : {}),
        ...(body.year !== undefined ? { year: body.year } : {}),
        ...(body.color !== undefined ? { color: body.color?.trim() ?? null } : {}),
        ...(body.fuelType !== undefined ? { fuelType: body.fuelType } : {}),
        ...(body.ownershipType !== undefined ? { ownershipType: body.ownershipType } : {}),
        ...(body.odometer !== undefined ? { odometer: body.odometer } : {}),
        ...(body.notes !== undefined ? { notes: body.notes?.trim() ?? null } : {}),
      };

      if (
        (updateData.registrationNumber ?? vehicle.registrationNumber) === null &&
        (updateData.plateNumber ?? vehicle.plateNumber) === null
      ) {
        throw new ValidationAppError('Registration number or plate number is required');
      }

      const updatedVehicle = await fastify.prisma.vehicle.update({
        where: { id: vehicleId },
        data: updateData,
        include: {
          customerAccount: {
            include: {
              contacts: true,
              locations: true,
            },
          },
          department: true,
          businessUnit: true,
          vehicleType: true,
          vehicleGroup: true,
          make: true,
          model: true,
          serviceRouteTemplate: {
            include: {
              stops: true,
            },
          },
          documents: true,
          devices: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle.update',
        entityType: 'Vehicle',
        entityId: vehicleId,
        metadata: updateData,
      });

      return reply.success({ item: serializeVehicle(updatedVehicle) });
    }
  );

  fastify.post(
    '/admin/vehicles/:vehicleId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicles:manage')],
    },
    async (request, reply) => {
      const { vehicleId } = validateOrThrow(vehicleIdParamSchema, request.params);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);

      const updatedVehicle = await fastify.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'ACTIVE' },
        include: {
          customerAccount: { include: { contacts: true, locations: true } },
          department: true,
          businessUnit: true,
          vehicleType: true,
          vehicleGroup: true,
          make: true,
          model: true,
          serviceRouteTemplate: { include: { stops: true } },
          documents: true,
          devices: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle.activate',
        entityType: 'Vehicle',
        entityId: vehicleId,
      });

      return reply.success({ item: serializeVehicle(updatedVehicle) });
    }
  );

  fastify.post(
    '/admin/vehicles/:vehicleId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicles:manage')],
    },
    async (request, reply) => {
      const { vehicleId } = validateOrThrow(vehicleIdParamSchema, request.params);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);

      const updatedVehicle = await fastify.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'INACTIVE' },
        include: {
          customerAccount: { include: { contacts: true, locations: true } },
          department: true,
          businessUnit: true,
          vehicleType: true,
          vehicleGroup: true,
          make: true,
          model: true,
          serviceRouteTemplate: { include: { stops: true } },
          documents: true,
          devices: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle.deactivate',
        entityType: 'Vehicle',
        entityId: vehicleId,
      });

      return reply.success({ item: serializeVehicle(updatedVehicle) });
    }
  );

  fastify.post(
    '/admin/vehicles/:vehicleId/archive',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicles:manage')],
    },
    async (request, reply) => {
      const { vehicleId } = validateOrThrow(vehicleIdParamSchema, request.params);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);

      const updatedVehicle = await fastify.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'ARCHIVED' },
        include: {
          customerAccount: { include: { contacts: true, locations: true } },
          department: true,
          businessUnit: true,
          vehicleType: true,
          vehicleGroup: true,
          make: true,
          model: true,
          serviceRouteTemplate: { include: { stops: true } },
          documents: true,
          devices: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle.archive',
        entityType: 'Vehicle',
        entityId: vehicleId,
      });

      return reply.success({ item: serializeVehicle(updatedVehicle) });
    }
  );

  fastify.get(
    '/admin/vehicles/:vehicleId/documents',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-documents:read')],
    },
    async (request, reply) => {
      const { vehicleId } = validateOrThrow(vehicleIdParamSchema, request.params);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);

      return reply.success({ items: vehicle.documents.map(serializeVehicleDocument) });
    }
  );

  fastify.get(
    '/admin/vehicles/:vehicleId/documents/:documentId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-documents:read')],
    },
    async (request, reply) => {
      const { vehicleId, documentId } = validateOrThrow(vehicleDocumentIdParamSchema, request.params);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);
      const document = await findVehicleDocumentOrThrow(fastify.prisma, documentId);

      if (document.vehicleId !== vehicleId) {
        throw new ConflictError('Vehicle document does not belong to the requested vehicle');
      }

      return reply.success({ item: serializeVehicleDocument(document) });
    }
  );

  fastify.post(
    '/admin/vehicles/:vehicleId/documents',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-documents:manage')],
    },
    async (request, reply) => {
      const { vehicleId } = validateOrThrow(vehicleIdParamSchema, request.params);
      const body = validateOrThrow(createVehicleDocumentSchema, request.body);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);

      const document = await fastify.prisma.vehicleDocument.create({
        data: {
          vehicleId,
          documentType: body.documentType,
          status: body.status ?? 'ACTIVE',
          ...(body.documentNumber ? { documentNumber: body.documentNumber.trim() } : {}),
          ...(body.issueDate ? { issueDate: body.issueDate } : {}),
          ...(body.expiryDate ? { expiryDate: body.expiryDate } : {}),
          ...(body.fileName ? { fileName: body.fileName.trim() } : {}),
          ...(body.fileUrl ? { fileUrl: body.fileUrl.trim() } : {}),
          ...(body.fileMimeType ? { fileMimeType: body.fileMimeType.trim() } : {}),
          ...(body.fileSizeBytes !== undefined ? { fileSizeBytes: body.fileSizeBytes } : {}),
          ...(body.notes ? { notes: body.notes.trim() } : {}),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_document.create',
        entityType: 'VehicleDocument',
        entityId: document.id,
        metadata: { vehicleId, documentType: document.documentType, status: document.status },
      });

      return reply.status(201).success({ item: serializeVehicleDocument(document) });
    }
  );

  fastify.patch(
    '/admin/vehicles/:vehicleId/documents/:documentId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-documents:manage')],
    },
    async (request, reply) => {
      const { vehicleId, documentId } = validateOrThrow(vehicleDocumentIdParamSchema, request.params);
      const body = validateOrThrow(updateVehicleDocumentSchema, request.body);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);
      const document = await findVehicleDocumentOrThrow(fastify.prisma, documentId);

      if (document.vehicleId !== vehicleId) {
        throw new ConflictError('Vehicle document does not belong to the requested vehicle');
      }

      const updateData = {
        ...(body.documentType ? { documentType: body.documentType } : {}),
        ...(body.documentNumber !== undefined ? { documentNumber: body.documentNumber?.trim() ?? null } : {}),
        ...(body.issueDate !== undefined ? { issueDate: body.issueDate } : {}),
        ...(body.expiryDate !== undefined ? { expiryDate: body.expiryDate } : {}),
        ...(body.fileName !== undefined ? { fileName: body.fileName?.trim() ?? null } : {}),
        ...(body.fileUrl !== undefined ? { fileUrl: body.fileUrl?.trim() ?? null } : {}),
        ...(body.fileMimeType !== undefined ? { fileMimeType: body.fileMimeType?.trim() ?? null } : {}),
        ...(body.fileSizeBytes !== undefined ? { fileSizeBytes: body.fileSizeBytes } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.notes !== undefined ? { notes: body.notes?.trim() ?? null } : {}),
      };

      const updatedDocument = await fastify.prisma.vehicleDocument.update({
        where: { id: documentId },
        data: updateData,
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_document.update',
        entityType: 'VehicleDocument',
        entityId: documentId,
        metadata: updateData,
      });

      return reply.success({ item: serializeVehicleDocument(updatedDocument) });
    }
  );

  fastify.post(
    '/admin/vehicles/:vehicleId/documents/:documentId/archive',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-documents:manage')],
    },
    async (request, reply) => {
      const { vehicleId, documentId } = validateOrThrow(vehicleDocumentIdParamSchema, request.params);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);
      const document = await findVehicleDocumentOrThrow(fastify.prisma, documentId);

      if (document.vehicleId !== vehicleId) {
        throw new ConflictError('Vehicle document does not belong to the requested vehicle');
      }

      const updatedDocument = await fastify.prisma.vehicleDocument.update({
        where: { id: documentId },
        data: { status: 'ARCHIVED' },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_document.archive',
        entityType: 'VehicleDocument',
        entityId: documentId,
      });

      return reply.success({ item: serializeVehicleDocument(updatedDocument) });
    }
  );

  fastify.get(
    '/admin/vehicles/:vehicleId/devices',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-devices:read')],
    },
    async (request, reply) => {
      const { vehicleId } = validateOrThrow(vehicleIdParamSchema, request.params);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);

      return reply.success({ items: vehicle.devices.map(serializeVehicleDevice) });
    }
  );

  fastify.get(
    '/admin/vehicles/:vehicleId/devices/:deviceId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-devices:read')],
    },
    async (request, reply) => {
      const { vehicleId, deviceId } = validateOrThrow(vehicleDeviceIdParamSchema, request.params);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);
      const device = await findVehicleDeviceOrThrow(fastify.prisma, deviceId);

      if (device.vehicleId !== vehicleId) {
        throw new ConflictError('Vehicle device does not belong to the requested vehicle');
      }

      return reply.success({ item: serializeVehicleDevice(device) });
    }
  );

  fastify.post(
    '/admin/vehicles/:vehicleId/devices',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-devices:manage')],
    },
    async (request, reply) => {
      const { vehicleId } = validateOrThrow(vehicleIdParamSchema, request.params);
      const body = validateOrThrow(createVehicleDeviceSchema, request.body);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);

      const existing = await fastify.prisma.vehicleDevice.findFirst({
        where: {
          vehicleId,
          externalDeviceId: body.externalDeviceId,
        },
      });

      if (existing) {
        throw new ConflictError('A device with that external device id is already attached to this vehicle');
      }

      const device = await fastify.prisma.vehicleDevice.create({
        data: {
          vehicleId,
          provider: body.provider,
          externalDeviceId: body.externalDeviceId,
          status: body.status ?? 'ACTIVE',
          ...(body.imei ? { imei: body.imei.trim() } : {}),
          ...(body.serialNumber ? { serialNumber: body.serialNumber.trim() } : {}),
          ...(body.installedAt ? { installedAt: body.installedAt } : {}),
          ...(body.removedAt ? { removedAt: body.removedAt } : {}),
          ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_device.attach',
        entityType: 'VehicleDevice',
        entityId: device.id,
        metadata: { vehicleId, provider: device.provider, externalDeviceId: device.externalDeviceId, status: device.status },
      });

      return reply.status(201).success({ item: serializeVehicleDevice(device) });
    }
  );

  fastify.patch(
    '/admin/vehicles/:vehicleId/devices/:deviceId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-devices:manage')],
    },
    async (request, reply) => {
      const { vehicleId, deviceId } = validateOrThrow(vehicleDeviceIdParamSchema, request.params);
      const body = validateOrThrow(updateVehicleDeviceSchema, request.body);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);
      const device = await findVehicleDeviceOrThrow(fastify.prisma, deviceId);

      if (device.vehicleId !== vehicleId) {
        throw new ConflictError('Vehicle device does not belong to the requested vehicle');
      }

      if (body.externalDeviceId && body.externalDeviceId !== device.externalDeviceId) {
        const duplicate = await fastify.prisma.vehicleDevice.findFirst({
          where: {
            vehicleId,
            externalDeviceId: body.externalDeviceId,
            id: { not: deviceId },
          },
        });

        if (duplicate) {
          throw new ConflictError('A device with that external device id is already attached to this vehicle');
        }
      }

      const updateData = {
        ...(body.provider ? { provider: body.provider } : {}),
        ...(body.externalDeviceId ? { externalDeviceId: body.externalDeviceId } : {}),
        ...(body.imei !== undefined ? { imei: body.imei?.trim() ?? null } : {}),
        ...(body.serialNumber !== undefined ? { serialNumber: body.serialNumber?.trim() ?? null } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.installedAt !== undefined ? { installedAt: body.installedAt } : {}),
        ...(body.removedAt !== undefined ? { removedAt: body.removedAt } : {}),
        ...(body.metadata !== undefined
          ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) }
          : {}),
      };

      const updatedDevice = await fastify.prisma.vehicleDevice.update({
        where: { id: deviceId },
        data: updateData,
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_device.update',
        entityType: 'VehicleDevice',
        entityId: deviceId,
        metadata: updateData,
      });

      return reply.success({ item: serializeVehicleDevice(updatedDevice) });
    }
  );

  fastify.post(
    '/admin/vehicles/:vehicleId/devices/:deviceId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-devices:manage')],
    },
    async (request, reply) => {
      const { vehicleId, deviceId } = validateOrThrow(vehicleDeviceIdParamSchema, request.params);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);
      const device = await findVehicleDeviceOrThrow(fastify.prisma, deviceId);

      if (device.vehicleId !== vehicleId) {
        throw new ConflictError('Vehicle device does not belong to the requested vehicle');
      }

      const updatedDevice = await fastify.prisma.vehicleDevice.update({
        where: { id: deviceId },
        data: { status: 'INACTIVE' },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_device.deactivate',
        entityType: 'VehicleDevice',
        entityId: deviceId,
      });

      return reply.success({ item: serializeVehicleDevice(updatedDevice) });
    }
  );

  fastify.post(
    '/admin/vehicles/:vehicleId/devices/:deviceId/detach',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vehicle-devices:manage')],
    },
    async (request, reply) => {
      const { vehicleId, deviceId } = validateOrThrow(vehicleDeviceIdParamSchema, request.params);
      const vehicle = await findVehicleOrThrow(fastify.prisma, vehicleId);
      await fastify.requireOrganizationAccess(request, vehicle.organizationId);
      const device = await findVehicleDeviceOrThrow(fastify.prisma, deviceId);

      if (device.vehicleId !== vehicleId) {
        throw new ConflictError('Vehicle device does not belong to the requested vehicle');
      }

      const updatedDevice = await fastify.prisma.vehicleDevice.update({
        where: { id: deviceId },
        data: {
          status: 'DETACHED',
          removedAt: device.removedAt ?? new Date(),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vehicle_device.detach',
        entityType: 'VehicleDevice',
        entityId: deviceId,
      });

      return reply.success({ item: serializeVehicleDevice(updatedDevice) });
    }
  );
};
