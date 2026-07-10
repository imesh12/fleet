# Page Registry

Admin APIs:
- `GET /api/v1/admin/navigation/pages`
- `POST /api/v1/admin/navigation/pages`
- `PATCH /api/v1/admin/navigation/pages/:id`
- `POST /api/v1/admin/navigation/pages/:id/activate`
- `POST /api/v1/admin/navigation/pages/:id/hide`
- `POST /api/v1/admin/navigation/pages/:id/disable`
- `POST /api/v1/admin/navigation/pages/:id/coming-soon`

Page status values:
- `ACTIVE`
- `HIDDEN`
- `COMING_SOON`
- `DISABLED`

Pages are metadata only. No frontend page rendering is implemented in Stage 20.

