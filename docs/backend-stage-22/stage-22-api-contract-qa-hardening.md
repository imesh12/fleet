# Stage 22: API Contract + QA Hardening Foundation

Stage 22 prepares the backend for frontend integration by adding API contract placeholders, route inventory generation, permission coverage checks, seed verification, smoke testing, and response envelope consistency checks.

This stage is backend-only. It does not implement Inventory, Tyres, Consumables, Attendance, Payroll, Import/Export, Bulk Upload, Accounting, Billing, frontend screens, or export generation.

## Delivered

- OpenAPI skeleton at `/api/v1/openapi.json`.
- Documentation placeholder at `/api/v1/docs`.
- Route inventory generator for Markdown and JSON outputs.
- Permission coverage scanner for admin routes.
- Seed verification script.
- API smoke test script.
- Response envelope heuristic checker.
- Package scripts for repeatable QA checks.

## Generated Outputs

- `docs/api/route-inventory.md`
- `docs/api/route-inventory.json`
- `docs/api/permission-coverage.md`
- `docs/api/response-envelope-check.md`

## Protected Legacy Files

The Stage 22 work must not modify or re-add known secret-bearing legacy exports:

- `settings/websitesetting.html`
- `settings/smsconfig.html`
- `whatsapp_settings.html`
