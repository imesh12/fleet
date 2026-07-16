# Notifications And Escalations

Frontend route:
- `/admin/notifications`

Integrated APIs:
- `GET/POST/PATCH /api/v1/admin/notification-providers`
- `POST /api/v1/admin/notification-providers/:providerId/deactivate`
- `POST /api/v1/admin/notification-providers/:providerId/test-send`
- `GET/POST/PATCH /api/v1/admin/notification-templates`
- `GET /api/v1/admin/notification-deliveries`
- `POST /api/v1/admin/notification-deliveries/retry-due`
- `POST /api/v1/admin/notification-deliveries/:deliveryId/retry`
- `POST /api/v1/admin/notification-deliveries/:deliveryId/cancel`
- `GET/POST/PATCH /api/v1/admin/escalation-policies`
- `GET/POST /api/v1/admin/escalation-events`
- `POST /api/v1/admin/escalation-events/:eventId/acknowledge`
- `POST /api/v1/admin/escalation-events/:eventId/resolve`

Secret behavior:
- Provider config is rendered as masked config.
- The frontend does not expose stored SMTP, webhook, or provider credentials.
