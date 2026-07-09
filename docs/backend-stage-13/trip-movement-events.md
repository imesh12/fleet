# Trip Movement Events

## Current synthesized events

During tracking ingest, Stage 13 can write:

- `TELEMETRY_RECEIVED`
- `MOVEMENT_STARTED`
- `MOVEMENT_STOPPED`

## Trigger behavior

- first telemetry for a linked trip creates `TELEMETRY_RECEIVED`
- moving from near-zero speed to active movement creates `MOVEMENT_STARTED`
- dropping from active movement to near-zero speed creates `MOVEMENT_STOPPED`

## Intent

This is a lightweight runtime signal layer for future trip analytics, dispatcher tooling, and alerting without introducing full movement analytics yet.
