# Stage 13 Verification

## Commands

```powershell
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_13_traccar_adapter_tracking_rules
npm.cmd run prisma:seed
npm.cmd run typecheck
npm.cmd run build
```

## Sample curl commands

```bash
curl -X POST http://localhost:3000/api/v1/admin/tracking/external-devices \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <org_id>" \
  -d "{\"organizationId\":\"<org_id>\",\"trackingProviderId\":\"<provider_id>\",\"externalDeviceId\":\"traccar-1001\",\"name\":\"Truck GPS 1001\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/tracking/device-mappings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <org_id>" \
  -d "{\"organizationId\":\"<org_id>\",\"trackingProviderId\":\"<provider_id>\",\"externalTrackingDeviceId\":\"<external_device_id>\",\"vehicleId\":\"<vehicle_id>\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/tracking-providers/<provider_id>/sync-runs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <org_id>" \
  -d "{\"runType\":\"MANUAL_DEVICE_DISCOVERY\",\"status\":\"PENDING\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/tracking-alert-rules \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <org_id>" \
  -d "{\"organizationId\":\"<org_id>\",\"name\":\"Speed 80\",\"code\":\"SPEED_80\",\"ruleType\":\"SPEED_THRESHOLD\",\"severity\":\"high\",\"condition\":{\"speedThreshold\":80}}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/geofences \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <org_id>" \
  -d "{\"organizationId\":\"<org_id>\",\"name\":\"Depot A\",\"code\":\"DEPOT_A\",\"geofenceType\":\"POLYGON\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/tracking/ingest \
  -H "Content-Type: application/json" \
  -H "x-tracking-provider-code: TRACCAR_MAIN" \
  -H "x-tracking-key-id: <key_id>" \
  -H "x-tracking-api-key: <secret>" \
  -d "{\"organizationId\":\"<org_id>\",\"providerType\":\"TRACCAR\",\"positionPayloads\":[{\"id\":1,\"deviceId\":\"traccar-1001\",\"latitude\":35.681236,\"longitude\":139.767125,\"speed\":88,\"deviceTime\":\"2026-07-09T06:00:00.000Z\",\"attributes\":{\"ignition\":true,\"event\":\"position\"}}]}"
```

## Checklist

- normalize a Traccar-style payload through `/tracking/ingest`
- confirm discovered external device upsert
- map the external device to a vehicle or vehicle device
- re-ingest telemetry and confirm mapping-based vehicle resolution
- create a manual sync run and sync item
- create a speed threshold rule and trigger it through ingest
- acknowledge and resolve a tracking alert event
- create a geofence and manage its point sequence
- confirm trip movement events appear when telemetry crosses movement thresholds
