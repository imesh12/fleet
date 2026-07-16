# Stage 32 Verification

Run:
- `npm.cmd run typecheck`
- `npm.cmd run build`

Manual checks:
- Open `/operations/routes`.
- Create/edit/toggle a service route.
- Open a route detail and manage stops.
- Create/edit/toggle a trip template.
- Open a trip template detail and manage stops.
- Open `/operations/trips`.
- Create/edit/cancel a planned trip.
- Open planned trip detail, assign/unassign vehicle/driver, run validation, manage stops, and create executed trip.
- Open executed trip detail and run lifecycle actions.
- Open `/operations/dispatch`.
- Create/edit/toggle a dispatch queue.
- Open queue detail, add/remove planned trips, update item status, and run validation.

Protected legacy files must remain untouched:
- `settings/websitesetting.html`
- `settings/smsconfig.html`
- `whatsapp_settings.html`
