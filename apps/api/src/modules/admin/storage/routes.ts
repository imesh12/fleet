import type { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@trackigniter8/db';
import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError, NotFoundError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';
import { z } from 'zod';

import { buildPaginationMeta } from '../../../lib/response.js';
import { getAuditContext, getPagination, masterDataStatusSchema, normalizeEntityCode, paginationQuerySchema } from '../utils.js';

const jsonRecordSchema = z.record(z.string(), z.unknown());
const idParamSchema = z.object({ id: z.string().min(1), fileId: z.string().min(1).optional() });
const providerTypeSchema = z.enum(['LOCAL', 'S3_PLACEHOLDER', 'GCS_PLACEHOLDER', 'AZURE_PLACEHOLDER']);
const fileStatusSchema = z.enum(['ACTIVE', 'ARCHIVED', 'DELETED']);
const fileVisibilitySchema = z.enum(['PRIVATE', 'ORGANIZATION', 'PUBLIC_PLACEHOLDER']);
const attachmentStatusSchema = z.enum(['ACTIVE', 'ARCHIVED']);
const supportedEntityTypeSchema = z.enum([
  'vehicle',
  'vehicle_document',
  'driver',
  'driver_license',
  'driver_document',
  'maintenance_request',
  'maintenance_work_order',
  'fuel_entry',
  'report_run',
  'organization',
  'customer_account',
]);

const listOrgQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  status: masterDataStatusSchema.optional(),
});

const providerSchema = z.object({
  organizationId: z.string().min(1).nullable().optional(),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  providerType: providerTypeSchema,
  description: z.string().trim().nullable().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
  config: jsonRecordSchema.nullable().optional(),
  metadata: jsonRecordSchema.nullable().optional(),
});
const updateProviderSchema = providerSchema.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be supplied' });

const bucketSchema = z.object({
  organizationId: z.string().min(1).nullable().optional(),
  storageProviderId: z.string().min(1),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
  config: jsonRecordSchema.nullable().optional(),
  metadata: jsonRecordSchema.nullable().optional(),
});
const updateBucketSchema = bucketSchema.partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be supplied' });

const fileSchema = z.object({
  organizationId: z.string().min(1),
  bucketId: z.string().min(1).nullable().optional(),
  originalFileName: z.string().trim().min(1),
  storedFileName: z.string().trim().min(1),
  storagePath: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.coerce.number().int().nonnegative(),
  checksum: z.string().trim().nullable().optional(),
  status: fileStatusSchema.default('ACTIVE'),
  visibility: fileVisibilitySchema.default('PRIVATE'),
  metadata: jsonRecordSchema.nullable().optional(),
});
const updateFileSchema = fileSchema.omit({ organizationId: true, sizeBytes: true }).partial().extend({
  sizeBytes: z.coerce.number().int().nonnegative().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'At least one file field must be supplied' });

const versionSchema = z.object({
  versionNumber: z.coerce.number().int().positive(),
  storedFileName: z.string().trim().min(1),
  storagePath: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.coerce.number().int().nonnegative(),
  checksum: z.string().trim().nullable().optional(),
  metadata: jsonRecordSchema.nullable().optional(),
});

const attachmentSchema = z.object({
  organizationId: z.string().min(1),
  fileObjectId: z.string().min(1),
  entityType: supportedEntityTypeSchema,
  entityId: z.string().min(1),
  attachmentType: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  status: attachmentStatusSchema.default('ACTIVE'),
});

const attachmentListQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  entityType: supportedEntityTypeSchema.optional(),
  entityId: z.string().min(1).optional(),
  status: attachmentStatusSchema.optional(),
});

const retentionSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  entityType: supportedEntityTypeSchema.nullable().optional(),
  retentionDays: z.coerce.number().int().positive(),
  archiveAfterDays: z.coerce.number().int().positive().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  status: masterDataStatusSchema.default('ACTIVE'),
  metadata: jsonRecordSchema.nullable().optional(),
});
const updateRetentionSchema = retentionSchema.omit({ organizationId: true }).partial().refine((value) => Object.keys(value).length > 0, { message: 'At least one policy field must be supplied' });

function serialize(item: Record<string, unknown>) {
  return item;
}

