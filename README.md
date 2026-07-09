# Trackigniter8 Backend Foundation

Stages 02 and 03 contain the backend-only foundation and IAM administration layer for the Trackigniter8 rebuild.

## Scope
- Fastify API base
- typed environment validation
- Prisma base auth/RBAC schema
- JWT authentication
- refresh token rotation
- RBAC permission guards
- audit logging
- health checks
- IAM administration APIs
- system settings foundation
- auth route rate limiting
- password policy enforcement
- Docker support

## Quick Start
1. Copy `.env.example` to `.env`
2. Start infra: `docker compose up -d`
3. Install dependencies: `npm.cmd install`
4. Generate Prisma client: `npx prisma generate --schema packages/db/prisma/schema.prisma`
5. Push or migrate schema: `npx prisma db push --schema packages/db/prisma/schema.prisma`
6. Seed defaults: `npx tsx packages/db/prisma/seed.ts`
7. Start API: `npx tsx apps/api/src/server.ts`

Detailed docs live in:
- [Stage 02 Docs](/C:/Users/cs_in/projects/trackigniter8/docs/backend-stage-02)
- [Stage 03 Docs](/C:/Users/cs_in/projects/trackigniter8/docs/backend-stage-03)
