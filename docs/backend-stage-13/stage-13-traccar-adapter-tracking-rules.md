# Stage 13: Traccar Adapter + Tracking Rules Foundation

## Scope

Stage 13 extends the Stage 12 tracking base with adapter-ready provider normalization, external device mapping workflows, sync run placeholders, tracking alert rules, and geofence definition storage.

Implemented areas:

- reusable tracking provider adapter package
- Traccar adapter normalization shell
- discovered external device storage
- internal vehicle/device mapping workflow
- provider sync run placeholders
- tracking alert rule and event foundation
- geofence definition storage and point management
- trip movement event synthesis during ingest

Out of scope:

- frontend map UI
- live Traccar polling workers
- full geofence runtime detection
- maintenance, fuel, payroll, and reports

## New models

- `ExternalTrackingDevice`
- `VehicleDeviceMapping`
- `TrackingProviderSyncRun`
- `TrackingProviderSyncItem`
- `TrackingAlertRule`
- `TrackingAlertEvent`
- `Geofence`
- `GeofencePoint`

## Adapter summary

- `packages/tracking-providers` now exposes a provider adapter interface.
- The Traccar adapter normalizes device and position payloads into the Stage 12 ingest contract.
- The API does not depend on a live Traccar server; normalization is local and reusable.

## API summary

- `GET/POST /api/v1/admin/tracking/external-devices`
- `GET /api/v1/admin/tracking/external-devices/:externalDeviceId`
- `GET/POST /api/v1/admin/tracking/device-mappings`
- `GET /api/v1/admin/tracking/device-mappings/:mappingId`
- `PATCH /api/v1/admin/tracking/device-mappings/:mappingId`
- `POST /api/v1/admin/tracking/device-mappings/:mappingId/deactivate`
- `POST /api/v1/admin/tracking/device-mappings/:mappingId/unmap`

- `GET/POST /api/v1/admin/tracking-providers/:providerId/sync-runs`
- `GET /api/v1/admin/tracking-providers/:providerId/sync-runs/:syncRunId`
- `POST /api/v1/admin/tracking-providers/:providerId/sync-runs/:syncRunId/items`
- `PATCH /api/v1/admin/tracking-providers/:providerId/sync-runs/:syncRunId/items/:syncItemId`

- `GET/POST /api/v1/admin/tracking-alert-rules`
- `GET /api/v1/admin/tracking-alert-rules/:alertRuleId`
- `PATCH /api/v1/admin/tracking-alert-rules/:alertRuleId`
- `POST /api/v1/admin/tracking-alert-rules/:alertRuleId/activate`
- `POST /api/v1/admin/tracking-alert-rules/:alertRuleId/deactivate`

- `GET/POST /api/v1/admin/tracking-alert-events`
- `GET /api/v1/admin/tracking-alert-events/:alertEventId`
- `POST /api/v1/admin/tracking-alert-events/:alertEventId/acknowledge`
- `POST /api/v1/admin/tracking-alert-events/:alertEventId/resolve`

- `GET/POST /api/v1/admin/geofences`
- `GET /api/v1/admin/geofences/:geofenceId`
- `PATCH /api/v1/admin/geofences/:geofenceId`
- `POST /api/v1/admin/geofences/:geofenceId/activate`
- `POST /api/v1/admin/geofences/:geofenceId/deactivate`
- `POST /api/v1/admin/geofences/:geofenceId/points`
- `PATCH /api/v1/admin/geofences/:geofenceId/points/:pointId`
- `DELETE /api/v1/admin/geofences/:geofenceId/points/:pointId`
- `POST /api/v1/admin/geofences/:geofenceId/points/reorder`

## Ingest extension summary

- normalized provider batches can now be converted through the adapter layer
- ingest upserts discovered external devices
- ingest can resolve mapped devices to vehicles
- ingest can synthesize trip movement events
- ingest can create safe alert events for selected active rule types
