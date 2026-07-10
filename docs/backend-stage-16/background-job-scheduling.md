# Background Job Scheduling

`BackgroundJobDefinition` now includes:
- `scheduleType`: `MANUAL`, `INTERVAL`, `CRON`
- `cronExpression`
- `intervalSeconds`
- `maxRetries`
- `backoffStrategy`
- `nextRunAt`
- `lastRunAt`
- `lockedAt`
- `lockedBy`

APIs:
- `GET /api/v1/admin/background-jobs/due`
- `POST /api/v1/admin/background-jobs/run-due`
- `POST /api/v1/admin/background-jobs/:jobDefinitionId/schedule/enable`
- `POST /api/v1/admin/background-jobs/:jobDefinitionId/schedule/disable`
- `GET /api/v1/admin/background-jobs/:jobDefinitionId/schedule/preview`
- `POST /api/v1/admin/background-jobs/:jobDefinitionId/trigger-now`

Simple cron support currently accepts expressions like `*/5 * * * *`.

