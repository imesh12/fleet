# RBAC Design

## Base Concepts
- users do not store a single role directly
- roles are assigned through `UserRole`
- permissions are assigned to roles through `RolePermission`
- effective permissions are resolved at request time from the user role graph

## Default Roles
- SUPER_ADMIN
- ADMIN
- MANAGER
- STAFF
- VIEWER

## Default Permission Seeds
Current seed focuses on foundation concerns:
- `system:health:read`
- `system:audit:read`
- `auth:self:read`
- `auth:self:logout`
- `iam:roles:manage`
- `iam:permissions:manage`
- `iam:users:manage`
- `iam:users:read`
- `iam:seeds:run`
- `audit:logs:write`
- `audit:logs:read`

## Enforcement
- JWT auth resolves user identity
- current user roles and permissions are loaded from the database
- route protection can use:
- `preHandler: [fastify.authenticate]`
- `preHandler: [fastify.authenticate, fastify.requirePermission('some:permission')]`

## Super Admin Behavior
- `SUPER_ADMIN` bypasses individual permission checks
- still useful to keep full permission mappings seeded for clarity and future admin tooling

## Why This Design
- supports many-to-many role assignment
- keeps module permissions extensible
- fits later enterprise concerns like temporary roles, scoped roles, and auditability
