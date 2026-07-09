# Stage 15: Background Jobs + Notification Delivery Foundation

## Scope

Stage 15 adds the backend foundations for:

- manual background job orchestration
- job run history and logs
- real notification delivery abstraction
- notification providers, templates, and deliveries
- tracking alert delivery and escalation hooks
- cleanup job handlers

This stage remains backend-only.

## Main additions

### Models

Added:

- `BackgroundJobDefinition`
- `BackgroundJobRun`
- `BackgroundJobRunLog`
- `NotificationProvider`
- `NotificationTemplate`
- `NotificationDelivery`
- `EscalationPolicy`
- `EscalationPolicyStep`
- `EscalationEvent`

### Services

Added shared services:

- `apps/api/src/lib/background-jobs.ts`
- `apps/api/src/lib/notification-delivery.ts`

### API areas

Added:

- `/api/v1/admin/background-jobs`
- `/api/v1/admin/notification-providers`
- `/api/v1/admin/notification-templates`
- `/api/v1/admin/notification-deliveries`
- `/api/v1/admin/escalation-policies`
- `/api/v1/admin/escalation-events`

Extended:

- tracking alert event delivery
- tracking alert event escalation
- tracking automation now creates pending `NotificationDelivery` records

## Job types

Current foundation supports:

- `TRACKING_PROVIDER_SYNC`
- `TRACKING_EVALUATION`
- `GEOFENCE_EVALUATION`
- `NOTIFICATION_DELIVERY`
- `CLEANUP_EXPIRED_INVITATIONS`

## Delivery behavior

Current real delivery foundation supports:

- `EMAIL` through existing mailer abstraction
- `WEBHOOK` as simulated/logged delivery
- `IN_APP` as simulated/logged delivery
- `SMS` as simulated/logged placeholder

## Stage outcome

Stage 15 gives the platform a usable execution foundation for scheduled work and outbound notification workflows, without requiring a persistent queue worker yet.
