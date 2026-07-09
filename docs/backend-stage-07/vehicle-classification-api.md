# Vehicle Classification API

## Endpoints
- `GET /api/v1/admin/vehicle-types`
- `GET /api/v1/admin/vehicle-types/:vehicleTypeId`
- `POST /api/v1/admin/vehicle-types`
- `PATCH /api/v1/admin/vehicle-types/:vehicleTypeId`
- `POST /api/v1/admin/vehicle-types/:vehicleTypeId/activate`
- `POST /api/v1/admin/vehicle-types/:vehicleTypeId/deactivate`
- same route pattern for:
  - `/api/v1/admin/vehicle-groups`
  - `/api/v1/admin/vehicle-makes`
  - `/api/v1/admin/vehicle-models`

## Filters
- `organizationId`
- `search`
- `status`
- `vehicleMakeId` for `vehicle-models`

## Validation Rules
- `code` is normalized to uppercase underscore format
- `organizationId + code` must be unique
- `VehicleModel.vehicleMakeId` must belong to the same organization

## Sample cURL
```bash
curl -X POST http://localhost:3000/api/v1/admin/vehicle-types \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <ORG_ID>" \
  -d '{
    "organizationId": "<ORG_ID>",
    "name": "Heavy Truck",
    "code": "heavy_truck",
    "description": "Long-haul and high-capacity trucks"
  }'
```

```bash
curl "http://localhost:3000/api/v1/admin/vehicle-models?organizationId=<ORG_ID>&vehicleMakeId=<MAKE_ID>" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "x-organization-id: <ORG_ID>"
```
