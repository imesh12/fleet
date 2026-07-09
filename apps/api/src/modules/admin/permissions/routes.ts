import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

const permissionIdParamSchema = z.object({
  permissionId: z.string().min(1),
});

export const adminPermissionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/permissions',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:permissions:read')],
    },
    async (_request, reply) => {
      const permissions = await fastify.prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { code: 'asc' }],
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      const grouped = permissions.reduce<Record<string, unknown[]>>((accumulator, permission) => {
        const items = accumulator[permission.module] ?? [];
        items.push({
          id: permission.id,
          code: permission.code,
          module: permission.module,
          name: permission.name,
          description: permission.description,
          roleCodes: permission.roles.map((entry) => entry.role.code).sort(),
        });
        accumulator[permission.module] = items;
        return accumulator;
      }, {});

      return reply.success({
        items: Object.entries(grouped).map(([module, items]) => ({
          module,
          permissions: items,
        })),
      });
    }
  );

  fastify.get(
    '/admin/permissions/:permissionId',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('iam:permissions:read')],
    },
    async (request, reply) => {
      const { permissionId } = validateOrThrow(permissionIdParamSchema, request.params);

      const permission = await fastify.prisma.permission.findUnique({
        where: { id: permissionId },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!permission) {
        throw new NotFoundError('Permission not found');
      }

      return reply.success({
        item: {
          id: permission.id,
          code: permission.code,
          module: permission.module,
          name: permission.name,
          description: permission.description,
          roles: permission.roles
            .map((entry) => ({
              id: entry.role.id,
              code: entry.role.code,
              name: entry.role.name,
              isSystem: entry.role.isSystem,
            }))
            .sort((left, right) => left.code.localeCompare(right.code)),
        },
      });
    }
  );
};
