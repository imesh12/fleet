# Stage 32 - Frontend Trips + Dispatch + Routes Workflows

Stage 32 implements frontend workflows for operations routing, trip planning, dispatch queues, and executed trip lifecycle using existing backend APIs.

Implemented:
- `/operations/routes` workflow dashboard.
- `/operations/routes/[routeId]` service route detail and stop metadata management.
- `/operations/trip-templates/[templateId]` trip template detail and stop metadata management.
- `/operations/trips` planned and executed trips workflow dashboard.
- `/operations/trips/[tripId]` planned trip detail with assignment, validation, cancellation, stops, and executed-trip creation.
- `/operations/trips/executed/[executedTripId]` executed trip lifecycle detail.
- `/operations/dispatch` dispatch queue dashboard.
- `/operations/dispatch/[queueId]` dispatch queue detail with queue items and validation.

No backend changes were required.

Out of scope:
- Live tracking/map UI.
- Runtime GPS ingestion changes.
- Skipped manager modules.
- Full drag-and-drop reordering. Sequence metadata is editable where practical.
