# Notification Retry + Backoff

`NotificationDelivery` now includes:
- `maxAttempts`
- `nextAttemptAt`
- `failureReason`
- `providerResponse`

Existing attempt fields continue to be used:
- `attemptCount`
- `lastAttemptAt`

APIs:
- `POST /api/v1/admin/notification-deliveries/retry-due`
- `POST /api/v1/admin/notification-deliveries/:deliveryId/retry`
- `POST /api/v1/admin/notification-deliveries/:deliveryId/cancel`

Backoff is exponential in the service foundation and caps at one hour.

