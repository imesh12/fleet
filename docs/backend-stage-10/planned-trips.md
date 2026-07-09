# Planned Trips API

## Purpose

Planned trips are non-runtime trip records used for preparation, assignment, queueing, and validation.

## Endpoints

- `GET /api/v1/admin/planned-trips`
- `GET /api/v1/admin/planned-trips/:plannedTripId`
- `POST /api/v1/admin/planned-trips`
- `PATCH /api/v1/admin/planned-trips/:plannedTripId`
- `POST /api/v1/admin/planned-trips/:plannedTripId/status`
- `POST /api/v1/admin/planned-trips/:plannedTripId/cancel`
- `POST /api/v1/admin/planned-trips/:plannedTripId/assign`
- `POST /api/v1/admin/planned-trips/:plannedTripId/unassign`

Stop management:

- `POST /api/v1/admin/planned-trips/:plannedTripId/stops`
- `PATCH /api/v1/admin/planned-trips/:plannedTripId/stops/:stopId`
- `DELETE /api/v1/admin/planned-trips/:plannedTripId/stops/:stopId`
- `POST /api/v1/admin/planned-trips/:plannedTripId/stops/reorder`

## Filters

List supports:

- `organizationId`
- `search`
- `status`
- `customerAccountId`
- `vehicleId`
- `driverId`
- `plannedStartFrom`
- `plannedStartTo`
- pagination

## Key fields

- `organizationId`
- `customerAccountId`
- `serviceRouteId`
- `serviceRouteTemplateId`
- `tripTemplateId`
- `vehicleId`
- `driverId`
- `assignmentId`
- `title`
- `referenceCode`
- `plannedStartAt`
- `plannedEndAt`
- `status`
- `priority`
- `notes`

## Notes

- Planned trips are organization-scoped
- Vehicle, driver, customer, assignment, route, and template references must belong to the same organization
- `referenceCode` is unique per organization when provided
- Template-linked planned trips auto-copy initial stops
- `CANCELED` and `DISPATCHED_PLACEHOLDER` trips are treated as immutable for planning edits
- Every write is audit logged under `admin.planned_trip.*` or `admin.planned_trip_stop.*`
