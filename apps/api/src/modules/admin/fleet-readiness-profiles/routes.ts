import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { ROLE_CODES } from '@trackigniter8/shared';
import { ConflictError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findFleetReadinessProfileOrThrow,
  getAuditContext,
  getPagination,
  masterDataStatusSchema,
  paginationQuerySchema,
  serializeFleetReadinessProfile,
} from '../utils.js';

const readinessProfileIdParamSchema = z.object({
  readinessProfileId: z.string().min(1),
});

const listReadinessProfilesQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  search: z.string().trim().optional(),
  status: masterDataStatusSchema.optional(),
});

const createReadinessProfileSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().trim().optional(),
  requireActiveVehicle: z.boolean().default(true),
  requireActiveDriver: z.boolean().default(true),
  requireValidVehicleDocuments: z.boolean().default(false),
  requireValidDriverLicense: z.boolean().default(false),
  requireActiveDevice: z.boolean().default(false),
  requireActiveAssignment: z.boolean().default(false),
  status: masterDataStatusSchema.default('ACTIVE'),
});

const updateReadinessProfileSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().trim().nullable().optional(),
    requireActiveVehicle: z.boolean().optional(),
    requireActiveDriver: z.boolean().optional(),
    requireValidVehicleDocuments: z.boolean().optional(),
    requireValidDriverLicense: z.boolean().optional(),
    requireActiveDevice: z.boolean().optional(),
    requireActiveAssignment: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one fleet readiness profile field must be supplied' });

export const adminFleetReadinessProfileRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/admin/fleet-readiness-profiles', { preHandler: [fastify.authenticate, fastify.requirePermission('fleet-readiness:read')] }, async (request, reply) => {
    const query = validateOrThrow(listReadinessProfilesQuerySchema, request.query);
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
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
      ...(!isSuperAdmin && !requestedOrganizationId ? { organization: { users: { some: { userId: request.currentUser!.id, status: 'ACTIVE' as const } } } } : {}),
    };

    const [items, total] = await Promise.all([
      fastify.prisma.fleetReadinessProfile.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      fastify.prisma.fleetReadinessProfile.count({ where }),
    ]);

    return reply.success({ items: items.map(serializeFleetReadinessProfile) }, buildPaginationMeta({ page, pageSize, total }));
  });

  fastify.get('/admin/fleet-readiness-profiles/:readinessProfileId', { preHandler: [fastify.authenticate, fastify.requirePermission('fleet-readiness:read')] }, async (request, reply) => {
    const { readinessProfileId } = validateOrThrow(readinessProfileIdParamSchema, request.params);
    const profile = await findFleetReadinessProfileOrThrow(fastify.prisma, readinessProfileId);
    await fastify.requireOrganizationAccess(request, profile.organizationId);
    return reply.success({ item: serializeFleetReadinessProfile(profile) });
  });

  fastify.post('/admin/fleet-readiness-profiles', { preHandler: [fastify.authenticate, fastify.requirePermission('fleet-readiness:manage')] }, async (request, reply) => {
    const body = validateOrThrow(createReadinessProfileSchema, request.body);
    await fastify.requireOrganizationAccess(request, body.organizationId);
    const existing = await fastify.prisma.fleetReadinessProfile.findUnique({ where: { organizationId_name: { organizationId: body.organizationId, name: body.name } } });
    if (existing) {
      throw new ConflictError('A fleet readiness profile with that name already exists for this organization');
    }

    const profile = await fastify.prisma.fleetReadinessProfile.create({
      data: {
        organizationId: body.organizationId,
        name: body.name,
        requireActiveVehicle: body.requireActiveVehicle ?? true,
        requireActiveDriver: body.requireActiveDriver ?? true,
        requireValidVehicleDocuments: body.requireValidVehicleDocuments ?? false,
        requireValidDriverLicense: body.requireValidDriverLicense ?? false,
        requireActiveDevice: body.requireActiveDevice ?? false,
        requireActiveAssignment: body.requireActiveAssignment ?? false,
        status: body.status ?? 'ACTIVE',
        ...(body.description ? { description: body.description } : {}),
      },
    });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fleet_readiness_profile.create', entityType: 'FleetReadinessProfile', entityId: profile.id, metadata: { organizationId: profile.organizationId, name: profile.name, status: profile.status } });
    return reply.status(201).success({ item: serializeFleetReadinessProfile(profile) });
  });

  fastify.patch('/admin/fleet-readiness-profiles/:readinessProfileId', { preHandler: [fastify.authenticate, fastify.requirePermission('fleet-readiness:manage')] }, async (request, reply) => {
    const { readinessProfileId } = validateOrThrow(readinessProfileIdParamSchema, request.params);
    const body = validateOrThrow(updateReadinessProfileSchema, request.body);
    const profile = await findFleetReadinessProfileOrThrow(fastify.prisma, readinessProfileId);
    await fastify.requireOrganizationAccess(request, profile.organizationId);

    const updateData = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.requireActiveVehicle !== undefined ? { requireActiveVehicle: body.requireActiveVehicle } : {}),
      ...(body.requireActiveDriver !== undefined ? { requireActiveDriver: body.requireActiveDriver } : {}),
      ...(body.requireValidVehicleDocuments !== undefined
        ? { requireValidVehicleDocuments: body.requireValidVehicleDocuments }
        : {}),
      ...(body.requireValidDriverLicense !== undefined ? { requireValidDriverLicense: body.requireValidDriverLicense } : {}),
      ...(body.requireActiveDevice !== undefined ? { requireActiveDevice: body.requireActiveDevice } : {}),
      ...(body.requireActiveAssignment !== undefined ? { requireActiveAssignment: body.requireActiveAssignment } : {}),
    };
    const updated = await fastify.prisma.fleetReadinessProfile.update({ where: { id: readinessProfileId }, data: updateData });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fleet_readiness_profile.update', entityType: 'FleetReadinessProfile', entityId: readinessProfileId, metadata: updateData });
    return reply.success({ item: serializeFleetReadinessProfile(updated) });
  });

  fastify.post('/admin/fleet-readiness-profiles/:readinessProfileId/activate', { preHandler: [fastify.authenticate, fastify.requirePermission('fleet-readiness:manage')] }, async (request, reply) => {
    const { readinessProfileId } = validateOrThrow(readinessProfileIdParamSchema, request.params);
    const profile = await findFleetReadinessProfileOrThrow(fastify.prisma, readinessProfileId);
    await fastify.requireOrganizationAccess(request, profile.organizationId);
    const updated = await fastify.prisma.fleetReadinessProfile.update({ where: { id: readinessProfileId }, data: { status: 'ACTIVE' } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fleet_readiness_profile.activate', entityType: 'FleetReadinessProfile', entityId: readinessProfileId });
    return reply.success({ item: serializeFleetReadinessProfile(updated) });
  });

  fastify.post('/admin/fleet-readiness-profiles/:readinessProfileId/deactivate', { preHandler: [fastify.authenticate, fastify.requirePermission('fleet-readiness:manage')] }, async (request, reply) => {
    const { readinessProfileId } = validateOrThrow(readinessProfileIdParamSchema, request.params);
    const profile = await findFleetReadinessProfileOrThrow(fastify.prisma, readinessProfileId);
    await fastify.requireOrganizationAccess(request, profile.organizationId);
    const updated = await fastify.prisma.fleetReadinessProfile.update({ where: { id: readinessProfileId }, data: { status: 'INACTIVE' } });
    await fastify.audit.write({ ...getAuditContext(request), action: 'admin.fleet_readiness_profile.deactivate', entityType: 'FleetReadinessProfile', entityId: readinessProfileId });
    return reply.success({ item: serializeFleetReadinessProfile(updated) });
  });
};
