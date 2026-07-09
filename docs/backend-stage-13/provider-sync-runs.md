# Provider Sync Runs

## Purpose

Sync runs provide a safe placeholder for future Traccar import jobs and provider reconciliation workflows.

## Models

- `TrackingProviderSyncRun`
- `TrackingProviderSyncItem`

## Current behavior

- create manual sync run placeholders
- attach item-level results
- mark item status and message
- inspect sync history by provider

## Future use

- polling jobs
- device catalog reconciliation
- historical import backfills
- provider-side error reporting
