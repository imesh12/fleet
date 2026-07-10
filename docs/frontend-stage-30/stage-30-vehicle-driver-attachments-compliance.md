# Stage 30 - Frontend Vehicle/Driver Attachments + Compliance Metadata

Stage 30 adds frontend metadata workflows to the existing vehicle and driver detail pages.

Implemented:
- Vehicle document metadata create/edit/archive.
- Vehicle device metadata create/edit/detach.
- Vehicle compliance record create/edit/archive.
- Driver skill assign/remove.
- Driver license create/edit/archive.
- Driver document metadata create/edit/archive.
- Driver compliance record create/edit/archive.
- Driver-to-vehicle assignment list/create/edit/activate/end/cancel.

Intentionally not implemented:
- Binary file upload.
- Live tracking runtime changes.
- Trips, maintenance runtime, fuel runtime, reports, payroll, inventory, billing, accounting, import/export, or bulk upload.
- Backend schema or route changes.

All workflows use the existing API client, bearer auth, and automatic `x-organization-id` behavior.
