# Driver Vehicle Assignments

## Endpoints
- `GET /api/v1/admin/driver-vehicle-assignments`
- `GET /api/v1/admin/driver-vehicle-assignments/:assignmentId`
- `POST /api/v1/admin/driver-vehicle-assignments`
- `PATCH /api/v1/admin/driver-vehicle-assignments/:assignmentId`
- `POST /api/v1/admin/driver-vehicle-assignments/:assignmentId/activate`
- `POST /api/v1/admin/driver-vehicle-assignments/:assignmentId/end`
- `POST /api/v1/admin/driver-vehicle-assignments/:assignmentId/cancel`

## Fields
- `organizationId`
- `driverId`
- `vehicleId`
- `assignmentType`
- `startDate`
- `endDate`
- `status`
- `notes`

## Note
- this stage provides assignment placeholders only
- no dispatch or trip execution logic is introduced
