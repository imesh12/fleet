# Vehicle List And Detail

Routes:

- `/fleet/vehicles`
- `/fleet/vehicles/[vehicleId]`

Backend APIs:

- `GET /api/v1/admin/vehicles`
- `GET /api/v1/admin/vehicles/:vehicleId`
- `GET /api/v1/admin/vehicles/:vehicleId/compliance-records`
- `GET /api/v1/admin/maintenance/due?vehicleId=...`
- `GET /api/v1/admin/tracking/vehicles/:vehicleId/latest`

The detail page is read-only and shows an "Edit coming next stage" panel.
