# Fuel Types + Vendor Profiles

Fuel type APIs:
- `GET /api/v1/admin/fuel-types`
- `POST /api/v1/admin/fuel-types`
- `GET /api/v1/admin/fuel-types/:id`
- `PATCH /api/v1/admin/fuel-types/:id`
- `POST /api/v1/admin/fuel-types/:id/activate`
- `POST /api/v1/admin/fuel-types/:id/deactivate`

Fuel vendor profile APIs:
- `GET /api/v1/admin/fuel-vendor-profiles`
- `POST /api/v1/admin/fuel-vendor-profiles`
- `GET /api/v1/admin/fuel-vendor-profiles/:id`
- `PATCH /api/v1/admin/fuel-vendor-profiles/:id`
- `POST /api/v1/admin/fuel-vendor-profiles/:id/activate`
- `POST /api/v1/admin/fuel-vendor-profiles/:id/deactivate`

Example:

```bash
curl -X POST http://localhost:3000/api/v1/admin/fuel-types \
  -H "authorization: Bearer TOKEN" \
  -H "content-type: application/json" \
  -d "{\"organizationId\":\"ORG_ID\",\"name\":\"Diesel\",\"code\":\"diesel\"}"
```

