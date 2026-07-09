import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  customerAccountStatusSchema,
  findCustomerAccountOrThrow,
  getAuditContext,
  getPagination,
  paginationQuerySchema,
  serializeCustomerAccount,
  serializeCustomerContact,
  serializeCustomerLocation,
} from '../utils.js';

const customerAccountIdParamSchema = z.object({
  customerAccountId: z.string().min(1),
});

const customerContactIdParamSchema = z.object({
  customerAccountId: z.string().min(1),
  contactId: z.string().min(1),
});

const customerLocationIdParamSchema = z.object({
  customerAccountId: z.string().min(1),
  locationId: z.string().min(1),
});

const listCustomerAccountsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: customerAccountStatusSchema.optional(),
});

const createCustomerAccountSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().trim().optional(),
  billingAddress: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: customerAccountStatusSchema.default('ACTIVE'),
});

const updateCustomerAccountSchema = z
  .object({
    name: z.string().min(2).optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().trim().nullable().optional(),
    billingAddress: z.string().trim().nullable().optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one customer account field must be supplied' });

const createCustomerContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().trim().optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().optional(),
  title: z.string().trim().optional(),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

const updateCustomerContactSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().trim().nullable().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().trim().nullable().optional(),
    title: z.string().trim().nullable().optional(),
    isPrimary: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one customer contact field must be supplied' });

const createCustomerLocationSchema = z.object({
  name: z.string().min(1),
  code: z.string().trim().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

const updateCustomerLocationSchema = z
  .object({
    name: z.string().min(1).optional(),
    code: z.string().trim().nullable().optional(),
    addressLine1: z.string().min(1).optional(),
    addressLine2: z.string().trim().nullable().optional(),
    city: z.string().trim().nullable().optional(),
    state: z.string().trim().nullable().optional(),
    postalCode: z.string().trim().nullable().optional(),
    country: z.string().trim().nullable().optional(),
    latitude: z.coerce.number().nullable().optional(),
    longitude: z.coerce.number().nullable().optional(),
    isPrimary: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one customer location field must be supplied' });

function normalizeCustomerCode(code: string) {
  return code
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();
}

export const adminCustomerAccountRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/customer-accounts',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('customer-accounts:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listCustomerAccountsQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
      const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();

      if (!isSuperAdmin && !requestedOrganizationId) {
        throw new ValidationAppError('Organization context is required for customer account queries', {
          header: 'x-organization-id',
        });
      }

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
        fastify.prisma.customerAccount.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            contacts: true,
            locations: true,
          },
        }),
        fastify.prisma.customerAccount.count({ where }),
      ]);

      return reply.success(
        { items: items.map(serializeCustomerAccount) },
        buildPaginationMeta({ page, pageSize, total })
      );
    }
  );

  fastify.get(
    '/admin/customer-accounts/:customerAccountId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('customer-accounts:read')],
    },
    async (request, reply) => {
      const { customerAccountId } = validateOrThrow(customerAccountIdParamSchema, request.params);
      const account = await findCustomerAccountOrThrow(fastify.prisma, customerAccountId);
      await fastify.requireOrganizationAccess(request, account.organizationId);

      return reply.success({
        item: {
          ...serializeCustomerAccount(account),
          contacts: account.contacts.map(serializeCustomerContact),
          locations: account.locations.map(serializeCustomerLocation),
        },
      });
    }
  );

  fastify.post(
    '/admin/customer-accounts',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('customer-accounts:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createCustomerAccountSchema, request.body);
      const code = normalizeCustomerCode(body.code);
      const status = body.status ?? 'ACTIVE';
      await fastify.requireOrganizationAccess(request, body.organizationId);

      const existing = await fastify.prisma.customerAccount.findUnique({
        where: {
          organizationId_code: {
            organizationId: body.organizationId,
            code,
          },
        },
      });

      if (existing) {
        throw new ConflictError('A customer account with that code already exists for this organization');
      }

      const account = await fastify.prisma.customerAccount.create({
        data: {
          organizationId: body.organizationId,
          name: body.name,
          code,
          status,
          ...(body.email ? { email: body.email } : {}),
          ...(body.phone ? { phone: body.phone } : {}),
          ...(body.billingAddress ? { billingAddress: body.billingAddress } : {}),
          ...(body.notes ? { notes: body.notes } : {}),
        },
        include: {
          contacts: true,
          locations: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.customer_account.create',
        entityType: 'CustomerAccount',
        entityId: account.id,
        metadata: { organizationId: account.organizationId, code: account.code, status: account.status },
      });

      return reply.status(201).success({ item: serializeCustomerAccount(account) });
    }
  );

  fastify.patch(
    '/admin/customer-accounts/:customerAccountId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('customer-accounts:manage')],
    },
    async (request, reply) => {
      const { customerAccountId } = validateOrThrow(customerAccountIdParamSchema, request.params);
      const body = validateOrThrow(updateCustomerAccountSchema, request.body);
      const account = await findCustomerAccountOrThrow(fastify.prisma, customerAccountId);
      await fastify.requireOrganizationAccess(request, account.organizationId);

      const updateData = {
        ...(body.name ? { name: body.name } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.billingAddress !== undefined ? { billingAddress: body.billingAddress } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      };

      const updatedAccount = await fastify.prisma.customerAccount.update({
        where: { id: customerAccountId },
        data: updateData,
        include: {
          contacts: true,
          locations: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.customer_account.update',
        entityType: 'CustomerAccount',
        entityId: customerAccountId,
        metadata: updateData,
      });

      return reply.success({ item: serializeCustomerAccount(updatedAccount) });
    }
  );

  fastify.post(
    '/admin/customer-accounts/:customerAccountId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('customer-accounts:manage')],
    },
    async (request, reply) => {
      const { customerAccountId } = validateOrThrow(customerAccountIdParamSchema, request.params);
      const account = await findCustomerAccountOrThrow(fastify.prisma, customerAccountId);
      await fastify.requireOrganizationAccess(request, account.organizationId);

      const updatedAccount = await fastify.prisma.customerAccount.update({
        where: { id: customerAccountId },
        data: { status: 'ACTIVE' },
        include: { contacts: true, locations: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.customer_account.activate',
        entityType: 'CustomerAccount',
        entityId: customerAccountId,
      });

      return reply.success({ item: serializeCustomerAccount(updatedAccount) });
    }
  );

  fastify.post(
    '/admin/customer-accounts/:customerAccountId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('customer-accounts:manage')],
    },
    async (request, reply) => {
      const { customerAccountId } = validateOrThrow(customerAccountIdParamSchema, request.params);
      const account = await findCustomerAccountOrThrow(fastify.prisma, customerAccountId);
      await fastify.requireOrganizationAccess(request, account.organizationId);

      const updatedAccount = await fastify.prisma.customerAccount.update({
        where: { id: customerAccountId },
        data: { status: 'INACTIVE' },
        include: { contacts: true, locations: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.customer_account.deactivate',
        entityType: 'CustomerAccount',
        entityId: customerAccountId,
      });

      return reply.success({ item: serializeCustomerAccount(updatedAccount) });
    }
  );

  fastify.post(
    '/admin/customer-accounts/:customerAccountId/contacts',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('customer-contacts:manage')],
    },
    async (request, reply) => {
      const { customerAccountId } = validateOrThrow(customerAccountIdParamSchema, request.params);
      const body = validateOrThrow(createCustomerContactSchema, request.body);
      const account = await findCustomerAccountOrThrow(fastify.prisma, customerAccountId);
      await fastify.requireOrganizationAccess(request, account.organizationId);

      const contact = await fastify.prisma.customerContact.create({
        data: {
          customerAccountId,
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
        action: 'admin.customer_contact.create',
        entityType: 'CustomerContact',
        entityId: contact.id,
        metadata: { customerAccountId },
      });

      return reply.status(201).success({ item: serializeCustomerContact(contact) });
    }
  );

  fastify.patch(
    '/admin/customer-accounts/:customerAccountId/contacts/:contactId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('customer-contacts:manage')],
    },
    async (request, reply) => {
      const { customerAccountId, contactId } = validateOrThrow(customerContactIdParamSchema, request.params);
      const body = validateOrThrow(updateCustomerContactSchema, request.body);
      const account = await findCustomerAccountOrThrow(fastify.prisma, customerAccountId);
      await fastify.requireOrganizationAccess(request, account.organizationId);

      const contact = await fastify.prisma.customerContact.findFirst({
        where: {
          id: contactId,
          customerAccountId,
        },
      });

      if (!contact) {
        throw new NotFoundError('Customer contact not found');
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

      const updatedContact = await fastify.prisma.customerContact.update({
        where: { id: contactId },
        data: updateData,
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.customer_contact.update',
        entityType: 'CustomerContact',
        entityId: contactId,
        metadata: updateData,
      });

      return reply.success({ item: serializeCustomerContact(updatedContact) });
    }
  );

  fastify.delete(
    '/admin/customer-accounts/:customerAccountId/contacts/:contactId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('customer-contacts:manage')],
    },
    async (request, reply) => {
      const { customerAccountId, contactId } = validateOrThrow(customerContactIdParamSchema, request.params);
      const account = await findCustomerAccountOrThrow(fastify.prisma, customerAccountId);
      await fastify.requireOrganizationAccess(request, account.organizationId);

      const contact = await fastify.prisma.customerContact.findFirst({
        where: { id: contactId, customerAccountId },
      });

      if (!contact) {
        throw new NotFoundError('Customer contact not found');
      }

      await fastify.prisma.customerContact.delete({ where: { id: contactId } });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.customer_contact.delete',
        entityType: 'CustomerContact',
        entityId: contactId,
        metadata: { customerAccountId },
      });

      return reply.success({ deleted: true });
    }
  );

  fastify.post(
    '/admin/customer-accounts/:customerAccountId/locations',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('customer-locations:manage')],
    },
    async (request, reply) => {
      const { customerAccountId } = validateOrThrow(customerAccountIdParamSchema, request.params);
      const body = validateOrThrow(createCustomerLocationSchema, request.body);
      const account = await findCustomerAccountOrThrow(fastify.prisma, customerAccountId);
      await fastify.requireOrganizationAccess(request, account.organizationId);

      const location = await fastify.prisma.customerLocation.create({
        data: {
          customerAccountId,
          name: body.name,
          addressLine1: body.addressLine1,
          isPrimary: body.isPrimary ?? false,
          isActive: body.isActive ?? true,
          ...(body.code ? { code: body.code } : {}),
          ...(body.addressLine2 ? { addressLine2: body.addressLine2 } : {}),
          ...(body.city ? { city: body.city } : {}),
          ...(body.state ? { state: body.state } : {}),
          ...(body.postalCode ? { postalCode: body.postalCode } : {}),
          ...(body.country ? { country: body.country } : {}),
          ...(body.latitude !== undefined ? { latitude: body.latitude } : {}),
          ...(body.longitude !== undefined ? { longitude: body.longitude } : {}),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.customer_location.create',
        entityType: 'CustomerLocation',
        entityId: location.id,
        metadata: { customerAccountId },
      });

      return reply.status(201).success({ item: serializeCustomerLocation(location) });
    }
  );

  fastify.patch(
    '/admin/customer-accounts/:customerAccountId/locations/:locationId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('customer-locations:manage')],
    },
    async (request, reply) => {
      const { customerAccountId, locationId } = validateOrThrow(customerLocationIdParamSchema, request.params);
      const body = validateOrThrow(updateCustomerLocationSchema, request.body);
      const account = await findCustomerAccountOrThrow(fastify.prisma, customerAccountId);
      await fastify.requireOrganizationAccess(request, account.organizationId);

      const location = await fastify.prisma.customerLocation.findFirst({
        where: { id: locationId, customerAccountId },
      });

      if (!location) {
        throw new NotFoundError('Customer location not found');
      }

      const updateData = {
        ...(body.name ? { name: body.name } : {}),
        ...(body.code !== undefined ? { code: body.code } : {}),
        ...(body.addressLine1 ? { addressLine1: body.addressLine1 } : {}),
        ...(body.addressLine2 !== undefined ? { addressLine2: body.addressLine2 } : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(body.state !== undefined ? { state: body.state } : {}),
        ...(body.postalCode !== undefined ? { postalCode: body.postalCode } : {}),
        ...(body.country !== undefined ? { country: body.country } : {}),
        ...(body.latitude !== undefined ? { latitude: body.latitude } : {}),
        ...(body.longitude !== undefined ? { longitude: body.longitude } : {}),
        ...(body.isPrimary !== undefined ? { isPrimary: body.isPrimary } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      };

      const updatedLocation = await fastify.prisma.customerLocation.update({
        where: { id: locationId },
        data: updateData,
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.customer_location.update',
        entityType: 'CustomerLocation',
        entityId: locationId,
        metadata: updateData,
      });

      return reply.success({ item: serializeCustomerLocation(updatedLocation) });
    }
  );

  fastify.delete(
    '/admin/customer-accounts/:customerAccountId/locations/:locationId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('customer-locations:manage')],
    },
    async (request, reply) => {
      const { customerAccountId, locationId } = validateOrThrow(customerLocationIdParamSchema, request.params);
      const account = await findCustomerAccountOrThrow(fastify.prisma, customerAccountId);
      await fastify.requireOrganizationAccess(request, account.organizationId);

      const location = await fastify.prisma.customerLocation.findFirst({
        where: { id: locationId, customerAccountId },
      });

      if (!location) {
        throw new NotFoundError('Customer location not found');
      }

      await fastify.prisma.customerLocation.delete({ where: { id: locationId } });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.customer_location.delete',
        entityType: 'CustomerLocation',
        entityId: locationId,
        metadata: { customerAccountId },
      });

      return reply.success({ deleted: true });
    }
  );
};
