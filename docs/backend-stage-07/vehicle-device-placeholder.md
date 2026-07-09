# Vehicle Device Placeholder

## Purpose
`VehicleDevice` prepares the schema and API surface for future GPS and Traccar integration without introducing live telemetry in Stage 07.

## Endpoints
- `GET /api/v1/admin/vehicles/:vehicleId/devices`
- `GET /api/v1/admin/vehicles/:vehicleId/devices/:deviceId`
- `POST /api/v1/admin/vehicles/:vehicleId/devices`
- `PATCH /api/v1/admin/vehicles/:vehicleId/devices/:deviceId`
- `POST /api/v1/admin/vehicles/:vehicleId/devices/:deviceId/deactivate`
- `POST /api/v1/admin/vehicles/:vehicleId/devices/:deviceId/detach`

## Fields
- `provider`
- `externalDeviceId`
- `imei`
- `serialNumber`
- `status`
- `installedAt`
- `removedAt`
- `metadata`

## Notes
- device metadata is organization-safe through vehicle ownership
- `vehicleId + externalDeviceId` must be unique
- detach sets `status = DETACHED` and records `removedAt` if it was not already set

## Sample cURL
```bash
curl -X POST http://localhost:3000/api/v1/admin/vehicles/<VEHICLE_ID>/devices \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <ORG_ID>" \
  -d '{
    "provider": "TRACCAR",
    "externalDeviceId": "device-1001",
    "imei": "356938035643809",
    "installedAt": "2026-07-09T00:00:00.000Z",
    "metadata": {
      "simNumber": "SIM-001",
      "installBay": "Bay A"
    }
  }'
```
