# Organization API

Base path: `/api/v1/admin/organizations`

## Endpoints
- `GET /` list organizations
- `GET /:organizationId` get organization detail
- `POST /` create organization
- `PATCH /:organizationId` update organization
- `POST /:organizationId/activate` activate organization
- `POST /:organizationId/deactivate` deactivate organization
- `GET /:organizationId/users` list organization users
- `POST /:organizationId/users` assign/add user membership
- `PATCH /:organizationId/users/:membershipId` update organization user role/status
- `DELETE /:organizationId/users/:membershipId` remove organization user
- `GET /:organizationId/settings` list organization settings
- `GET /:organizationId/settings/:key` get organization setting
- `PUT /:organizationId/settings/:key` upsert organization setting
- `DELETE /:organizationId/settings/:key` delete organization setting

## Access Rules
- `SUPER_ADMIN` can access all organizations
- normal users must belong to the organization and have active membership
- request header `x-organization-id` can be used where an explicit org route param is not present

## Sample Curl
```bash
curl -X POST http://localhost:3000/api/v1/admin/organizations \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Acme Logistics\",\"code\":\"ACME_LOGISTICS\",\"email\":\"ops@acme.local\"}"
```

```bash
curl http://localhost:3000/api/v1/admin/organizations/<ORG_ID>/users?page=1&pageSize=20 \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-organization-id: <ORG_ID>"
```

```bash
curl -X PUT http://localhost:3000/api/v1/admin/organizations/<ORG_ID>/settings/dispatch.timezone \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"value\":\"UTC\",\"valueType\":\"STRING\",\"category\":\"operations\",\"isSecret\":false}"
```
