# Tracking Provider API

## Purpose

Tracking providers decouple the platform from any single GPS vendor or Traccar-specific implementation.

## Provider fields

- `organizationId`
- `name`
- `code`
- `providerType`
- `baseUrl`
- `description`
- `status`
- `metadata`

## Credential model

Credentials are nested under a provider and currently support header-based ingest authentication.

Stored fields:

- `name`
- `keyId`
- `authType`
- `secretHash`
- `secretHint`
- `status`
- `lastUsedAt`
- `expiresAt`
- `metadata`

Behavior:

- plain-text secrets are returned only during create or rotate flows
- read APIs return masked credential metadata only
- inactive or expired credentials cannot ingest telemetry

## Health model

Provider health stores:

- `status`
- `message`
- `lastCheckedAt`
- `lastSuccessAt`
- `lastFailureAt`
- `lastIngestAt`
- `metadata`

Health can be updated by admin APIs and is also refreshed automatically on successful ingest.
