# Service Areas

Service areas are operational grouping structures for customer locations. They are not runtime geofences and do not include live map or tracking behavior.

Base path: `/api/v1/admin/service-areas`

## Supported Operations
- list
- get with linked customer locations
- create
- update
- activate
- deactivate
- add customer location
- remove customer location

## Sample Curl
```bash
curl -X POST http://localhost:3000/api/v1/admin/service-areas \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "x-organization-id: <ORG_ID>" \
  -H "Content-Type: application/json" \
  -d "{\"organizationId\":\"<ORG_ID>\",\"name\":\"Central Zone\",\"code\":\"CENTRAL_ZONE\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/service-areas/<AREA_ID>/locations \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"customerLocationId\":\"<CUSTOMER_LOCATION_ID>\"}"
```
