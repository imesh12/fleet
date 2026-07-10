# Driver Create/Edit

Routes:

- `/fleet/drivers/new`
- `/fleet/drivers/[driverId]/edit`

Backend APIs:

- `POST /api/v1/admin/drivers`
- `PATCH /api/v1/admin/drivers/:driverId`
- `GET /api/v1/admin/drivers/:driverId`

Supported fields:

- employeeNumber
- firstName
- lastName
- displayName
- email
- phone
- dateOfBirth
- gender
- address fields
- emergency contact fields
- hireDate
- employmentType
- status on create
- notes
- customerAccountId
- departmentId
- businessUnitId
- driverGroupId
