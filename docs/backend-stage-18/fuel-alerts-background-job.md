# Fuel Alerts + Background Job

Alert API:
- `GET /api/v1/admin/fuel/alerts`

Supported alert foundations:
- Fuel card expiry
- Fuel tank low level
- Fuel entry policy violation placeholder

Background job type:

```text
FUEL_ALERT_EVALUATION
```

Example job config:

```json
{
  "organizationId": "ORG_ID",
  "daysAhead": 30,
  "lowTankPercent": 20,
  "createNotifications": true,
  "notificationRecipient": "ops@example.test"
}
```

Notification delivery records are only created when explicitly configured.

