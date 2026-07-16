import { z } from 'zod';

import { DEFAULT_API_PREFIX } from '@trackigniter8/shared';

const csvStringSchema = z
  .string()
  .default('*')
  .transform((value) =>
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  );

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_NAME: z.string().min(1).default('trackigniter8-api'),
  APP_VERSION: z.string().min(1).default('0.1.0'),
  APP_HOST: z.string().min(1).default('0.0.0.0'),
  APP_PORT: z.coerce.number().int().positive().default(3000),
  APP_LOG_LEVEL: z.string().min(1).default('info'),
  API_PREFIX: z.string().min(1).default(DEFAULT_API_PREFIX),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CORS_ORIGINS: csvStringSchema,
  CORS_CREDENTIALS: z.coerce.boolean().default(false),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().min(2).default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().min(2).default('7d'),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  AUTH_RATE_LIMIT_WINDOW: z.string().min(2).default('1 minute'),
  MAIL_PROVIDER: z.string().min(1).default('console'),
  MAIL_FROM_EMAIL: z.string().email().default('no-reply@trackigniter8.local'),
  MAIL_FROM_NAME: z.string().min(1).default('Trackigniter8 Notifications'),
  PASSWORD_MIN_LENGTH: z.coerce.number().int().min(8).max(128).default(12),
  PASSWORD_REQUIRE_UPPERCASE: z.coerce.boolean().default(true),
  PASSWORD_REQUIRE_LOWERCASE: z.coerce.boolean().default(true),
  PASSWORD_REQUIRE_NUMBER: z.coerce.boolean().default(true),
  PASSWORD_REQUIRE_SPECIAL: z.coerce.boolean().default(true),
  SHOW_ERROR_DETAILS: z.coerce.boolean().default(false),
  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_USERNAME: z.string().min(3),
  SUPER_ADMIN_PASSWORD: z.string().min(8),
  SUPER_ADMIN_FIRST_NAME: z.string().min(1).default('System'),
  SUPER_ADMIN_LAST_NAME: z.string().min(1).default('Administrator'),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

function assertProductionSafeEnv(env: AppEnv) {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  const placeholderSecrets = [
    ['JWT_ACCESS_SECRET', env.JWT_ACCESS_SECRET],
    ['JWT_REFRESH_SECRET', env.JWT_REFRESH_SECRET],
  ].filter(([, value]) => String(value).toLowerCase().includes('change-me'));

  if (placeholderSecrets.length > 0) {
    throw new Error(`Production configuration must not use placeholder JWT secrets: ${placeholderSecrets.map(([key]) => key).join(', ')}`);
  }

  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    throw new Error('Production configuration must use different JWT access and refresh secrets');
  }

  if (env.CORS_ORIGINS.includes('*')) {
    throw new Error('Production configuration must use explicit CORS_ORIGINS, not *');
  }

  if (env.SUPER_ADMIN_PASSWORD === 'ChangeMe123!') {
    throw new Error('Production configuration must not use the default development super-admin password');
  }
}

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${formatted}`);
  }

  assertProductionSafeEnv(parsed.data);
  cachedEnv = parsed.data;
  return cachedEnv;
}
