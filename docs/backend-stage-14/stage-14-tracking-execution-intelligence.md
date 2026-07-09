# Stage 14: Tracking Execution Intelligence Foundation

## Scope

Stage 14 extends the Stage 12 and Stage 13 tracking foundation with runtime-safe execution intelligence:

- manual provider sync execution
- geofence runtime evaluation
- tracking evaluator run history
- trip and vehicle replay query APIs
- notification and escalation placeholders
- Traccar webhook and manual pull shells

This stage remains backend-only and does not add frontend map UI, maintenance, fuel, reports, payroll, or full notification delivery.

## Main additions

### Data model

Added:

- `GeofenceEvaluationRun`
- `GeofenceEvent`
- `TrackingEvaluationRun`
- `TrackingEvaluationItem`
- `TrackingNotificationRule`
- `TrackingNotificationEvent`

Added enums:

- `GeofenceEventType`
- `EvaluationRunStatus`
- `EvaluationItemStatus`
- `TrackingNotificationChannel`
- `TrackingNotificationEventStatus`

### Services

Added shared execution service:

- `apps/api/src/lib/tracking-execution.ts`

This service centralizes:

- provider payload normalization
- provider credential authentication
- normalized telemetry ingest reuse
- tracking alert creation
- placeholder notification event generation

### APIs

Added or extended:

- `POST /api/v1/admin/tracking-providers/:providerId/sync-runs/:syncRunId/run`
- `POST /api/v1/admin/tracking-providers/:providerId/sync-now`
- `POST /api/v1/admin/tracking-providers/:providerId/traccar/pull`
- `POST /api/v1/admin/geofences/evaluate`
- `GET /api/v1/admin/geofence-events`
- `GET /api/v1/admin/geofence-events/:eventId`
- `POST /api/v1/admin/tracking/evaluate`
- `GET /api/v1/admin/tracking/evaluation-runs`
- `GET /api/v1/admin/tracking/evaluation-runs/:runId`
- `GET /api/v1/admin/trips/:tripId/replay`
- `GET /api/v1/admin/trips/:tripId/positions`
- `GET /api/v1/admin/vehicles/:vehicleId/replay`
- `GET /api/v1/admin/tracking-notification-rules`
- `GET /api/v1/admin/tracking-notification-rules/:notificationRuleId`
- `POST /api/v1/admin/tracking-notification-rules`
- `PATCH /api/v1/admin/tracking-notification-rules/:notificationRuleId`
- `POST /api/v1/admin/tracking-notification-rules/:notificationRuleId/activate`
- `POST /api/v1/admin/tracking-notification-rules/:notificationRuleId/deactivate`
- `GET /api/v1/admin/tracking-notification-events`
- `GET /api/v1/admin/tracking-notification-events/:notificationEventId`
- `POST /api/v1/tracking/traccar/webhook`

## Security and tenancy

All new admin reads and writes remain organization-scoped:

- `SUPER_ADMIN` may access any organization
- normal users must pass tenant checks through `requireOrganizationAccess`
- `x-organization-id` remains the preferred tenant selector where needed

## Runtime behavior

### Sync runner

The sync runner is still manual, but now executes a real normalize-and-ingest flow. It is intentionally shaped so it can be called later by a background scheduler or worker.

### Geofence runtime

Current runtime logic supports:

- polygon evaluation
- latest position or selected position evaluation
- safe `ENTER` and `EXIT` state changes
- optional `INSIDE` and `OUTSIDE` snapshot emission

### Tracking evaluators

Current evaluator coverage:

- device offline
- stale position
- speed threshold
- ignition on/off state checks

### Replay

Replay APIs now expose replay-ready telemetry and position history without introducing any frontend coupling.

## Stage outcome

Stage 14 gives the backend a working execution intelligence layer that future alert delivery, scheduler jobs, dashboards, and live map views can consume without changing the core tracking data model again.
