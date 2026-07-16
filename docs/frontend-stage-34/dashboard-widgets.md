# Dashboard Widgets

Integrated APIs:
- `GET /admin/dashboard/summary`
- `GET /admin/dashboard/widgets`
- `POST /admin/dashboard/widgets`
- `PATCH /admin/dashboard/widgets/:id`

Dashboard behavior:
- Requires selected organization context.
- Shows vehicle, driver, trip, maintenance, fuel, tracking health, and alert summary cards.
- Renders active widget definitions sorted by `position`.
- Unsupported widget types fall back to a generic summary card.
- Supports manual refresh and safe 60-second auto-refresh.
