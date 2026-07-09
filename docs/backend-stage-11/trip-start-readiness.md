# Trip Start Readiness

## Endpoint behavior

`POST /api/v1/admin/trips/:tripId/start` runs readiness validation before a trip can start.

Optional inputs:

- `readinessProfileId`
- `assignmentPolicyId`
- `force`
- `note`

## Checks covered

- vehicle active status
- driver active status
- valid active vehicle documents
- valid active driver licenses
- expired vehicle compliance records
- expired driver compliance records
- active vehicle device when required
- active assignment when required
- assignment policy rules such as overlapping trips, same organization, and same customer compatibility

## Force start

- If blockers exist, normal start is rejected.
- `force: true` is allowed only with `trips:force-start`.
- Forced starts still record validation blockers and warnings for audit and later review.

## Stored history

Trip start writes:

- `TripEvent.READINESS_VALIDATED`
- `DispatchAction.VALIDATED`
- `TripEvent.STARTED` or `TripEvent.FORCE_STARTED`
- `DispatchAction.STARTED` or `DispatchAction.FORCE_STARTED`
