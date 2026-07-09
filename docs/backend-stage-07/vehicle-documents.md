# Vehicle Documents

## Endpoints
- `GET /api/v1/admin/vehicles/:vehicleId/documents`
- `GET /api/v1/admin/vehicles/:vehicleId/documents/:documentId`
- `POST /api/v1/admin/vehicles/:vehicleId/documents`
- `PATCH /api/v1/admin/vehicles/:vehicleId/documents/:documentId`
- `POST /api/v1/admin/vehicles/:vehicleId/documents/:documentId/archive`
- `GET /api/v1/admin/vehicles/documents/expiring`

## Metadata Fields
- `documentType`
- `documentNumber`
- `issueDate`
- `expiryDate`
- `fileName`
- `fileUrl`
- `fileMimeType`
- `fileSizeBytes`
- `status`
- `notes`

## Notes
- Stage 07 stores metadata only
- there is no upload endpoint yet
- expiry reporting is query-based and supports `days`, `organizationId`, `vehicleId`, and `status`

## Sample cURL
```bash
curl -X POST http://localhost:3000/api/v1/admin/vehicles/<VEHICLE_ID>/documents \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <ORG_ID>" \
  -d '{
    "documentType": "INSURANCE",
    "documentNumber": "INS-2026-0001",
    "issueDate": "2026-01-01T00:00:00.000Z",
    "expiryDate": "2027-01-01T00:00:00.000Z",
    "fileName": "insurance.pdf",
    "fileUrl": "/files/vehicle/insurance.pdf"
  }'
```

```bash
curl "http://localhost:3000/api/v1/admin/vehicles/documents/expiring?organizationId=<ORG_ID>&days=45" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "x-organization-id: <ORG_ID>"
```
