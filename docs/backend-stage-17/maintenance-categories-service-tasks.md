# Maintenance Categories + Service Tasks

APIs:
- `GET /api/v1/admin/maintenance-categories`
- `POST /api/v1/admin/maintenance-categories`
- `GET /api/v1/admin/maintenance-categories/:id`
- `PATCH /api/v1/admin/maintenance-categories/:id`
- `POST /api/v1/admin/maintenance-categories/:id/activate`
- `POST /api/v1/admin/maintenance-categories/:id/deactivate`
- `GET /api/v1/admin/maintenance-service-tasks`
- `POST /api/v1/admin/maintenance-service-tasks`
- `GET /api/v1/admin/maintenance-service-tasks/:id`
- `PATCH /api/v1/admin/maintenance-service-tasks/:id`
- `POST /api/v1/admin/maintenance-service-tasks/:id/activate`
- `POST /api/v1/admin/maintenance-service-tasks/:id/deactivate`

Service tasks support default interval kilometers/days, estimated duration, estimated cost, and optional category mapping.

Sample:

```bash
curl -X POST http://localhost:3000/api/v1/admin/maintenance-service-tasks \
  -H "authorization: Bearer TOKEN" \
  -H "content-type: application/json" \
  -d "{\"organizationId\":\"ORG_ID\",\"name\":\"Oil Change\",\"code\":\"oil_change\",\"defaultIntervalKm\":10000,\"defaultIntervalDays\":180}"
```

