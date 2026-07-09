# Stage 12: Live Tracking Ingestion + Telemetry Foundation

## Scope

Stage 12 introduces backend-only live tracking foundations on top of the Stage 04-11 organization, vehicle, driver, planning, and trip lifecycle layers.

Implemented areas:

- Organization-scoped tracking providers
- Masked provider ingest credentials
- Provider health snapshots
- Telemetry ingestion endpoint
- Latest vehicle position storage
- Append-only telemetry history
- Trip linkage for telemetry events
- Tracking health and stale/offline summaries

Out of scope:

- Frontend map UI
- Full Traccar synchronization
- Live replay UI
- Geofence runtime
- Maintenance, fuel, payroll, and reports

## New models

- `TrackingProvider`
- `TrackingProviderCredential`
- `TrackingProviderHealth`
- `VehiclePosition`
- `VehicleTelemetryEvent`

## Design summary

- `TrackingProvider` is organization scoped and provider neutral.
- `TrackingProviderCredential` stores hashed ingest secrets and exposes only masked metadata on read.
- `VehiclePosition` stores the latest known position per vehicle.
- `VehicleTelemetryEvent` stores append-only telemetry history for analytics, replay, and alerting foundations.
- Telemetry can link to an explicit trip or infer an active trip for the vehicle.

## API summary

- `GET/POST /api/v1/admin/tracking-providers`
- `GET/PATCH /api/v1/admin/tracking-providers/:providerId`
- `POST /api/v1/admin/tracking-providers/:providerId/activate`
- `POST /api/v1/admin/tracking-providers/:providerId/deactivate`
- `GET/POST /api/v1/admin/tracking-providers/:providerId/credentials`
- `GET/PATCH /api/v1/admin/tracking-providers/:providerId/credentials/:credentialId`
- `POST /api/v1/admin/tracking-providers/:providerId/credentials/:credentialId/deactivate`
- `GET/PUT /api/v1/admin/tracking-providers/:providerId/health`

- `POST /api/v1/tracking/ingest`

- `GET /api/v1/admin/tracking/vehicles/latest`
- `GET /api/v1/admin/tracking/vehicles/:vehicleId/latest`
- `GET /api/v1/admin/tracking/vehicles/:vehicleId/history`
- `GET /api/v1/admin/tracking/health`

## Operational behavior

- Ingest authenticates by provider code, key id, and secret.
- Every telemetry event is written to history.
- Latest position updates only when the incoming telemetry timestamp is newer than the stored current position.
- Provider health is updated automatically during successful ingest.
