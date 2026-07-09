# Trackigniter8 API Design Draft

## Recommended Backend Stack
- Node.js 22+
- Fastify
- TypeScript
- PostgreSQL
- Prisma
- Redis
- JWT for API auth
- RBAC via role/permission middleware

## Why This Stack
This project is broad, form-heavy, and strongly relational. Fastify plus TypeScript gives a lightweight but structured API layer, Prisma keeps schema evolution manageable, PostgreSQL fits the operational and financial data well, and Redis is useful for sessions, queues, caching, and live-tracking fanout.

## Alternative Stack Comparison
- NestJS: better if the team wants stricter framework conventions, but heavier than needed for a phased rebuild.
- Laravel: closest to the legacy page/action style, but weaker fit with the preferred TypeScript-first future.
- Django: strong admin ecosystem, but less aligned with the requested Node stack and future shared DTOs.

## API Principles
- Prefix with `/api/v1`
- Resource-oriented routes
- Request/response validation at the boundary
- Central auth and permission hooks
- Audit logs for all writes
- Async jobs for imports, alerts, report exports, and tracking sync

## Auth APIs
- POST `/api/v1/auth/login`
- POST `/api/v1/auth/refresh`
- POST `/api/v1/auth/logout`
- POST `/api/v1/auth/forgot-password`
- POST `/api/v1/auth/reset-password`
- GET `/api/v1/auth/me`
- GET `/api/v1/auth/permissions`

## Dashboard APIs
- GET `/api/v1/dashboard/summary`
- GET `/api/v1/dashboard/fleet-status`
- GET `/api/v1/dashboard/recent-issues`
- GET `/api/v1/dashboard/geofence-activity`
- GET `/api/v1/dashboard/reminders`

## Vehicle APIs
- GET `/api/v1/vehicles`
- POST `/api/v1/vehicles`
- GET `/api/v1/vehicles/:vehicleId`
- PATCH `/api/v1/vehicles/:vehicleId`
- DELETE `/api/v1/vehicles/:vehicleId`
- POST `/api/v1/vehicles/import`
- GET `/api/v1/vehicle-groups`
- POST `/api/v1/vehicle-groups`
- PATCH `/api/v1/vehicle-groups/:groupId`
- GET `/api/v1/vehicle-routes`
- POST `/api/v1/vehicle-routes`
- GET `/api/v1/vehicle-vendors`
- POST `/api/v1/vehicle-vendors`
- GET `/api/v1/tyres`
- POST `/api/v1/tyres`

## Driver APIs
- GET `/api/v1/drivers`
- POST `/api/v1/drivers`
- GET `/api/v1/drivers/:driverId`
- PATCH `/api/v1/drivers/:driverId`
- POST `/api/v1/drivers/import`
- POST `/api/v1/drivers/:driverId/reset-password`
- GET `/api/v1/drivers/performance`

## Customer APIs
- GET `/api/v1/customers`
- POST `/api/v1/customers`
- GET `/api/v1/customers/:customerId`
- PATCH `/api/v1/customers/:customerId`

## Trip APIs
- GET `/api/v1/trips`
- POST `/api/v1/trips`
- GET `/api/v1/trips/:tripId`
- PATCH `/api/v1/trips/:tripId`
- GET `/api/v1/trips/:tripId/stops`
- POST `/api/v1/trips/:tripId/payments`
- POST `/api/v1/trips/:tripId/expenses`
- PATCH `/api/v1/trips/:tripId/expenses/:expenseId`
- POST `/api/v1/trips/:tripId/send-sms`
- POST `/api/v1/trips/:tripId/send-email`

## Dispatch APIs
- GET `/api/v1/dispatch/jobs`
- POST `/api/v1/dispatch/jobs`
- PATCH `/api/v1/dispatch/jobs/:jobId`
- POST `/api/v1/dispatch/jobs/:jobId/assign`

## Tracking APIs
- GET `/api/v1/tracking/live`
- GET `/api/v1/tracking/history`
- GET `/api/v1/tracking/vehicles/:vehicleId/positions`
- GET `/api/v1/tracking/devices`
- POST `/api/v1/tracking/devices`
- POST `/api/v1/tracking/providers/traccar/sync`
- POST `/api/v1/tracking/providers/traccar/webhook`

