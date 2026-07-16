# Legacy Page Inventory

Stage 38A inspected legacy HTML exports without reading protected secret-bearing files.

Protected files not inspected:

- `settings/websitesetting.html`
- `settings/smsconfig.html`
- `whatsapp_settings.html`

## Drivers

| Path | Purpose | Notable UI |
| --- | --- | --- |
| `drivers.html` | Driver list and card/grid management view | Table columns for photo, name, contact, license number, license expiry, status, action; card-grid driver presentation; reset-password form modal |
| `drivers/adddrivers.html` | Create driver and bulk import | Photo upload preview, form tabs, required personal/contact/license/payment fields, document upload metadata |
| `drivers/performance.html` | Driver scorecard/rankings | Info boxes, avatar table, performance breakdown, rankings |

Driver patterns to preserve: photo-first list cards, license expiry visibility, status badges, compact contact/license table columns, and a profile-card mental model.

## Vehicles

| Path | Purpose | Notable UI |
| --- | --- | --- |
| `vehicle.html` | Vehicle management list/card view | Table columns for vehicle, driver/fuel, group/owner, status/expiry, actions; card-grid toggle |
| `vehicle/addvehicle.html` | Create vehicle and bulk import | Vehicle image preview, tabbed form sections, registration/type/fuel/group/driver/model/manufacturer/chassis/engine fields |
| `vehicle/vehiclegroup.html` | Vehicle type/group management | Image-backed group rows, frontend booking visibility toggle |
| `vehicle/vehicleroute.html` | Route master list | Simple route table with add modal |

Vehicle patterns to preserve: registration-first visual hierarchy, image preview, driver/fuel grouped information, document/expiry warnings, and quick links into route/tracking/maintenance.

## Trips

| Path | Purpose | Notable UI |
| --- | --- | --- |
| `trips.html` | Trip list | Details/customer/route/vehicle/driver/status/action columns, status filters with pill badges, list/card controls |
| `trips/addtrips.html` | New booking/trip planning | Resource card, journey details card, pickup/drop/additional stops, odometer, documents, financial sections |
| `trips/details/*.html` | Trip detail | Driver profile card, route section, trip info, financial summary, map/geofence panel, payments/expenses/SMS/email modals |

Trip patterns to preserve: resource-first assignment display, route stop timeline, lifecycle/status action hierarchy, and timeline/history panels.

## Tracking

| Path | Purpose | Notable UI |
| --- | --- | --- |
| `tracking.html` | Historical tracking/replay filter screen | Vehicle select, date range, prominent track action, modal map container |
| `tracking/livestatus.html` | Live status dashboard | Map-first layout with compact top counters and white floating controls |

Tracking patterns to preserve: map-dominant layout, side/filter panel, clear stale/offline/live indicators, replay controls, and compact telemetry summaries.

## Related Modules

| Area | Representative paths | Useful patterns |
| --- | --- | --- |
| Maintenance | `maintenance/addmaintenance.html`, `maintenance/pms.html` | Sectioned service forms, checklist table, notification options, PMS interval cards |
| Fuel | `fuel/addfuel.html` | Vehicle/driver/fuel type/date/quantity/odometer/amount grouped form with tank/vendor toggle |
| Reports | `reports/driver_performance.html`, `reports/fuels.html` | Simple date/entity filter cards and single-action report generation |
| Geofence | `geofence/addgeofence.html`, `geofence/geofenceevents.html` | Map definition workflow, event history table, info boxes |
| Customers/Admin | `customer/addcustomer.html`, `users/adduser.html` | Permission matrix, notification preferences, compact form cards |
