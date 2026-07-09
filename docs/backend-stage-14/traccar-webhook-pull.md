# Traccar Webhook and Pull Shell

## Purpose

Stage 14 adds Traccar-facing shells on top of the Stage 13 adapter and the Stage 12 ingestion pipeline.

## Endpoints

- `POST /api/v1/tracking/traccar/webhook`
- `POST /api/v1/admin/tracking-providers/:providerId/traccar/pull`

## Webhook behavior

The webhook:

- authenticates with provider code, key id, and secret
- requires the provider to be `TRACCAR`
- normalizes payloads through the adapter
- reuses the shared tracking execution service

## Pull behavior

The pull endpoint is still manual and payload-driven:

- no live Traccar API dependency
- no scheduler
- creates a `TrackingProviderSyncRun`
- executes normalization and ingest

## Example headers

```text
x-tracking-provider-code: TRACCAR_MAIN
x-tracking-key-id: ingest-primary
x-tracking-api-key: your-provider-secret
```

## Example webhook body

```json
{
  "organizationId": "org_123",
  "devicePayloads": [],
  "positionPayloads": [
    {
      "id": 1001,
      "deviceId": 9001,
      "latitude": 35.6895,
      "longitude": 139.6917,
      "deviceTime": "2026-07-09T06:30:00.000Z"
    }
  ]
}
```
