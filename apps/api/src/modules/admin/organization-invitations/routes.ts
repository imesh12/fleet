import { createHash, randomBytes } from 'node:crypto';

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

import { getMailer } from '@trackigniter8/mailer';
import { ROLE_CODES } from '@trackigniter8/shared';
import { NotFoundError, ValidationAppError } from '@trackigniter8/errors';
import { validateOrThrow } from '@trackigniter8/validation';

import { buildPaginationMeta } from '../../../lib/response.js';
import {
  findOrganizationInvitationOrThrow,
  findOrganizationOrThrow,
  getAuditContext,
  getPagination,
  organizationInvitationStatusSchema,
  organizationUserRoleSchema,
  paginationQuerySchema,
  serializeOrganizationInvitation,
} from '../utils.js';

const invitationIdParamSchema = z.object({
  invitationId: z.string().min(1),
});

const listInvitationsQuerySchema = paginationQuerySchema.extend({
  organizationId: z.string().min(1).optional(),
  status: organizationInvitationStatusSchema.optional(),
});

const createInvitationSchema = z.object({
  organizationId: z.string().min(1),
  email: z.string().email(),
  role: organizationUserRoleSchema.default('MEMBER'),
  expiresInDays: z.coerce.number().int().min(1).max(30).default(7),
  message: z.string().trim().optional(),
});

const acceptInvitationSchema = z.object({
  token: z.string().min(1),
});

const resendInvitationSchema = z.object({
  message: z.string().trim().optional(),
});

function hashInvitationToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function buildInvitationToken() {
  return randomBytes(48).toString('hex');
}

