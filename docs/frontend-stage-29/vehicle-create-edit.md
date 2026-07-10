# Vehicle Create/Edit

Routes:

- `/fleet/vehicles/new`
- `/fleet/vehicles/[vehicleId]/edit`

Backend APIs:

- `POST /api/v1/admin/vehicles`
- `PATCH /api/v1/admin/vehicles/:vehicleId`
- `GET /api/v1/admin/vehicles/:vehicleId`

Supported fields:

- registrationNumber
- plateNumber
- vin
- chassisNumber
- engineNumber
- year
- color
- fuelType
- ownershipType
- status on create
- odometer
- notes
- customerAccountId
- departmentId
- businessUnitId
- vehicleTypeId
- vehicleGroupId
- makeId
- modelId
