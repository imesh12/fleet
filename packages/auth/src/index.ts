import bcrypt from 'bcryptjs';

import { getEnv } from '@trackigniter8/config';

export type PasswordPolicyResult = {
  valid: boolean;
  errors: string[];
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateTokenId(): string {
  return crypto.randomUUID();
}

export function getJwtConfig() {
  const env = getEnv();
  return {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  };
}

export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  const env = getEnv();
  const errors: string[] = [];

  if (password.length < env.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${env.PASSWORD_MIN_LENGTH} characters long`);
  }

  if (env.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter');
  }

  if (env.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter');
  }

  if (env.PASSWORD_REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    errors.push('Password must include at least one number');
  }

  if (env.PASSWORD_REQUIRE_SPECIAL && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must include at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
