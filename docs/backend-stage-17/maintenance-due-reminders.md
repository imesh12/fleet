# Maintenance Due + Reminders

APIs:
- `GET /api/v1/admin/maintenance/due`
- `GET /api/v1/admin/vehicles/:vehicleId/maintenance/due`

Query options:
- `organizationId`
- `daysAhead`
- `odometerAheadKm`
- `createNotifications`
- `notificationProviderId`
- `notificationRecipient`

Due output includes:
- plan/task identifiers
- due status: `OVERDUE`, `DUE`, or `UPCOMING`
- due date
- due odometer
- current vehicle odometer
- summary counts

Notification deliveries are placeholders using the existing notification foundation and are only created when explicitly requested.

