# Vendors CRUD

Route:

```text
/admin/vendors
```

Backend APIs:

- `GET /api/v1/admin/vendors`
- `POST /api/v1/admin/vendors`
- `PATCH /api/v1/admin/vendors/:vendorId`
- `POST /api/v1/admin/vendors/:vendorId/activate`
- `POST /api/v1/admin/vendors/:vendorId/deactivate`

Requires selected organization context.

Fields:

- name
- code
- email
- phone
- address
- notes
- status on create

Vendor contacts and contracts remain placeholders for a later stage.
