# Background Jobs

## Purpose

Stage 15 introduces a first-class background job model and manual execution API.

## Models

- `BackgroundJobDefinition`
- `BackgroundJobRun`
- `BackgroundJobRunLog`

## APIs

- `GET /api/v1/admin/background-jobs`
- `POST /api/v1/admin/background-jobs`
- `GET /api/v1/admin/background-jobs/:jobDefinitionId`
- `PATCH /api/v1/admin/background-jobs/:jobDefinitionId`
- `POST /api/v1/admin/background-jobs/:jobDefinitionId/activate`
- `POST /api/v1/admin/background-jobs/:jobDefinitionId/deactivate`
- `POST /api/v1/admin/background-jobs/:jobDefinitionId/run`
- `GET /api/v1/admin/background-jobs/:jobDefinitionId/runs`
- `GET /api/v1/admin/background-jobs/:jobDefinitionId/runs/:runId`

## Design notes

- organization-specific jobs can be tenant-scoped
- global jobs can remain `organizationId = null`
- job config is stored as JSON for future scheduler compatibility
- no external queue is required yet
