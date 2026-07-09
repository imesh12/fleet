# Driver Compliance

## Endpoints
- `GET /api/v1/admin/driver-compliance-types`
- `GET /api/v1/admin/driver-compliance-types/:driverComplianceTypeId`
- `POST /api/v1/admin/driver-compliance-types`
- `PATCH /api/v1/admin/driver-compliance-types/:driverComplianceTypeId`
- `POST /api/v1/admin/driver-compliance-types/:driverComplianceTypeId/activate`
- `POST /api/v1/admin/driver-compliance-types/:driverComplianceTypeId/deactivate`
- `GET /api/v1/admin/drivers/:driverId/compliance-records`
- `GET /api/v1/admin/drivers/:driverId/compliance-records/:complianceRecordId`
- `POST /api/v1/admin/drivers/:driverId/compliance-records`
- `PATCH /api/v1/admin/drivers/:driverId/compliance-records/:complianceRecordId`
- `POST /api/v1/admin/drivers/:driverId/compliance-records/:complianceRecordId/archive`
- `GET /api/v1/admin/drivers/compliance-records/expiring`

## Example Types
- medical check
- background check
- training certificate
- safety course
