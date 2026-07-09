# Notification Providers and Templates

## Providers

Providers define delivery endpoints and configuration by channel.

### Models

- `NotificationProvider`
- `NotificationTemplate`

### Channels

- `EMAIL`
- `WEBHOOK`
- `IN_APP`
- `SMS`

### Provider types

- `CONSOLE`
- `EMAIL`
- `WEBHOOK`
- `IN_APP`
- `SMS`

## APIs

### Providers

- `GET /api/v1/admin/notification-providers`
- `POST /api/v1/admin/notification-providers`
- `GET /api/v1/admin/notification-providers/:providerId`
- `PATCH /api/v1/admin/notification-providers/:providerId`
- `POST /api/v1/admin/notification-providers/:providerId/activate`
- `POST /api/v1/admin/notification-providers/:providerId/deactivate`
- `POST /api/v1/admin/notification-providers/:providerId/test-send`

### Templates

- `GET /api/v1/admin/notification-templates`
- `POST /api/v1/admin/notification-templates`
- `GET /api/v1/admin/notification-templates/:templateId`
- `PATCH /api/v1/admin/notification-templates/:templateId`
- `POST /api/v1/admin/notification-templates/:templateId/activate`
- `POST /api/v1/admin/notification-templates/:templateId/deactivate`

## Current implementation

- email uses the existing mailer package
- other channels use safe simulated delivery logging for now
