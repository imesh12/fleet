import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { hashPassword } from '@trackigniter8/auth';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  assertPasswordPolicy,
  findUserOrThrow,
  getAuditContext,
  getPagination,
  normalizeRoleCode,
  paginationQuerySchema,
  serializeUser,
  userStatusSchema,
} from '../utils.js';

const listUsersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().optional(),
  status: userStatusSchema.optional(),
});

const userIdParamSchema = z.object({
  userId: z.string().min(1),
});

const userRoleParamSchema = z.object({
  userId: z.string().min(1),
  roleCode: z.string().min(1),
});

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(1),
  status: userStatusSchema.default('ACTIVE'),
  roleCodes: z.array(z.string().min(1)).default([]),
});

const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    username: z.string().min(3).optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one profile field must be supplied',
  });

const resetPasswordSchema = z.object({
  newPassword: z.string().min(1),
});

const assignRolesSchema = z.object({
  roleCodes: z.array(z.string().min(1)).min(1),
});

async function assertUniqueUserFields(
  fastify: FastifyInstance,
  input: { email?: string | undefined; username?: string | undefined; excludeUserId?: string | undefined }
) {
  if (!input.email && !input.username) {
    return;
  }

  const existing = await fastify.prisma.user.findFirst({
    where: {
      OR: [
        ...(input.email ? [{ email: input.email }] : []),
        ...(input.username ? [{ username: input.username }] : []),
      ],
      ...(input.excludeUserId ? { NOT: { id: input.excludeUserId } } : {}),
    },
  });

  if (!existing) {
    return;
  }

  if (input.email && existing.email === input.email) {
    throw new ConflictError('A user with that email already exists');
  }

  if (input.username && existing.username === input.username) {
    throw new ConflictError('A user with that username already exists');
  }
}

async function getRolesByCode(fastify: FastifyInstance, roleCodes: string[]) {
  if (roleCodes.length === 0) {
    return [];
  }

  const normalizedRoleCodes = Array.from(new Set(roleCodes.map(normalizeRoleCode)));
  const roles = await fastify.prisma.role.findMany({
    where: {
      code: {
        in: normalizedRoleCodes,
      },
    },
  });

  if (roles.length !== normalizedRoleCodes.length) {
    const foundCodes = new Set(roles.map((role) => role.code));
    const missingCodes = normalizedRoleCodes.filter((code) => !foundCodes.has(code));
    throw new ValidationAppError('One or more roles do not exist', { missingRoleCodes: missingCodes });
  }

  return roles;
}

function assertSuperAdminAssignmentAllowed(currentUser: { roles: string[] }, roleCodes: string[]) {
  if (roleCodes.includes(ROLE_CODES.SUPER_ADMIN) && !currentUser.roles.includes(ROLE_CODES.SUPER_ADMIN)) {
    throw new ValidationAppError('Only a super admin can assign the SUPER_ADMIN role');
  }
}

async function assertNotLastActiveSuperAdmin(
  fastify: FastifyInstance,
  userId: string,
  action: string
) {
  const targetUser = await fastify.prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!targetUser) {
    throw new NotFoundError('User not found');
  }

  const isSuperAdmin = targetUser.roles.some((entry) => entry.role.code === ROLE_CODES.SUPER_ADMIN);
  if (!isSuperAdmin || targetUser.status !== 'ACTIVE') {
    return;
  }

  const activeSuperAdminCount = await fastify.prisma.user.count({
    where: {
      status: 'ACTIVE',
      roles: {
        some: {
          role: {
            code: ROLE_CODES.SUPER_ADMIN,
          },
        },
      },
    },
  });

  if (activeSuperAdminCount <= 1) {
    throw new ValidationAppError(`Cannot ${action} the last active super admin account`);
  }
}

