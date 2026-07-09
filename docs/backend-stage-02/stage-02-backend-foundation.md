# Stage 02 Backend Foundation

## Scope Completed
Stage 02 creates the shared backend foundation only:
- workspace and package structure
- Fastify app base
- typed environment config
- Prisma auth/RBAC schema
- JWT auth with refresh token rotation
- RBAC permission helper
- audit logging service
- health check endpoint
- Docker/dev setup

## Deliberately Not Implemented
- vehicle module
- driver module
- tracking module
- trip module
- maintenance module
- reports module
- frontend conversion

## Structure
- `apps/api`
  - Fastify application
  - auth routes
  - health route
  - plugins and runtime services
- `packages/config`
  - typed environment validation
- `packages/db`
  - Prisma client, schema, seed
- `packages/auth`
  - password hashing and JWT config helpers
- `packages/rbac`
  - permission checks
- `packages/logger`
  - structured logger factory
- `packages/errors`
  - application error types
- `packages/validation`
  - Zod validation helper
- `packages/shared`
  - shared constants, payload types, seed definitions

## Current APIs
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `GET /api/v1/health`

## Database Models In Stage 02
- User
- Role
- Permission
- UserRole
- RolePermission
- RefreshToken
- AuditLog

## Notes
- refresh tokens are stored hashed in the database
- refresh rotation revokes old tokens when a new pair is issued
- audit logging is already reusable for future modules
- role and permission seed data is centralized in `packages/shared`
