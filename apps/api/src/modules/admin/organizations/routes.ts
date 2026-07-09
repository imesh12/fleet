import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES, SYSTEM_SETTING_VALUE_TYPES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  coerceSettingValueToStorage,
  findOrganizationOrThrow,
  findUserOrThrow,
  getAuditContext,
  getPagination,
  organizationMembershipStatusSchema,
  organizationStatusSchema,
  organizationUserRoleSchema,
  paginationQuerySchema,
  serializeOrganization,
  serializeOrganizationSetting,
  serializeOrganizationUser,
} from '../utils.js';

const organizationIdParamSchema = z.object({
  organizationId: z.string().min(1),
});

const organizationMembershipIdParamSchema = z.object({
  organizationId: z.string().min(1),
  membershipId: z.string().min(1),
});

const organizationSettingParamSchema = z.object({
  organizationId: z.string().min(1),
  key: z.string().min(1),
});

const listOrganizationsQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  status: organizationStatusSchema.optional(),
});

const createOrganizationSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  legalName: z.string().trim().optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().optional(),
  taxIdentifier: z.string().trim().optional(),
  status: organizationStatusSchema.default('ACTIVE'),
});

const updateOrganizationSchema = z
  .object({
    name: z.string().min(2).optional(),
    legalName: z.string().trim().nullable().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().trim().nullable().optional(),
    taxIdentifier: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one organization field must be supplied' });

const assignOrganizationUserSchema = z.object({
  userId: z.string().min(1),
  role: organizationUserRoleSchema.default('MEMBER'),
  status: organizationMembershipStatusSchema.default('ACTIVE'),
});

const updateOrganizationUserSchema = z
  .object({
    role: organizationUserRoleSchema.optional(),
    status: organizationMembershipStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one membership field must be supplied' });

const listOrganizationUsersQuerySchema = paginationQuerySchema.extend({
  status: organizationMembershipStatusSchema.optional(),
});

const listOrganizationSettingsQuerySchema = paginationQuerySchema.extend({
  category: z.string().trim().optional(),
});

const upsertOrganizationSettingSchema = z.object({
  value: z.unknown(),
  valueType: z.enum(SYSTEM_SETTING_VALUE_TYPES),
  category: z.string().min(1),
  isSecret: z.boolean().default(false),
  description: z.string().trim().nullable().optional(),
});

function normalizeOrganizationCode(code: string) {
  return code
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();
}

export const adminOrganizationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/organizations',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organizations:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listOrganizationsQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);

      const where = {
        ...(query.status ? { status: query.status } : {}),
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' as const } },
                { code: { contains: query.search, mode: 'insensitive' as const } },
                { legalName: { contains: query.search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
        ...(!isSuperAdmin
          ? {
              users: {
                some: {
                  userId: request.currentUser!.id,
                  status: 'ACTIVE' as const,
                },
              },
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.organization.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            users: true,
            customerAccounts: true,
          },
        }),
        fastify.prisma.organization.count({ where }),
      ]);

      return reply.success(
        { items: items.map(serializeOrganization) },
        buildPaginationMeta({ page, pageSize, total })
      );
    }
  );

  fastify.get(
    '/admin/organizations/:organizationId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organizations:read')],
    },
    async (request, reply) => {
      const { organizationId } = validateOrThrow(organizationIdParamSchema, request.params);
      await fastify.requireOrganizationAccess(request, organizationId);
      const organization = await fastify.prisma.organization.findUnique({
        where: { id: organizationId },
        include: {
          users: {
            include: {
              user: true,
            },
          },
          customerAccounts: {
            include: {
              contacts: true,
              locations: true,
            },
          },
          settings: true,
        },
      });

      if (!organization) {
        throw new NotFoundError('Organization not found');
      }

      return reply.success({
        item: {
          ...serializeOrganization(organization),
          users: organization.users.map(serializeOrganizationUser),
          customerAccounts: organization.customerAccounts.map(serializeCustomerAccountForDetail),
          settings: organization.settings.map(serializeOrganizationSetting),
        },
      });
    }
  );

  fastify.post(
    '/admin/organizations',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organizations:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createOrganizationSchema, request.body);
      const code = normalizeOrganizationCode(body.code);
      const status = body.status ?? 'ACTIVE';

      const existing = await fastify.prisma.organization.findUnique({
        where: { code },
      });

      if (existing) {
        throw new ConflictError('An organization with that code already exists');
      }

      const organization = await fastify.prisma.organization.create({
        data: {
          name: body.name,
          code,
          status,
          ...(body.legalName ? { legalName: body.legalName } : {}),
          ...(body.email ? { email: body.email } : {}),
          ...(body.phone ? { phone: body.phone } : {}),
          ...(body.taxIdentifier ? { taxIdentifier: body.taxIdentifier } : {}),
        },
        include: {
          users: true,
          customerAccounts: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.organization.create',
        entityType: 'Organization',
        entityId: organization.id,
        metadata: { code: organization.code, status: organization.status },
      });

      return reply.status(201).success({
        item: serializeOrganization(organization),
      });
    }
  );

  fastify.patch(
    '/admin/organizations/:organizationId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organizations:manage')],
    },
    async (request, reply) => {
      const { organizationId } = validateOrThrow(organizationIdParamSchema, request.params);
      const body = validateOrThrow(updateOrganizationSchema, request.body);
      await fastify.requireOrganizationAccess(request, organizationId);
      await findOrganizationOrThrow(fastify.prisma, organizationId);

      const updateData = {
        ...(body.name ? { name: body.name } : {}),
        ...(body.legalName !== undefined ? { legalName: body.legalName } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.taxIdentifier !== undefined ? { taxIdentifier: body.taxIdentifier } : {}),
      };

      const organization = await fastify.prisma.organization.update({
        where: { id: organizationId },
        data: updateData,
        include: {
          users: true,
          customerAccounts: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.organization.update',
        entityType: 'Organization',
        entityId: organizationId,
        metadata: updateData,
      });

      return reply.success({
        item: serializeOrganization(organization),
      });
    }
  );

  fastify.post(
    '/admin/organizations/:organizationId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organizations:manage')],
    },
    async (request, reply) => {
      const { organizationId } = validateOrThrow(organizationIdParamSchema, request.params);
      await fastify.requireOrganizationAccess(request, organizationId);
      const organization = await fastify.prisma.organization.update({
        where: { id: organizationId },
        data: { status: 'ACTIVE' },
        include: { users: true, customerAccounts: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.organization.activate',
        entityType: 'Organization',
        entityId: organizationId,
      });

      return reply.success({ item: serializeOrganization(organization) });
    }
  );

  fastify.post(
    '/admin/organizations/:organizationId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organizations:manage')],
    },
    async (request, reply) => {
      const { organizationId } = validateOrThrow(organizationIdParamSchema, request.params);
      await fastify.requireOrganizationAccess(request, organizationId);
      const organization = await fastify.prisma.organization.update({
        where: { id: organizationId },
        data: { status: 'INACTIVE' },
        include: { users: true, customerAccounts: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.organization.deactivate',
        entityType: 'Organization',
        entityId: organizationId,
      });

      return reply.success({ item: serializeOrganization(organization) });
    }
  );

  fastify.get(
    '/admin/organizations/:organizationId/users',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organization-users:read')],
    },
    async (request, reply) => {
      const { organizationId } = validateOrThrow(organizationIdParamSchema, request.params);
      const query = validateOrThrow(listOrganizationUsersQuerySchema, request.query);
      await fastify.requireOrganizationAccess(request, organizationId);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const where = {
        organizationId,
        ...(query.status ? { status: query.status } : {}),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.organizationUser.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            user: true,
          },
        }),
        fastify.prisma.organizationUser.count({ where }),
      ]);

      return reply.success(
        { items: items.map(serializeOrganizationUser) },
        buildPaginationMeta({ page, pageSize, total })
      );
    }
  );

  fastify.post(
    '/admin/organizations/:organizationId/users',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organization-users:manage')],
    },
    async (request, reply) => {
      const { organizationId } = validateOrThrow(organizationIdParamSchema, request.params);
      const body = validateOrThrow(assignOrganizationUserSchema, request.body);
      await fastify.requireOrganizationAccess(request, organizationId);
      await findOrganizationOrThrow(fastify.prisma, organizationId);
      await findUserOrThrow(fastify.prisma, body.userId);

      const membership = await fastify.prisma.organizationUser.upsert({
        where: {
          organizationId_userId: {
            organizationId,
            userId: body.userId,
          },
        },
        update: {
          role: body.role ?? 'MEMBER',
          status: body.status ?? 'ACTIVE',
        },
        create: {
          organizationId,
          userId: body.userId,
          role: body.role ?? 'MEMBER',
          status: body.status ?? 'ACTIVE',
        },
        include: {
          user: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.organization_user.assign',
        entityType: 'OrganizationUser',
        entityId: membership.id,
        metadata: { organizationId, userId: body.userId, role: membership.role, status: membership.status },
      });

      return reply.status(201).success({
        item: serializeOrganizationUser(membership),
      });
    }
  );

  fastify.patch(
    '/admin/organizations/:organizationId/users/:membershipId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organization-users:manage')],
    },
    async (request, reply) => {
      const { organizationId, membershipId } = validateOrThrow(organizationMembershipIdParamSchema, request.params);
      const body = validateOrThrow(updateOrganizationUserSchema, request.body);
      await fastify.requireOrganizationAccess(request, organizationId);

      const membership = await fastify.prisma.organizationUser.findFirst({
        where: {
          id: membershipId,
          organizationId,
        },
      });

      if (!membership) {
        throw new NotFoundError('Organization membership not found');
      }

      const updatedMembership = await fastify.prisma.organizationUser.update({
        where: { id: membershipId },
        data: {
          ...(body.role ? { role: body.role } : {}),
          ...(body.status ? { status: body.status } : {}),
        },
        include: {
          user: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.organization_user.update',
        entityType: 'OrganizationUser',
        entityId: membershipId,
        metadata: {
          ...(body.role ? { role: body.role } : {}),
          ...(body.status ? { status: body.status } : {}),
        },
      });

      return reply.success({
        item: serializeOrganizationUser(updatedMembership),
      });
    }
  );

  fastify.delete(
    '/admin/organizations/:organizationId/users/:membershipId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organization-users:manage')],
    },
    async (request, reply) => {
      const { organizationId, membershipId } = validateOrThrow(organizationMembershipIdParamSchema, request.params);
      await fastify.requireOrganizationAccess(request, organizationId);

      const membership = await fastify.prisma.organizationUser.findFirst({
        where: {
          id: membershipId,
          organizationId,
        },
        include: {
          user: true,
        },
      });

      if (!membership) {
        throw new NotFoundError('Organization membership not found');
      }

      await fastify.prisma.organizationUser.delete({
        where: { id: membershipId },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.organization_user.remove',
        entityType: 'OrganizationUser',
        entityId: membershipId,
        metadata: { organizationId, userId: membership.userId },
      });

      return reply.success({ deleted: true });
    }
  );

  fastify.get(
    '/admin/organizations/:organizationId/settings',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organizations:read')],
    },
    async (request, reply) => {
      const { organizationId } = validateOrThrow(organizationIdParamSchema, request.params);
      const query = validateOrThrow(listOrganizationSettingsQuerySchema, request.query);
      await fastify.requireOrganizationAccess(request, organizationId);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const where = {
        organizationId,
        ...(query.category ? { category: query.category } : {}),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.organizationSetting.findMany({
          where,
          skip,
          take,
          orderBy: [{ category: 'asc' }, { key: 'asc' }],
        }),
        fastify.prisma.organizationSetting.count({ where }),
      ]);

      return reply.success(
        { items: items.map(serializeOrganizationSetting) },
        buildPaginationMeta({ page, pageSize, total })
      );
    }
  );

  fastify.get(
    '/admin/organizations/:organizationId/settings/:key',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organizations:read')],
    },
    async (request, reply) => {
      const { organizationId, key } = validateOrThrow(organizationSettingParamSchema, request.params);
      await fastify.requireOrganizationAccess(request, organizationId);

      const setting = await fastify.prisma.organizationSetting.findUnique({
        where: {
          organizationId_key: {
            organizationId,
            key,
          },
        },
      });

      if (!setting) {
        throw new NotFoundError('Organization setting not found');
      }

      return reply.success({ item: serializeOrganizationSetting(setting) });
    }
  );

  fastify.put(
    '/admin/organizations/:organizationId/settings/:key',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organizations:manage')],
    },
    async (request, reply) => {
      const { organizationId, key } = validateOrThrow(organizationSettingParamSchema, request.params);
      const body = validateOrThrow(upsertOrganizationSettingSchema, request.body);
      await fastify.requireOrganizationAccess(request, organizationId);
      const isSecret = body.isSecret ?? false;

      const setting = await fastify.prisma.organizationSetting.upsert({
        where: {
          organizationId_key: {
            organizationId,
            key,
          },
        },
        update: {
          value: coerceSettingValueToStorage(body.valueType, body.value),
          valueType: body.valueType,
          category: body.category,
          isSecret,
          description: body.description ?? null,
        },
        create: {
          organizationId,
          key,
          value: coerceSettingValueToStorage(body.valueType, body.value),
          valueType: body.valueType,
          category: body.category,
          isSecret,
          description: body.description ?? null,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.organization_setting.upsert',
        entityType: 'OrganizationSetting',
        entityId: setting.id,
        metadata: { organizationId, key, category: body.category, valueType: body.valueType, isSecret },
      });

      return reply.success({ item: serializeOrganizationSetting(setting) });
    }
  );

  fastify.delete(
    '/admin/organizations/:organizationId/settings/:key',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organizations:manage')],
    },
    async (request, reply) => {
      const { organizationId, key } = validateOrThrow(organizationSettingParamSchema, request.params);
      await fastify.requireOrganizationAccess(request, organizationId);

      const setting = await fastify.prisma.organizationSetting.findUnique({
        where: {
          organizationId_key: {
            organizationId,
            key,
          },
        },
      });

      if (!setting) {
        throw new NotFoundError('Organization setting not found');
      }

      await fastify.prisma.organizationSetting.delete({
        where: { id: setting.id },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.organization_setting.delete',
        entityType: 'OrganizationSetting',
        entityId: setting.id,
        metadata: { organizationId, key },
      });

      return reply.success({ deleted: true });
    }
  );
};

function serializeCustomerAccountForDetail(account: {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  billingAddress: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  contacts: unknown[];
  locations: unknown[];
}) {
  return {
    id: account.id,
    organizationId: account.organizationId,
    name: account.name,
    code: account.code,
    email: account.email,
    phone: account.phone,
    billingAddress: account.billingAddress,
    notes: account.notes,
    status: account.status,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    contactCount: account.contacts.length,
    locationCount: account.locations.length,
  };
}
