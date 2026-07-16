# Users, Roles, And Permissions

Frontend routes:
- `/admin/users`
- `/admin/users/[userId]`
- `/admin/roles`
- `/admin/roles/[roleId]`
- `/admin/permissions`

Integrated APIs:
- `GET/POST /api/v1/admin/users`
- `GET/PATCH /api/v1/admin/users/:userId`
- `POST /api/v1/admin/users/:userId/activate`
- `POST /api/v1/admin/users/:userId/deactivate`
- `POST /api/v1/admin/users/:userId/reset-password`
- `POST /api/v1/admin/users/:userId/roles`
- `DELETE /api/v1/admin/users/:userId/roles/:roleCode`
- `GET /api/v1/admin/sessions`
- `POST /api/v1/admin/sessions/:sessionId/revoke`
- `POST /api/v1/admin/sessions/revoke-all`
- `GET/POST /api/v1/admin/roles`
- `GET/PATCH/DELETE /api/v1/admin/roles/:roleId`
- `POST /api/v1/admin/roles/:roleId/permissions`
- `DELETE /api/v1/admin/roles/:roleId/permissions/:permissionCode`
- `GET /api/v1/admin/permissions`

System roles remain protected by backend enforcement. The frontend shows permission summaries and grouped seeded permissions.
