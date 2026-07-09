# Departments And Business Units

## Models
Both models are organization-scoped and use the same basic shape:
- `id`
- `organizationId`
- `name`
- `code`
- `description`
- `status`
- `createdAt`
- `updatedAt`

Status values:
- `ACTIVE`
- `INACTIVE`

## APIs
- `GET /api/v1/admin/departments`
- `GET /api/v1/admin/departments/:departmentId`
- `POST /api/v1/admin/departments`
- `PATCH /api/v1/admin/departments/:departmentId`
- `POST /api/v1/admin/departments/:departmentId/activate`
- `POST /api/v1/admin/departments/:departmentId/deactivate`

- `GET /api/v1/admin/business-units`
- `GET /api/v1/admin/business-units/:businessUnitId`
- `POST /api/v1/admin/business-units`
- `PATCH /api/v1/admin/business-units/:businessUnitId`
- `POST /api/v1/admin/business-units/:businessUnitId/activate`
- `POST /api/v1/admin/business-units/:businessUnitId/deactivate`

## Sample Curl
```bash
curl -X POST http://localhost:3000/api/v1/admin/departments \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-organization-id: <ORG_ID>" \
  -H "Content-Type: application/json" \
  -d "{\"organizationId\":\"<ORG_ID>\",\"name\":\"Dispatch\",\"code\":\"DISPATCH\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/business-units \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-organization-id: <ORG_ID>" \
  -H "Content-Type: application/json" \
  -d "{\"organizationId\":\"<ORG_ID>\",\"name\":\"North Region\",\"code\":\"NORTH_REGION\"}"
```
