# Geofence Definitions

## Purpose

Stage 13 stores geofence definitions without enabling runtime detection yet.

## Models

- `Geofence`
- `GeofencePoint`

## Supported geometry types

- `POLYGON`
- `POLYLINE`

## API behavior

- create and update organization-scoped geofences
- activate or deactivate a geofence definition
- add, edit, delete, and reorder points
- return points ordered by sequence

## Out of scope

- enter/exit detection
- dwell logic
- trip/geofence analytics
- frontend map drawing tools
