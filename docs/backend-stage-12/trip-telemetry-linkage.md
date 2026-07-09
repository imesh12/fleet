# Trip Telemetry Linkage

## Current linkage behavior

Telemetry can link to a trip in two ways:

1. explicit `tripId` in the ingest payload
2. inferred active trip for the same organization and vehicle

## Active trip inference

When no `tripId` is supplied, the ingest pipeline looks for a trip for the same vehicle in one of these states:

- `READY`
- `DISPATCHED`
- `STARTED`
- `ON_HOLD`
- `RESUMED`

## Current scope

- links are stored on `VehiclePosition` and `VehicleTelemetryEvent`
- no route deviation logic yet
- no geofence logic yet
- no full trip event synthesis from telemetry yet

This keeps Stage 12 safe while preparing future replay, alerting, and map workflows.
