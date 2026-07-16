# Stage 33 - Frontend Tracking + Geofences + Alerts

Stage 33 implements tracking, provider/device, geofence, and alert frontend workflows using existing Stage 12-16 backend APIs.

Implemented:
- `/tracking/live` latest vehicle positions, health summary, filters, refresh, and safe auto-refresh.
- `/tracking/vehicles/[vehicleId]` vehicle tracking detail, history preview, and replay-ready position list.
- `/tracking/providers` provider CRUD.
- `/tracking/providers/[providerId]` provider health, credential metadata, sync runs, external devices, and device mappings.
- `/tracking/geofences` geofence CRUD, manual evaluation, and event list.
- `/tracking/geofences/[geofenceId]` geofence detail and ordered point metadata.
- `/tracking/alerts` alert rules, alert events, and evaluation run history.
- `/tracking/alerts/events/[alertEventId]` acknowledge, resolve, deliver, and escalate actions.

No backend changes were required.

Map approach:
- Full map rendering was deferred.
- Stage 33 uses map-ready coordinate panels and telemetry tables.
- No Google Maps key, legacy key, or proprietary map secret is used.
