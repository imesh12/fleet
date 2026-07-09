import fp from 'fastify-plugin';

import { createAuditService } from '../lib/audit-service.js';

export const auditPlugin = fp(async (fastify) => {
  fastify.decorate('audit', createAuditService(fastify));
});
