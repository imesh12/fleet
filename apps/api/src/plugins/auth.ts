import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

import { getJwtConfig } from '@trackigniter8/auth';
import { AuthenticationError } from '@trackigniter8/errors';
import type { JwtAccessPayload } from '@trackigniter8/shared';

import { buildUserContext } from '../lib/auth-service.js';

export const authPlugin = fp(async (fastify) => {
  const jwtConfig = getJwtConfig();

  await fastify.register(fastifyJwt, {
    secret: jwtConfig.accessSecret,
  });

  fastify.decorate('authenticate', async (request, _reply) => {
    try {
      const payload = await request.jwtVerify<JwtAccessPayload>();
      const user = await buildUserContext(fastify, payload.sub);
      request.currentUser = user;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired access token', error);
    }
  });
});
