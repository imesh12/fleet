import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import { getAuditContext, getPagination, normalizeRoleCode, paginationQuerySchema } from '../utils.js';

const roleIdParamSchema = z.object({
  roleId: z.string().min(1),
});

const permissionParamSchema = z.object({
  roleId: z.string().min(1),
  permissionCode: z.string().min(1),
});

const createRoleSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  description: z.string().trim().optional(),
  permissionCodes: z.array(z.string().min(1)).default([]),
});

const updateRoleSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one role field must be supplied',
  });

const assignPermissionsSchema = z.object({
  permissionCodes: z.array(z.string().min(1)).min(1),
});

function serializeRole(role: {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions?: Array<{
    permission: {
      id: string;
      code: string;
      module: string;
      name: string;
      description: string | null;
    };
  }>;
  users?: unknown[];
}) {
  return {
    id: role.id,
    code: role.code,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    permissionCount: role.permissions?.length ?? 0,
    userCount: role.users?.length ?? 0,
    permissions:
      role.permissions?.map((entry) => ({
        id: entry.permission.id,
        code: entry.permission.code,
        module: entry.permission.module,
        name: entry.permission.name,
        description: entry.permission.description,
      })) ?? [],
  };
}

async function findRoleOrThrow(fastify: FastifyInstance, roleId: string) {
  const role = await fastify.prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      users: true,
    },
  });

  if (!role) {
    throw new NotFoundError('Role not found');
  }

  return role;
}

async function findPermissionsByCode(fastify: FastifyInstance, permissionCodes: string[]) {
  if (permissionCodes.length === 0) {
    return [];
  }

  const uniqueCodes = Array.from(new Set(permissionCodes));
  const permissions = await fastify.prisma.permission.findMany({
    where: {
      code: {
        in: uniqueCodes,
      },
    },
  });

  if (permissions.length !== uniqueCodes.length) {
    const foundCodes = new Set(permissions.map((permission) => permission.code));
    const missingCodes = uniqueCodes.filter((code) => !foundCodes.has(code));
    throw new ValidationAppError('One or more permissions do not exist', { missingPermissionCodes: missingCodes });
  }

  return permissions;
}

function assertRoleIsCustom(role: { isSystem: boolean; code: string }) {
  if (role.isSystem) {
    throw new ValidationAppError(`System role ${role.code} is protected and cannot be modified`);
  }
}

export const adminRoleRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/roles',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:roles:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(paginationQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });

      const [roles, total] = await Promise.all([
        fastify.prisma.role.findMany({
          skip,
          take,
          orderBy: [{ isSystem: 'desc' }, { code: 'asc' }],
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
            users: true,
          },
        }),
        fastify.prisma.role.count(),
      ]);

      return reply.success(
        {
          items: roles.map(serializeRole),
        },
        buildPaginationMeta({
          page,
          pageSize,
          total,
        })
      );
    }
  );

  fastify.get(
    '/admin/roles/:roleId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:roles:read')],
    },
    async (request, reply) => {
      const { roleId } = validateOrThrow(roleIdParamSchema, request.params);
      const role = await findRoleOrThrow(fastify, roleId);

      return reply.success({
        item: serializeRole(role),
      });
    }
  );

  fastify.post(
    '/admin/roles',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:roles:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createRoleSchema, request.body);
      const code = normalizeRoleCode(body.code);
      const permissions = await findPermissionsByCode(fastify, body.permissionCodes ?? []);

      const existing = await fastify.prisma.role.findUnique({
        where: { code },
      });

      if (existing) {
        throw new ValidationAppError('A role with that code already exists', { code });
      }

      const role = await fastify.prisma.$transaction(async (tx) => {
        const createdRole = await tx.role.create({
          data: {
            code,
            name: body.name,
            description: body.description ?? null,
            isSystem: false,
          },
        });

        if (permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: permissions.map((permission) => ({
              roleId: createdRole.id,
              permissionId: permission.id,
            })),
          });
        }

        return tx.role.findUniqueOrThrow({
          where: { id: createdRole.id },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
            users: true,
          },
        });
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.role.create',
        entityType: 'Role',
        entityId: role.id,
        metadata: {
          code: role.code,
          permissionCodes: permissions.map((permission) => permission.code),
        },
      });

      return reply.status(201).success({
        item: serializeRole(role),
      });
    }
  );

  fastify.patch(
    '/admin/roles/:roleId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:roles:manage')],
    },
    async (request, reply) => {
      const { roleId } = validateOrThrow(roleIdParamSchema, request.params);
      const body = validateOrThrow(updateRoleSchema, request.body);
      const updateData = {
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      };
      const role = await findRoleOrThrow(fastify, roleId);
      assertRoleIsCustom(role);

      const updatedRole = await fastify.prisma.$transaction(async (tx) => {
        await tx.role.update({
          where: { id: roleId },
          data: updateData,
        });

        return tx.role.findUniqueOrThrow({
          where: { id: roleId },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
            users: true,
          },
        });
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.role.update',
        entityType: 'Role',
        entityId: roleId,
        metadata: updateData,
      });

      return reply.success({
        item: serializeRole(updatedRole),
      });
    }
  );

  fastify.delete(
    '/admin/roles/:roleId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:roles:manage')],
    },
    async (request, reply) => {
      const { roleId } = validateOrThrow(roleIdParamSchema, request.params);
      const role = await findRoleOrThrow(fastify, roleId);
      assertRoleIsCustom(role);

      await fastify.prisma.role.delete({
        where: { id: roleId },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.role.delete',
        entityType: 'Role',
        entityId: roleId,
        metadata: {
          code: role.code,
        },
      });

      return reply.success({
        deleted: true,
      });
    }
  );

  fastify.post(
    '/admin/roles/:roleId/permissions',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:roles:manage')],
    },
    async (request, reply) => {
      const { roleId } = validateOrThrow(roleIdParamSchema, request.params);
      const body = validateOrThrow(assignPermissionsSchema, request.body);
      const role = await findRoleOrThrow(fastify, roleId);
      assertRoleIsCustom(role);
      const permissions = await findPermissionsByCode(fastify, body.permissionCodes);

      const updatedRole = await fastify.prisma.$transaction(async (tx) => {
        for (const permission of permissions) {
          await tx.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              roleId,
              permissionId: permission.id,
            },
          });
        }

        return tx.role.findUniqueOrThrow({
          where: { id: roleId },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
            users: true,
          },
        });
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.role.permissions.assign',
        entityType: 'Role',
        entityId: roleId,
        metadata: {
          permissionCodes: permissions.map((permission) => permission.code),
        },
      });

      return reply.success({
        item: serializeRole(updatedRole),
      });
    }
  );

  fastify.delete(
    '/admin/roles/:roleId/permissions/:permissionCode',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:roles:manage')],
    },
    async (request, reply) => {
      const { roleId, permissionCode } = validateOrThrow(permissionParamSchema, request.params);
      const role = await findRoleOrThrow(fastify, roleId);
      assertRoleIsCustom(role);

      const permission = await fastify.prisma.permission.findUnique({
        where: { code: permissionCode },
      });

      if (!permission) {
        throw new NotFoundError('Permission not found');
      }

      const updatedRole = await fastify.prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({
          where: {
            roleId,
            permissionId: permission.id,
          },
        });

        return tx.role.findUniqueOrThrow({
          where: { id: roleId },
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
            users: true,
          },
        });
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.role.permissions.remove',
        entityType: 'Role',
        entityId: roleId,
        metadata: {
          permissionCode,
        },
      });

      return reply.success({
        item: serializeRole(updatedRole),
      });
    }
  );
};
