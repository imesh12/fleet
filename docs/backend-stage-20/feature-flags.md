# Feature Flags

Admin APIs:
- `GET /api/v1/admin/feature-flags`
- `POST /api/v1/admin/feature-flags`
- `GET /api/v1/admin/feature-flags/:id`
- `PATCH /api/v1/admin/feature-flags/:id`

Fields:
- `organizationId`
- `key`
- `name`
- `description`
- `enabled`
- `rolloutStatus`
- `metadata`

Rollout statuses:
- `PLANNED`
- `PREVIEW`
- `ENABLED`
- `DISABLED`

