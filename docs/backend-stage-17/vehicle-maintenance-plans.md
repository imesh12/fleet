# Vehicle Maintenance Plans

APIs:
- `GET /api/v1/admin/vehicles/:vehicleId/maintenance-plans`
- `POST /api/v1/admin/vehicles/:vehicleId/maintenance-plans`
- `GET /api/v1/admin/vehicles/:vehicleId/maintenance-plans/:planId`
- `PATCH /api/v1/admin/vehicles/:vehicleId/maintenance-plans/:planId`
- `POST /api/v1/admin/vehicles/:vehicleId/maintenance-plans/:planId/activate`
- `POST /api/v1/admin/vehicles/:vehicleId/maintenance-plans/:planId/deactivate`
- `POST /api/v1/admin/vehicles/:vehicleId/maintenance-plans/:planId/tasks`
- `PATCH /api/v1/admin/vehicles/:vehicleId/maintenance-plans/:planId/tasks/:taskId`
- `DELETE /api/v1/admin/vehicles/:vehicleId/maintenance-plans/:planId/tasks/:taskId`

Plans and tasks support due dates, due odometer, last completed timestamps, interval days, and interval kilometers.

