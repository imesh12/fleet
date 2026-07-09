# Development Setup

## Local Setup
1. Copy `.env.example` to `.env`
2. Start infrastructure:
   - `docker compose up -d`
3. Install dependencies:
   - `npm.cmd install`
4. Generate Prisma client:
   - `npx prisma generate --schema packages/db/prisma/schema.prisma`
5. Run the initial migration:
   - `npx prisma migrate dev --schema packages/db/prisma/schema.prisma`
6. Seed roles, permissions, and the default super admin:
   - `npx tsx packages/db/prisma/seed.ts`
7. Start the API:
   - `npx tsx apps/api/src/server.ts`

## Docker Notes
- `docker-compose.yml` provisions PostgreSQL and Redis
- `Dockerfile` is included for the API container image
- the compose file currently focuses on infrastructure only, which keeps local app iteration simpler

## Verification Targets
- `GET /api/v1/health`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

## Troubleshooting
- if Prisma generate fails, confirm dependencies installed and `DATABASE_URL` is set
- if migrations fail, confirm PostgreSQL container is healthy and reachable on port 5432
- if auth requests fail, confirm the seed completed and the super admin credentials match `.env`
