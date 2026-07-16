# Maintenance Workflows

Integrated APIs:
- `GET/POST/PATCH /admin/maintenance-categories`
- `POST /admin/maintenance-categories/:id/activate`
- `POST /admin/maintenance-categories/:id/deactivate`
- `GET/POST/PATCH /admin/maintenance-service-tasks`
- `POST /admin/maintenance-service-tasks/:id/activate`
- `POST /admin/maintenance-service-tasks/:id/deactivate`
- `GET/POST/PATCH /admin/inspection-checklists`
- `POST /admin/inspection-checklists/:id/activate`
- `POST /admin/inspection-checklists/:id/deactivate`
- `GET /admin/maintenance/due`
- `GET/POST/PATCH /admin/maintenance-requests`
- `POST /admin/maintenance-requests/:id/cancel`
- `GET/POST/PATCH /admin/maintenance-work-orders`
- `POST /admin/maintenance-work-orders/:id/cancel`
- `POST/PATCH/DELETE /admin/maintenance-work-orders/:id/tasks/:taskId`

Work order task rows are read from the work-order detail payload because the backend exposes task mutations but not a separate task list endpoint.
