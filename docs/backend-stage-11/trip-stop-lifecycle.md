# Trip Stop Lifecycle

## Endpoints

- `GET /api/v1/admin/trips/:tripId/stops`
- `PATCH /api/v1/admin/trips/:tripId/stops/:stopId`
- `POST /api/v1/admin/trips/:tripId/stops/reorder`

## Supported stop states

- `PENDING`
- `ARRIVED`
- `COMPLETED`
- `SKIPPED`
- `FAILED`

## Stop update behavior

Allowed updates:

- `status`
- `note`
- `actualArrivalAt`
- `actualDepartureAt`

Convenience behavior:

- moving a stop to `ARRIVED` auto-populates `actualArrivalAt` when missing
- moving a stop to `COMPLETED` auto-populates `actualDepartureAt` when missing
- note-only updates create a trip event for timeline visibility

## Reordering rules

- Stops can be reordered only before the trip starts.
- Reorder requests must include every trip stop exactly once.
- Reorder writes a `TripEvent.STOP_REORDERED` audit-friendly event.
