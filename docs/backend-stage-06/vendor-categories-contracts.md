# Vendor Categories And Contracts

## Vendor Categories
Base path: `/api/v1/admin/vendor-categories`

Supported operations:
- list
- get
- create
- update
- activate
- deactivate

Vendor categories are organization scoped, and `Vendor.vendorCategoryId` is optional.

## Vendor Contracts
Base path: `/api/v1/admin/vendors/:vendorId/contracts`

Supported operations:
- list contracts
- get contract
- create contract
- update contract
- activate contract
- expire contract
- cancel contract

Contracts are metadata only in Stage 06. No procurement, invoice, maintenance, or fuel workflows are included.

## Sample Curl
```bash
curl -X POST http://localhost:3000/api/v1/admin/vendor-categories \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-organization-id: <ORG_ID>" \
  -H "Content-Type: application/json" \
  -d "{\"organizationId\":\"<ORG_ID>\",\"name\":\"Tires\",\"code\":\"TIRES\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/vendors/<VENDOR_ID>/contracts \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"contractNumber\":\"VC-2026-001\",\"title\":\"Preferred Supplier Agreement\"}"
```
