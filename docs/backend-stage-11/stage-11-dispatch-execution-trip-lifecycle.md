# Stage 11: Dispatch Execution + Trip Lifecycle Foundation

## Scope

Stage 11 adds runtime-safe dispatch execution records on top of the Stage 04-10 planning and readiness foundation.

Implemented areas:

- Executed trips created from planned trips
- Trip stops with runtime lifecycle state
- Trip events and dispatch action history
- Trip timeline aggregation
- Readiness validation before trip start
- Force-start support behind dedicated permission
- RBAC and audit coverage for execution APIs

Out of scope:

- Live GPS ingestion
- Traccar sync
- Tracking maps or geofence runtime
- Maintenance, fuel, payroll, reports, and frontend conversion

## New models

- `Trip`
- `TripStop`
- `TripEvent`
- `DispatchAction`

## New enums

- `TripStatus`
- `TripStopStatus`
- `TripEventType`
- `DispatchActionType`

## Lifecycle summary

Trip statuses:

- `SCHEDULED`
- `READY`
- `DISPATCHED`
- `STARTED`
- `ON_HOLD`
- `RESUMED`
- `COMPLETED`
- `CANCELLED`
- `FAILED`

Trip stop statuses:

- `PENDING`
- `ARRIVED`
- `COMPLETED`
- `SKIPPED`
- `FAILED`

## API summary

- `GET/POST /api/v1/admin/trips`
- `GET /api/v1/admin/trips/:tripId`
- `POST /api/v1/admin/trips/:tripId/start`
- `POST /api/v1/admin/trips/:tripId/hold`
- `POST /api/v1/admin/trips/:tripId/resume`
- `POST /api/v1/admin/trips/:tripId/complete`
- `POST /api/v1/admin/trips/:tripId/cancel`
- `POST /api/v1/admin/trips/:tripId/fail`
- `GET /api/v1/admin/trips/:tripId/stops`
- `PATCH /api/v1/admin/trips/:tripId/stops/:stopId`
- `POST /api/v1/admin/trips/:tripId/stops/reorder`
- `GET /api/v1/admin/trips/:tripId/timeline`

- `GET/POST /api/v1/admin/dispatch/actions`
- `GET /api/v1/admin/dispatch/actions/:dispatchActionId`

## Execution behavior

- Trips are created from `PlannedTrip` records and inherit planning references where available.
- Trip stops are seeded from the planned trip stop list at creation time.
- Starting a trip evaluates readiness profiles and assignment policy rules before the status moves to `STARTED`.
- Force start is blocked unless the caller has `trips:force-start`.
- Trip history is split into structured `TripEvent` and `DispatchAction` records so future live tracking can append telemetry without changing the core lifecycle model.
