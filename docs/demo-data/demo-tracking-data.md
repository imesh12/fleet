# Demo Tracking Data

Tracking seed data uses provider-neutral Stage 12-16 models.

Included:

- 2 tracking providers.
- Credential metadata with non-real placeholders only.
- Provider health rows.
- 20 external tracking devices.
- 20 vehicle-device mappings.
- Provider sync run/items.
- 20 tracking alert rules.
- 60 alert events.
- 15 geofences with polygon points.
- Geofence evaluation run/events.
- 20 latest vehicle positions.
- 8,000 historical telemetry events.

Important schema note:

`VehiclePosition` is the latest-position table and has a unique constraint on `vehicleId`. Historical replay data is therefore seeded into `VehicleTelemetryEvent`.

The telemetry path is deterministic, using Tokyo-area route interpolation rather than random coordinates.
