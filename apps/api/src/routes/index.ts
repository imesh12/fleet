import type { FastifyPluginAsync } from 'fastify';

import { adminRoutes } from '../modules/admin/index.js';
import { apiContractRoutes } from '../modules/api-contract/routes.js';
import { authRoutes } from '../modules/auth/routes.js';
import { healthRoutes } from '../modules/health/routes.js';
import { navigationRoutes } from '../modules/navigation/routes.js';
import { trackingRoutes } from '../modules/tracking/routes.js';

const routePlugins: FastifyPluginAsync[] = [healthRoutes, apiContractRoutes, authRoutes, navigationRoutes, trackingRoutes, adminRoutes];

export const registerRoutes: FastifyPluginAsync = async (fastify) => {
  for (const routePlugin of routePlugins) {
    await fastify.register(routePlugin);
  }
};
