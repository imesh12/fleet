# Traccar Adapter Foundation

## Package

- `packages/tracking-providers`

## Exposed concepts

- `TrackingProviderAdapter`
- `NormalizedTrackingIngestEvent`
- `NormalizedTrackingDevice`
- `TraccarAdapter`
- `createTrackingProviderAdapter`

## Traccar coverage

Current Traccar normalization supports:

- device payload normalization
- position payload normalization
- conversion to the Stage 12 ingest shape

## Current design intent

- keep transport and authentication separate from normalization
- let future pull jobs, webhook receivers, or import scripts reuse the same adapter
- avoid hard-coding Traccar-specific fields into the core tracking models
