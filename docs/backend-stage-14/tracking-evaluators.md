# Tracking Evaluators

## Purpose

Stage 14 introduces manual evaluator runs that inspect current tracking state and generate alert events plus placeholder notification events.

## Models

- `TrackingEvaluationRun`
- `TrackingEvaluationItem`

## Endpoint

- `POST /api/v1/admin/tracking/evaluate`

## Supported evaluator outcomes

- device offline
- stale position
- speed threshold
- ignition on
- ignition off

## Current sources

Evaluators read:

- active `TrackingAlertRule` records
- latest `VehiclePosition` rows
- active `TrackingNotificationRule` records

## Outputs

The run may create:

- `TrackingEvaluationItem`
- `TrackingAlertEvent`
- `TrackingNotificationEvent`

## Read APIs

- `GET /api/v1/admin/tracking/evaluation-runs`
- `GET /api/v1/admin/tracking/evaluation-runs/:runId`

## Example request

```json
{
  "organizationId": "org_123",
  "staleMinutes": 15,
  "offlineMinutes": 60
}
```

## Design note

This is intentionally implemented as a manual evaluator foundation. A future scheduler can call the same evaluation path without changing the API contracts.
