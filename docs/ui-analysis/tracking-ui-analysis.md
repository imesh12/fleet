# Tracking UI Analysis

## Legacy Findings

- Tracking is map-first.
- Historical tracking uses vehicle select, date range, and a dominant Track button.
- Live status uses compact counters and floating map controls.
- Vehicle status is communicated through color and proximity to map/list context.
- Tracking pages depend on old scripts and must not be copied directly.

## Recommended Map Strategy

Use either:

- Leaflet with OpenStreetMap for fastest implementation and no paid API key.
- MapLibre if vector tiles, styling control, or provider flexibility becomes important.

Recommended now: Leaflet with OpenStreetMap for Stage 38B/39 implementation speed.

## Modern Tracking Layout

- Desktop: `MapSidebarLayout` with 65-70% map, 30-35% sidebar.
- Sidebar: search, filters, vehicle cards, status counts, stale/offline filters.
- Map: markers colored by active/stale/offline/alert state.
- Detail drawer/card: vehicle, driver, speed, heading, ignition, battery, odometer, provider timestamp, last seen age.
- Replay: date range, trip selector, speed control placeholder, ordered position list.

## Safety

- Do not use Google API keys from legacy HTML.
- Do not copy inline tracking scripts.
- Never render credential secret values.

## Component Needs

- `MapSidebarLayout`: new.
- `TrackingVehicleCard`: new.
- `CoordinateDisplay`: reuse.
- `TelemetryTable`: reuse.
- `HealthIndicator`: reuse/extend.
- `AutoRefreshControl`: reuse.
