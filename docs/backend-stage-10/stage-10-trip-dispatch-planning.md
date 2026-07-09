# Stage 10: Trip and Dispatch Planning Foundation

## Scope

Stage 10 adds planning-only fleet operations on top of the Stage 04-09 tenant, vehicle, driver, route, and readiness foundation.

Implemented areas:

- Trip templates and template stops
- Planned trips and planned trip stops
- Dispatch queues and queue items
- Pre-dispatch validation using readiness profiles and assignment policies
- Safe planning status transitions
- RBAC and audit coverage for the new planning APIs

Out of scope:

- Live dispatch execution
- GPS ingestion or Traccar sync
- Runtime trip telemetry
- Maintenance, fuel, payroll, reports, and frontend conversion

## New models

- `TripTemplate`
- `TripTemplateStop`
- `PlannedTrip`
- `PlannedTripStop`
- `DispatchQueue`
- `DispatchQueueItem`

## New enums

- `PlannedTripStatus`
- `PlannedTripPriority`
- `DispatchQueueItemStatus`

## Status design

Planned trip statuses:

- `DRAFT`
- `PLANNED`
- `READY`
- `BLOCKED`
- `CANCELED`
- `DISPATCHED_PLACEHOLDER`

Dispatch queue item statuses:

- `DRAFT`
- `PLANNED`
- `READY`
- `BLOCKED`
- `HELD`
- `CANCELED`
- `DISPATCHED_PLACEHOLDER`

`DISPATCHED_PLACEHOLDER` exists only to prepare future runtime dispatch integration. It does not start execution.

## API summary

- `GET/POST /api/v1/admin/trip-templates`
- `GET/PATCH /api/v1/admin/trip-templates/:tripTemplateId`
- `POST /api/v1/admin/trip-templates/:tripTemplateId/activate`
- `POST /api/v1/admin/trip-templates/:tripTemplateId/deactivate`
- `POST/PATCH/DELETE /api/v1/admin/trip-templates/:tripTemplateId/stops...`
- `POST /api/v1/admin/trip-templates/:tripTemplateId/stops/reorder`

- `GET/POST /api/v1/admin/planned-trips`
- `GET/PATCH /api/v1/admin/planned-trips/:plannedTripId`
- `POST /api/v1/admin/planned-trips/:plannedTripId/status`
- `POST /api/v1/admin/planned-trips/:plannedTripId/cancel`
- `POST /api/v1/admin/planned-trips/:plannedTripId/assign`
- `POST /api/v1/admin/planned-trips/:plannedTripId/unassign`
- `POST/PATCH/DELETE /api/v1/admin/planned-trips/:plannedTripId/stops...`
- `POST /api/v1/admin/planned-trips/:plannedTripId/stops/reorder`

- `GET/POST /api/v1/admin/dispatch-queues`
- `GET/PATCH /api/v1/admin/dispatch-queues/:dispatchQueueId`
- `POST /api/v1/admin/dispatch-queues/:dispatchQueueId/activate`
- `POST /api/v1/admin/dispatch-queues/:dispatchQueueId/deactivate`
- `POST /api/v1/admin/dispatch-queues/:dispatchQueueId/items`
- `DELETE /api/v1/admin/dispatch-queues/:dispatchQueueId/items/:itemId`
- `POST /api/v1/admin/dispatch-queues/:dispatchQueueId/items/reorder`
- `POST /api/v1/admin/dispatch-queues/:dispatchQueueId/items/:itemId/status`

- `POST /api/v1/admin/dispatch/validate`

## Planning behavior

- Trip templates can reference `ServiceRoute` and `ServiceRouteTemplate`
- Planned trips can reference customer, route, route template, trip template, vehicle, driver, and assignment placeholders
- Planned trips auto-seed stops from the linked trip template, route template, or service route when available
- Dispatch queues organize planned trips without starting execution
- Validation combines readiness checks and assignment policy rules for pre-dispatch decisions
