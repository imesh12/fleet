import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  driverDocumentStatusSchema,
  driverEmploymentTypeSchema,
  driverGenderSchema,
  driverLicenseStatusSchema,
  driverStatusSchema,
  findBusinessUnitOrThrow,
  findCustomerAccountOrThrow,
  findDepartmentOrThrow,
  findDriverDocumentOrThrow,
  findDriverGroupOrThrow,
  findDriverLicenseOrThrow,
  findDriverOrThrow,
  findDriverSkillOrThrow,
  getAuditContext,
  getPagination,
  paginationQuerySchema,
  serializeDriver,
  serializeDriverDocument,
  serializeDriverLicense,
  serializeDriverSkillAssignment,
} from '../utils.js';

const driverIdParamSchema = z.object({
  driverId: z.string().min(1),
});

const driverLicenseIdParamSchema = z.object({
  driverId: z.string().min(1),
  licenseId: z.string().min(1),
});

const driverDocumentIdParamSchema = z.object({
  driverId: z.string().min(1),
  documentId: z.string().min(1),
});

const driverSkillIdParamSchema = z.object({
  driverId: z.string().min(1),
  driverSkillId: z.string().min(1),
});

const listDriversQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: driverStatusSchema.optional(),
  driverGroupId: z.string().min(1).optional(),
  customerAccountId: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
  businessUnitId: z.string().min(1).optional(),
});

const listExpiringDriverLicensesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(),
  days: z.coerce.number().int().min(1).max(365).default(30),
  status: driverLicenseStatusSchema.optional(),
});

const listExpiringDriverDocumentsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  driverId: z.string().min(1).optional(),
  days: z.coerce.number().int().min(1).max(365).default(30),
  status: driverDocumentStatusSchema.optional(),
});

const createDriverSchema = z.object({
  organizationId: z.string().min(1),
  customerAccountId: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
  businessUnitId: z.string().min(1).optional(),
  driverGroupId: z.string().min(1).optional(),
  employeeNumber: z.string().trim().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  displayName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().trim().optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: driverGenderSchema.optional(),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().optional(),
  emergencyContactName: z.string().trim().optional(),
  emergencyContactPhone: z.string().trim().optional(),
  emergencyContactRelationship: z.string().trim().optional(),
  hireDate: z.coerce.date().optional(),
  employmentType: driverEmploymentTypeSchema.optional(),
  status: driverStatusSchema.default('ACTIVE'),
  notes: z.string().trim().optional(),
});

