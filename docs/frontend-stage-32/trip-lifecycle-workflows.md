# Trip Lifecycle Workflows

Integrated APIs:
- `GET /admin/trips`
- `GET /admin/trips/:tripId`
- `POST /admin/trips/:tripId/start`
- `POST /admin/trips/:tripId/hold`
- `POST /admin/trips/:tripId/resume`
- `POST /admin/trips/:tripId/complete`
- `POST /admin/trips/:tripId/cancel`
- `POST /admin/trips/:tripId/fail`
- `PATCH /admin/trips/:tripId/stops/:stopId`
- `GET /admin/trips/:tripId/timeline`
- `GET /admin/trips/:tripId/replay`

Force start is exposed as a separate action. The backend remains responsible for RBAC enforcement.
