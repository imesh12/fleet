# Tracking Sync Runner

## Purpose

Stage 14 upgrades provider sync runs from placeholder records into executable manual runs.

## Endpoints

- `POST /api/v1/admin/tracking-providers/:providerId/sync-runs/:syncRunId/run`
- `POST /api/v1/admin/tracking-providers/:providerId/sync-now`
- `POST /api/v1/admin/tracking-providers/:providerId/traccar/pull`

## Flow

1. Validate tenant access.
2. Load the tracking provider.
3. Normalize payloads through the provider adapter.
4. Create sync item placeholders for devices and positions.
5. Reuse the shared tracking execution service to ingest normalized data.
6. Update run and item status to `COMPLETED` or `FAILED`.

## Request shape

Manual execution supports payload-driven requests so local development does not depend on a live provider:

```json
{
  "providerType": "TRACCAR",
  "devicePayloads": [],
  "positionPayloads": [
    {
      "id": 1001,
      "deviceId": 9001,
      "latitude": 35.6895,
      "longitude": 139.6917,
      "speed": 45,
      "deviceTime": "2026-07-09T06:30:00.000Z"
    }
  ]
}
```

## Audit actions

- `admin.tracking_sync.run`
- `admin.tracking_sync.sync_now`
- `admin.traccar.pull`

## Notes

- No scheduler was added in Stage 14.
- No live Traccar dependency is required.
- The execution service is reusable for a future job runner.
