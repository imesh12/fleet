# Full-Stack Verification

Representative verification areas:
- Login/logout and `/auth/me`
- Organization selection and `x-organization-id`
- Navigation menu and coming-soon entries
- Dashboard summaries
- Organizations, customer accounts, vendors
- Vehicles, drivers, metadata, attachments, compliance
- Routes, trips, dispatch
- Tracking providers, geofences, alerts, health
- Maintenance and fuel read/write workflows
- Reports and dashboard widgets
- Users, roles, permissions, settings, files, jobs, notifications

Automated coverage:
- `npm.cmd run api:smoke`
- `npm.cmd run web:routes`
- `npm.cmd run api:routes`
- `npm.cmd run api:permissions`
- `npm.cmd run api:verify-seed`
- `npm.cmd run api:response-check`
- `npm.cmd run api:openapi-check`

Manual QA should still click through destructive or state-changing actions in a QA database before production release.
