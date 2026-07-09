# Tracking Alert Automation

## Purpose

Stage 15 connects tracking alert generation to outbound delivery records and escalation workflows.

## Hooks added

- Stage 14 ingest/evaluation paths now create `NotificationDelivery` records
- manual alert creation now also creates pending deliveries
- alert event delivery endpoint can create missing deliveries and send them
- alert event escalation endpoint creates `EscalationEvent`

## APIs

- `POST /api/v1/admin/tracking-alert-events/:alertEventId/deliver`
- `POST /api/v1/admin/tracking-alert-events/:alertEventId/escalate`

## Current automation path

1. Tracking alert event is created.
2. Matching `TrackingNotificationRule` records are resolved.
3. `TrackingNotificationEvent` placeholders may be created.
4. `NotificationDelivery` records are created in `PENDING`.
5. Delivery is attempted manually or by background job.
