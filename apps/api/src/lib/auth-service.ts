import { createHash, randomBytes } from 'node:crypto';

import type { FastifyInstance } from 'fastify';

import { generateTokenId, getJwtConfig, verifyPassword } from '@trackigniter8/auth';
import { AuthenticationError } from '@trackigniter8/errors';
import type { JwtAccessPayload } from '@trackigniter8/shared';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function buildOpaqueRefreshToken(tokenId: string) {
  return `${tokenId}.${randomBytes(48).toString('hex')}`;
}

function parseOpaqueRefreshToken(refreshToken: string) {
  const [tokenId] = refreshToken.split('.');
  if (!tokenId) {
    throw new AuthenticationError('Refresh token format is invalid');
  }
  return tokenId;
}

function durationToDate(duration: string): Date {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2]!;
  const multiplier: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  const unitMs = multiplier[unit];
  if (!unitMs) {
    throw new Error(`Unsupported duration unit: ${unit}`);
  }

  return new Date(Date.now() + value * unitMs);
}

export async function buildUserContext(fastify: FastifyInstance, userId: string): Promise<JwtAccessPayload & { id: string }> {
  const user = await fastify.prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  if (user.status !== 'ACTIVE') {
    throw new AuthenticationError('User account is not active');
  }

  const roles = user.roles.map((entry) => entry.role.code);
  const permissions = Array.from(
    new Set(user.roles.flatMap((entry) => entry.role.permissions.map((rolePermission) => rolePermission.permission.code)))
  );

  return {
    id: user.id,
    sub: user.id,
    type: 'user',
    email: user.email,
    username: user.username,
    roles,
    permissions,
  };
}

export async function issueAuthTokens(fastify: FastifyInstance, userId: string) {
  return issueAuthTokensWithContext(fastify, userId, {});
}

export async function issueAuthTokensWithContext(
  fastify: FastifyInstance,
  userId: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
  }
) {
  const jwtConfig = getJwtConfig();
  const userContext = await buildUserContext(fastify, userId);
  const refreshTokenId = generateTokenId();

  const accessToken = await fastify.jwt.sign(
    {
      sub: userContext.sub,
      type: userContext.type,
      email: userContext.email,
      username: userContext.username,
      roles: userContext.roles,
      permissions: userContext.permissions,
    },
    {
      expiresIn: jwtConfig.accessExpiresIn,
    }
  );

  const refreshToken = buildOpaqueRefreshToken(refreshTokenId);

  await fastify.prisma.refreshToken.create({
    data: {
      userId,
      tokenId: refreshTokenId,
      hashedToken: hashToken(refreshToken),
      expiresAt: durationToDate(jwtConfig.refreshExpiresIn),
      lastUsedAt: new Date(),
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent } : {}),
    },
  });

  return {
    accessToken,
    refreshToken,
    refreshTokenId,
    user: {
      id: userContext.id,
      email: userContext.email,
      username: userContext.username,
      roles: userContext.roles,
      permissions: userContext.permissions,
    },
  };
}

export async function loginWithPassword(
  fastify: FastifyInstance,
  credentials: { emailOrUsername: string; password: string },
  context: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
) {
  const user = await fastify.prisma.user.findFirst({
    where: {
      OR: [{ email: credentials.emailOrUsername }, { username: credentials.emailOrUsername }],
    },
  });

  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }

  const isValid = await verifyPassword(credentials.password, user.passwordHash);
  if (!isValid) {
    throw new AuthenticationError('Invalid credentials');
  }

  await fastify.prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return issueAuthTokensWithContext(fastify, user.id, context);
}

export async function revokeRefreshToken(
  fastify: FastifyInstance,
  refreshToken: string,
  options: {
    revokedReason?: string;
  } = {}
) {
  const tokenId = parseOpaqueRefreshToken(refreshToken);

  const tokenRecord = await fastify.prisma.refreshToken.findUnique({
    where: { tokenId },
  });

  if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.hashedToken !== hashToken(refreshToken)) {
    throw new AuthenticationError('Refresh token is invalid or already revoked');
  }

  await fastify.prisma.refreshToken.update({
    where: { tokenId },
    data: {
      revokedAt: new Date(),
      ...(options.revokedReason ? { revokedReason: options.revokedReason } : {}),
    },
  });
}

export async function rotateRefreshToken(
  fastify: FastifyInstance,
  refreshToken: string,
  context: {
    ipAddress?: string;
    userAgent?: string;
  } = {}
) {
  const tokenId = parseOpaqueRefreshToken(refreshToken);

  const tokenRecord = await fastify.prisma.refreshToken.findUnique({
    where: { tokenId },
  });

  if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
    throw new AuthenticationError('Refresh token expired or revoked');
  }

  if (tokenRecord.hashedToken !== hashToken(refreshToken)) {
    throw new AuthenticationError('Refresh token mismatch');
  }

  const next = await issueAuthTokensWithContext(fastify, tokenRecord.userId, context);

  await fastify.prisma.refreshToken.update({
    where: { tokenId },
    data: {
      revokedAt: new Date(),
      revokedReason: 'rotated',
      replacedById: next.refreshTokenId,
      lastUsedAt: new Date(),
    },
  });

  return next;
}