export const adminOrganizationInvitationRoutes: FastifyPluginAsync = async (fastify) => {
  const mailer = getMailer();

  fastify.get(
    '/admin/organization-invitations',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organization-invitations:read')],
    },
    async (request, reply) => {
      const query = validateOrThrow(listInvitationsQuerySchema, request.query);
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
        fastify.prisma.organizationInvitation.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        fastify.prisma.organizationInvitation.count({ where }),
      ]);

      return reply.success(
        { items: items.map(serializeOrganizationInvitation) },
        buildPaginationMeta({ page, pageSize, total })
      );
    }
  );

  fastify.post(
    '/admin/organization-invitations',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organization-invitations:manage')],
    },
    async (request, reply) => {
      const body = validateOrThrow(createInvitationSchema, request.body);
      await fastify.requireOrganizationAccess(request, body.organizationId);
      await findOrganizationOrThrow(fastify.prisma, body.organizationId);

      const pendingExisting = await fastify.prisma.organizationInvitation.findFirst({
        where: {
          organizationId: body.organizationId,
          email: body.email,
          status: 'PENDING',
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (pendingExisting) {
        throw new ValidationAppError('An active invitation already exists for that email in this organization');
      }

      const token = buildInvitationToken();
      const tokenHash = hashInvitationToken(token);
      const expiresAt = new Date(Date.now() + (body.expiresInDays ?? 7) * 86_400_000);

      const invitation = await fastify.prisma.organizationInvitation.create({
        data: {
          organizationId: body.organizationId,
          email: body.email,
          role: body.role ?? 'MEMBER',
          tokenHash,
          ...(body.message ? { message: body.message } : {}),
          expiresAt,
          lastSentAt: new Date(),
          sentCount: 1,
          invitedByUserId: request.currentUser!.id,
        },
      });

      const invitationLink = `${fastify.config.API_PREFIX}/admin/organization-invitations/accept?token=${token}`;

      const emailResult = await mailer.sendEmail({
        to: body.email,
        subject: `Organization invitation for ${request.currentOrganization?.name ?? 'Trackigniter8'}`,
        text: `You have been invited to join an organization. Accept here: ${invitationLink}`,
        metadata: {
          organizationId: body.organizationId,
          invitationId: invitation.id,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.organization_invitation.create',
        entityType: 'OrganizationInvitation',
        entityId: invitation.id,
        metadata: { organizationId: invitation.organizationId, email: invitation.email, role: invitation.role },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.notification.email.send',
        entityType: 'OrganizationInvitation',
        entityId: invitation.id,
        metadata: {
          provider: emailResult.provider,
          messageId: emailResult.messageId,
          email: invitation.email,
        },
      });

      return reply.status(201).success({
        item: serializeOrganizationInvitation(invitation),
        ...(fastify.config.NODE_ENV !== 'production'
          ? {
              invitationToken: token,
              invitationLink,
            }
          : {}),
      });
    }
  );

  fastify.post(
    '/admin/organization-invitations/:invitationId/resend',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organization-invitations:manage')],
    },
    async (request, reply) => {
      const { invitationId } = validateOrThrow(invitationIdParamSchema, request.params);
      const body = validateOrThrow(resendInvitationSchema, request.body ?? {});
      const invitation = await findOrganizationInvitationOrThrow(fastify.prisma, invitationId);
      await fastify.requireOrganizationAccess(request, invitation.organizationId);

      if (invitation.status !== 'PENDING') {
        throw new ValidationAppError('Only pending invitations can be resent');
      }

      const token = buildInvitationToken();
      const tokenHash = hashInvitationToken(token);
      const updatedInvitation = await fastify.prisma.organizationInvitation.update({
        where: { id: invitationId },
        data: {
          tokenHash,
          ...(body.message !== undefined ? { message: body.message } : {}),
          lastSentAt: new Date(),
          sentCount: invitation.sentCount + 1,
        },
      });

      const invitationLink = `${fastify.config.API_PREFIX}/admin/organization-invitations/accept?token=${token}`;
      const emailResult = await mailer.sendEmail({
        to: updatedInvitation.email,
        subject: `Organization invitation reminder for ${request.currentOrganization?.name ?? 'Trackigniter8'}`,
        text: `Your invitation is ready. Accept here: ${invitationLink}`,
        metadata: {
          organizationId: updatedInvitation.organizationId,
          invitationId: updatedInvitation.id,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.organization_invitation.resend',
        entityType: 'OrganizationInvitation',
        entityId: invitationId,
        metadata: {
          email: updatedInvitation.email,
          sentCount: updatedInvitation.sentCount,
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.notification.email.resend',
        entityType: 'OrganizationInvitation',
        entityId: invitationId,
        metadata: {
          provider: emailResult.provider,
          messageId: emailResult.messageId,
          email: updatedInvitation.email,
        },
      });

      return reply.success({
        item: serializeOrganizationInvitation(updatedInvitation),
        ...(fastify.config.NODE_ENV !== 'production'
          ? {
              invitationToken: token,
              invitationLink,
            }
          : {}),
      });
    }
  );

  fastify.post(
    '/admin/organization-invitations/:invitationId/cancel',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organization-invitations:manage')],
    },
    async (request, reply) => {
      const { invitationId } = validateOrThrow(invitationIdParamSchema, request.params);
      const invitation = await findOrganizationInvitationOrThrow(fastify.prisma, invitationId);
      await fastify.requireOrganizationAccess(request, invitation.organizationId);

      if (invitation.status !== 'PENDING') {
        throw new ValidationAppError('Only pending invitations can be canceled');
      }

      const updatedInvitation = await fastify.prisma.organizationInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.organization_invitation.cancel',
        entityType: 'OrganizationInvitation',
        entityId: invitationId,
        metadata: { organizationId: invitation.organizationId, email: invitation.email },
      });

      return reply.success({ item: serializeOrganizationInvitation(updatedInvitation) });
    }
  );

  fastify.post(
    '/admin/organization-invitations/:invitationId/expire',
    {
      preHandler: [fastify.authenticate, fastify.requirePermission('organization-invitations:manage')],
    },
    async (request, reply) => {
      const { invitationId } = validateOrThrow(invitationIdParamSchema, request.params);
      const invitation = await findOrganizationInvitationOrThrow(fastify.prisma, invitationId);
      await fastify.requireOrganizationAccess(request, invitation.organizationId);

      if (invitation.status !== 'PENDING') {
        throw new ValidationAppError('Only pending invitations can be expired');
      }

      const updatedInvitation = await fastify.prisma.organizationInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'EXPIRED',
          expiresAt: new Date(),
        },
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.organization_invitation.expire',
        entityType: 'OrganizationInvitation',
        entityId: invitationId,
        metadata: { email: invitation.email },
      });

      return reply.success({ item: serializeOrganizationInvitation(updatedInvitation) });
    }
  );

  fastify.post(
    '/admin/organization-invitations/accept',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const body = validateOrThrow(acceptInvitationSchema, request.body);
      const invitation = await fastify.prisma.organizationInvitation.findUnique({
        where: {
          tokenHash: hashInvitationToken(body.token),
        },
      });

      if (!invitation) {
        throw new NotFoundError('Invitation not found');
      }

      if (invitation.status !== 'PENDING') {
        throw new ValidationAppError('Invitation is no longer pending');
      }

      if (invitation.expiresAt <= new Date()) {
        await fastify.prisma.organizationInvitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });
        throw new ValidationAppError('Invitation has expired');
      }

      if (request.currentUser!.email.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new ValidationAppError('Invitation email does not match the authenticated user');
      }

      const result = await fastify.prisma.$transaction(async (tx) => {
        const membership = await tx.organizationUser.upsert({
          where: {
            organizationId_userId: {
              organizationId: invitation.organizationId,
              userId: request.currentUser!.id,
            },
          },
          update: {
            role: invitation.role,
            status: 'ACTIVE',
          },
          create: {
            organizationId: invitation.organizationId,
            userId: request.currentUser!.id,
            role: invitation.role,
            status: 'ACTIVE',
          },
        });

        const updatedInvitation = await tx.organizationInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
          },
        });

        return {
          membership,
          invitation: updatedInvitation,
        };
      });

      await fastify.audit.write({
        ...getAuditContext(request),
        action: 'admin.organization_invitation.accept',
        entityType: 'OrganizationInvitation',
        entityId: invitation.id,
        metadata: { organizationId: invitation.organizationId, userId: request.currentUser!.id },
      });

      return reply.success({
        invitation: serializeOrganizationInvitation(result.invitation),
        membership: {
          id: result.membership.id,
          organizationId: result.membership.organizationId,
          userId: result.membership.userId,
          role: result.membership.role,
          status: result.membership.status,
        },
      });
    }
  );
};
