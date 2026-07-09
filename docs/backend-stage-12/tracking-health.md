# Tracking Health

## Endpoint

- `GET /api/v1/admin/tracking/health`

## Response areas

- provider health snapshots
- device last seen summary
- vehicle latest position age
- stale/offline indicators

## Staleness

The endpoint accepts `staleMinutes` and marks providers, devices, and vehicles stale when the last seen timestamp exceeds that threshold.

## Provider health sources

- manual admin health updates
- automatic successful ingest updates

## Audit

Tracking health reads write `admin.tracking_health.read` audit entries.
