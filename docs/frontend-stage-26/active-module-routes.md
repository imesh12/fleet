# Active Module Routes

## Admin/Core

- `/admin/users` -> `GET /api/v1/admin/users`
- `/admin/roles` -> `GET /api/v1/admin/roles`
- `/admin/permissions` -> `GET /api/v1/admin/permissions`
- `/admin/organizations` -> `GET /api/v1/admin/organizations`
- `/admin/customers` -> `GET /api/v1/admin/customer-accounts`
- `/admin/vendors` -> `GET /api/v1/admin/vendors`
- `/admin/settings` -> `GET /api/v1/admin/settings`

## Fleet

- `/fleet/vehicles` -> `GET /api/v1/admin/vehicles`
- `/fleet/drivers` -> `GET /api/v1/admin/drivers`
- `/fleet/assignments` -> `GET /api/v1/admin/driver-vehicle-assignments`

## Operations

- `/operations/trips` -> `GET /api/v1/admin/trips`
- `/operations/dispatch` -> `GET /api/v1/admin/dispatch-queues`
- `/operations/routes` -> `GET /api/v1/admin/service-routes`

## Tracking

- `/tracking/live` -> `GET /api/v1/admin/tracking/vehicles/latest`
- `/tracking/providers` -> `GET /api/v1/admin/tracking-providers`
- `/tracking/geofences` -> `GET /api/v1/admin/geofences`
- `/tracking/alerts` -> `GET /api/v1/admin/tracking-alert-events`

## Maintenance/Fuel/Reports

- `/maintenance` -> `GET /api/v1/admin/maintenance/due`
- `/fuel` -> `GET /api/v1/admin/fuel-entries`
- `/reports` -> `GET /api/v1/admin/report-definitions`
