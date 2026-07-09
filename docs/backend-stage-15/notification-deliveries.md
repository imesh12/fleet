# Notification Deliveries

## Purpose

Stage 15 introduces real delivery records separate from Stage 14 placeholder notification events.

## Model

- `NotificationDelivery`

## Statuses

- `PENDING`
- `PROCESSING`
- `SENT`
- `FAILED`
- `CANCELED`

## APIs

- `GET /api/v1/admin/notification-deliveries`
- `GET /api/v1/admin/notification-deliveries/:deliveryId`
- `POST /api/v1/admin/notification-deliveries/:deliveryId/retry`
- `POST /api/v1/admin/notification-deliveries/:deliveryId/mark-sent`
- `POST /api/v1/admin/notification-deliveries/:deliveryId/mark-failed`
- `POST /api/v1/admin/notification-deliveries/:deliveryId/cancel`

## Delivery source

Deliveries are currently created from tracking alert automation through `TrackingNotificationRule` records.
