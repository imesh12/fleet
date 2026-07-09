# Geofence Runtime Detection

## Purpose

Stage 14 adds backend runtime evaluation on top of stored geofence definitions from Stage 13.

## Models

- `GeofenceEvaluationRun`
- `GeofenceEvent`

## Event types

- `ENTER`
- `EXIT`
- `INSIDE`
- `OUTSIDE`

## Endpoint

- `POST /api/v1/admin/geofences/evaluate`

## Behavior

The current implementation:

- reads active polygon geofences
- evaluates latest or selected vehicle positions
- stores run history
- emits transition events safely

Default behavior prefers state-change events:

- first observation creates `INSIDE` or `OUTSIDE`
- state changes create `ENTER` or `EXIT`
- repeated `INSIDE` or `OUTSIDE` events are only emitted when `emitStateEvents` is enabled

## Sample request

```json
{
  "organizationId": "org_123",
  "vehicleId": "veh_123",
  "emitStateEvents": false
}
```

## Read APIs

- `GET /api/v1/admin/geofence-events`
- `GET /api/v1/admin/geofence-events/:eventId`

## Limitations

- polygon evaluation only
- no polyline runtime semantics yet
- no geofence alert delivery yet
- no background evaluation scheduler yet
