# Status Badges

Added:

- `OperationalStatusBadge`
- `HealthStatusBadge`
- `humanizeStatus`
- `statusTone`

Existing `StatusBadge` now delegates to `OperationalStatusBadge`, so current pages inherit semantic display without route rewrites.

Mapped concepts include:

- Active, ready, online, valid, completed
- Draft, scheduled, pending, running, maintenance, due
- Cancelled, failed, expired, rejected, blocked, archived
- Stale, offline, inactive, suspended, detached, unmapped
- Dispatched, started, open, acknowledged

Status text remains visible and does not rely on color alone.
