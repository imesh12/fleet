import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findBusinessUnitOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeBusinessUnit,
} from '../utils.js';

const businessUnitIdParamSchema = z.object({
  businessUnitId: z.string().min(1),
});

const listBusinessUnitsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createBusinessUnitSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateBusinessUnitSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one business unit field must be supplied' });

export const adminBusinessUnitRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/business-units',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('business-units:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listBusinessUnitsQuerySchema, request.query);
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
        fastify.prisma.businessUnit.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        fastify.prisma.businessUnit.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeBusinessUnit) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/business-units/:businessUnitId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('business-units:read')],
    },
    async (request, reply) => {
      const { businessUnitId } = validateOrThrow(businessUnitIdParamSchema, request.params);
      const unit = await findBusinessUnitOrThrow(fastify.prisma, businessUnitId);
      await fastify.requireOrganizationAccess(request, unit.organizationId);

      return reply.success({ item: serializeBusinessUnit(unit) });
    }
  );

  fastify.post(
    '/admin/business-units',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('business-units:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createBusinessUnitSchema, request.body);
      const code = normalizeEntityCode(body.code);
      const status = body.status ?? 'ACTIVE';
      await fastify.requireOrganizationAccess(request, body.organizationId);

      const existing = await fastify.prisma.businessUnit.findUnique({
        where: {
          organizationId_code: {
            organizationId: body.organizationId,
            code,
          },
        },
      });

      if (existing) {
        throw new ConflictError('A business unit with that code already exists for this organization');
      }

      const unit = await fastify.prisma.businessUnit.create({
        data: {
          organizationId: body.organizationId,
          name: body.name,
          code,
          status,
          ...(body.description ? { description: body.description } : {}),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.business_unit.create',
        entityType: 'BusinessUnit',
        entityId: unit.id,
        metadata: { organizationId: unit.organizationId, code: unit.code, status: unit.status },
      });

      return reply.status(201).success({ item: serializeBusinessUnit(unit) });
    }
  );

  fastify.patch(
    '/admin/business-units/:businessUnitId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('business-units:manage')],
    },
    async (request, reply) => {
      const { businessUnitId } = validateOrThrow(businessUnitIdParamSchema, request.params);
      const body = validateOrThrow(updateBusinessUnitSchema, request.body);
      const unit = await findBusinessUnitOrThrow(fastify.prisma, businessUnitId);
      await fastify.requireOrganizationAccess(request, unit.organizationId);

      const updateData = {
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      };

      const updatedUnit = await fastify.prisma.businessUnit.update({
        where: { id: businessUnitId },
        data: updateData,
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.business_unit.update',
        entityType: 'BusinessUnit',
        entityId: businessUnitId,
        metadata: updateData,
      });

      return reply.success({ item: serializeBusinessUnit(updatedUnit) });
    }
  );

  fastify.post(
    '/admin/business-units/:businessUnitId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('business-units:manage')],
    },
    async (request, reply) => {
      const { businessUnitId } = validateOrThrow(businessUnitIdParamSchema, request.params);
      const unit = await findBusinessUnitOrThrow(fastify.prisma, businessUnitId);
      await fastify.requireOrganizationAccess(request, unit.organizationId);

      const updatedUnit = await fastify.prisma.businessUnit.update({
        where: { id: businessUnitId },
        data: { status: 'ACTIVE' },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.business_unit.activate',
        entityType: 'BusinessUnit',
        entityId: businessUnitId,
      });

      return reply.success({ item: serializeBusinessUnit(updatedUnit) });
    }
  );

  fastify.post(
    '/admin/business-units/:businessUnitId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('business-units:manage')],
    },
    async (request, reply) => {
      const { businessUnitId } = validateOrThrow(businessUnitIdParamSchema, request.params);
      const unit = await findBusinessUnitOrThrow(fastify.prisma, businessUnitId);
      await fastify.requireOrganizationAccess(request, unit.organizationId);

      const updatedUnit = await fastify.prisma.businessUnit.update({
        where: { id: businessUnitId },
        data: { status: 'INACTIVE' },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.business_unit.deactivate',
        entityType: 'BusinessUnit',
        entityId: businessUnitId,
      });

      return reply.success({ item: serializeBusinessUnit(updatedUnit) });
    }
  );
};
