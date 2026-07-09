# Vendor Foundation

## Models
### `Vendor`
- `id`
- `organizationId`
- `name`
- `code`
- `email`
- `phone`
- `address`
- `notes`
- `status`
- `createdAt`
- `updatedAt`

### `VendorContact`
- `id`
- `vendorId`
- `firstName`
- `lastName`
- `email`
- `phone`
- `title`
- `isPrimary`
- `isActive`
- `createdAt`
- `updatedAt`

## APIs
- `GET /api/v1/admin/vendors`
- `GET /api/v1/admin/vendors/:vendorId`
- `POST /api/v1/admin/vendors`
- `PATCH /api/v1/admin/vendors/:vendorId`
- `POST /api/v1/admin/vendors/:vendorId/activate`
- `POST /api/v1/admin/vendors/:vendorId/deactivate`
- `POST /api/v1/admin/vendors/:vendorId/contacts`
- `PATCH /api/v1/admin/vendors/:vendorId/contacts/:contactId`
- `DELETE /api/v1/admin/vendors/:vendorId/contacts/:contactId`

## Sample Curl
```bash
curl -X POST http://localhost:3000/api/v1/admin/vendors \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-organization-id: <ORG_ID>" \
  -H "Content-Type: application/json" \
  -d "{\"organizationId\":\"<ORG_ID>\",\"name\":\"Yard Parts Co\",\"code\":\"YARD_PARTS\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/vendors/<VENDOR_ID>/contacts \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"firstName\":\"Mina\",\"email\":\"mina@example.com\",\"isPrimary\":true}"
```
