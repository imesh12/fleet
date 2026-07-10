# Driver List And Detail

Routes:

- `/fleet/drivers`
- `/fleet/drivers/[driverId]`

Backend APIs:

- `GET /api/v1/admin/drivers`
- `GET /api/v1/admin/drivers/:driverId`
- `GET /api/v1/admin/drivers/:driverId/compliance-records`
- `GET /api/v1/admin/driver-vehicle-assignments?driverId=...&status=ACTIVE`

The detail page is read-only and shows an "Edit coming next stage" panel.
