# Stage 03: IAM Administration + Backend Hardening

Stage 03 builds the administrative control plane on top of the Stage 02 foundation. It adds user, role, permission, session, audit-log, and system-setting APIs without introducing business modules such as vehicles, drivers, trips, tracking, fuel, or reports.

## Delivered Scope
- `User` administration under `/api/v1/admin/users`
- `Role` administration under `/api/v1/admin/roles`
- permission inspection under `/api/v1/admin/permissions`
- refresh-token session administration under `/api/v1/admin/sessions`
- audit log read APIs under `/api/v1/admin/audit-logs`
- generic `SystemSetting` foundation under `/api/v1/admin/settings`
- tighter auth rate limiting, password policy checks, request-id propagation, env-driven CORS, and safer production error behavior

## New Data Foundation
- `RefreshToken` now stores `ipAddress`, `userAgent`, `lastUsedAt`, and `revokedReason`
- `SystemSetting` stores generic typed application settings with secret masking in responses

## Admin Mutation Audit Actions
- `admin.user.create`
- `admin.user.update`
- `admin.user.activate`
- `admin.user.deactivate`
- `admin.user.password.reset`
- `admin.user.roles.assign`
- `admin.user.roles.remove`
- `admin.role.create`
- `admin.role.update`
- `admin.role.delete`
- `admin.role.permissions.assign`
- `admin.role.permissions.remove`
- `admin.session.revoke`
- `admin.session.revoke-all`
- `admin.setting.upsert`
- `admin.setting.delete`

## Verification Checklist
1. Generate Prisma client: `npx.cmd prisma generate --schema packages/db/prisma/schema.prisma`
2. Typecheck: `npm.cmd run typecheck`
3. Build: `npm.cmd run build`
4. If Postgres is healthy, push schema: `npx.cmd prisma db push --schema packages/db/prisma/schema.prisma`
5. If Postgres is healthy, seed defaults: `npm.cmd run prisma:seed`

## Sample Curl Flow
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"emailOrUsername\":\"superadmin\",\"password\":\"ChangeMe123!\"}"
```

```bash
curl http://localhost:3000/api/v1/admin/users?page=1&pageSize=20 \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

```bash
curl -X PUT http://localhost:3000/api/v1/admin/settings/app.name \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"value\":\"Trackigniter8\",\"valueType\":\"STRING\",\"category\":\"general\",\"isSecret\":false}"
```

## Local Infra Status During This Stage
- Type generation, typecheck, and build completed successfully
- Postgres port `5432` accepted TCP connections, but Prisma schema operations still failed with `Schema engine error`
- Redis port `6379` was not reachable locally

Because of that infra state, Stage 03 was implemented and validated at compile time without making database or Redis availability a blocker.