export const adminUserRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/users',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:users:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listUsersQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });

      const where = {
        ...(query.status ? { status: query.status } : {}),
        ...(query.search
          ? {
              OR: [
                { email: { contains: query.search, mode: 'insensitive' as const } },
                { username: { contains: query.search, mode: 'insensitive' as const } },
                { firstName: { contains: query.search, mode: 'insensitive' as const } },
                { lastName: { contains: query.search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      };

      const [users, total] = await Promise.all([
        fastify.prisma.user.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        fastify.prisma.user.count({ where }),
      ]);

      return reply.success(
        {
          items: users.map(serializeUser),
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
    '/admin/users/:userId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:users:read')],
    },
    async (request, reply) => {
      const { userId } = validateOrThrow(userIdParamSchema, request.params);
      const user = await findUserOrThrow(fastify.prisma, userId);

      return reply.success({
        item: serializeUser(user),
      });
    }
  );

  fastify.post(
    '/admin/users',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:users:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createUserSchema, request.body);
      const currentUser = request.currentUser!;
      const requestedRoleCodes = (body.roleCodes ?? []).map(normalizeRoleCode);
      const status = body.status ?? 'ACTIVE';

      assertPasswordPolicy(body.password);
      assertSuperAdminAssignmentAllowed(currentUser, requestedRoleCodes);
      await assertUniqueUserFields(fastify, {
        email: body.email,
        username: body.username,
      });

      const roles = await getRolesByCode(fastify, requestedRoleCodes);
      const passwordHash = await hashPassword(body.password);

      const createdUser = await fastify.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: body.email,
            username: body.username,
            firstName: body.firstName,
            lastName: body.lastName,
            passwordHash,
            status,
          },
        });

        if (roles.length > 0) {
          await tx.userRole.createMany({
            data: roles.map((role) => ({
              userId: user.id,
              roleId: role.id,
            })),
          });
        }

        return findUserOrThrow(tx, user.id);
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.user.create',
        entityType: 'User',
        entityId: createdUser.id,
        metadata: {
          email: createdUser.email,
          username: createdUser.username,
          roleCodes: requestedRoleCodes,
        },
      });

      return reply.status(201).success({
        item: serializeUser(createdUser),
      });
    }
  );

  fastify.patch(
    '/admin/users/:userId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:users:manage')],
    },
    async (request, reply) => {
      const { userId } = validateOrThrow(userIdParamSchema, request.params);
      const body = validateOrThrow(updateUserSchema, request.body);
      const updateData = {
        ...(body.email ? { email: body.email } : {}),
        ...(body.username ? { username: body.username } : {}),
        ...(body.firstName ? { firstName: body.firstName } : {}),
        ...(body.lastName ? { lastName: body.lastName } : {}),
      };

      await findUserOrThrow(fastify.prisma, userId);
      await assertUniqueUserFields(fastify, {
        ...(body.email ? { email: body.email } : {}),
        ...(body.username ? { username: body.username } : {}),
        excludeUserId: userId,
      });

      const updatedUser = await fastify.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: updateData,
        });

        return findUserOrThrow(tx, userId);
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.user.update',
        entityType: 'User',
        entityId: userId,
        metadata: updateData,
      });

      return reply.success({
        item: serializeUser(updatedUser),
      });
    }
  );

  fastify.post(
    '/admin/users/:userId/activate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:users:manage')],
    },
    async (request, reply) => {
      const { userId } = validateOrThrow(userIdParamSchema, request.params);

      const user = await fastify.prisma.$transaction(async (tx) => {
        await findUserOrThrow(tx, userId);
        await tx.user.update({
          where: { id: userId },
          data: { status: 'ACTIVE' },
        });

        return findUserOrThrow(tx, userId);
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.user.activate',
        entityType: 'User',
        entityId: userId,
      });

      return reply.success({
        item: serializeUser(user),
      });
    }
  );

  fastify.post(
    '/admin/users/:userId/deactivate',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:users:manage')],
    },
    async (request, reply) => {
      const { userId } = validateOrThrow(userIdParamSchema, request.params);
      await assertNotLastActiveSuperAdmin(fastify, userId, 'deactivate');

      const user = await fastify.prisma.$transaction(async (tx) => {
        await findUserOrThrow(tx, userId);
        await tx.user.update({
          where: { id: userId },
          data: { status: 'DISABLED' },
        });

        return findUserOrThrow(tx, userId);
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.user.deactivate',
        entityType: 'User',
        entityId: userId,
      });

      return reply.success({
        item: serializeUser(user),
      });
    }
  );

  fastify.post(
    '/admin/users/:userId/reset-password',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:users:manage')],
    },
    async (request, reply) => {
      const { userId } = validateOrThrow(userIdParamSchema, request.params);
      const body = validateOrThrow(resetPasswordSchema, request.body);
      assertPasswordPolicy(body.newPassword);

      const passwordHash = await hashPassword(body.newPassword);
      await findUserOrThrow(fastify.prisma, userId);

      await fastify.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            passwordHash,
          },
        });

        await tx.refreshToken.updateMany({
          where: {
            userId,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
            revokedReason: 'admin_password_reset',
          },
        });
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.user.password.reset',
        entityType: 'User',
        entityId: userId,
      });

      return reply.success({
        passwordReset: true,
      });
    }
  );

  fastify.post(
    '/admin/users/:userId/roles',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:users:manage')],
    },
    async (request, reply) => {
      const { userId } = validateOrThrow(userIdParamSchema, request.params);
      const body = validateOrThrow(assignRolesSchema, request.body);
      const currentUser = request.currentUser!;
      const requestedRoleCodes = Array.from(new Set(body.roleCodes.map(normalizeRoleCode)));

      assertSuperAdminAssignmentAllowed(currentUser, requestedRoleCodes);
      await findUserOrThrow(fastify.prisma, userId);
      const roles = await getRolesByCode(fastify, requestedRoleCodes);

      const user = await fastify.prisma.$transaction(async (tx) => {
        for (const role of roles) {
          await tx.userRole.upsert({
            where: {
              userId_roleId: {
                userId,
                roleId: role.id,
              },
            },
            update: {},
            create: {
              userId,
              roleId: role.id,
            },
          });
        }

        return findUserOrThrow(tx, userId);
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.user.roles.assign',
        entityType: 'User',
        entityId: userId,
        metadata: {
          roleCodes: requestedRoleCodes,
        },
      });

      return reply.success({
        item: serializeUser(user),
      });
    }
  );

  fastify.delete(
    '/admin/users/:userId/roles/:roleCode',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:users:manage')],
    },
    async (request, reply) => {
      const { userId, roleCode } = validateOrThrow(userRoleParamSchema, request.params);
      const normalizedRoleCode = normalizeRoleCode(roleCode);

      if (normalizedRoleCode === ROLE_CODES.SUPER_ADMIN && !request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN)) {
        throw new ValidationAppError('Only a super admin can remove the SUPER_ADMIN role');
      }

      if (normalizedRoleCode === ROLE_CODES.SUPER_ADMIN) {
        await assertNotLastActiveSuperAdmin(fastify, userId, 'remove the SUPER_ADMIN role from');
      }

      const role = await fastify.prisma.role.findUnique({
        where: { code: normalizedRoleCode },
      });

      if (!role) {
        throw new NotFoundError('Role not found');
      }

      const user = await fastify.prisma.$transaction(async (tx) => {
        await findUserOrThrow(tx, userId);
        await tx.userRole.deleteMany({
          where: {
            userId,
            roleId: role.id,
          },
        });

        return findUserOrThrow(tx, userId);
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.user.roles.remove',
        entityType: 'User',
        entityId: userId,
        metadata: {
          roleCode: normalizedRoleCode,
        },
      });

      return reply.success({
        item: serializeUser(user),
      });
    }
  );
};
