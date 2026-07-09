import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { NotFoundError } from '@trackigniter8/errors';
import { SYSTEM_SETTING_VALUE_TYPES } from '@trackigniter8/shared';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  coerceSettingValueToStorage,
  getAuditContext,
  getPagination,
  paginationQuerySchema,
  serializeSetting,
} from '../utils.js';

const settingKeyParamSchema = z.object({
  key: z.string().min(1),
});

const listSettingsQuerySchema = paginationQuerySchema.extend({
  category: z.string().trim().optional(),
});

const upsertSettingSchema = z.object({
  value: z.unknown(),
  valueType: z.enum(SYSTEM_SETTING_VALUE_TYPES),
  category: z.string().min(1),
  isSecret: z.boolean().default(false),
  description: z.string().trim().nullable().optional(),
});

export const adminSettingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/settings',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('settings:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listSettingsQuerySchema, request.query);
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const { skip, take } = getPagination({ page, pageSize });
      const where = {
        ...(query.category ? { category: query.category } : {}),
      };

      const [settings, total] = await Promise.all([
        fastify.prisma.systemSetting.findMany({
          where,
          skip,
          take,
          orderBy: [{ category: 'asc' }, { key: 'asc' }],
        }),
        fastify.prisma.systemSetting.count({ where }),
      ]);

      return reply.success(
        {
          items: settings.map(serializeSetting),
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
    '/admin/settings/:key',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('settings:read')],
    },
    async (request, reply) => {
      const { key } = validateOrThrow(settingKeyParamSchema, request.params);
      const setting = await fastify.prisma.systemSetting.findUnique({
        where: { key },
      });

      if (!setting) {
        throw new NotFoundError('System setting not found');
      }

      return reply.success({
        item: serializeSetting(setting),
      });
    }
  );

  fastify.put(
    '/admin/settings/:key',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('settings:manage')],
    },
    async (request, reply) => {
      const { key } = validateOrThrow(settingKeyParamSchema, request.params);
      const body = validateOrThrow(upsertSettingSchema, request.body);
      const isSecret = body.isSecret ?? false;
      const value = coerceSettingValueToStorage(body.valueType, body.value);

      const setting = await fastify.prisma.systemSetting.upsert({
        where: { key },
        update: {
          value,
          valueType: body.valueType,
          category: body.category,
          isSecret,
          description: body.description ?? null,
        },
        create: {
          key,
          value,
          valueType: body.valueType,
          category: body.category,
          isSecret,
          description: body.description ?? null,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.setting.upsert',
        entityType: 'SystemSetting',
        entityId: setting.id,
        metadata: {
          key: setting.key,
          category: setting.category,
          valueType: setting.valueType,
          isSecret: setting.isSecret,
        },
      });

      return reply.success({
        item: serializeSetting(setting),
      });
    }
  );

  fastify.delete(
    '/admin/settings/:key',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('settings:manage')],
    },
    async (request, reply) => {
      const { key } = validateOrThrow(settingKeyParamSchema, request.params);
      const setting = await fastify.prisma.systemSetting.findUnique({
        where: { key },
      });

      if (!setting) {
        throw new NotFoundError('System setting not found');
      }

      await fastify.prisma.systemSetting.delete({
        where: { key },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.setting.delete',
        entityType: 'SystemSetting',
        entityId: setting.id,
        metadata: {
          key: setting.key,
          category: setting.category,
        },
      });

      return reply.success({
        deleted: true,
      });
    }
  );
};
