# Dispatch Queues API

## Purpose

Dispatch queues stage planned trips for later runtime dispatch without starting real execution.

## Endpoints

- `GET /api/v1/admin/dispatch-queues`
- `GET /api/v1/admin/dispatch-queues/:dispatchQueueId`
- `POST /api/v1/admin/dispatch-queues`
- `PATCH /api/v1/admin/dispatch-queues/:dispatchQueueId`
- `POST /api/v1/admin/dispatch-queues/:dispatchQueueId/activate`
- `POST /api/v1/admin/dispatch-queues/:dispatchQueueId/deactivate`

Queue item management:

- `POST /api/v1/admin/dispatch-queues/:dispatchQueueId/items`
- `DELETE /api/v1/admin/dispatch-queues/:dispatchQueueId/items/:itemId`
- `POST /api/v1/admin/dispatch-queues/:dispatchQueueId/items/reorder`
- `POST /api/v1/admin/dispatch-queues/:dispatchQueueId/items/:itemId/status`

## Queue fields

- `organizationId`
- `name`
- `code`
- `description`
- `status`

## Queue item fields

- `plannedTripId`
- `sequence`
- `status`
- `notes`
- `holdReason`

## Notes

- Queues and planned trips must belong to the same organization
- A planned trip can only appear once in the same queue
- Queue reorder requests must include every current item exactly once
- Queue item transitions are validated before update
- Every write is audit logged under `admin.dispatch_queue.*` or `admin.dispatch_queue_item.*`
