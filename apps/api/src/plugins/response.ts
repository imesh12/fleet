import fp from 'fastify-plugin';

import { sendSuccess } from '../lib/response.js';

export const responsePlugin = fp(async (fastify) => {
  fastify.decorateReply('success', function success(data, meta) {
    return sendSuccess(this, data, meta);
  });
});
