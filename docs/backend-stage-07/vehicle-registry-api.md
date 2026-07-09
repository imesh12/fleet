# Vehicle Registry API

## Endpoints
- `GET /api/v1/admin/vehicles`
- `GET /api/v1/admin/vehicles/:vehicleId`
- `POST /api/v1/admin/vehicles`
- `PATCH /api/v1/admin/vehicles/:vehicleId`
- `POST /api/v1/admin/vehicles/:vehicleId/activate`
- `POST /api/v1/admin/vehicles/:vehicleId/deactivate`
- `POST /api/v1/admin/vehicles/:vehicleId/archive`

## Supported Fields
- organization links:
  - `organizationId`
  - `customerAccountId`
  - `departmentId`
  - `businessUnitId`
- classification links:
  - `vehicleTypeId`
  - `vehicleGroupId`
  - `makeId`
  - `modelId`
  - `serviceRouteTemplateId`
- identity fields:
  - `registrationNumber`
  - `plateNumber`
  - `vin`
  - `chassisNumber`
  - `engineNumber`
- operational fields:
  - `year`
  - `color`
  - `fuelType`
  - `ownershipType`
  - `status`
  - `odometer`
  - `notes`

## Filters
- `organizationId`
- `search`
- `status`
- `vehicleTypeId`
- `vehicleGroupId`
- `customerAccountId`
- `departmentId`
- `businessUnitId`

## Validation Rules
- at least one of `registrationNumber` or `plateNumber` is required
- `registrationNumber` and `plateNumber` are unique per organization when provided
- linked customer, department, business unit, vehicle type, vehicle group, make, model, and route template must belong to the same organization
- if both `makeId` and `modelId` are supplied, the model must belong to the selected make

## Sample cURL
```bash
curl -X POST http://localhost:3000/api/v1/admin/vehicles \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <ORG_ID>" \
  -d '{
    "organizationId": "<ORG_ID>",
    "vehicleTypeId": "<TYPE_ID>",
    "vehicleGroupId": "<GROUP_ID>",
    "makeId": "<MAKE_ID>",
    "modelId": "<MODEL_ID>",
    "plateNumber": "ABC-1234",
    "registrationNumber": "REG-1001",
    "vin": "1HGBH41JXMN109186",
    "year": 2024,
    "fuelType": "DIESEL",
    "ownershipType": "OWNED",
    "odometer": 12500
  }'
```

```bash
curl "http://localhost:3000/api/v1/admin/vehicles?organizationId=<ORG_ID>&status=ACTIVE&vehicleTypeId=<TYPE_ID>" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "x-organization-id: <ORG_ID>"
```
