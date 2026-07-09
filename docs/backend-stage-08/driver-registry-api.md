# Driver Registry API

## Endpoints
- `GET /api/v1/admin/drivers`
- `GET /api/v1/admin/drivers/:driverId`
- `POST /api/v1/admin/drivers`
- `PATCH /api/v1/admin/drivers/:driverId`
- `POST /api/v1/admin/drivers/:driverId/activate`
- `POST /api/v1/admin/drivers/:driverId/deactivate`
- `POST /api/v1/admin/drivers/:driverId/archive`

## Supported Fields
- tenant links:
  - `organizationId`
  - `customerAccountId`
  - `departmentId`
  - `businessUnitId`
  - `driverGroupId`
- identity:
  - `employeeNumber`
  - `firstName`
  - `lastName`
  - `displayName`
  - `email`
  - `phone`
- profile:
  - `dateOfBirth`
  - `gender`
  - `addressLine1`
  - `addressLine2`
  - `city`
  - `state`
  - `postalCode`
  - `country`
- emergency contact:
  - `emergencyContactName`
  - `emergencyContactPhone`
  - `emergencyContactRelationship`
- employment:
  - `hireDate`
  - `employmentType`
  - `status`
  - `notes`

## Filters
- `organizationId`
- `search`
- `status`
- `driverGroupId`
- `customerAccountId`
- `departmentId`
- `businessUnitId`

## Sample cURL
```bash
curl -X POST http://localhost:3000/api/v1/admin/drivers \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <ORG_ID>" \
  -d '{
    "organizationId": "<ORG_ID>",
    "employeeNumber": "DRV-0001",
    "firstName": "Aiko",
    "lastName": "Tanaka",
    "displayName": "Aiko Tanaka",
    "phone": "+81-90-0000-0000",
    "employmentType": "FULL_TIME",
    "status": "ACTIVE"
  }'
```
