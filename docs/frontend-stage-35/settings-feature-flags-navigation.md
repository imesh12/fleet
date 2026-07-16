# Settings, Feature Flags, And Navigation

Frontend route:
- `/admin/settings`

Integrated APIs:
- `GET /api/v1/admin/settings`
- `PUT /api/v1/admin/settings/:key`
- `GET /api/v1/admin/organizations/:organizationId/settings`
- `GET/POST/PATCH /api/v1/admin/navigation/menu-groups`
- `GET/POST/PATCH /api/v1/admin/navigation/menu-items`
- `POST /api/v1/admin/navigation/menu-items/:id/coming-soon`
- `GET/POST/PATCH /api/v1/admin/navigation/pages`
- `GET/POST/PATCH /api/v1/admin/feature-flags`

Secret behavior:
- Existing secret setting values are masked.
- Secret replacement is explicit through the settings editor.
- The UI does not display stored secret values.

Navigation management supports numeric sort order and coming-soon status without drag-and-drop.
