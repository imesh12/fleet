import { createHash, randomBytes } from 'node:crypto';

import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findTrackingProviderCredentialOrThrow,
  findTrackingProviderOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  paginationQuerySchema,
  serializeTrackingProvider,
  serializeTrackingProviderCredential,
  serializeTrackingProviderHealth,
  trackingHealthStatusSchema,
  trackingProviderCredentialAuthTypeSchema,
} from '../utils.js';

const jsonRecordSchema = z.record(z.string(), z.unknown());

const providerIdParamSchema = z.object({
  providerId: z.string().min(1),
});

const providerCredentialIdParamSchema = z.object({
  providerId: z.string().min(1),
  credentialId: z.string().min(1),
});

const listTrackingProvidersQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  status: masterDataStatusSchema.optional(),
  search: z.string().trim().optional(),
});

const createTrackingProviderSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  providerType: z.string().trim().min(1),
  baseUrl: z.string().trim().url().optional(),
  description: z.string().trim().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
  metadata: jsonRecordSchema.optional(),
});

const updateTrackingProviderSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    code: z.string().trim().min(1).optional(),
    providerType: z.string().trim().min(1).optional(),
    baseUrl: z.string().trim().url().nullable().optional(),
    description: z.string().trim().nullable().optional(),
    metadata: jsonRecordSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one tracking provider field must be supplied',
  });

const createTrackingProviderCredentialSchema = z.object({
  name: z.string().trim().min(1),
  keyId: z.string().trim().min(1).optional(),
  authType: trackingProviderCredentialAuthTypeSchema.default('API_KEY'),
  secret: z.string().trim().min(12).optional(),
  expiresAt: z.coerce.date().optional(),
  metadata: jsonRecordSchema.optional(),
});

const updateTrackingProviderCredentialSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    authType: trackingProviderCredentialAuthTypeSchema.optional(),
    secret: z.string().trim().min(12).optional(),
    expiresAt: z.coerce.date().nullable().optional(),
    status: masterDataStatusSchema.optional(),
    metadata: jsonRecordSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one tracking provider credential field must be supplied',
  });

const upsertTrackingProviderHealthSchema = z
  .object({
    status: trackingHealthStatusSchema.optional(),
    message: z.string().trim().nullable().optional(),
    lastCheckedAt: z.coerce.date().nullable().optional(),
    lastSuccessAt: z.coerce.date().nullable().optional(),
    lastFailureAt: z.coerce.date().nullable().optional(),
    lastIngestAt: z.coerce.date().nullable().optional(),
    metadata: jsonRecordSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one tracking provider health field must be supplied',
  });

function normalizeProviderCode(code: string) {
  return code
    .trim()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Za-z0-9_]/g, '')
    .toUpperCase();
}

function hashCredentialSecret(secret: string) {
  return createHash('sha256').update(secret).digest('hex');
}

function buildSecretHint(secret: string) {
  return `****${secret.slice(-4)}`;
}

function buildGeneratedKeyId() {
  return `trk_${randomBytes(6).toString('hex')}`;
}

function buildGeneratedSecret() {
  return randomBytes(24).toString('hex');
}

