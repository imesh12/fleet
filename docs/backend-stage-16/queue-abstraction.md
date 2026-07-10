# Queue Abstraction

Code:
- `apps/api/src/lib/queue.ts`

The queue layer exposes:
- `QueueProvider`
- `enqueue`
- `scheduleRecurring`
- `cancelRecurring`
- `registerQueueHandler`
- `executeQueuedJob`
- `executeReadyQueueJobs`

The current provider is in-memory for development and API-process manual execution. Its interface is intentionally compatible with a future Redis/BullMQ adapter.

Future adapter notes:
- Persist queued jobs in Redis.
- Register workers in a separate `apps/worker` process.
- Map `maxAttempts` and `backoffStrategy` to BullMQ retry options.

