import fp from 'fastify-plugin';

import { AuthenticationError } from '@trackigniter8/errors';
import { requirePermission as assertPermission } from '@trackigniter8/rbac';

export const rbacPlugin = fp(async (fastify) => {
  fastify.decorate('requirePermission', (permission: string) => {
    return async (request) => {
      if (!request.currentUser) {
        throw new AuthenticationError('Authentication middleware must run before permission checks');
      }

      assertPermission(
        {
          permissions: request.currentUser?.permissions ?? [],
          roles: request.currentUser?.roles ?? [],
        },
        permission
      );
    };
  });
});
