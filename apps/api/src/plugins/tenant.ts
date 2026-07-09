import fp from 'fastify-plugin';

import { ROLE_CODES } from '@trackigniter8/shared';
import { AuthenticationError, AuthorizationError, NotFoundError, ValidationAppError } from '@trackigniter8/errors';

export const tenantPlugin = fp(async (fastify) => {
  fastify.decorate('requireOrganizationAccess', async (request, organizationId) => {
    if (!request.currentUser) {
      throw new AuthenticationError('Authentication middleware must run before organization access checks');
    }

    const resolvedOrganizationId = organizationId ?? request.headers['x-organization-id']?.toString();

    if (!resolvedOrganizationId) {
      throw new ValidationAppError('Organization context is required', {
        header: 'x-organization-id',
      });
    }

    const organization = await fastify.prisma.organization.findUnique({
      where: { id: resolvedOrganizationId },
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    let membership: {
      id: string;
      role: string;
      status: string;
    } | null = null;

    if (!request.currentUser.roles.includes(ROLE_CODES.SUPER_ADMIN)) {
      const orgMembership = await fastify.prisma.organizationUser.findUnique({
        where: {
          organizationId_userId: {
            organizationId: organization.id,
            userId: request.currentUser.id,
          },
        },
      });

      if (!orgMembership || orgMembership.status !== 'ACTIVE') {
        throw new AuthorizationError('You do not have access to the requested organization');
      }

      membership = {
        id: orgMembership.id,
        role: orgMembership.role,
        status: orgMembership.status,
      };
    }

    const context = {
      organization: {
        id: organization.id,
        name: organization.name,
        code: organization.code,
        status: organization.status,
      },
      membership,
    };

    request.currentOrganization = context.organization;
    request.currentOrganizationMembership = context.membership;

    return context;
  });
});
