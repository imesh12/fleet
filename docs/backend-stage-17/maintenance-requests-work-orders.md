# Maintenance Requests + Work Orders

Maintenance requests:
- `GET /api/v1/admin/maintenance-requests`
- `POST /api/v1/admin/maintenance-requests`
- `GET /api/v1/admin/maintenance-requests/:id`
- `PATCH /api/v1/admin/maintenance-requests/:id`
- `POST /api/v1/admin/maintenance-requests/:id/cancel`

Maintenance work orders:
- `GET /api/v1/admin/maintenance-work-orders`
- `POST /api/v1/admin/maintenance-work-orders`
- `GET /api/v1/admin/maintenance-work-orders/:id`
- `PATCH /api/v1/admin/maintenance-work-orders/:id`
- `POST /api/v1/admin/maintenance-work-orders/:id/cancel`
- `POST /api/v1/admin/maintenance-work-orders/:id/tasks`
- `PATCH /api/v1/admin/maintenance-work-orders/:id/tasks/:taskId`
- `DELETE /api/v1/admin/maintenance-work-orders/:id/tasks/:taskId`

Planning statuses:
- `DRAFT`
- `REQUESTED`
- `APPROVED`
- `SCHEDULED`
- `IN_PROGRESS_PLACEHOLDER`
- `COMPLETED_PLACEHOLDER`
- `CANCELLED`

