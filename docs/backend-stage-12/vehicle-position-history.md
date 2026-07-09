# Vehicle Position History

## Latest position storage

`VehiclePosition` stores the current latest position per vehicle.

Rules:

- one current row per vehicle
- newer provider timestamps replace current latest position
- older delayed telemetry still goes into history without overwriting current state

## History storage

`VehicleTelemetryEvent` stores append-only telemetry history.

Use cases prepared by this model:

- trip replay foundation
- future route deviation checks
- device troubleshooting
- alert/event enrichment
- map-ready vehicle history APIs

## Read APIs

- `GET /api/v1/admin/tracking/vehicles/latest`
- `GET /api/v1/admin/tracking/vehicles/:vehicleId/latest`
- `GET /api/v1/admin/tracking/vehicles/:vehicleId/history`

Supported filters:

- organization
- vehicle
- trip
- tracking provider
- event type
- provider timestamp range
- pagination
