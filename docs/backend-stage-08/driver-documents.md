# Driver Documents

## Endpoints
- `GET /api/v1/admin/drivers/:driverId/documents`
- `GET /api/v1/admin/drivers/:driverId/documents/:documentId`
- `POST /api/v1/admin/drivers/:driverId/documents`
- `PATCH /api/v1/admin/drivers/:driverId/documents/:documentId`
- `POST /api/v1/admin/drivers/:driverId/documents/:documentId/archive`
- `GET /api/v1/admin/drivers/documents/expiring`

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

## Note
- Stage 08 stores metadata only
- file upload remains out of scope
