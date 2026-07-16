# Report Runs And Exports

Integrated APIs:
- `GET /admin/report-runs`
- `POST /admin/report-runs`
- `GET /admin/report-export-jobs`
- `POST /admin/report-export-jobs`

Frontend behavior:
- Users can create report run placeholders.
- Users can create export placeholder jobs in JSON, CSV, Excel placeholder, or PDF placeholder formats.
- Run and export detail pages inspect recent run/export history.

Backend note:
- Direct `GET /admin/report-runs/:id` and `GET /admin/report-export-jobs/:id` do not currently exist, so detail pages use the recent list result and show a clear not-found state if the item is outside that result window.
