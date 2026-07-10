# Vehicle Metadata Workflows

Vehicle detail page:
- `/fleet/vehicles/[vehicleId]`

Integrated APIs:
- `GET /admin/vehicles/:vehicleId/documents`
- `POST /admin/vehicles/:vehicleId/documents`
- `PATCH /admin/vehicles/:vehicleId/documents/:documentId`
- `POST /admin/vehicles/:vehicleId/documents/:documentId/archive`
- `GET /admin/vehicles/:vehicleId/devices`
- `POST /admin/vehicles/:vehicleId/devices`
- `PATCH /admin/vehicles/:vehicleId/devices/:deviceId`
- `POST /admin/vehicles/:vehicleId/devices/:deviceId/detach`
- `GET /admin/vehicles/:vehicleId/compliance-records`
- `POST /admin/vehicles/:vehicleId/compliance-records`
- `PATCH /admin/vehicles/:vehicleId/compliance-records/:complianceRecordId`
- `POST /admin/vehicles/:vehicleId/compliance-records/:complianceRecordId/archive`

Document workflows include metadata-only file fields:
- file name
- file URL/path
- MIME type
- file size

No physical upload is performed in this stage.
