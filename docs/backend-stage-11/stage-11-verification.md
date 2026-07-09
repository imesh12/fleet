# Stage 11 Verification

## Commands

```powershell
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_11_dispatch_execution_trip_lifecycle
npm.cmd run prisma:seed
npm.cmd run typecheck
npm.cmd run build
```

## Sample curl commands

```bash
curl -X POST http://localhost:3000/api/v1/admin/trips \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <org_id>" \
  -d "{\"plannedTripId\":\"<planned_trip_id>\",\"referenceCode\":\"TRIP-0001\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/trips/<trip_id>/start \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <org_id>" \
  -d "{\"force\":false}"
```

```bash
curl -X PATCH http://localhost:3000/api/v1/admin/trips/<trip_id>/stops/<stop_id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <org_id>" \
  -d "{\"status\":\"ARRIVED\",\"note\":\"Arrived at customer gate\"}"
```

```bash
curl http://localhost:3000/api/v1/admin/trips/<trip_id>/timeline \
  -H "Authorization: Bearer <token>" \
  -H "x-organization-id: <org_id>"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/dispatch/actions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <org_id>" \
  -d "{\"organizationId\":\"<org_id>\",\"tripId\":\"<trip_id>\",\"actionType\":\"NOTE\",\"note\":\"Manual dispatcher annotation\"}"
```

## Checklist

- Create a planned trip if one does not already exist
- Create an executed trip from the planned trip
- Confirm trip stops are copied from the planned trip
- Start a trip with readiness passing
- Attempt a blocked start and verify blocker output
- Force start with `trips:force-start` and confirm audit trail
- Hold, resume, complete, cancel, and fail through allowed transitions only
- Update stop statuses and confirm timestamps
- Reorder stops before start and confirm rejection after start
- Review timeline ordering for trip events and dispatch actions
- Confirm audit logs exist for every write operation
