import type { AppEnv } from '@trackigniter8/config';
import type { JwtAccessPayload } from '@trackigniter8/shared';
import type { Logger } from '@trackigniter8/logger';
import type { PrismaClient } from '@prisma/client';
import type { Redis as RedisClient } from 'ioredis';

export type AuthenticatedUser = JwtAccessPayload & {
  id: string;
};

export type AuditActor = {
  actorUserId?: string;
  actorType?: 'USER' | 'SYSTEM';
  ipAddress?: string;
  userAgent?: string;
};

export type RequestOrganizationContext = {
  organization: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  membership: {
    id: string;
    role: string;
    status: string;
  } | null;
};

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: RedisClient;
    appLogger: Logger;
    config: AppEnv;
    authenticate: (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>;
    requirePermission: (permission: string) => import('fastify').preHandlerHookHandler;
    requireOrganizationAccess: (
      request: import('fastify').FastifyRequest,
      organizationId?: string
    ) => Promise<RequestOrganizationContext>;
    audit: {
      write: (
        input: AuditActor & {
          action: string;
          entityType?: string;
          entityId?: string;
          metadata?: Record<string, unknown>;
        }
      ) => Promise<void>;
    };
  }

  interface FastifyReply {
    success: <T>(data: T, meta?: Record<string, unknown>) => import('fastify').FastifyReply;
  }

  interface FastifyRequest {
    currentUser?: AuthenticatedUser;
    currentOrganization?: RequestOrganizationContext['organization'];
    currentOrganizationMembership?: RequestOrganizationContext['membership'];
  }
}