export const adminTrackingProviderRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/admin/tracking-providers',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-providers:read')] },
    async (request, reply) => {
      const query = validateOrThrow(listTrackingProvidersQuerySchema, request.query);
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
                { providerType: { contains: query.search, mode: 'insensitive' as const } },
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
        fastify.prisma.trackingProvider.findMany({
          where,
          skip,
          take,
          orderBy: [{ name: 'asc' }],
          include: {
            credentials: true,
            health: true,
          },
        }),
        fastify.prisma.trackingProvider.count({ where }),
      ]);

      return reply.success({ items: items.map(serializeTrackingProvider) }, buildPaginationMeta({ page, pageSize, total }));
    }
  );

  fastify.get(
    '/admin/tracking-providers/:providerId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-providers:read')] },
    async (request, reply) => {
      const { providerId } = validateOrThrow(providerIdParamSchema, request.params);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);

      return reply.success({
        item: serializeTrackingProvider(provider),
        credentials: provider.credentials.map(serializeTrackingProviderCredential),
        health: provider.health ? serializeTrackingProviderHealth(provider.health) : null,
      });
    }
  );

  fastify.post(
    '/admin/tracking-providers',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-providers:manage')] },
    async (request, reply) => {
      const body = validateOrThrow(createTrackingProviderSchema, request.body);
      await fastify.requireOrganizationAccess(request, body.organizationId);
      const code = normalizeProviderCode(body.code);

      const duplicate = await fastify.prisma.trackingProvider.findFirst({
        where: {
          organizationId: body.organizationId,
          code,
        },
      });

      if (duplicate) {
        throw new ConflictError('A tracking provider with that code already exists for this organization');
      }

      const provider = await fastify.prisma.trackingProvider.create({
        data: {
          organizationId: body.organizationId,
          name: body.name.trim(),
          code,
          providerType: body.providerType.trim(),
          status: body.status ?? 'ACTIVE',
          ...(body.baseUrl ? { baseUrl: body.baseUrl.trim() } : {}),
          ...(body.description ? { description: body.description.trim() } : {}),
          ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
        },
        include: {
          credentials: true,
          health: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_provider.create',
        entityType: 'TrackingProvider',
        entityId: provider.id,
        metadata: { organizationId: provider.organizationId, code: provider.code, providerType: provider.providerType },
      });

      return reply.status(201).success({ item: serializeTrackingProvider(provider) });
    }
  );

  fastify.patch(
    '/admin/tracking-providers/:providerId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-providers:manage')] },
    async (request, reply) => {
      const { providerId } = validateOrThrow(providerIdParamSchema, request.params);
      const body = validateOrThrow(updateTrackingProviderSchema, request.body);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);

      const nextCode = body.code ? normalizeProviderCode(body.code) : undefined;
      if (nextCode && nextCode !== provider.code) {
        const duplicate = await fastify.prisma.trackingProvider.findFirst({
          where: {
            organizationId: provider.organizationId,
            code: nextCode,
            id: { not: providerId },
          },
        });

        if (duplicate) {
          throw new ConflictError('A tracking provider with that code already exists for this organization');
        }
      }

      const updateData = {
        ...(body.name ? { name: body.name.trim() } : {}),
        ...(nextCode ? { code: nextCode } : {}),
        ...(body.providerType ? { providerType: body.providerType.trim() } : {}),
        ...(body.baseUrl !== undefined ? { baseUrl: body.baseUrl?.trim() ?? null } : {}),
        ...(body.description !== undefined ? { description: body.description?.trim() ?? null } : {}),
        ...(body.metadata !== undefined
          ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) }
          : {}),
      };

      const updatedProvider = await fastify.prisma.trackingProvider.update({
        where: { id: providerId },
        data: updateData,
        include: {
          credentials: true,
          health: true,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_provider.update',
        entityType: 'TrackingProvider',
        entityId: providerId,
        metadata: updateData,
      });

      return reply.success({ item: serializeTrackingProvider(updatedProvider) });
    }
  );

  fastify.post(
    '/admin/tracking-providers/:providerId/activate',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-providers:manage')] },
    async (request, reply) => {
      const { providerId } = validateOrThrow(providerIdParamSchema, request.params);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);

      const updatedProvider = await fastify.prisma.trackingProvider.update({
        where: { id: providerId },
        data: { status: 'ACTIVE' },
        include: { credentials: true, health: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_provider.activate',
        entityType: 'TrackingProvider',
        entityId: providerId,
      });

      return reply.success({ item: serializeTrackingProvider(updatedProvider) });
    }
  );

  fastify.post(
    '/admin/tracking-providers/:providerId/deactivate',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-providers:manage')] },
    async (request, reply) => {
      const { providerId } = validateOrThrow(providerIdParamSchema, request.params);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);

      const updatedProvider = await fastify.prisma.trackingProvider.update({
        where: { id: providerId },
        data: { status: 'INACTIVE' },
        include: { credentials: true, health: true },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_provider.deactivate',
        entityType: 'TrackingProvider',
        entityId: providerId,
      });

      return reply.success({ item: serializeTrackingProvider(updatedProvider) });
    }
  );

  fastify.get(
    '/admin/tracking-providers/:providerId/credentials',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-providers:read')] },
    async (request, reply) => {
      const { providerId } = validateOrThrow(providerIdParamSchema, request.params);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);
      return reply.success({ items: provider.credentials.map(serializeTrackingProviderCredential) });
    }
  );

  fastify.get(
    '/admin/tracking-providers/:providerId/credentials/:credentialId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-providers:read')] },
    async (request, reply) => {
      const { providerId, credentialId } = validateOrThrow(providerCredentialIdParamSchema, request.params);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);
      const credential = await findTrackingProviderCredentialOrThrow(fastify.prisma, credentialId);

      if (credential.trackingProviderId !== providerId) {
        throw new ConflictError('Tracking provider credential does not belong to the requested provider');
      }

      return reply.success({ item: serializeTrackingProviderCredential(credential) });
    }
  );

  fastify.post(
    '/admin/tracking-providers/:providerId/credentials',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-credentials:manage')] },
    async (request, reply) => {
      const { providerId } = validateOrThrow(providerIdParamSchema, request.params);
      const body = validateOrThrow(createTrackingProviderCredentialSchema, request.body);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);

      const keyId = body.keyId?.trim() || buildGeneratedKeyId();
      const plainTextSecret = body.secret?.trim() || buildGeneratedSecret();

      const duplicate = await fastify.prisma.trackingProviderCredential.findFirst({
        where: {
          trackingProviderId: providerId,
          keyId,
        },
      });

      if (duplicate) {
        throw new ConflictError('A tracking credential with that key id already exists for this provider');
      }

      const credential = await fastify.prisma.trackingProviderCredential.create({
        data: {
          trackingProviderId: providerId,
          name: body.name.trim(),
          keyId,
          authType: body.authType ?? 'API_KEY',
          secretHash: hashCredentialSecret(plainTextSecret),
          secretHint: buildSecretHint(plainTextSecret),
          ...(body.expiresAt ? { expiresAt: body.expiresAt } : {}),
          ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_provider_credential.create',
        entityType: 'TrackingProviderCredential',
        entityId: credential.id,
        metadata: { trackingProviderId: providerId, keyId: credential.keyId, authType: credential.authType },
      });

      return reply.status(201).success({
        item: serializeTrackingProviderCredential(credential),
        plainTextSecret,
      });
    }
  );

  fastify.patch(
    '/admin/tracking-providers/:providerId/credentials/:credentialId',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-credentials:manage')] },
    async (request, reply) => {
      const { providerId, credentialId } = validateOrThrow(providerCredentialIdParamSchema, request.params);
      const body = validateOrThrow(updateTrackingProviderCredentialSchema, request.body);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);
      const credential = await findTrackingProviderCredentialOrThrow(fastify.prisma, credentialId);

      if (credential.trackingProviderId !== providerId) {
        throw new ConflictError('Tracking provider credential does not belong to the requested provider');
      }

      const rotatedSecret = body.secret?.trim();
      const updateData = {
        ...(body.name ? { name: body.name.trim() } : {}),
        ...(body.authType ? { authType: body.authType } : {}),
        ...(rotatedSecret
          ? {
              secretHash: hashCredentialSecret(rotatedSecret),
              secretHint: buildSecretHint(rotatedSecret),
            }
          : {}),
        ...(body.expiresAt !== undefined ? { expiresAt: body.expiresAt } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.metadata !== undefined
          ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) }
          : {}),
      };

      const updatedCredential = await fastify.prisma.trackingProviderCredential.update({
        where: { id: credentialId },
        data: updateData,
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_provider_credential.update',
        entityType: 'TrackingProviderCredential',
        entityId: credentialId,
        metadata: {
          trackingProviderId: providerId,
          rotatedSecret: Boolean(rotatedSecret),
          status: updatedCredential.status,
        },
      });

      return reply.success({
        item: serializeTrackingProviderCredential(updatedCredential),
        ...(rotatedSecret ? { plainTextSecret: rotatedSecret } : {}),
      });
    }
  );

  fastify.post(
    '/admin/tracking-providers/:providerId/credentials/:credentialId/deactivate',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-credentials:manage')] },
    async (request, reply) => {
      const { providerId, credentialId } = validateOrThrow(providerCredentialIdParamSchema, request.params);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);
      const credential = await findTrackingProviderCredentialOrThrow(fastify.prisma, credentialId);

      if (credential.trackingProviderId !== providerId) {
        throw new ConflictError('Tracking provider credential does not belong to the requested provider');
      }

      const updatedCredential = await fastify.prisma.trackingProviderCredential.update({
        where: { id: credentialId },
        data: { status: 'INACTIVE' },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_provider_credential.deactivate',
        entityType: 'TrackingProviderCredential',
        entityId: credentialId,
      });

      return reply.success({ item: serializeTrackingProviderCredential(updatedCredential) });
    }
  );

  fastify.get(
    '/admin/tracking-providers/:providerId/health',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-providers:read')] },
    async (request, reply) => {
      const { providerId } = validateOrThrow(providerIdParamSchema, request.params);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);

      return reply.success({
        item: provider.health ? serializeTrackingProviderHealth(provider.health) : null,
      });
    }
  );

  fastify.put(
    '/admin/tracking-providers/:providerId/health',
    { preHandler: [fastify.authenticate, fastify.requirePermission('tracking-providers:manage')] },
    async (request, reply) => {
      const { providerId } = validateOrThrow(providerIdParamSchema, request.params);
      const body = validateOrThrow(upsertTrackingProviderHealthSchema, request.body);
      const provider = await findTrackingProviderOrThrow(fastify.prisma, providerId);
      await fastify.requireOrganizationAccess(request, provider.organizationId);

      const health = await fastify.prisma.trackingProviderHealth.upsert({
        where: { trackingProviderId: providerId },
        update: {
          ...(body.status ? { status: body.status } : {}),
          ...(body.message !== undefined ? { message: body.message?.trim() ?? null } : {}),
          ...(body.lastCheckedAt !== undefined ? { lastCheckedAt: body.lastCheckedAt } : {}),
          ...(body.lastSuccessAt !== undefined ? { lastSuccessAt: body.lastSuccessAt } : {}),
          ...(body.lastFailureAt !== undefined ? { lastFailureAt: body.lastFailureAt } : {}),
          ...(body.lastIngestAt !== undefined ? { lastIngestAt: body.lastIngestAt } : {}),
          ...(body.metadata !== undefined
            ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) }
            : {}),
        },
        create: {
          trackingProviderId: providerId,
          status: body.status ?? 'UNKNOWN',
          ...(body.message ? { message: body.message.trim() } : {}),
          ...(body.lastCheckedAt ? { lastCheckedAt: body.lastCheckedAt } : {}),
          ...(body.lastSuccessAt ? { lastSuccessAt: body.lastSuccessAt } : {}),
          ...(body.lastFailureAt ? { lastFailureAt: body.lastFailureAt } : {}),
          ...(body.lastIngestAt ? { lastIngestAt: body.lastIngestAt } : {}),
          ...(body.metadata ? { metadata: body.metadata as Prisma.InputJsonValue } : {}),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.tracking_provider_health.update',
        entityType: 'TrackingProviderHealth',
        entityId: health.id,
        metadata: { trackingProviderId: providerId, status: health.status },
      });

      return reply.success({ item: serializeTrackingProviderHealth(health) });
    }
  );
};
