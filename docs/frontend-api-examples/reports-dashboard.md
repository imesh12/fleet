# Reports Dashboard

```http
GET /api/v1/admin/report-definitions?page=1&pageSize=20
Authorization: Bearer <accessToken>
x-organization-id: <organizationId>
```

```http
POST /api/v1/admin/report-runs
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "organizationId": "organization_id",
  "reportDefinitionId": "report_definition_id",
  "filters": {
    "dateFrom": "2026-07-01",
    "dateTo": "2026-07-10"
  }
}
```

```json
{
  "success": true,
  "data": {
    "item": {
      "id": "report_run_id",
      "status": "COMPLETED_PLACEHOLDER"
    }
  },
  "meta": {
    "requestId": "request_id"
  }
}
```
