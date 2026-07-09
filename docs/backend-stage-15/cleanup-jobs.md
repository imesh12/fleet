# Cleanup Jobs

## Current cleanup handler

Stage 15 adds a manual cleanup handler for expired invitations:

- `CLEANUP_EXPIRED_INVITATIONS`

## Behavior

- finds pending invitations past `expiresAt`
- marks them `EXPIRED`
- records a job run summary
- writes run logs

## Why this matters

This gives the background job foundation a safe non-tracking workload immediately, which helps validate the generic job runner design.
