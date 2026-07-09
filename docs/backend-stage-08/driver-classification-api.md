# Driver Classification API

## Endpoints
- `GET /api/v1/admin/driver-groups`
- `GET /api/v1/admin/driver-groups/:driverGroupId`
- `POST /api/v1/admin/driver-groups`
- `PATCH /api/v1/admin/driver-groups/:driverGroupId`
- `POST /api/v1/admin/driver-groups/:driverGroupId/activate`
- `POST /api/v1/admin/driver-groups/:driverGroupId/deactivate`
- `GET /api/v1/admin/driver-skills`
- `GET /api/v1/admin/driver-skills/:driverSkillId`
- `POST /api/v1/admin/driver-skills`
- `PATCH /api/v1/admin/driver-skills/:driverSkillId`
- `POST /api/v1/admin/driver-skills/:driverSkillId/activate`
- `POST /api/v1/admin/driver-skills/:driverSkillId/deactivate`

## Related Assignment Endpoints
- `GET /api/v1/admin/drivers/:driverId/skills`
- `POST /api/v1/admin/drivers/:driverId/skills`
- `DELETE /api/v1/admin/drivers/:driverId/skills/:driverSkillId`

## Sample cURL
```bash
curl -X POST http://localhost:3000/api/v1/admin/driver-groups \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <ORG_ID>" \
  -d '{
    "organizationId": "<ORG_ID>",
    "name": "Senior Drivers",
    "code": "senior_drivers"
  }'
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/drivers/<DRIVER_ID>/skills \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <ORG_ID>" \
  -d '{
    "driverSkillId": "<SKILL_ID>",
    "notes": "Certified for hazardous goods handling"
  }'
```
