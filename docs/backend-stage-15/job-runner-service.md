# Job Runner Service

## Service

- `apps/api/src/lib/background-jobs.ts`

## Responsibilities

- job registry by `BackgroundJobType`
- manual run execution
- run status transitions
- structured run logs
- safe error capture
- optional idempotency key reuse

## Current handlers

- tracking provider sync
- tracking evaluation
- geofence evaluation
- notification delivery
- cleanup expired invitations

## Future extension

This service is intentionally shaped so a later worker can call the same job registry while persisting runs in the same tables.
