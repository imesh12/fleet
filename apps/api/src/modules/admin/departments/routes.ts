import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findDepartmentOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  normalizeEntityCode,
  paginationQuerySchema,
  serializeDepartment,
} from '../utils.js';

const departmentIdParamSchema = z.object({
  departmentId: z.string().min(1),
});

const listDepartmentsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createDepartmentSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateDepartmentSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one department field must be supplied' });

export const adminDepartmentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/departments',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('departments:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listDepartmentsQuerySchema, request.query);
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
        fastify.prisma.department.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        fastify.prisma.department.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeDepartment) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/departments/:departmentId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('departments:read')],
    },
    async (request, reply) => {
      const { departmentId } = validateOrThrow(departmentIdParamSchema, request.params);
      const department = await findDepartmentOrThrow(fastify.prisma, departmentId);
      await fastify.requireOrganizationAccess(request, department.organizationId);

      return reply.success({ item: serializeDepartment(department) });
    }
  );

  fastify.post(
    '/admin/departments',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('departments:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createDepartmentSchema, request.body);
      const code = normalizeEntityCode(body.code);
      const status = body.status ?? 'ACTIVE';
      await fastify.requireOrganizationAccess(request, body.organizationId);

      const existing = await fastify.prisma.department.findUnique({
        where: {
          organizationId_code: {
            organizationId: body.organizationId,
            code,
          },
        },
      });

      if (existing) {
        throw new ConflictError('A department with that code already exists for this organization');
      }

      const department = await fastify.prisma.department.create({
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
        action: 'admin.department.create',
        entityType: 'Department',
        entityId: department.id,
        metadata: { organizationId: department.organizationId, code: department.code, status: department.status },
      });

      return reply.status(201).success({ item: serializeDepartment(department) });
    }
  );

  fastify.patch(
    '/admin/departments/:departmentId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('departments:manage')],
    },
    async (request, reply) => {
      const { departmentId } = validateOrThrow(departmentIdParamSchema, request.params);
      const body = validateOrThrow(updateDepartmentSchema, request.body);
      const department = await findDepartmentOrThrow(fastify.prisma, departmentId);
      await fastify.requireOrganizationAccess(request, department.organizationId);

      const updateData = {
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      };

      const updatedDepartment = await fastify.prisma.department.update({
        where: { id: departmentId },
        data: updateData,
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.department.update',
        entityType: 'Department',
        entityId: departmentId,
        metadata: updateData,
      });

      return reply.success({ item: serializeDepartment(updatedDepartment) });
    }
  );

  fastify.post(
    '/admin/departments/:departmentId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('departments:manage')],
    },
    async (request, reply) => {
      const { departmentId } = validateOrThrow(departmentIdParamSchema, request.params);
      const department = await findDepartmentOrThrow(fastify.prisma, departmentId);
      await fastify.requireOrganizationAccess(request, department.organizationId);

      const updatedDepartment = await fastify.prisma.department.update({
        where: { id: departmentId },
        data: { status: 'ACTIVE' },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.department.activate',
        entityType: 'Department',
        entityId: departmentId,
      });

      return reply.success({ item: serializeDepartment(updatedDepartment) });
    }
  );

  fastify.post(
    '/admin/departments/:departmentId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('departments:manage')],
    },
    async (request, reply) => {
      const { departmentId } = validateOrThrow(departmentIdParamSchema, request.params);
      const department = await findDepartmentOrThrow(fastify.prisma, departmentId);
      await fastify.requireOrganizationAccess(request, department.organizationId);

      const updatedDepartment = await fastify.prisma.department.update({
        where: { id: departmentId },
        data: { status: 'INACTIVE' },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.department.deactivate',
        entityType: 'Department',
        entityId: departmentId,
      });

      return reply.success({ item: serializeDepartment(updatedDepartment) });
    }
  );
};
