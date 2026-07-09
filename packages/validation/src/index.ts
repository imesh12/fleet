import { ZodError, type ZodSchema } from 'zod';

import { ValidationAppError } from '@trackigniter8/errors';

export function validateOrThrow<T>(schema: ZodSchema<T>, value: unknown): T {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationAppError('Request validation failed', error.flatten());
    }
    throw error;
  }
}
