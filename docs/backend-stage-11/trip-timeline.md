# Trip Timeline

## Endpoint

- `GET /api/v1/admin/trips/:tripId/timeline`

## Contents

The timeline combines:

- `TripEvent`
- `DispatchAction`

Each timeline item includes:

- `id`
- `kind`
- `happenedAt`
- serialized item payload

## Intended use

- execution audit trail
- operator review screens
- future dispatch dashboards
- later live-tracking enrichment without changing historical structure
