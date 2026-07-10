# Worker Runner Service

Code:
- `apps/api/src/lib/worker-runner.ts`

The worker runner:
- Scans due active scheduled jobs.
- Locks job definitions with `lockedAt` and `lockedBy`.
- Enqueues jobs through the queue abstraction.
- Executes queued jobs immediately for API-driven manual runs.
- Updates `lastRunAt`, `nextRunAt`, and lock fields.

Handlers supported:
- `TRACKING_PROVIDER_SYNC`
- `TRACKING_EVALUATION`
- `GEOFENCE_EVALUATION`
- `NOTIFICATION_DELIVERY`
- `CLEANUP_EXPIRED_INVITATIONS`

