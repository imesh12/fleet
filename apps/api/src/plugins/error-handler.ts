import fp from 'fastify-plugin';
import { ZodError } from 'zod';

import { getEnv } from '@trackigniter8/config';
import { AppError } from '@trackigniter8/errors';

export const errorHandlerPlugin = fp(async (fastify) => {
  fastify.setErrorHandler((error, request, reply) => {
    const env = getEnv();
    const requestId = request.id;
    const err = error as Error;
    const includeDetails = env.NODE_ENV !== 'production' || env.SHOW_ERROR_DETAILS;

    if (error instanceof AppError) {
      request.log.warn({ err: error, requestId }, error.message);
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(includeDetails && error.details ? { details: error.details } : {}),
        },
        meta: { requestId },
      });
    }

    if (error instanceof ZodError) {
      request.log.warn({ err: error, requestId }, 'Validation failed');
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          details: error.flatten(),
        },
        meta: { requestId },
      });
    }

    request.log.error({ err, requestId }, 'Unhandled application error');
    return reply.status(500).send({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
      meta: { requestId },
    });
  });
});
