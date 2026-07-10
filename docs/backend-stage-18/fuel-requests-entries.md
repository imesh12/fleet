# Fuel Requests + Entries

Fuel request APIs:
- `GET /api/v1/admin/fuel-requests`
- `POST /api/v1/admin/fuel-requests`
- `GET /api/v1/admin/fuel-requests/:id`
- `PATCH /api/v1/admin/fuel-requests/:id`
- `POST /api/v1/admin/fuel-requests/:id/approve`
- `POST /api/v1/admin/fuel-requests/:id/reject`
- `POST /api/v1/admin/fuel-requests/:id/cancel`
- `POST /api/v1/admin/fuel-requests/:id/fulfill`

Fuel entry APIs:
- `GET /api/v1/admin/fuel-entries`
- `POST /api/v1/admin/fuel-entries`
- `GET /api/v1/admin/fuel-entries/:id`
- `PATCH /api/v1/admin/fuel-entries/:id`
- `POST /api/v1/admin/fuel-entries/:id/approve`
- `POST /api/v1/admin/fuel-entries/:id/reject`
- `POST /api/v1/admin/fuel-entries/:id/cancel`
- `POST /api/v1/admin/fuel-entries/:id/archive`

Fuel entries store receipt metadata only. No file upload, accounting, reporting, or billing is implemented in this stage.

