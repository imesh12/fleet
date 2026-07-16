# Frontend Redesign Roadmap

## Priority 1: Global Visual Foundation

- Scope: tokens, sidebar/topbar, page headers, status badges, tables, cards.
- Benefit: makes every page feel intentional and easier to scan.
- Likely files: `tailwind.config.ts`, `globals.css`, `Sidebar`, `Topbar`, `PageHeader`, `StatusBadge`, `SimpleTable`, `Card`.
- Risk: low if done as additive variants.
- Backend changes: none.

## Priority 2: Drivers, Vehicles, Dashboard

- Scope: driver profile/list, vehicle profile/list, dashboard urgency cards.
- Benefit: largest client-facing improvement; mirrors strongest legacy patterns.
- Likely files: fleet driver/vehicle pages, new `ProfileHeroCard`, `DriverAvatar`, `VehicleImageCard`, `EntitySummaryCard`, `ComplianceCard`.
- Risk: medium because detail pages have many subresources.
- Backend changes: none expected; image metadata can use existing file/attachment foundation later.

## Priority 3: Trips, Dispatch, Tracking

- Scope: route/stop timelines, validation panels, map-first tracking.
- Benefit: improves operational understanding and demo flow.
- Likely files: operations pages, tracking pages, `RouteStopTimeline`, `MapSidebarLayout`, `TrackingVehicleCard`.
- Risk: medium-high if Leaflet is introduced; keep map integration isolated.
- Backend changes: none expected.

## Priority 4: Maintenance, Fuel, Reports, Admin Polish

- Scope: due/overdue cards, fuel policy/tank signal cards, report gallery, admin density cleanup.
- Benefit: makes support modules less generic.
- Likely files: maintenance/fuel/reports/admin pages and shared cards.
- Risk: low-medium.
- Backend changes: none expected.
