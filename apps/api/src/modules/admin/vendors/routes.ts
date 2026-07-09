import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findVendorCategoryOrThrow,
  findVendorContractOrThrow,
  findVendorOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeVendor,
  serializeVendorCategory,
  serializeVendorContact,
  serializeVendorContract,
} from '../utils.js';

const vendorIdParamSchema = z.object({
  vendorId: z.string().min(1),
});

const vendorContactIdParamSchema = z.object({
  vendorId: z.string().min(1),
  contactId: z.string().min(1),
});

const vendorContractIdParamSchema = z.object({
  vendorId: z.string().min(1),
  contractId: z.string().min(1),
});

const listVendorsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createVendorSchema = z.object({
  organizationId: z.string().min(1),
  vendorCategoryId: z.string().min(1).optional(),
  name: z.string().min(2),
  code: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateVendorSchema = z
  .object({
    vendorCategoryId: z.string().min(1).nullable().optional(),
    name: z.string().min(2).optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().trim().nullable().optional(),
    address: z.string().trim().nullable().optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one vendor field must be supplied' });

const createVendorContractSchema = z.object({
  contractNumber: z.string().min(1),
  title: z.string().min(2),
  description: z.string().trim().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  notes: z.string().trim().optional(),
});

const updateVendorContractSchema = z
  .object({
    contractNumber: z.string().min(1).optional(),
    title: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
    startDate: z.coerce.date().nullable().optional(),
    endDate: z.coerce.date().nullable().optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one vendor contract field must be supplied' });

const createVendorContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().trim().optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().optional(),
  title: z.string().trim().optional(),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

const updateVendorContactSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().trim().nullable().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().trim().nullable().optional(),
    title: z.string().trim().nullable().optional(),
    isPrimary: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one vendor contact field must be supplied' });

export const adminVendorRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/vendors',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendors:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listVendorsQuerySchema, request.query);
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
        ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}),
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' as const } },
                { code: { contains: query.search, mode: 'insensitive' as const } },
                { email: { contains: query.search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
        ...(!isSuperAdmin && !requestedOrganizationId
          ? {
              organization: {
                users: {
                  some: {
                    userId: request.currentUser!.id,
                    status: 'ACTIVE' as const,
                  },
                },
              },
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.vendor.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            contacts: true,
            vendorCategory: true,
            contracts: true,
          },
        }),
        fastify.prisma.vendor.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeVendor) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/vendors/:vendorId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendors:read')],
    },
    async (request, reply) => {
      const { vendorId } = validateOrThrow(vendorIdParamSchema, request.params);
      const vendor = await findVendorOrThrow(fastify.prisma, vendorId);
      await fastify.requireOrganizationAccess(request, vendor.organizationId);

      return reply.success({
        item: {
          ...serializeVendor(vendor),
          vendorCategory: vendor.vendorCategory ? serializeVendorCategory(vendor.vendorCategory) : null,
          contacts: vendor.contacts.map(serializeVendorContact),
          contracts: vendor.contracts.map(serializeVendorContract),
        },
      });
    }
  );

  fastify.post(
    '/admin/vendors',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendors:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createVendorSchema, request.body);
      const code = normalizeEntityCode(body.code);
      const status = body.status ?? 'ACTIVE';
      await fastify.requireOrganizationAccess(request, body.organizationId);
      if (body.vendorCategoryId) {
        const category = await findVendorCategoryOrThrow(fastify.prisma, body.vendorCategoryId);
        if (category.organizationId !== body.organizationId) {
          throw new ConflictError('Vendor category must belong to the same organization');
        }
      }

      const existing = await fastify.prisma.vendor.findUnique({
        where: {
          organizationId_code: {
            organizationId: body.organizationId,
            code,
          },
        },
      });

      if (existing) {
        throw new ConflictError('A vendor with that code already exists for this organization');
      }

      const vendor = await fastify.prisma.vendor.create({
        data: {
          organizationId: body.organizationId,
          name: body.name,
          code,
          status,
          ...(body.vendorCategoryId ? { vendorCategoryId: body.vendorCategoryId } : {}),
          ...(body.email ? { email: body.email } : {}),
          ...(body.phone ? { phone: body.phone } : {}),
          ...(body.address ? { address: body.address } : {}),
          ...(body.notes ? { notes: body.notes } : {}),
        },
        include: {
          contacts: true,
          vendorCategory: true,
          contracts: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor.create',
        entityType: 'Vendor',
        entityId: vendor.id,
        metadata: { organizationId: vendor.organizationId, code: vendor.code, status: vendor.status },
      });

      return reply.status(201).success({ item: serializeVendor(vendor) });
    }
  );

  fastify.patch(
    '/admin/vendors/:vendorId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendors:manage')],
    },
    async (request, reply) => {
      const { vendorId } = validateOrThrow(vendorIdParamSchema, request.params);
      const body = validateOrThrow(updateVendorSchema, request.body);
      const vendor = await findVendorOrThrow(fastify.prisma, vendorId);
      await fastify.requireOrganizationAccess(request, vendor.organizationId);
      if (body.vendorCategoryId) {
        const category = await findVendorCategoryOrThrow(fastify.prisma, body.vendorCategoryId);
        if (category.organizationId !== vendor.organizationId) {
          throw new ConflictError('Vendor category must belong to the same organization');
        }
      }

      const updateData = {
        ...(body.vendorCategoryId !== undefined ? { vendorCategoryId: body.vendorCategoryId } : {}),
        ...(body.name ? { name: body.name } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.address !== undefined ? { address: body.address } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      };

      const updatedVendor = await fastify.prisma.vendor.update({
        where: { id: vendorId },
        data: updateData,
        include: {
          contacts: true,
          vendorCategory: true,
          contracts: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor.update',
        entityType: 'Vendor',
        entityId: vendorId,
        metadata: updateData,
      });

      return reply.success({ item: serializeVendor(updatedVendor) });
    }
  );

  fastify.post(
    '/admin/vendors/:vendorId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendors:manage')],
    },
    async (request, reply) => {
      const { vendorId } = validateOrThrow(vendorIdParamSchema, request.params);
      const vendor = await findVendorOrThrow(fastify.prisma, vendorId);
      await fastify.requireOrganizationAccess(request, vendor.organizationId);

      const updatedVendor = await fastify.prisma.vendor.update({
        where: { id: vendorId },
        data: { status: 'ACTIVE' },
        include: { contacts: true, vendorCategory: true, contracts: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor.activate',
        entityType: 'Vendor',
        entityId: vendorId,
      });

      return reply.success({ item: serializeVendor(updatedVendor) });
    }
  );

  fastify.post(
    '/admin/vendors/:vendorId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendors:manage')],
    },
    async (request, reply) => {
      const { vendorId } = validateOrThrow(vendorIdParamSchema, request.params);
      const vendor = await findVendorOrThrow(fastify.prisma, vendorId);
      await fastify.requireOrganizationAccess(request, vendor.organizationId);

      const updatedVendor = await fastify.prisma.vendor.update({
        where: { id: vendorId },
        data: { status: 'INACTIVE' },
        include: { contacts: true, vendorCategory: true, contracts: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor.deactivate',
        entityType: 'Vendor',
        entityId: vendorId,
      });

      return reply.success({ item: serializeVendor(updatedVendor) });
    }
  );

  fastify.post(
    '/admin/vendors/:vendorId/contacts',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-contacts:manage')],
    },
    async (request, reply) => {
      const { vendorId } = validateOrThrow(vendorIdParamSchema, request.params);
      const body = validateOrThrow(createVendorContactSchema, request.body);
      const vendor = await findVendorOrThrow(fastify.prisma, vendorId);
      await fastify.requireOrganizationAccess(request, vendor.organizationId);

      const contact = await fastify.prisma.vendorContact.create({
        data: {
          vendorId,
          firstName: body.firstName,
          isPrimary: body.isPrimary ?? false,
          isActive: body.isActive ?? true,
          ...(body.lastName ? { lastName: body.lastName } : {}),
          ...(body.email ? { email: body.email } : {}),
          ...(body.phone ? { phone: body.phone } : {}),
          ...(body.title ? { title: body.title } : {}),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor_contact.create',
        entityType: 'VendorContact',
        entityId: contact.id,
        metadata: { vendorId },
      });

      return reply.status(201).success({ item: serializeVendorContact(contact) });
    }
  );

  fastify.patch(
    '/admin/vendors/:vendorId/contacts/:contactId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-contacts:manage')],
    },
    async (request, reply) => {
      const { vendorId, contactId } = validateOrThrow(vendorContactIdParamSchema, request.params);
      const body = validateOrThrow(updateVendorContactSchema, request.body);
      const vendor = await findVendorOrThrow(fastify.prisma, vendorId);
      await fastify.requireOrganizationAccess(request, vendor.organizationId);

      const contact = await fastify.prisma.vendorContact.findFirst({
        where: {
          id: contactId,
          vendorId,
        },
      });

      if (!contact) {
        throw new NotFoundError('Vendor contact not found');
      }

      const updateData = {
        ...(body.firstName ? { firstName: body.firstName } : {}),
        ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.isPrimary !== undefined ? { isPrimary: body.isPrimary } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      };

      const updatedContact = await fastify.prisma.vendorContact.update({
        where: { id: contactId },
        data: updateData,
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor_contact.update',
        entityType: 'VendorContact',
        entityId: contactId,
        metadata: updateData,
      });

      return reply.success({ item: serializeVendorContact(updatedContact) });
    }
  );

  fastify.delete(
    '/admin/vendors/:vendorId/contacts/:contactId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-contacts:manage')],
    },
    async (request, reply) => {
      const { vendorId, contactId } = validateOrThrow(vendorContactIdParamSchema, request.params);
      const vendor = await findVendorOrThrow(fastify.prisma, vendorId);
      await fastify.requireOrganizationAccess(request, vendor.organizationId);

      const contact = await fastify.prisma.vendorContact.findFirst({
        where: {
          id: contactId,
          vendorId,
        },
      });

      if (!contact) {
        throw new NotFoundError('Vendor contact not found');
      }

      await fastify.prisma.vendorContact.delete({
        where: { id: contactId },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor_contact.delete',
        entityType: 'VendorContact',
        entityId: contactId,
        metadata: { vendorId },
      });

      return reply.success({ deleted: true });
    }
  );

  fastify.get(
    '/admin/vendors/:vendorId/contracts',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-contracts:read')],
    },
    async (request, reply) => {
      const { vendorId } = validateOrThrow(vendorIdParamSchema, request.params);
      const vendor = await findVendorOrThrow(fastify.prisma, vendorId);
      await fastify.requireOrganizationAccess(request, vendor.organizationId);

      return reply.success({
        items: vendor.contracts
          .slice()
          .sort(
            (left: { createdAt: Date }, right: { createdAt: Date }) => right.createdAt.getTime() - left.createdAt.getTime()
          )
          .map(serializeVendorContract),
      });
    }
  );

  fastify.get(
    '/admin/vendors/:vendorId/contracts/:contractId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-contracts:read')],
    },
    async (request, reply) => {
      const { vendorId, contractId } = validateOrThrow(vendorContractIdParamSchema, request.params);
      const vendor = await findVendorOrThrow(fastify.prisma, vendorId);
      await fastify.requireOrganizationAccess(request, vendor.organizationId);
      const contract = await findVendorContractOrThrow(fastify.prisma, contractId);

      if (contract.vendorId !== vendorId) {
        throw new ConflictError('Vendor contract does not belong to the requested vendor');
      }

      return reply.success({ item: serializeVendorContract(contract) });
    }
  );

  fastify.post(
    '/admin/vendors/:vendorId/contracts',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-contracts:manage')],
    },
    async (request, reply) => {
      const { vendorId } = validateOrThrow(vendorIdParamSchema, request.params);
      const body = validateOrThrow(createVendorContractSchema, request.body);
      const vendor = await findVendorOrThrow(fastify.prisma, vendorId);
      await fastify.requireOrganizationAccess(request, vendor.organizationId);

      const contract = await fastify.prisma.vendorContract.create({
        data: {
          vendorId,
          contractNumber: body.contractNumber,
          title: body.title,
          status: 'DRAFT',
          ...(body.description ? { description: body.description } : {}),
          ...(body.startDate ? { startDate: body.startDate } : {}),
          ...(body.endDate ? { endDate: body.endDate } : {}),
          ...(body.notes ? { notes: body.notes } : {}),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor_contract.create',
        entityType: 'VendorContract',
        entityId: contract.id,
        metadata: { vendorId, contractNumber: contract.contractNumber, status: contract.status },
      });

      return reply.status(201).success({ item: serializeVendorContract(contract) });
    }
  );

  fastify.patch(
    '/admin/vendors/:vendorId/contracts/:contractId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-contracts:manage')],
    },
    async (request, reply) => {
      const { vendorId, contractId } = validateOrThrow(vendorContractIdParamSchema, request.params);
      const body = validateOrThrow(updateVendorContractSchema, request.body);
      const vendor = await findVendorOrThrow(fastify.prisma, vendorId);
      await fastify.requireOrganizationAccess(request, vendor.organizationId);
      const contract = await findVendorContractOrThrow(fastify.prisma, contractId);

      if (contract.vendorId !== vendorId) {
        throw new ConflictError('Vendor contract does not belong to the requested vendor');
      }

      const updateData = {
        ...(body.contractNumber ? { contractNumber: body.contractNumber } : {}),
        ...(body.title ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.startDate !== undefined ? { startDate: body.startDate } : {}),
        ...(body.endDate !== undefined ? { endDate: body.endDate } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      };

      const updatedContract = await fastify.prisma.vendorContract.update({
        where: { id: contractId },
        data: updateData,
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor_contract.update',
        entityType: 'VendorContract',
        entityId: contractId,
        metadata: updateData,
      });

      return reply.success({ item: serializeVendorContract(updatedContract) });
    }
  );

  fastify.post(
    '/admin/vendors/:vendorId/contracts/:contractId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-contracts:manage')],
    },
    async (request, reply) => {
      const { vendorId, contractId } = validateOrThrow(vendorContractIdParamSchema, request.params);
      const vendor = await findVendorOrThrow(fastify.prisma, vendorId);
      await fastify.requireOrganizationAccess(request, vendor.organizationId);
      const contract = await findVendorContractOrThrow(fastify.prisma, contractId);

      if (contract.vendorId !== vendorId) {
        throw new ConflictError('Vendor contract does not belong to the requested vendor');
      }

      const updatedContract = await fastify.prisma.vendorContract.update({
        where: { id: contractId },
        data: { status: 'ACTIVE' },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor_contract.activate',
        entityType: 'VendorContract',
        entityId: contractId,
      });

      return reply.success({ item: serializeVendorContract(updatedContract) });
    }
  );

  fastify.post(
    '/admin/vendors/:vendorId/contracts/:contractId/expire',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-contracts:manage')],
    },
    async (request, reply) => {
      const { vendorId, contractId } = validateOrThrow(vendorContractIdParamSchema, request.params);
      const vendor = await findVendorOrThrow(fastify.prisma, vendorId);
      await fastify.requireOrganizationAccess(request, vendor.organizationId);
      const contract = await findVendorContractOrThrow(fastify.prisma, contractId);

      if (contract.vendorId !== vendorId) {
        throw new ConflictError('Vendor contract does not belong to the requested vendor');
      }

      const updatedContract = await fastify.prisma.vendorContract.update({
        where: { id: contractId },
        data: {
          status: 'EXPIRED',
          endDate: contract.endDate ?? new Date(),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor_contract.expire',
        entityType: 'VendorContract',
        entityId: contractId,
      });

      return reply.success({ item: serializeVendorContract(updatedContract) });
    }
  );

  fastify.post(
    '/admin/vendors/:vendorId/contracts/:contractId/cancel',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-contracts:manage')],
    },
    async (request, reply) => {
      const { vendorId, contractId } = validateOrThrow(vendorContractIdParamSchema, request.params);
      const vendor = await findVendorOrThrow(fastify.prisma, vendorId);
      await fastify.requireOrganizationAccess(request, vendor.organizationId);
      const contract = await findVendorContractOrThrow(fastify.prisma, contractId);

      if (contract.vendorId !== vendorId) {
        throw new ConflictError('Vendor contract does not belong to the requested vendor');
      }

      const updatedContract = await fastify.prisma.vendorContract.update({
        where: { id: contractId },
        data: { status: 'CANCELED' },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor_contract.cancel',
        entityType: 'VendorContract',
        entityId: contractId,
      });

      return reply.success({ item: serializeVendorContract(updatedContract) });
    }
  );
};
