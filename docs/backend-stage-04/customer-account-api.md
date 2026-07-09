# Customer Account API

Base path: `/api/v1/admin/customer-accounts`

## Endpoints
- `GET /` list customer accounts
- `GET /:customerAccountId` get customer account detail
- `POST /` create customer account
- `PATCH /:customerAccountId` update customer account
- `POST /:customerAccountId/activate` activate customer account
- `POST /:customerAccountId/deactivate` deactivate customer account
- `POST /:customerAccountId/contacts` create contact
- `PATCH /:customerAccountId/contacts/:contactId` update contact
- `DELETE /:customerAccountId/contacts/:contactId` delete contact
- `POST /:customerAccountId/locations` create location
- `PATCH /:customerAccountId/locations/:locationId` update location
- `DELETE /:customerAccountId/locations/:locationId` delete location

## Access Rules
- `SUPER_ADMIN` can work across organizations
- normal users are limited to customer accounts inside organizations they belong to
- for list routes, provide `organizationId` or `x-organization-id` for non-super-admin calls

## Sample Curl
```bash
curl -X POST http://localhost:3000/api/v1/admin/customer-accounts \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"organizationId\":\"<ORG_ID>\",\"name\":\"Northwind\",\"code\":\"NORTHWIND\"}"
```

```bash
curl http://localhost:3000/api/v1/admin/customer-accounts?organizationId=<ORG_ID>&page=1&pageSize=20 \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-organization-id: <ORG_ID>"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/customer-accounts/<ACCOUNT_ID>/locations \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Primary Depot\",\"addressLine1\":\"123 Yard Rd\",\"city\":\"Osaka\",\"country\":\"JP\"}"
```
