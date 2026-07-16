# Stage 31 - Frontend Maintenance + Fuel Workflows

Stage 31 replaces the Maintenance and Fuel shell pages with frontend workflows backed by existing Stage 17 and Stage 18 APIs.

Implemented:
- Maintenance workflow dashboard at `/maintenance`.
- Maintenance request detail at `/maintenance/requests/[requestId]`.
- Maintenance work order detail at `/maintenance/work-orders/[workOrderId]`.
- Fuel workflow dashboard at `/fuel`.
- Fuel request detail at `/fuel/requests/[requestId]`.
- Fuel entry detail at `/fuel/entries/[entryId]`.

No backend changes were required.

Out of scope:
- Binary file upload.
- Mechanic execution workflow.
- Inventory, tyres, payroll, billing, accounting, import/export, and bulk upload.
- Maintenance/fuel reporting exports.