## Geofence And Route Planner APIs
- GET `/api/v1/geofences`
- POST `/api/v1/geofences`
- GET `/api/v1/geofences/:geofenceId`
- PATCH `/api/v1/geofences/:geofenceId`
- GET `/api/v1/geofence-events`
- GET `/api/v1/route-plans`
- POST `/api/v1/route-plans`
- GET `/api/v1/route-plans/:routePlanId`

## Maintenance APIs
- GET `/api/v1/maintenance`
- POST `/api/v1/maintenance`
- PATCH `/api/v1/maintenance/:maintenanceId`
- GET `/api/v1/maintenance/vendors`
- POST `/api/v1/maintenance/vendors`
- GET `/api/v1/mechanics`
- POST `/api/v1/mechanics`
- GET `/api/v1/pms-schedules`
- POST `/api/v1/pms-schedules`

## Fuel APIs
- GET `/api/v1/fuel-entries`
- POST `/api/v1/fuel-entries`
- GET `/api/v1/fuel-entries/:fuelEntryId`
- PATCH `/api/v1/fuel-entries/:fuelEntryId`

## Reminder APIs
- GET `/api/v1/reminders`
- POST `/api/v1/reminders`
- PATCH `/api/v1/reminders/:reminderId`
- GET `/api/v1/reminder-services`

## Accounts APIs
- GET `/api/v1/accounts`
- POST `/api/v1/accounts`
- GET `/api/v1/account-categories`
- POST `/api/v1/account-categories`
- GET `/api/v1/account-transactions`
- POST `/api/v1/account-transactions`
- POST `/api/v1/account-transfers`

## Stock And Payroll APIs
- GET `/api/v1/stock-items`
- POST `/api/v1/stock-items`
- GET `/api/v1/payroll/settlements`
- POST `/api/v1/payroll/settlements`

## Reports APIs
- GET `/api/v1/reports/bookings`
- GET `/api/v1/reports/drivers`
- GET `/api/v1/reports/fuel`
- GET `/api/v1/reports/geofence`
- GET `/api/v1/reports/maintenance`
- GET `/api/v1/reports/profitability`
- GET `/api/v1/reports/income-expense`
- GET `/api/v1/reports/top-income`
- GET `/api/v1/reports/top-expense`
- GET `/api/v1/reports/top-routes`
- GET `/api/v1/reports/top-vehicles`
- POST `/api/v1/reports/export`

## Settings APIs
- GET `/api/v1/settings/site`
- PATCH `/api/v1/settings/site`
- GET `/api/v1/settings/traccar`
- PATCH `/api/v1/settings/traccar`
- GET `/api/v1/settings/smtp`
- PATCH `/api/v1/settings/smtp`
- POST `/api/v1/settings/smtp/test`
- GET `/api/v1/settings/sms`
- PATCH `/api/v1/settings/sms`
- POST `/api/v1/settings/sms/test`
- GET `/api/v1/settings/email-templates`
- PATCH `/api/v1/settings/email-templates/:templateCode`
- GET `/api/v1/settings/sms-templates`
- PATCH `/api/v1/settings/sms-templates/:templateCode`
- GET `/api/v1/settings/alerts`
- PATCH `/api/v1/settings/alerts`

## Legacy Endpoint Hints Found In Export
- login/login_action
- Resetpassword/resetpasswordsave
- vehicle/insertvehicle
- vehicle/import_csv
- drivers/insertdriver
- drivers/import_csv
- customer/insertcustomer
- Trips/inserttrips
- maintenance/insertmaintenance
- maintenance/addmechanic
- maintenance/updatemechanic
- maintenance/addmaintenance_vendor
- maintenance/updatemaintenance_vendor
- maintenance/add_pms
- fuel/insertfuel
- geofence/geofence_save
- accounts/add
- accounts/update
- accounts/inserttransactions
- accounts/execute_transfer
- stockinventory/insertstockinventory
- users/insertuser
- reminder/insertreminder
- payroll/settle
- settings/websitesetting_save
- settings/traccarconfigsave
- settings/smtpconfigsave
- settings/smsconfigsave
- alerts/save_config

## Tracking Integration Recommendation
- Wrap Traccar in an integration service rather than coupling controllers directly to provider payloads
- Store provider credentials encrypted
- Normalize device and position payloads before persistence
- Make webhook and sync processing idempotent

## Recommended Build Order
1. auth, users, roles, permissions, settings
2. vehicles, drivers, customers, vendors, groups, routes
3. trips and dispatch
4. fuel, maintenance, reminders
5. tracking, geofences, route planner, Traccar integration
6. accounts, stock, payroll
7. reports, alerts, exports, communications
