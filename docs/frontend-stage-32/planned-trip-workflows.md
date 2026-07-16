# Planned Trip Workflows

Integrated APIs:
- `GET/POST/PATCH /admin/planned-trips`
- `GET /admin/planned-trips/:plannedTripId`
- `POST /admin/planned-trips/:plannedTripId/status`
- `POST /admin/planned-trips/:plannedTripId/cancel`
- `POST /admin/planned-trips/:plannedTripId/assign`
- `POST /admin/planned-trips/:plannedTripId/unassign`
- `POST/PATCH/DELETE /admin/planned-trips/:plannedTripId/stops/:stopId`
- `POST /admin/dispatch/validate`
- `POST /admin/trips`

Planned trip detail supports dispatch validation and creating an executed trip from a planned trip.
