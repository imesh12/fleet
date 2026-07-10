# Customer Accounts CRUD

Route:

```text
/admin/customers
```

Backend APIs:

- `GET /api/v1/admin/customer-accounts`
- `POST /api/v1/admin/customer-accounts`
- `PATCH /api/v1/admin/customer-accounts/:customerAccountId`
- `POST /api/v1/admin/customer-accounts/:customerAccountId/activate`
- `POST /api/v1/admin/customer-accounts/:customerAccountId/deactivate`

Requires selected organization context.

Fields:

- name
- code
- email
- phone
- billingAddress
- notes
- status on create

Contacts and locations remain placeholders for a later stage.
