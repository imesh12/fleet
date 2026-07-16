# Repository Inventory

## A. Active Application Source

- `apps/api` - Fastify API application.
- `apps/web` - Next.js frontend application.
- `packages/auth`
- `packages/config`
- `packages/db`
- `packages/errors`
- `packages/logger`
- `packages/mailer`
- `packages/queue`
- `packages/rbac`
- `packages/shared`
- `packages/tracking-providers`
- `packages/validation`

## B. Active Infrastructure / Configuration

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `tsconfig.base.json`
- `Dockerfile`
- `docker-compose.yml`
- `.env.example`
- `.env.production.example`
- `apps/web/.env.example`
- `apps/web/.env.production.example`
- `apps/web/Dockerfile`

## C. Active Documentation

- `README.md`
- `docs/backend-analysis`
- `docs/backend-stage-*`
- `docs/frontend-stage-*`
- `docs/release-stage-36`
- `docs/release-stage-37`
- `docs/api`

## D. Generated Artifacts

- `dist`
- `apps/web/.next`
- `node_modules`
- `docs/api/route-inventory.json`
- `docs/api/route-inventory.md`
- `docs/api/permission-coverage.md`
- `docs/api/response-envelope-check.md`
- `docs/frontend-stage-36/frontend-route-verification.*`

Generated artifacts should not be treated as legacy application source.

## E. Legacy HTML / Export Assets

Root-level legacy HTML exports:
- `accounts.html`
- `alerts.html`
- `attendance.html`
- `backup.html`
- `chat.html`
- `coupon.html`
- `customer.html`
- `dashboard.html`
- `dispatch.html`
- `drivers.html`
- `fuel.html`
- `geofence.html`
- `import.html`
- `incidents.html`
- `languages.html`
- `maintenance.html`
- `payroll.html`
- `reminder.html`
- `resetpassword.html`
- `route_planner.html`
- `stockinventory.html`
- `tracking.html`
- `trips.html`
- `tyres.html`
- `users.html`
- `vehicle.html`
- `vehiclevendors.html`

Legacy module folders:
- `accounts`
- `customer`
- `drivers`
- `fuel`
- `geofence`
- `login`
- `maintenance`
- `reminder`
- `reports`
- `settings`
- `stockinventory`
- `tracking`
- `trips`
- `users`
- `vehicle`
- `vehiclevendors`

## F. Sensitive Legacy Files

Known sensitive legacy paths:
- `settings/websitesetting.html`
- `settings/smsconfig.html`
- `whatsapp_settings.html`

These paths are ignored and should not be copied into a tracked archive without sanitization.

## G. Unknown / Manual Review

- Legacy HTML files outside the three known sensitive paths may still contain inline URLs, tokens, or vendor snippets.
- Legacy settings pages other than the protected three should be reviewed before archival.
- Any binary or asset folders added later should be scanned before tracking.
