# Trip and Vehicle Replay

## Purpose

Stage 14 exposes replay-ready tracking queries for trips and vehicles without introducing any frontend assumptions.

## Endpoints

- `GET /api/v1/admin/trips/:tripId/replay`
- `GET /api/v1/admin/trips/:tripId/positions`
- `GET /api/v1/admin/vehicles/:vehicleId/replay`

## Query options

- `dateFrom`
- `dateTo`
- `limit`
- `order`
- `includeTelemetryEvents`
- `tripId` for vehicle replay

## Response intent

Replay APIs return ordered position history and optional telemetry event history so future map replay or trip diagnostics screens can use the backend as-is.

## Permission split

- `trip-replay:read`
- `vehicle-replay:read`

## Example

```text
GET /api/v1/admin/trips/trip_123/replay?order=asc&limit=500&includeTelemetryEvents=true
```
