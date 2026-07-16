# Geofence Workflows

Pages:
- `/tracking/geofences`
- `/tracking/geofences/new`
- `/tracking/geofences/[geofenceId]`
- `/tracking/geofences/[geofenceId]/edit`

Integrated APIs:
- `GET/POST/PATCH /admin/geofences`
- `POST /admin/geofences/:geofenceId/activate`
- `POST /admin/geofences/:geofenceId/deactivate`
- `GET /admin/geofences/:geofenceId`
- `POST/PATCH/DELETE /admin/geofences/:geofenceId/points/:pointId`
- `POST /admin/geofences/evaluate`
- `GET /admin/geofence-events`

Stage 33 provides a simple coordinate-point editor. Map drawing is deferred.
