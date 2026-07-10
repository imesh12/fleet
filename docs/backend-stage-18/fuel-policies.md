# Fuel Policies

Fuel policy APIs:
- `GET /api/v1/admin/fuel-policies`
- `POST /api/v1/admin/fuel-policies`
- `GET /api/v1/admin/fuel-policies/:id`
- `PATCH /api/v1/admin/fuel-policies/:id`
- `POST /api/v1/admin/fuel-policies/:id/activate`
- `POST /api/v1/admin/fuel-policies/:id/deactivate`
- `POST /api/v1/admin/fuel-policies/:id/rules`
- `PATCH /api/v1/admin/fuel-policies/:id/rules/:ruleId`
- `DELETE /api/v1/admin/fuel-policies/:id/rules/:ruleId`

Rule examples:
- `MAX_LITERS_PER_DAY`
- `MAX_AMOUNT_PER_TRANSACTION`
- `ALLOWED_FUEL_TYPE`
- `ODOMETER_REQUIRED`
- `RECEIPT_REQUIRED`
- `VEHICLE_ACTIVE`
- `DRIVER_ACTIVE`

Rules are metadata only in Stage 18. Enforcement is left for future runtime workflows.

