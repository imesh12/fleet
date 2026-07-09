# Trips API

## Endpoints

- `GET /api/v1/admin/trips`
- `GET /api/v1/admin/trips/:tripId`
- `POST /api/v1/admin/trips`
- `POST /api/v1/admin/trips/:tripId/start`
- `POST /api/v1/admin/trips/:tripId/hold`
- `POST /api/v1/admin/trips/:tripId/resume`
- `POST /api/v1/admin/trips/:tripId/complete`
- `POST /api/v1/admin/trips/:tripId/cancel`
- `POST /api/v1/admin/trips/:tripId/fail`

## List filters

- `organizationId`
- `search`
- `status`
- `customerAccountId`
- `vehicleId`
- `driverId`
- `plannedTripId`
- `scheduledStartFrom`
- `scheduledStartTo`
- pagination fields

## Create trip

`POST /api/v1/admin/trips` creates an executed trip from a planned trip.

Request fields:

- `plannedTripId`
- `dispatchQueueItemId` optional
- `referenceCode` optional
- `note` optional

Behavior:

- validates organization access
- ensures a planned trip is not converted twice
- copies assignment, route, customer, and schedule references
- copies planned trip stops into `TripStop`
- writes `TripEvent.CREATED`
- writes `DispatchAction.DISPATCHED`

## Lifecycle endpoints

- `start` runs readiness evaluation and moves to `STARTED` or `FORCE_STARTED`
- `hold` moves to `ON_HOLD` and records a hold reason
- `resume` moves to `RESUMED`
- `complete` moves to `COMPLETED`
- `cancel` moves to `CANCELLED`
- `fail` moves to `FAILED`

## Response shape

Trip detail returns:

- trip summary fields
- customer, route, template, vehicle, driver, and assignment references
- ordered stops
- ordered events
- ordered dispatch actions
