# Tracking Ingestion API

## Endpoint

- `POST /api/v1/tracking/ingest`

## Authentication

Headers:

- `x-tracking-provider-code`
- `x-tracking-key-id`
- `x-tracking-api-key`

Optional alternative:

- `Authorization: Bearer <secret>`

## Payload shapes

Single event:

```json
{
  "organizationId": "org_id",
  "vehicleId": "vehicle_id",
  "latitude": 35.681236,
  "longitude": 139.767125,
  "speed": 42.5,
  "providerTimestamp": "2026-07-09T05:00:00.000Z"
}
```

Batch:

```json
{
  "events": [
    {
      "organizationId": "org_id",
      "externalDeviceId": "gps-001",
      "latitude": 35.681236,
      "longitude": 139.767125,
      "providerTimestamp": "2026-07-09T05:00:00.000Z"
    }
  ]
}
```

## Supported event fields

- `organizationId`
- `vehicleId`
- `vehicleDeviceId`
- `externalDeviceId`
- `trackingProviderId`
- `tripId`
- `providerEventId`
- `latitude`
- `longitude`
- `speed`
- `heading`
- `altitude`
- `accuracy`
- `ignition`
- `battery`
- `odometer`
- `eventType`
- `providerTimestamp`
- `rawPayload`

## Validation behavior

- all events in a batch must belong to one organization
- provider and credential must be active
- vehicle and device must belong to the provider organization
- device provider string must match the tracking provider code
- explicit trip linkage must belong to the same organization and compatible vehicle context