const updateDriverSchema = z
  .object({
    customerAccountId: z.string().min(1).nullable().optional(),
    departmentId: z.string().min(1).nullable().optional(),
    businessUnitId: z.string().min(1).nullable().optional(),
    driverGroupId: z.string().min(1).nullable().optional(),
    employeeNumber: z.string().trim().min(1).optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().trim().nullable().optional(),
    dateOfBirth: z.coerce.date().nullable().optional(),
    gender: driverGenderSchema.nullable().optional(),
    addressLine1: z.string().trim().nullable().optional(),
    addressLine2: z.string().trim().nullable().optional(),
    city: z.string().trim().nullable().optional(),
    state: z.string().trim().nullable().optional(),
    postalCode: z.string().trim().nullable().optional(),
    country: z.string().trim().nullable().optional(),
    emergencyContactName: z.string().trim().nullable().optional(),
    emergencyContactPhone: z.string().trim().nullable().optional(),
    emergencyContactRelationship: z.string().trim().nullable().optional(),
    hireDate: z.coerce.date().nullable().optional(),
    employmentType: driverEmploymentTypeSchema.nullable().optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one driver field must be supplied' });

const assignDriverSkillSchema = z.object({
  driverSkillId: z.string().min(1),
  notes: z.string().trim().optional(),
});

const createDriverLicenseSchema = z.object({
  licenseNumber: z.string().trim().min(1),
  licenseType: z.string().trim().min(1),
  issuingCountry: z.string().trim().optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  status: driverLicenseStatusSchema.default('ACTIVE'),
  notes: z.string().trim().optional(),
});

const updateDriverLicenseSchema = z
  .object({
    licenseNumber: z.string().trim().min(1).optional(),
    licenseType: z.string().trim().min(1).optional(),
    issuingCountry: z.string().trim().nullable().optional(),
    issueDate: z.coerce.date().nullable().optional(),
    expiryDate: z.coerce.date().nullable().optional(),
    status: driverLicenseStatusSchema.optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one driver license field must be supplied' });

const createDriverDocumentSchema = z.object({
  documentType: z.string().min(1),
  documentNumber: z.string().trim().optional(),
  issueDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  fileName: z.string().trim().optional(),
  fileUrl: z.string().trim().optional(),
  fileMimeType: z.string().trim().optional(),
  fileSizeBytes: z.coerce.number().int().min(0).optional(),
  status: driverDocumentStatusSchema.default('ACTIVE'),
  notes: z.string().trim().optional(),
});

const updateDriverDocumentSchema = z
  .object({
    documentType: z.string().min(1).optional(),
    documentNumber: z.string().trim().nullable().optional(),
    issueDate: z.coerce.date().nullable().optional(),
    expiryDate: z.coerce.date().nullable().optional(),
    fileName: z.string().trim().nullable().optional(),
    fileUrl: z.string().trim().nullable().optional(),
    fileMimeType: z.string().trim().nullable().optional(),
    fileSizeBytes: z.coerce.number().int().min(0).nullable().optional(),
    status: driverDocumentStatusSchema.optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one driver document field must be supplied' });

async function assertDriverRelations(fastify: Parameters<FastifyPluginAsync>[0], organizationId: string, relationIds: {
  customerAccountId?: string | null | undefined;
  departmentId?: string | null | undefined;
  businessUnitId?: string | null | undefined;
  driverGroupId?: string | null | undefined;
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

  if (relationIds.driverGroupId) {
    const driverGroup = await findDriverGroupOrThrow(fastify.prisma, relationIds.driverGroupId);
    if (driverGroup.organizationId !== organizationId) {
      throw new ConflictError('Driver group must belong to the same organization');
    }
  }
}

async function assertDriverEmployeeNumberUnique(
  fastify: Parameters<FastifyPluginAsync>[0],
  input: { organizationId: string; employeeNumber: string; excludeDriverId?: string }
) {
  const existing = await fastify.prisma.driver.findFirst({
    where: {
      organizationId: input.organizationId,
      employeeNumber: input.employeeNumber.trim(),
      ...(input.excludeDriverId ? { id: { not: input.excludeDriverId } } : {}),
    },
  });

  if (existing) {
    throw new ConflictError('A driver with that employee number already exists for this organization');
  }
}

export const adminDriverRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/drivers/licenses/expiring', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-licenses:read')] }, async (request, reply) => {
    const query = validateOrThrow(listExpiringDriverLicensesQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();

    if (!requestedOrganizationId && !query.driverId) {
      throw new ValidationAppError('Organization context or driver id is required for license expiry queries');
    }

    if (requestedOrganizationId) {
      await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    }

    let driver: Awaited<ReturnType<typeof findDriverOrThrow>> | null = null;
    if (query.driverId) {
      driver = await findDriverOrThrow(fastify.prisma, query.driverId);
      await fastify.requireOrganizationAccess(request, driver.organizationId);
    }

    const untilDate = new Date();
    untilDate.setDate(untilDate.getDate() + (query.days ?? 30));
    const where = {
      ...(query.status ? { status: query.status } : {}),
      expiryDate: { not: null, lte: untilDate },
      ...(driver ? { driverId: driver.id } : {}),
      ...(requestedOrganizationId ? { driver: { organizationId: requestedOrganizationId } } : {}),
    };

    const [items, total] = await Promise.all([
      fastify.prisma.driverLicense.findMany({ where, skip, take, orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }] }),
      fastify.prisma.driverLicense.count({ where }),
    ]);

    return reply.success({ items: items.map(serializeDriverLicense) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/drivers/documents/expiring', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-documents:read')] }, async (request, reply) => {
    const query = validateOrThrow(listExpiringDriverDocumentsQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();

    if (!requestedOrganizationId && !query.driverId) {
      throw new ValidationAppError('Organization context or driver id is required for document expiry queries');
    }

    if (requestedOrganizationId) {
      await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    }

    let driver: Awaited<ReturnType<typeof findDriverOrThrow>> | null = null;
    if (query.driverId) {
      driver = await findDriverOrThrow(fastify.prisma, query.driverId);
      await fastify.requireOrganizationAccess(request, driver.organizationId);
    }

    const untilDate = new Date();
    untilDate.setDate(untilDate.getDate() + (query.days ?? 30));
    const where = {
      ...(query.status ? { status: query.status } : {}),
      expiryDate: { not: null, lte: untilDate },
      ...(driver ? { driverId: driver.id } : {}),
      ...(requestedOrganizationId ? { driver: { organizationId: requestedOrganizationId } } : {}),
    };

    const [items, total] = await Promise.all([
      fastify.prisma.driverDocument.findMany({ where, skip, take, orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }] }),
      fastify.prisma.driverDocument.count({ where }),
    ]);

    return reply.success({ items: items.map(serializeDriverDocument) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/drivers', { preHandler: [fastify.authenticate, fastify.requirePermission('drivers:read')] }, async (request, reply) => {
    const query = validateOrThrow(listDriversQuerySchema, request.query);
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
      ...(query.driverGroupId ? { driverGroupId: query.driverGroupId } : {}),
      ...(query.customerAccountId ? { customerAccountId: query.customerAccountId } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.businessUnitId ? { businessUnitId: query.businessUnitId } : {}),
      ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
      ...(query.search
        ? {
            OR: [
              { employeeNumber: { contains: query.search, mode: 'insensitive' as const } },
              { firstName: { contains: query.search, mode: 'insensitive' as const } },
              { lastName: { contains: query.search, mode: 'insensitive' as const } },
              { displayName: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
              { phone: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(!isSuperAdmin && !requestedOrganizationId ? { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } } : {}),
    };

    const [items, total] = await Promise.all([
      fastify.prisma.driver.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customerAccount: { include: { contacts: true, locations: true } },
          department: true,
          businessUnit: true,
          driverGroup: true,
          skillAssignments: { include: { driverSkill: true } },
          licenses: true,
          documents: true,
          vehicleAssignments: true,
        },
      }),
      fastify.prisma.driver.count({ where }),
    ]);

    return reply.success({ items: items.map(serializeDriver) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/drivers/:driverId', { preHandler: [fastify.authenticate, fastify.requirePermission('drivers:read')] }, async (request, reply) => {
    const { driverId } = validateOrThrow(driverIdParamSchema, request.params);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    return reply.success({
      item: {
        ...serializeDriver(driver),
        skills: driver.skillAssignments.map(serializeDriverSkillAssignment),
        licenses: driver.licenses.map(serializeDriverLicense),
        documents: driver.documents.map(serializeDriverDocument),
      },
    });
  });

  fastify.post('/admin/drivers', { preHandler: [fastify.authenticate, fastify.requirePermission('drivers:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createDriverSchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    await assertDriverRelations(fastify, body.organizationId, body);
    await assertDriverEmployeeNumberUnique(fastify, { organizationId: body.organizationId, employeeNumber: body.employeeNumber });

    const driver = await fastify.prisma.driver.create({
      data: {
        organizationId: body.organizationId,
        employeeNumber: body.employeeNumber.trim(),
        firstName: body.firstName,
        lastName: body.lastName,
        displayName: body.displayName,
        status: body.status ?? 'ACTIVE',
        ...(body.customerAccountId ? { customerAccountId: body.customerAccountId } : {}),
        ...(body.departmentId ? { departmentId: body.departmentId } : {}),
        ...(body.businessUnitId ? { businessUnitId: body.businessUnitId } : {}),
        ...(body.driverGroupId ? { driverGroupId: body.driverGroupId } : {}),
        ...(body.email ? { email: body.email } : {}),
        ...(body.phone ? { phone: body.phone } : {}),
        ...(body.dateOfBirth ? { dateOfBirth: body.dateOfBirth } : {}),
        ...(body.gender ? { gender: body.gender } : {}),
        ...(body.addressLine1 ? { addressLine1: body.addressLine1 } : {}),
        ...(body.addressLine2 ? { addressLine2: body.addressLine2 } : {}),
        ...(body.city ? { city: body.city } : {}),
        ...(body.state ? { state: body.state } : {}),
        ...(body.postalCode ? { postalCode: body.postalCode } : {}),
        ...(body.country ? { country: body.country } : {}),
        ...(body.emergencyContactName ? { emergencyContactName: body.emergencyContactName } : {}),
        ...(body.emergencyContactPhone ? { emergencyContactPhone: body.emergencyContactPhone } : {}),
        ...(body.emergencyContactRelationship ? { emergencyContactRelationship: body.emergencyContactRelationship } : {}),
        ...(body.hireDate ? { hireDate: body.hireDate } : {}),
        ...(body.employmentType ? { employmentType: body.employmentType } : {}),
        ...(body.notes ? { notes: body.notes } : {}),
      },
      include: {
        customerAccount: { include: { contacts: true, locations: true } },
        department: true,
        businessUnit: true,
        driverGroup: true,
        skillAssignments: { include: { driverSkill: true } },
        licenses: true,
        documents: true,
        vehicleAssignments: true,
      },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver.create', entityType: 'Driver', entityId: driver.id, metadata: { organizationId: driver.organizationId, employeeNumber: driver.employeeNumber, status: driver.status } });
    return reply.status(201).success({ item: serializeDriver(driver) });
  });

  fastify.patch('/admin/drivers/:driverId', { preHandler: [fastify.authenticate, fastify.requirePermission('drivers:manage')] }, async (request, reply) => {
    const { driverId } = validateOrThrow(driverIdParamSchema, request.params);
    const body = validateOrThrow(updateDriverSchema, request.body);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    await assertDriverRelations(fastify, driver.organizationId, body);
    if (body.employeeNumber) {
      await assertDriverEmployeeNumberUnique(fastify, { organizationId: driver.organizationId, employeeNumber: body.employeeNumber, excludeDriverId: driver.id });
    }

    const updateData = {
      ...(body.customerAccountId !== undefined ? { customerAccountId: body.customerAccountId } : {}),
      ...(body.departmentId !== undefined ? { departmentId: body.departmentId } : {}),
      ...(body.businessUnitId !== undefined ? { businessUnitId: body.businessUnitId } : {}),
      ...(body.driverGroupId !== undefined ? { driverGroupId: body.driverGroupId } : {}),
      ...(body.employeeNumber ? { employeeNumber: body.employeeNumber.trim() } : {}),
      ...(body.firstName ? { firstName: body.firstName } : {}),
      ...(body.lastName ? { lastName: body.lastName } : {}),
      ...(body.displayName ? { displayName: body.displayName } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.dateOfBirth !== undefined ? { dateOfBirth: body.dateOfBirth } : {}),
      ...(body.gender !== undefined ? { gender: body.gender } : {}),
      ...(body.addressLine1 !== undefined ? { addressLine1: body.addressLine1 } : {}),
      ...(body.addressLine2 !== undefined ? { addressLine2: body.addressLine2 } : {}),
      ...(body.city !== undefined ? { city: body.city } : {}),
      ...(body.state !== undefined ? { state: body.state } : {}),
      ...(body.postalCode !== undefined ? { postalCode: body.postalCode } : {}),
      ...(body.country !== undefined ? { country: body.country } : {}),
      ...(body.emergencyContactName !== undefined ? { emergencyContactName: body.emergencyContactName } : {}),
      ...(body.emergencyContactPhone !== undefined ? { emergencyContactPhone: body.emergencyContactPhone } : {}),
      ...(body.emergencyContactRelationship !== undefined ? { emergencyContactRelationship: body.emergencyContactRelationship } : {}),
      ...(body.hireDate !== undefined ? { hireDate: body.hireDate } : {}),
      ...(body.employmentType !== undefined ? { employmentType: body.employmentType } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    };

    const updated = await fastify.prisma.driver.update({
      where: { id: driverId },
      data: updateData,
      include: {
        customerAccount: { include: { contacts: true, locations: true } },
        department: true,
        businessUnit: true,
        driverGroup: true,
        skillAssignments: { include: { driverSkill: true } },
        licenses: true,
        documents: true,
        vehicleAssignments: true,
      },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver.update', entityType: 'Driver', entityId: driverId, metadata: updateData });
    return reply.success({ item: serializeDriver(updated) });
  });

  fastify.post('/admin/drivers/:driverId/activate', { preHandler: [fastify.authenticate, fastify.requirePermission('drivers:manage')] }, async (request, reply) => {
    const { driverId } = validateOrThrow(driverIdParamSchema, request.params);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const updated = await fastify.prisma.driver.update({ where: { id: driverId }, data: { status: 'ACTIVE' }, include: { customerAccount: { include: { contacts: true, locations: true } }, department: true, businessUnit: true, driverGroup: true, skillAssignments: { include: { driverSkill: true } }, licenses: true, documents: true, vehicleAssignments: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver.activate', entityType: 'Driver', entityId: driverId });
    return reply.success({ item: serializeDriver(updated) });
  });

  fastify.post('/admin/drivers/:driverId/deactivate', { preHandler: [fastify.authenticate, fastify.requirePermission('drivers:manage')] }, async (request, reply) => {
    const { driverId } = validateOrThrow(driverIdParamSchema, request.params);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const updated = await fastify.prisma.driver.update({ where: { id: driverId }, data: { status: 'INACTIVE' }, include: { customerAccount: { include: { contacts: true, locations: true } }, department: true, businessUnit: true, driverGroup: true, skillAssignments: { include: { driverSkill: true } }, licenses: true, documents: true, vehicleAssignments: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver.deactivate', entityType: 'Driver', entityId: driverId });
    return reply.success({ item: serializeDriver(updated) });
  });

  fastify.post('/admin/drivers/:driverId/archive', { preHandler: [fastify.authenticate, fastify.requirePermission('drivers:manage')] }, async (request, reply) => {
    const { driverId } = validateOrThrow(driverIdParamSchema, request.params);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const updated = await fastify.prisma.driver.update({ where: { id: driverId }, data: { status: 'ARCHIVED' }, include: { customerAccount: { include: { contacts: true, locations: true } }, department: true, businessUnit: true, driverGroup: true, skillAssignments: { include: { driverSkill: true } }, licenses: true, documents: true, vehicleAssignments: true } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver.archive', entityType: 'Driver', entityId: driverId });
    return reply.success({ item: serializeDriver(updated) });
  });

  fastify.get('/admin/drivers/:driverId/skills', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-skills:read')] }, async (request, reply) => {
    const { driverId } = validateOrThrow(driverIdParamSchema, request.params);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    return reply.success({ items: driver.skillAssignments.map(serializeDriverSkillAssignment) });
  });

  fastify.post('/admin/drivers/:driverId/skills', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-skills:manage')] }, async (request, reply) => {
    const { driverId } = validateOrThrow(driverIdParamSchema, request.params);
    const body = validateOrThrow(assignDriverSkillSchema, request.body);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const skill = await findDriverSkillOrThrow(fastify.prisma, body.driverSkillId);
    if (skill.organizationId !== driver.organizationId) {
      throw new ConflictError('Driver skill must belong to the same organization');
    }

    const assignment = await fastify.prisma.driverSkillAssignment.upsert({
      where: { driverId_driverSkillId: { driverId, driverSkillId: body.driverSkillId } },
      update: { ...(body.notes !== undefined ? { notes: body.notes } : {}) },
      create: { driverId, driverSkillId: body.driverSkillId, ...(body.notes ? { notes: body.notes } : {}) },
      include: { driverSkill: true },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_skill_assignment.assign', entityType: 'DriverSkillAssignment', entityId: assignment.id, metadata: { driverId, driverSkillId: body.driverSkillId } });
    return reply.status(201).success({ item: serializeDriverSkillAssignment(assignment) });
  });

  fastify.delete('/admin/drivers/:driverId/skills/:driverSkillId', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-skills:manage')] }, async (request, reply) => {
    const { driverId, driverSkillId } = validateOrThrow(driverSkillIdParamSchema, request.params);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const assignment = await fastify.prisma.driverSkillAssignment.findUnique({ where: { driverId_driverSkillId: { driverId, driverSkillId } } });
    if (!assignment) {
      throw new ValidationAppError('Driver skill assignment not found');
    }

    await fastify.prisma.driverSkillAssignment.delete({ where: { id: assignment.id } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_skill_assignment.remove', entityType: 'DriverSkillAssignment', entityId: assignment.id, metadata: { driverId, driverSkillId } });
    return reply.success({ deleted: true });
  });

  fastify.get('/admin/drivers/:driverId/licenses', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-licenses:read')] }, async (request, reply) => {
    const { driverId } = validateOrThrow(driverIdParamSchema, request.params);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    return reply.success({ items: driver.licenses.map(serializeDriverLicense) });
  });

  fastify.get('/admin/drivers/:driverId/licenses/:licenseId', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-licenses:read')] }, async (request, reply) => {
    const { driverId, licenseId } = validateOrThrow(driverLicenseIdParamSchema, request.params);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const license = await findDriverLicenseOrThrow(fastify.prisma, licenseId);
    if (license.driverId !== driverId) {
      throw new ConflictError('Driver license does not belong to the requested driver');
    }
    return reply.success({ item: serializeDriverLicense(license) });
  });

  fastify.post('/admin/drivers/:driverId/licenses', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-licenses:manage')] }, async (request, reply) => {
    const { driverId } = validateOrThrow(driverIdParamSchema, request.params);
    const body = validateOrThrow(createDriverLicenseSchema, request.body);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);

    const license = await fastify.prisma.driverLicense.create({
      data: {
        driverId,
        licenseNumber: body.licenseNumber.trim(),
        licenseType: body.licenseType.trim(),
        status: body.status ?? 'ACTIVE',
        ...(body.issuingCountry ? { issuingCountry: body.issuingCountry.trim() } : {}),
        ...(body.issueDate ? { issueDate: body.issueDate } : {}),
        ...(body.expiryDate ? { expiryDate: body.expiryDate } : {}),
        ...(body.notes ? { notes: body.notes } : {}),
      },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_license.create', entityType: 'DriverLicense', entityId: license.id, metadata: { driverId, licenseNumber: license.licenseNumber, status: license.status } });
    return reply.status(201).success({ item: serializeDriverLicense(license) });
  });

  fastify.patch('/admin/drivers/:driverId/licenses/:licenseId', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-licenses:manage')] }, async (request, reply) => {
    const { driverId, licenseId } = validateOrThrow(driverLicenseIdParamSchema, request.params);
    const body = validateOrThrow(updateDriverLicenseSchema, request.body);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const license = await findDriverLicenseOrThrow(fastify.prisma, licenseId);
    if (license.driverId !== driverId) {
      throw new ConflictError('Driver license does not belong to the requested driver');
    }

    const updateData = {
      ...(body.licenseNumber ? { licenseNumber: body.licenseNumber.trim() } : {}),
      ...(body.licenseType ? { licenseType: body.licenseType.trim() } : {}),
      ...(body.issuingCountry !== undefined ? { issuingCountry: body.issuingCountry } : {}),
      ...(body.issueDate !== undefined ? { issueDate: body.issueDate } : {}),
      ...(body.expiryDate !== undefined ? { expiryDate: body.expiryDate } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    };

    const updated = await fastify.prisma.driverLicense.update({ where: { id: licenseId }, data: updateData });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_license.update', entityType: 'DriverLicense', entityId: licenseId, metadata: updateData });
    return reply.success({ item: serializeDriverLicense(updated) });
  });

  fastify.post('/admin/drivers/:driverId/licenses/:licenseId/archive', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-licenses:manage')] }, async (request, reply) => {
    const { driverId, licenseId } = validateOrThrow(driverLicenseIdParamSchema, request.params);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const license = await findDriverLicenseOrThrow(fastify.prisma, licenseId);
    if (license.driverId !== driverId) {
      throw new ConflictError('Driver license does not belong to the requested driver');
    }

    const updated = await fastify.prisma.driverLicense.update({ where: { id: licenseId }, data: { status: 'ARCHIVED' } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_license.archive', entityType: 'DriverLicense', entityId: licenseId });
    return reply.success({ item: serializeDriverLicense(updated) });
  });

  fastify.get('/admin/drivers/:driverId/documents', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-documents:read')] }, async (request, reply) => {
    const { driverId } = validateOrThrow(driverIdParamSchema, request.params);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    return reply.success({ items: driver.documents.map(serializeDriverDocument) });
  });

  fastify.get('/admin/drivers/:driverId/documents/:documentId', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-documents:read')] }, async (request, reply) => {
    const { driverId, documentId } = validateOrThrow(driverDocumentIdParamSchema, request.params);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const document = await findDriverDocumentOrThrow(fastify.prisma, documentId);
    if (document.driverId !== driverId) {
      throw new ConflictError('Driver document does not belong to the requested driver');
    }
    return reply.success({ item: serializeDriverDocument(document) });
  });

  fastify.post('/admin/drivers/:driverId/documents', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-documents:manage')] }, async (request, reply) => {
    const { driverId } = validateOrThrow(driverIdParamSchema, request.params);
    const body = validateOrThrow(createDriverDocumentSchema, request.body);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);

    const document = await fastify.prisma.driverDocument.create({
      data: {
        driverId,
        documentType: body.documentType,
        status: body.status ?? 'ACTIVE',
        ...(body.documentNumber ? { documentNumber: body.documentNumber.trim() } : {}),
        ...(body.issueDate ? { issueDate: body.issueDate } : {}),
        ...(body.expiryDate ? { expiryDate: body.expiryDate } : {}),
        ...(body.fileName ? { fileName: body.fileName.trim() } : {}),
        ...(body.fileUrl ? { fileUrl: body.fileUrl.trim() } : {}),
        ...(body.fileMimeType ? { fileMimeType: body.fileMimeType.trim() } : {}),
        ...(body.fileSizeBytes !== undefined ? { fileSizeBytes: body.fileSizeBytes } : {}),
        ...(body.notes ? { notes: body.notes } : {}),
      },
    });

    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_document.create', entityType: 'DriverDocument', entityId: document.id, metadata: { driverId, documentType: document.documentType, status: document.status } });
    return reply.status(201).success({ item: serializeDriverDocument(document) });
  });

  fastify.patch('/admin/drivers/:driverId/documents/:documentId', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-documents:manage')] }, async (request, reply) => {
    const { driverId, documentId } = validateOrThrow(driverDocumentIdParamSchema, request.params);
    const body = validateOrThrow(updateDriverDocumentSchema, request.body);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const document = await findDriverDocumentOrThrow(fastify.prisma, documentId);
    if (document.driverId !== driverId) {
      throw new ConflictError('Driver document does not belong to the requested driver');
    }

    const updateData = {
      ...(body.documentType ? { documentType: body.documentType } : {}),
      ...(body.documentNumber !== undefined ? { documentNumber: body.documentNumber } : {}),
      ...(body.issueDate !== undefined ? { issueDate: body.issueDate } : {}),
      ...(body.expiryDate !== undefined ? { expiryDate: body.expiryDate } : {}),
      ...(body.fileName !== undefined ? { fileName: body.fileName } : {}),
      ...(body.fileUrl !== undefined ? { fileUrl: body.fileUrl } : {}),
      ...(body.fileMimeType !== undefined ? { fileMimeType: body.fileMimeType } : {}),
      ...(body.fileSizeBytes !== undefined ? { fileSizeBytes: body.fileSizeBytes } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    };

    const updated = await fastify.prisma.driverDocument.update({ where: { id: documentId }, data: updateData });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_document.update', entityType: 'DriverDocument', entityId: documentId, metadata: updateData });
    return reply.success({ item: serializeDriverDocument(updated) });
  });

  fastify.post('/admin/drivers/:driverId/documents/:documentId/archive', { preHandler: [fastify.authenticate, fastify.requirePermission('driver-documents:manage')] }, async (request, reply) => {
    const { driverId, documentId } = validateOrThrow(driverDocumentIdParamSchema, request.params);
    const driver = await findDriverOrThrow(fastify.prisma, driverId);
    await fastify.requireOrganizationAccess(request, driver.organizationId);
    const document = await findDriverDocumentOrThrow(fastify.prisma, documentId);
    if (document.driverId !== driverId) {
      throw new ConflictError('Driver document does not belong to the requested driver');
    }

    const updated = await fastify.prisma.driverDocument.update({ where: { id: documentId }, data: { status: 'ARCHIVED' } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.driver_document.archive', entityType: 'DriverDocument', entityId: documentId });
    return reply.success({ item: serializeDriverDocument(updated) });
  });
};
