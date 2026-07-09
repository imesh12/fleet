# External Device Mapping

## Purpose

External tracking providers usually identify devices differently from internal `VehicleDevice` and `Vehicle` records. Stage 13 adds a mapping layer for that mismatch.

## Models

- `ExternalTrackingDevice`
- `VehicleDeviceMapping`

## Workflow

1. provider device is discovered or upserted
2. internal admin maps it to a `Vehicle` and optional `VehicleDevice`
3. ingest can resolve the external identity through the mapping
4. unmapped or inactive states remain visible for later remediation

## API behavior

- external device list supports organization/provider/status/search filters
- upsert keeps discovery metadata fresh
- mappings support activate/deactivate/unmap workflows
- mapping validation enforces same-organization relationships
