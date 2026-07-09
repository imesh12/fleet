# Dispatch Actions

## Purpose

`DispatchAction` stores operational dispatch history separate from core trip state changes.

Examples:

- `VALIDATED`
- `ASSIGNED`
- `DISPATCHED`
- `STARTED`
- `HELD`
- `RESUMED`
- `COMPLETED`
- `CANCELLED`
- `FAILED`
- `FORCE_STARTED`
- `NOTE`

## Endpoints

- `GET /api/v1/admin/dispatch/actions`
- `GET /api/v1/admin/dispatch/actions/:dispatchActionId`
- `POST /api/v1/admin/dispatch/actions`

## List filters

- `organizationId`
- `tripId`
- `plannedTripId`
- `dispatchQueueItemId`
- `actionType`
- pagination fields

## Creation rules

- caller must have organization access
- referenced trip, planned trip, and queue item must belong to the same organization
- actor user is recorded automatically from the authenticated request when available
