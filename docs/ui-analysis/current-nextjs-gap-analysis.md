# Current Next.js Gap Analysis

## Current Strengths

- Backend-connected app shell exists.
- Organization context and `x-organization-id` behavior are implemented.
- Navigation respects coming-soon state.
- CRUD and metadata patterns exist.
- Vehicle, driver, trip, tracking, maintenance, fuel, report, and admin pages are broad and functional.
- Design already avoids default corporate blandness with `ink`, `cream`, `linen`, `ember`, and `moss`.

## Main Gaps

- Many detail pages still feel data-structure-first rather than operator-first.
- `MetadataManager` is useful but visually generic when overused.
- Driver and vehicle image/profile hierarchy is missing.
- Status colors are too broad: many operational states collapse into neutral.
- Tracking is map-ready but not map-first.
- Trip route/stops need a timeline visualization.
- Dashboard cards show data but lack fleet-specific prioritization and alert urgency.

## Module Notes

| Module | Strength | Gap | Legacy Pattern To Modernize |
| --- | --- | --- | --- |
| Dashboard | Connected widgets and summaries | Needs operational urgency | Info-box style metric hierarchy |
| Drivers | Detail/subresource workflows exist | Missing avatar hero/profile feel | Photo-first driver card/profile |
| Vehicles | Documents/devices/compliance workflows exist | Missing image/registration hero | Vehicle card with driver/fuel/status grouping |
| Trips | Planning/execution pages exist | Route progress not visual enough | Stop timeline and status workflow |
| Dispatch | Queue workflows exist | Needs readiness/action hierarchy | Validation before dispatch, grouped queue cards |
| Tracking | Latest/history data present | No real map panel yet | Map-first live tracking |
| Maintenance | Workflows exist | Needs due/overdue visual priority | Checklist and due cards |
| Fuel | Workflows exist | Needs policy/tank/card signal cards | Tank/vendor toggle and amount/odometer prominence |
| Reports | Definitions/runs/exports exist | Needs client-friendly report gallery | Simple filter cards |
| Admin | Broad coverage | Dense admin pages can remain utilitarian | Permission matrix and masked secrets |

## Patterns To Avoid

- Old jQuery modals and inline event handlers.
- AdminLTE class dependency.
- Exposed remote resources and unsafe settings.
- Dense tables without mobile consideration.
