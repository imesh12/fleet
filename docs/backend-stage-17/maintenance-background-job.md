# Maintenance Background Job

Stage 17 adds background job type:

```text
MAINTENANCE_DUE_EVALUATION
```

The handler scans maintenance plans/tasks and logs:
- plan count
- due count
- overdue count
- upcoming count
- notification delivery count

Example job definition config:

```json
{
  "organizationId": "ORG_ID",
  "daysAhead": 30,
  "odometerAheadKm": 1000,
  "createNotifications": true,
  "notificationRecipient": "ops@example.test"
}
```

Use Stage 16 scheduling APIs to run this job manually, by interval, or by supported simple cron.

