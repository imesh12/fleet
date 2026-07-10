# Dashboard Summary

```http
GET /api/v1/admin/dashboard/summary
Authorization: Bearer <accessToken>
x-organization-id: <organizationId>
```

```json
{
  "success": true,
  "data": {
    "summary": {
      "vehicles": { "total": 0, "active": 0 },
      "drivers": { "total": 0, "active": 0 },
      "trips": { "total": 0, "active": 0 },
      "maintenance": { "due": 0, "overdue": 0 },
      "fuel": { "entries": 0, "alerts": 0 },
      "tracking": { "online": 0, "stale": 0 },
      "alerts": { "open": 0, "acknowledged": 0 }
    }
  },
  "meta": {
    "requestId": "request_id"
  }
}
```
