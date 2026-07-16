# Browser Verification

## Environment

- API: `http://localhost:3000/api/v1`.
- Web: `http://localhost:3001`.
- Health endpoints checked:
  - `/api/v1/health/live`: `200`.
  - `/api/v1/health/ready`: `200`.
  - `/api/v1/health`: `200`.
- Web `/login`: `200`.

## Accounts Tested

| Account | Result | Notes |
| --- | --- | --- |
| `admin.demo@trackigniter8.local` | Pass | Login, `auth/me`, organization list, navigation, dashboard. |
| `manager01.demo@trackigniter8.local` | Pass | Login, `auth/me`, organization list, navigation, dashboard. |
| `staff01.demo@trackigniter8.local` | Pass | Login, `auth/me`, DEMO-TOKYO navigation. Admin organization listing correctly returned `403`. |
| `viewer01.demo@trackigniter8.local` | Pass | Login, `auth/me`, DEMO-TOKYO navigation. Admin organization listing correctly returned `403`. |

## Tenant Isolation

Admin scoped reads confirmed:

| Tenant | Vehicles | Drivers |
| --- | ---: | ---: |
| `DEMO-TOKYO` | 20 | 20 |
| `DEMO-OSAKA` | 0 | 0 |
| `DEMO-YOKOHAMA` | 0 | 0 |

This confirms the demo fleet data is scoped to DEMO-TOKYO and is not leaking into the smaller demo tenants through the tested vehicle/driver endpoints.

## Modules Covered By Automated Smoke

- Health.
- Login and `auth/me`.
- Navigation menu.
- Dashboard summary.
- Users.
- Organizations.
- Customer accounts.
- Vendors.
- Vehicles.
- Drivers.
- Planned trips.
- Dispatch queues.
- Tracking health.
- Maintenance due.
- Fuel alerts.
- Report definitions.
- Background jobs.
- Files.

## Browser Automation Status

The in-app browser runtime failed during setup with a kernel asset write error. Local Playwright, Playwright Test, Chrome, and Edge binaries were not available in the workspace/environment. Visual screenshots were therefore not captured in this pass.

