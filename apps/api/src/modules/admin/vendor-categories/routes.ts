import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findVendorCategoryOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeVendorCategory,
} from '../utils.js';

const vendorCategoryIdParamSchema = z.object({
  vendorCategoryId: z.string().min(1),
});

const listVendorCategoriesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createVendorCategorySchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateVendorCategorySchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one vendor category field must be supplied' });

export const adminVendorCategoryRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/vendor-categories',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-categories:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listVendorCategoriesQuerySchema, request.query);
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
        fastify.prisma.vendorCategory.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            vendors: true,
          },
        }),
        fastify.prisma.vendorCategory.count({ where }),
      ]);

      return reply.success(
        { items: items.map(serializeVendorCategory) },
        buildPaginationMeta({ page, pageSize, total })
      );
    }
  );

  fastify.get(
    '/admin/vendor-categories/:vendorCategoryId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-categories:read')],
    },
    async (request, reply) => {
      const { vendorCategoryId } = validateOrThrow(vendorCategoryIdParamSchema, request.params);
      const category = await findVendorCategoryOrThrow(fastify.prisma, vendorCategoryId);
      await fastify.requireOrganizationAccess(request, category.organizationId);

      return reply.success({ item: serializeVendorCategory(category) });
    }
  );

  fastify.post(
    '/admin/vendor-categories',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-categories:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createVendorCategorySchema, request.body);
      const code = normalizeEntityCode(body.code);
      const status = body.status ?? 'ACTIVE';
      await fastify.requireOrganizationAccess(request, body.organizationId);

      const existing = await fastify.prisma.vendorCategory.findUnique({
        where: {
          organizationId_code: {
            organizationId: body.organizationId,
            code,
          },
        },
      });

      if (existing) {
        throw new ConflictError('A vendor category with that code already exists for this organization');
      }

      const category = await fastify.prisma.vendorCategory.create({
        data: {
          organizationId: body.organizationId,
          name: body.name,
          code,
          status,
          ...(body.description ? { description: body.description } : {}),
        },
        include: {
          vendors: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor_category.create',
        entityType: 'VendorCategory',
        entityId: category.id,
        metadata: { organizationId: category.organizationId, code: category.code, status: category.status },
      });

      return reply.status(201).success({ item: serializeVendorCategory(category) });
    }
  );

  fastify.patch(
    '/admin/vendor-categories/:vendorCategoryId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-categories:manage')],
    },
    async (request, reply) => {
      const { vendorCategoryId } = validateOrThrow(vendorCategoryIdParamSchema, request.params);
      const body = validateOrThrow(updateVendorCategorySchema, request.body);
      const category = await findVendorCategoryOrThrow(fastify.prisma, vendorCategoryId);
      await fastify.requireOrganizationAccess(request, category.organizationId);

      const updateData = {
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      };

      const updatedCategory = await fastify.prisma.vendorCategory.update({
        where: { id: vendorCategoryId },
        data: updateData,
        include: {
          vendors: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor_category.update',
        entityType: 'VendorCategory',
        entityId: vendorCategoryId,
        metadata: updateData,
      });

      return reply.success({ item: serializeVendorCategory(updatedCategory) });
    }
  );

  fastify.post(
    '/admin/vendor-categories/:vendorCategoryId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-categories:manage')],
    },
    async (request, reply) => {
      const { vendorCategoryId } = validateOrThrow(vendorCategoryIdParamSchema, request.params);
      const category = await findVendorCategoryOrThrow(fastify.prisma, vendorCategoryId);
      await fastify.requireOrganizationAccess(request, category.organizationId);

      const updatedCategory = await fastify.prisma.vendorCategory.update({
        where: { id: vendorCategoryId },
        data: { status: 'ACTIVE' },
        include: { vendors: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor_category.activate',
        entityType: 'VendorCategory',
        entityId: vendorCategoryId,
      });

      return reply.success({ item: serializeVendorCategory(updatedCategory) });
    }
  );

  fastify.post(
    '/admin/vendor-categories/:vendorCategoryId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('vendor-categories:manage')],
    },
    async (request, reply) => {
      const { vendorCategoryId } = validateOrThrow(vendorCategoryIdParamSchema, request.params);
      const category = await findVendorCategoryOrThrow(fastify.prisma, vendorCategoryId);
      await fastify.requireOrganizationAccess(request, category.organizationId);

      const updatedCategory = await fastify.prisma.vendorCategory.update({
        where: { id: vendorCategoryId },
        data: { status: 'INACTIVE' },
        include: { vendors: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.vendor_category.deactivate',
        entityType: 'VendorCategory',
        entityId: vendorCategoryId,
      });

      return reply.success({ item: serializeVendorCategory(updatedCategory) });
    }
  );
};
