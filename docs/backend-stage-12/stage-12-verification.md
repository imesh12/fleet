# Stage 12 Verification

## Commands

```powershell
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_12_live_tracking_telemetry_foundation
npm.cmd run prisma:seed
npm.cmd run typecheck
npm.cmd run build
```

## Sample curl commands

```bash
curl -X POST http://localhost:3000/api/v1/admin/tracking-providers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <org_id>" \
  -d "{\"organizationId\":\"<org_id>\",\"name\":\"Primary Traccar\",\"code\":\"TRACCAR_MAIN\",\"providerType\":\"TRACCAR\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/tracking-providers/<provider_id>/credentials \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <org_id>" \
  -d "{\"name\":\"Ingest Key 01\",\"authType\":\"API_KEY\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/tracking/ingest \
  -H "Content-Type: application/json" \
  -H "x-tracking-provider-code: TRACCAR_MAIN" \
  -H "x-tracking-key-id: <key_id>" \
  -H "x-tracking-api-key: <plain_text_secret>" \
  -d "{\"organizationId\":\"<org_id>\",\"vehicleId\":\"<vehicle_id>\",\"latitude\":35.681236,\"longitude\":139.767125,\"speed\":42.5,\"providerTimestamp\":\"2026-07-09T05:00:00.000Z\"}"
```

```bash
curl http://localhost:3000/api/v1/admin/tracking/vehicles/latest \
  -H "Authorization: Bearer <token>" \
  -H "x-organization-id: <org_id>"
```

```bash
curl http://localhost:3000/api/v1/admin/tracking/health?staleMinutes=15 \
  -H "Authorization: Bearer <token>" \
  -H "x-organization-id: <org_id>"
```

## Checklist

- Create an organization-scoped tracking provider
- Create a provider credential and capture the returned plain-text secret
- Ingest a single telemetry event using provider headers
- Ingest a telemetry batch for the same organization
- Confirm history rows are created in `VehicleTelemetryEvent`
- Confirm the latest vehicle position is updated only by newer telemetry
- Confirm telemetry links to an explicit or inferred active trip when applicable
- Read latest positions and per-vehicle history through admin APIs
- Read tracking health and verify stale/offline calculations
- Confirm audit logs exist for provider writes, health reads, and ingest events
