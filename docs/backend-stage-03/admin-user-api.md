# Admin User API

Base path: `/api/v1/admin/users`

## Endpoints
- `GET /` list users with `page`, `pageSize`, `search`, `status`
- `GET /:userId` get one user with roles and permission summary
- `POST /` create a user
- `PATCH /:userId` update profile fields
- `POST /:userId/activate` activate a user
- `POST /:userId/deactivate` deactivate a user
- `POST /:userId/reset-password` reset password and revoke active sessions
- `POST /:userId/roles` assign one or more roles
- `DELETE /:userId/roles/:roleCode` remove one role

## Request Notes
- create user body: `email`, `username`, `firstName`, `lastName`, `password`, optional `status`, optional `roleCodes`
- update user body: any of `email`, `username`, `firstName`, `lastName`
- reset password body: `newPassword`
- assign roles body: `roleCodes: string[]`

## Response Notes
- list responses use the shared success envelope plus `meta.pagination`
- user payloads never expose `passwordHash`
- each user includes a flattened permission summary derived from assigned roles

## Guarding Rules
- read routes require `iam:users:read`
- mutation routes require `iam:users:manage`
- assigning or removing `SUPER_ADMIN` requires an acting super admin
- deactivating or stripping the last active `SUPER_ADMIN` is blocked
