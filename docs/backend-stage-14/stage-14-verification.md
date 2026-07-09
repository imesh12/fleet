# Stage 14 Verification

## Commands run

Executed successfully:

- `npx.cmd prisma generate --schema packages/db/prisma/schema.prisma`
- `npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_14_tracking_execution_intelligence`
- `npm.cmd run prisma:seed`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Sample curl commands

### Run a provider sync immediately

```bash
curl -X POST "http://localhost:3000/api/v1/admin/tracking-providers/PROVIDER_ID/sync-now" \
  -H "Authorization: Bearer ADMIN_JWT" \
  -H "x-organization-id: ORG_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "providerType": "TRACCAR",
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
  }'
```

### Evaluate geofences

```bash
curl -X POST "http://localhost:3000/api/v1/admin/geofences/evaluate" \
  -H "Authorization: Bearer ADMIN_JWT" \
  -H "x-organization-id: ORG_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": "VEHICLE_ID",
    "emitStateEvents": false
  }'
```

### Run tracking evaluators

```bash
curl -X POST "http://localhost:3000/api/v1/admin/tracking/evaluate" \
  -H "Authorization: Bearer ADMIN_JWT" \
  -H "x-organization-id: ORG_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "staleMinutes": 15,
    "offlineMinutes": 60
  }'
```

### Read a trip replay

```bash
curl "http://localhost:3000/api/v1/admin/trips/TRIP_ID/replay?order=asc&limit=500&includeTelemetryEvents=true" \
  -H "Authorization: Bearer ADMIN_JWT"
```

### Send a Traccar webhook payload

```bash
curl -X POST "http://localhost:3000/api/v1/tracking/traccar/webhook" \
  -H "x-tracking-provider-code: TRACCAR_MAIN" \
  -H "x-tracking-key-id: ingest-primary" \
  -H "x-tracking-api-key: PROVIDER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "ORG_ID",
    "positionPayloads": [
      {
        "id": 1001,
        "deviceId": 9001,
        "latitude": 35.6895,
        "longitude": 139.6917,
        "deviceTime": "2026-07-09T06:30:00.000Z"
      }
    ]
  }'
```

## Verification checklist

- migration applied and Prisma client regenerated
- seed completed and new permissions attached to default roles
- typecheck passed
- build passed
- replay endpoints compile and are registered
- sync runner execution compiles against the shared ingest service
- Traccar webhook shell compiles against the Stage 13 adapter
