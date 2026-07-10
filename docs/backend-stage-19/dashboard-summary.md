# Dashboard Summary

APIs:
- `GET /api/v1/admin/dashboard/widgets`
- `POST /api/v1/admin/dashboard/widgets`
- `PATCH /api/v1/admin/dashboard/widgets/:id`
- `GET /api/v1/admin/dashboard/summary`

Dashboard summary includes:
- Vehicle summary
- Driver summary
- Trip summary
- Maintenance summary
- Fuel summary
- Tracking health summary
- Alert summary

Optional query:
- `persistSnapshot=true` creates a `DashboardSnapshot`.

Example:

```bash
curl "http://localhost:3000/api/v1/admin/dashboard/summary?organizationId=ORG_ID&persistSnapshot=true" \
  -H "authorization: Bearer TOKEN"
```

