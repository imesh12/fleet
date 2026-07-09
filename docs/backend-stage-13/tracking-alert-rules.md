# Tracking Alert Rules

## Models

- `TrackingAlertRule`
- `TrackingAlertEvent`

## Rule types

- `DEVICE_OFFLINE`
- `SPEED_THRESHOLD`
- `IGNITION_ON`
- `IGNITION_OFF`
- `STALE_POSITION`
- `TRIP_STARTED`
- `TRIP_COMPLETED`

## Current ingest evaluation

Stage 13 evaluates a limited safe subset during ingest:

- speed threshold crossing
- ignition on transition
- ignition off transition
- trip started linkage
- completed-trip telemetry visibility

Rules such as offline and stale position are stored for future scheduled evaluation.

## Event lifecycle

- `OPEN`
- `ACKNOWLEDGED`
- `RESOLVED`

## Admin behavior

- rules can be scoped by organization and optionally provider/vehicle
- events can be listed, acknowledged, and resolved
- write operations are audited
