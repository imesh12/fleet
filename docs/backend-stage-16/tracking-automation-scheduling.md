# Tracking Automation Scheduling

Background job definitions can schedule tracking automation:
- `TRACKING_PROVIDER_SYNC`
- `TRACKING_EVALUATION`
- `GEOFENCE_EVALUATION`

Example interval schedule:

```bash
curl -X POST http://localhost:3000/api/v1/admin/background-jobs/{jobDefinitionId}/schedule/enable \
  -H "authorization: Bearer TOKEN" \
  -H "content-type: application/json" \
  -d "{\"scheduleType\":\"INTERVAL\",\"intervalSeconds\":300}"
```

Manual due-job execution:

```bash
curl -X POST "http://localhost:3000/api/v1/admin/background-jobs/run-due?organizationId=ORG_ID" \
  -H "authorization: Bearer TOKEN" \
  -H "x-organization-id: ORG_ID"
```

