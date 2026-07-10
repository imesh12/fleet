# Filter Presets + Report Runs

Filter preset APIs:
- `GET /api/v1/admin/report-filter-presets`
- `POST /api/v1/admin/report-filter-presets`
- `PATCH /api/v1/admin/report-filter-presets/:id`

Report run APIs:
- `GET /api/v1/admin/report-runs`
- `POST /api/v1/admin/report-runs`

Report runs are placeholder query results in Stage 19. They store filters, result summary JSON, row count, timestamps, and run status.

Example:

```bash
curl -X POST http://localhost:3000/api/v1/admin/report-runs \
  -H "authorization: Bearer TOKEN" \
  -H "content-type: application/json" \
  -d "{\"organizationId\":\"ORG_ID\",\"reportDefinitionId\":\"REPORT_ID\",\"filters\":{\"status\":\"ACTIVE\"}}"
```

