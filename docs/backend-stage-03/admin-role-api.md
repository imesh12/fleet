# Admin Role API

Base path: `/api/v1/admin/roles`

## Endpoints
- `GET /` list roles
- `GET /:roleId` get one role with permissions
- `POST /` create a custom role
- `PATCH /:roleId` update a custom role
- `DELETE /:roleId` delete a custom role
- `POST /:roleId/permissions` assign permissions to a custom role
- `DELETE /:roleId/permissions/:permissionCode` remove one permission from a custom role

## System Role Protection
Protected roles:
- `SUPER_ADMIN`
- `ADMIN`
- `MANAGER`
- `STAFF`
- `VIEWER`

These system roles can be listed and inspected, but Stage 03 prevents editing their metadata, deleting them, or mutating their permission sets through the role administration APIs.

## Request Notes
- create role body: `code`, `name`, optional `description`, optional `permissionCodes`
- update role body: `name` and/or `description`
- assign permissions body: `permissionCodes: string[]`

## Guarding Rules
- read routes require `iam:roles:read`
- mutation routes require `iam:roles:manage`
