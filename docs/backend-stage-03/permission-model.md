# Permission Model

Stage 03 keeps permissions system-defined and seed-driven. There is no public API for arbitrary permission creation in this stage.

## Modules
- `system`
- `auth`
- `iam`
- `audit`
- `settings`

## Core Permissions
- `system:health:read`
- `auth:self:read`
- `auth:self:logout`
- `iam:users:read`
- `iam:users:manage`
- `iam:roles:read`
- `iam:roles:manage`
- `iam:permissions:read`
- `iam:sessions:read`
- `iam:sessions:manage`
- `audit:logs:write`
- `audit:logs:read`
- `settings:read`
- `settings:manage`

## Default Role Mapping
- `SUPER_ADMIN`: all seeded permissions
- `ADMIN`: full IAM admin except seed/bootstrap actions
- `MANAGER`: read-heavy IAM visibility plus audit/settings read
- `STAFF`: self-service auth and health only
- `VIEWER`: self-service auth and health only

## Inspection APIs
- `GET /api/v1/admin/permissions`
- `GET /api/v1/admin/permissions/:permissionId`
