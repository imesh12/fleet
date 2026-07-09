# Fleet Readiness Profiles

## Endpoints
- `GET /api/v1/admin/fleet-readiness-profiles`
- `GET /api/v1/admin/fleet-readiness-profiles/:readinessProfileId`
- `POST /api/v1/admin/fleet-readiness-profiles`
- `PATCH /api/v1/admin/fleet-readiness-profiles/:readinessProfileId`
- `POST /api/v1/admin/fleet-readiness-profiles/:readinessProfileId/activate`
- `POST /api/v1/admin/fleet-readiness-profiles/:readinessProfileId/deactivate`

## Fields
- `organizationId`
- `name`
- `description`
- `requireActiveVehicle`
- `requireActiveDriver`
- `requireValidVehicleDocuments`
- `requireValidDriverLicense`
- `requireActiveDevice`
- `requireActiveAssignment`
- `status`

## Sample cURL
```bash
curl -X POST http://localhost:3000/api/v1/admin/fleet-readiness-profiles \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <ORG_ID>" \
  -d '{
    "organizationId": "<ORG_ID>",
    "name": "Dispatch Readiness",
    "requireActiveVehicle": true,
    "requireActiveDriver": true,
    "requireValidVehicleDocuments": true,
    "requireValidDriverLicense": true,
    "requireActiveDevice": true,
    "requireActiveAssignment": true
  }'
```
