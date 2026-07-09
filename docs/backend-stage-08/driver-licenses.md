# Driver Licenses

## Endpoints
- `GET /api/v1/admin/drivers/:driverId/licenses`
- `GET /api/v1/admin/drivers/:driverId/licenses/:licenseId`
- `POST /api/v1/admin/drivers/:driverId/licenses`
- `PATCH /api/v1/admin/drivers/:driverId/licenses/:licenseId`
- `POST /api/v1/admin/drivers/:driverId/licenses/:licenseId/archive`
- `GET /api/v1/admin/drivers/licenses/expiring`

## Fields
- `licenseNumber`
- `licenseType`
- `issuingCountry`
- `issueDate`
- `expiryDate`
- `status`
- `notes`

## Sample cURL
```bash
curl -X POST http://localhost:3000/api/v1/admin/drivers/<DRIVER_ID>/licenses \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <ORG_ID>" \
  -d '{
    "licenseNumber": "DL-1234567",
    "licenseType": "HEAVY_VEHICLE",
    "issuingCountry": "JP",
    "issueDate": "2025-01-01T00:00:00.000Z",
    "expiryDate": "2028-01-01T00:00:00.000Z"
  }'
```
