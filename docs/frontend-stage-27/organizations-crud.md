# Organizations CRUD

Route:

```text
/admin/organizations
```

Backend APIs:

- `GET /api/v1/admin/organizations`
- `POST /api/v1/admin/organizations`
- `PATCH /api/v1/admin/organizations/:organizationId`
- `POST /api/v1/admin/organizations/:organizationId/activate`
- `POST /api/v1/admin/organizations/:organizationId/deactivate`

Fields:

- name
- code
- legalName
- email
- phone
- taxIdentifier
- status on create