function scopedWhere(request: any, requestedOrganizationId?: string) {
  const isSuperAdmin = request.currentUser!.roles.includes(ROLE_CODES.SUPER_ADMIN);
  return !isSuperAdmin && !requestedOrganizationId
    ? { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } }
    : {};
}

async function requireOptionalOrgAccess(fastify: Parameters<FastifyPluginAsync>[0], request: any, organizationId?: string | null) {
  if (organizationId) await fastify.requireOrganizationAccess(request, organizationId);
}

async function assertBucketScope(fastify: Parameters<FastifyPluginAsync>[0], bucketId: string, organizationId: string) {
  const bucket = await fastify.prisma.storageBucket.findUnique({ where: { id: bucketId } });
  if (!bucket) throw new NotFoundError('Storage bucket not found');
  if (bucket.organizationId && bucket.organizationId !== organizationId) throw new ConflictError('Storage bucket must be global or belong to the same organization');
}

async function assertFileScope(fastify: Parameters<FastifyPluginAsync>[0], fileObjectId: string, organizationId: string) {
  const file = await fastify.prisma.fileObject.findUnique({ where: { id: fileObjectId } });
  if (!file) throw new NotFoundError('File object not found');
  if (file.organizationId !== organizationId) throw new ConflictError('File object must belong to the same organization');
}

