# Driver Metadata Workflows

Driver detail page:
- `/fleet/drivers/[driverId]`

Integrated APIs:
- `GET /admin/drivers/:driverId/skills`
- `POST /admin/drivers/:driverId/skills`
- `DELETE /admin/drivers/:driverId/skills/:driverSkillId`
- `GET /admin/drivers/:driverId/licenses`
- `POST /admin/drivers/:driverId/licenses`
- `PATCH /admin/drivers/:driverId/licenses/:licenseId`
- `POST /admin/drivers/:driverId/licenses/:licenseId/archive`
- `GET /admin/drivers/:driverId/documents`
- `POST /admin/drivers/:driverId/documents`
- `PATCH /admin/drivers/:driverId/documents/:documentId`
- `POST /admin/drivers/:driverId/documents/:documentId/archive`
- `GET /admin/drivers/:driverId/compliance-records`
- `POST /admin/drivers/:driverId/compliance-records`
- `PATCH /admin/drivers/:driverId/compliance-records/:complianceRecordId`
- `POST /admin/drivers/:driverId/compliance-records/:complianceRecordId/archive`

Expiry-sensitive records show clear valid, expiring, and expired states.
