# Vehicle Compliance

## Endpoints
- `GET /api/v1/admin/vehicle-compliance-types`
- `GET /api/v1/admin/vehicle-compliance-types/:vehicleComplianceTypeId`
- `POST /api/v1/admin/vehicle-compliance-types`
- `PATCH /api/v1/admin/vehicle-compliance-types/:vehicleComplianceTypeId`
- `POST /api/v1/admin/vehicle-compliance-types/:vehicleComplianceTypeId/activate`
- `POST /api/v1/admin/vehicle-compliance-types/:vehicleComplianceTypeId/deactivate`
- `GET /api/v1/admin/vehicles/:vehicleId/compliance-records`
- `GET /api/v1/admin/vehicles/:vehicleId/compliance-records/:complianceRecordId`
- `POST /api/v1/admin/vehicles/:vehicleId/compliance-records`
- `PATCH /api/v1/admin/vehicles/:vehicleId/compliance-records/:complianceRecordId`
- `POST /api/v1/admin/vehicles/:vehicleId/compliance-records/:complianceRecordId/archive`
- `GET /api/v1/admin/vehicles/compliance-records/expiring`

## Example Types
- registration
- insurance
- roadworthiness
- emission
- inspection

## Sample cURL
```bash
curl -X POST http://localhost:3000/api/v1/admin/vehicle-compliance-types \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <ORG_ID>" \
  -d '{
    "organizationId": "<ORG_ID>",
    "name": "Insurance",
    "code": "insurance"
  }'
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/vehicles/<VEHICLE_ID>/compliance-records \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <ORG_ID>" \
  -d '{
    "vehicleComplianceTypeId": "<TYPE_ID>",
    "referenceNumber": "INS-2026-001",
    "expiryDate": "2027-01-01T00:00:00.000Z"
  }'
```
