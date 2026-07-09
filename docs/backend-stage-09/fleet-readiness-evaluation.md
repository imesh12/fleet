# Fleet Readiness Evaluation

## Endpoint
- `GET /api/v1/admin/fleet-readiness/evaluate`

## Inputs
- `organizationId` or `x-organization-id`
- `vehicleId`
- `driverId`
- `assignmentId`
- `readinessProfileId`

## Output Shape
- `ready`
- `checks`
- `warnings`
- `blockers`
- `context`

## Evaluation Coverage
- active vehicle state
- active driver state
- valid driver license presence
- valid vehicle document presence
- active device presence
- active assignment presence
- expired active vehicle compliance records
- expired active driver compliance records

## Sample cURL
```bash
curl "http://localhost:3000/api/v1/admin/fleet-readiness/evaluate?organizationId=<ORG_ID>&vehicleId=<VEHICLE_ID>&driverId=<DRIVER_ID>&readinessProfileId=<PROFILE_ID>" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "x-organization-id: <ORG_ID>"
```
