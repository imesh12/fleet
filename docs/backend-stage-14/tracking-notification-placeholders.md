# Tracking Notification Placeholders

## Purpose

Stage 14 adds tracking notification and escalation storage without implementing real channel delivery yet.

## Models

- `TrackingNotificationRule`
- `TrackingNotificationEvent`

## Channels

- `EMAIL`
- `SMS`
- `WEBHOOK`
- `IN_APP`

## Rule fields

Rules store:

- optional linked tracking alert rule
- channel
- escalation level
- recipient metadata
- message template
- freeform metadata

## Event fields

Events store:

- linked notification rule
- linked tracking alert event
- channel
- status
- message snapshot
- escalation level
- recipient metadata

## API coverage

- list/get/create/update/activate/deactivate rules
- list/get notification events
- acknowledge and resolve notification events

## Current behavior

Notification events are generated as placeholders from:

- shared tracking execution ingest
- manual tracking evaluator runs

No actual outbound sending is performed in Stage 14.
