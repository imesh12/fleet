# Background Jobs

Frontend route:
- `/admin/jobs`

Integrated APIs:
- `GET/POST/PATCH /api/v1/admin/background-jobs`
- `GET /api/v1/admin/background-jobs/due`
- `POST /api/v1/admin/background-jobs/run-due`
- `POST /api/v1/admin/background-jobs/:jobDefinitionId/trigger-now`
- `POST /api/v1/admin/background-jobs/:jobDefinitionId/schedule/enable`
- `POST /api/v1/admin/background-jobs/:jobDefinitionId/schedule/disable`

The page supports job definition metadata, schedule state controls, due-job visibility, and manual worker actions.

Always-running workers and external queue dashboards remain future production-hardening work.