export const adminStorageRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/storage/providers', { preHandler: [fastify.authenticate, fastify.requirePermission('storage-providers:read')] }, async (request, reply) => {
    const query = validateOrThrow(listOrgQuerySchema.extend({ providerType: providerTypeSchema.optional() }), request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { OR: [{ organizationId: requestedOrganizationId }, { organizationId: null }] } : {}), ...(query.status ? { status: query.status } : {}), ...(query.providerType ? { providerType: query.providerType } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.storageProvider.findMany({ where, skip, take, include: { buckets: true }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.storageProvider.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/storage/providers', { preHandler: [fastify.authenticate, fastify.requirePermission('storage-providers:manage')] }, async (request, reply) => {
    const body = validateOrThrow(providerSchema, request.body);
    await requireOptionalOrgAccess(fastify, request, body.organizationId);
    const item = await fastify.prisma.storageProvider.create({ data: { ...body, organizationId: body.organizationId ?? null, code: normalizeEntityCode(body.code), status: body.status ?? 'ACTIVE', ...(body.config !== undefined ? { config: body.config === null ? Prisma.JsonNull : (body.config as Prisma.InputJsonValue) } : {}), ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.StorageProviderUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.storage_provider.create', entityType: 'StorageProvider', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/storage/providers/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('storage-providers:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.storageProvider.findUnique({ where: { id }, include: { buckets: true } });
    if (!item) throw new NotFoundError('Storage provider not found');
    await requireOptionalOrgAccess(fastify, request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/storage/providers/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('storage-providers:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateProviderSchema, request.body);
    const existing = await fastify.prisma.storageProvider.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Storage provider not found');
    await requireOptionalOrgAccess(fastify, request, existing.organizationId);
    const item = await fastify.prisma.storageProvider.update({ where: { id }, data: { ...body, ...(body.code ? { code: normalizeEntityCode(body.code) } : {}), ...(body.config !== undefined ? { config: body.config === null ? Prisma.JsonNull : (body.config as Prisma.InputJsonValue) } : {}), ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.StorageProviderUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.storage_provider.update', entityType: 'StorageProvider', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const action of ['activate', 'deactivate'] as const) {
    fastify.post(`/admin/storage/providers/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('storage-providers:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.storageProvider.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Storage provider not found');
      await requireOptionalOrgAccess(fastify, request, existing.organizationId);
      const item = await fastify.prisma.storageProvider.update({ where: { id }, data: { status: action === 'activate' ? 'ACTIVE' : 'INACTIVE' } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.storage_provider.${action}`, entityType: 'StorageProvider', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }

  fastify.get('/admin/storage/buckets', { preHandler: [fastify.authenticate, fastify.requirePermission('storage-buckets:read')] }, async (request, reply) => {
    const query = validateOrThrow(listOrgQuerySchema.extend({ storageProviderId: z.string().min(1).optional() }), request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { OR: [{ organizationId: requestedOrganizationId }, { organizationId: null }] } : {}), ...(query.status ? { status: query.status } : {}), ...(query.storageProviderId ? { storageProviderId: query.storageProviderId } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.storageBucket.findMany({ where, skip, take, include: { storageProvider: true }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.storageBucket.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/storage/buckets', { preHandler: [fastify.authenticate, fastify.requirePermission('storage-buckets:manage')] }, async (request, reply) => {
    const body = validateOrThrow(bucketSchema, request.body);
    await requireOptionalOrgAccess(fastify, request, body.organizationId);
    const provider = await fastify.prisma.storageProvider.findUnique({ where: { id: body.storageProviderId } });
    if (!provider) throw new NotFoundError('Storage provider not found');
    if ((provider.organizationId ?? null) !== (body.organizationId ?? null)) throw new ConflictError('Storage provider scope must match bucket scope');
    const item = await fastify.prisma.storageBucket.create({ data: { ...body, organizationId: body.organizationId ?? null, code: normalizeEntityCode(body.code), status: body.status ?? 'ACTIVE', ...(body.config !== undefined ? { config: body.config === null ? Prisma.JsonNull : (body.config as Prisma.InputJsonValue) } : {}), ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.StorageBucketUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.storage_bucket.create', entityType: 'StorageBucket', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/storage/buckets/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('storage-buckets:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.storageBucket.findUnique({ where: { id }, include: { storageProvider: true } });
    if (!item) throw new NotFoundError('Storage bucket not found');
    await requireOptionalOrgAccess(fastify, request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/storage/buckets/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('storage-buckets:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateBucketSchema, request.body);
    const existing = await fastify.prisma.storageBucket.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Storage bucket not found');
    await requireOptionalOrgAccess(fastify, request, existing.organizationId);
    const item = await fastify.prisma.storageBucket.update({ where: { id }, data: { ...body, ...(body.code ? { code: normalizeEntityCode(body.code) } : {}), ...(body.config !== undefined ? { config: body.config === null ? Prisma.JsonNull : (body.config as Prisma.InputJsonValue) } : {}), ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.StorageBucketUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.storage_bucket.update', entityType: 'StorageBucket', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const action of ['activate', 'deactivate'] as const) {
    fastify.post(`/admin/storage/buckets/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('storage-buckets:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.storageBucket.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Storage bucket not found');
      await requireOptionalOrgAccess(fastify, request, existing.organizationId);
      const item = await fastify.prisma.storageBucket.update({ where: { id }, data: { status: action === 'activate' ? 'ACTIVE' : 'INACTIVE' } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.storage_bucket.${action}`, entityType: 'StorageBucket', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }

  fastify.get('/admin/files', { preHandler: [fastify.authenticate, fastify.requirePermission('files:read')] }, async (request, reply) => {
    const query = validateOrThrow(paginationQuerySchema.extend({ organizationId: z.string().min(1).optional(), status: fileStatusSchema.optional(), visibility: fileVisibilitySchema.optional() }), request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.status ? { status: query.status } : {}), ...(query.visibility ? { visibility: query.visibility } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.fileObject.findMany({ where, skip, take, include: { bucket: true, versions: true, attachments: true }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.fileObject.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/files', { preHandler: [fastify.authenticate, fastify.requirePermission('files:manage')] }, async (request, reply) => {
    const body = validateOrThrow(fileSchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    if (body.bucketId) await assertBucketScope(fastify, body.bucketId, body.organizationId);
    const item = await fastify.prisma.fileObject.create({ data: { ...body, status: body.status ?? 'ACTIVE', visibility: body.visibility ?? 'PRIVATE', createdByUserId: request.currentUser?.id, ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.FileObjectUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.file_object.create', entityType: 'FileObject', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.post('/admin/files/signed-upload-url', { preHandler: [fastify.authenticate, fastify.requirePermission('files:manage')] }, async (request, reply) => {
    const body = validateOrThrow(z.object({ organizationId: z.string().min(1), fileName: z.string().min(1), mimeType: z.string().min(1), bucketId: z.string().min(1).optional() }), request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    const uploadToken = crypto.randomUUID();
    return reply.success({ item: { uploadUrl: `placeholder://upload/${uploadToken}`, uploadToken, expiresInSeconds: 900, fields: body } });
  });

  fastify.get('/admin/files/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('files:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.fileObject.findUnique({ where: { id }, include: { bucket: true, versions: true, attachments: true } });
    if (!item) throw new NotFoundError('File object not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/files/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('files:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateFileSchema, request.body);
    const existing = await fastify.prisma.fileObject.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('File object not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    if (body.bucketId) await assertBucketScope(fastify, body.bucketId, existing.organizationId);
    const item = await fastify.prisma.fileObject.update({ where: { id }, data: { ...body, ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.FileObjectUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.file_object.update', entityType: 'FileObject', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const [action, status] of Object.entries({ archive: 'ARCHIVED', delete: 'DELETED' }) as Array<[string, 'ARCHIVED' | 'DELETED']>) {
    fastify.post(`/admin/files/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('files:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.fileObject.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('File object not found');
      await fastify.requireOrganizationAccess(request, existing.organizationId);
      const item = await fastify.prisma.fileObject.update({ where: { id }, data: { status } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.file_object.${action}`, entityType: 'FileObject', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }

  fastify.post('/admin/files/:id/versions', { preHandler: [fastify.authenticate, fastify.requirePermission('files:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(versionSchema, request.body);
    const file = await fastify.prisma.fileObject.findUnique({ where: { id } });
    if (!file) throw new NotFoundError('File object not found');
    await fastify.requireOrganizationAccess(request, file.organizationId);
    const item = await fastify.prisma.fileVersion.create({ data: { fileObjectId: id, ...body, ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.FileVersionUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.file_version.create', entityType: 'FileVersion', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/files/:id/access-logs', { preHandler: [fastify.authenticate, fastify.requirePermission('file-access-logs:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const file = await fastify.prisma.fileObject.findUnique({ where: { id } });
    if (!file) throw new NotFoundError('File object not found');
    await fastify.requireOrganizationAccess(request, file.organizationId);
    const items = await fastify.prisma.fileAccessLog.findMany({ where: { fileObjectId: id }, orderBy: { createdAt: 'desc' }, take: 100 });
    return reply.success({ items: items.map(serialize) });
  });

  fastify.post('/admin/files/:id/signed-download-url', { preHandler: [fastify.authenticate, fastify.requirePermission('files:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const file = await fastify.prisma.fileObject.findUnique({ where: { id } });
    if (!file) throw new NotFoundError('File object not found');
    await fastify.requireOrganizationAccess(request, file.organizationId);
    await fastify.prisma.fileAccessLog.create({
      data: {
        fileObjectId: id,
        action: 'SIGNED_DOWNLOAD_URL',
        ipAddress: request.ip,
        ...(request.currentUser?.id ? { userId: request.currentUser.id } : {}),
        ...(request.headers['user-agent'] ? { userAgent: request.headers['user-agent'].toString() } : {}),
      },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.file_access_log.signed_download_url', entityType: 'FileObject', entityId: id });
    return reply.success({ item: { downloadUrl: `placeholder://download/${id}?token=${crypto.randomUUID()}`, expiresInSeconds: 900 } });
  });

  fastify.get('/admin/attachments', { preHandler: [fastify.authenticate, fastify.requirePermission('file-attachments:read')] }, async (request, reply) => {
    const query = validateOrThrow(attachmentListQuerySchema, request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.entityType ? { entityType: query.entityType } : {}), ...(query.entityId ? { entityId: query.entityId } : {}), ...(query.status ? { status: query.status } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.fileAttachment.findMany({ where, skip, take, include: { fileObject: true }, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.fileAttachment.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/attachments', { preHandler: [fastify.authenticate, fastify.requirePermission('file-attachments:manage')] }, async (request, reply) => {
    const body = validateOrThrow(attachmentSchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    await assertFileScope(fastify, body.fileObjectId, body.organizationId);
    const item = await fastify.prisma.fileAttachment.create({ data: { ...body, status: body.status ?? 'ACTIVE' } as Prisma.FileAttachmentUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.file_attachment.create', entityType: 'FileAttachment', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.post('/admin/attachments/:id/archive', { preHandler: [fastify.authenticate, fastify.requirePermission('file-attachments:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const existing = await fastify.prisma.fileAttachment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('File attachment not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.fileAttachment.update({ where: { id }, data: { status: 'ARCHIVED' } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.file_attachment.archive', entityType: 'FileAttachment', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  fastify.get('/admin/document-retention-policies', { preHandler: [fastify.authenticate, fastify.requirePermission('document-retention:read')] }, async (request, reply) => {
    const query = validateOrThrow(listOrgQuerySchema.extend({ entityType: supportedEntityTypeSchema.optional() }), request.query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { skip, take } = getPagination({ page, pageSize });
    const requestedOrganizationId = query.organizationId ?? request.headers['x-organization-id']?.toString();
    if (requestedOrganizationId) await fastify.requireOrganizationAccess(request, requestedOrganizationId);
    const where = { ...(requestedOrganizationId ? { organizationId: requestedOrganizationId } : {}), ...(query.status ? { status: query.status } : {}), ...(query.entityType ? { entityType: query.entityType } : {}), ...scopedWhere(request, requestedOrganizationId) };
    const [items, total] = await Promise.all([
      fastify.prisma.documentRetentionPolicy.findMany({ where, skip, take, orderBy: [{ createdAt: 'desc' }] }),
      fastify.prisma.documentRetentionPolicy.count({ where }),
    ]);
    return reply.success({ items: items.map(serialize) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.post('/admin/document-retention-policies', { preHandler: [fastify.authenticate, fastify.requirePermission('document-retention:manage')] }, async (request, reply) => {
    const body = validateOrThrow(retentionSchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    const item = await fastify.prisma.documentRetentionPolicy.create({ data: { ...body, code: normalizeEntityCode(body.code), status: body.status ?? 'ACTIVE', ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.DocumentRetentionPolicyUncheckedCreateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.document_retention_policy.create', entityType: 'DocumentRetentionPolicy', entityId: item.id });
    return reply.status(201).success({ item: serialize(item) });
  });

  fastify.get('/admin/document-retention-policies/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('document-retention:read')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const item = await fastify.prisma.documentRetentionPolicy.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Document retention policy not found');
    await fastify.requireOrganizationAccess(request, item.organizationId);
    return reply.success({ item: serialize(item) });
  });

  fastify.patch('/admin/document-retention-policies/:id', { preHandler: [fastify.authenticate, fastify.requirePermission('document-retention:manage')] }, async (request, reply) => {
    const { id } = validateOrThrow(idParamSchema, request.params);
    const body = validateOrThrow(updateRetentionSchema, request.body);
    const existing = await fastify.prisma.documentRetentionPolicy.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Document retention policy not found');
    await fastify.requireOrganizationAccess(request, existing.organizationId);
    const item = await fastify.prisma.documentRetentionPolicy.update({ where: { id }, data: { ...body, ...(body.code ? { code: normalizeEntityCode(body.code) } : {}), ...(body.metadata !== undefined ? { metadata: body.metadata === null ? Prisma.JsonNull : (body.metadata as Prisma.InputJsonValue) } : {}) } as Prisma.DocumentRetentionPolicyUncheckedUpdateInput });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.document_retention_policy.update', entityType: 'DocumentRetentionPolicy', entityId: item.id });
    return reply.success({ item: serialize(item) });
  });

  for (const action of ['activate', 'deactivate'] as const) {
    fastify.post(`/admin/document-retention-policies/:id/${action}`, { preHandler: [fastify.authenticate, fastify.requirePermission('document-retention:manage')] }, async (request, reply) => {
      const { id } = validateOrThrow(idParamSchema, request.params);
      const existing = await fastify.prisma.documentRetentionPolicy.findUnique({ where: { id } });
      if (!existing) throw new NotFoundError('Document retention policy not found');
      await fastify.requireOrganizationAccess(request, existing.organizationId);
      const item = await fastify.prisma.documentRetentionPolicy.update({ where: { id }, data: { status: action === 'activate' ? 'ACTIVE' : 'INACTIVE' } });
      await fastify.audit.write({ ...getAuditContext(request), action: `admin.document_retention_policy.${action}`, entityType: 'DocumentRetentionPolicy', entityId: item.id });
      return reply.success({ item: serialize(item) });
    });
  }
};
