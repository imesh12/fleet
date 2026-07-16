# Dispatch Queue Workflows

Integrated APIs:
- `GET/POST/PATCH /admin/dispatch-queues`
- `GET /admin/dispatch-queues/:dispatchQueueId`
- `POST /admin/dispatch-queues/:dispatchQueueId/activate`
- `POST /admin/dispatch-queues/:dispatchQueueId/deactivate`
- `POST /admin/dispatch-queues/:dispatchQueueId/items`
- `DELETE /admin/dispatch-queues/:dispatchQueueId/items/:itemId`
- `POST /admin/dispatch-queues/:dispatchQueueId/items/:itemId/status`
- `POST /admin/dispatch/validate`

Queue item status transitions are exposed through metadata editing. Sequence values are editable as a lightweight reorder placeholder.
