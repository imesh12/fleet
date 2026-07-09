# Stage 10 Verification

## Commands

```powershell
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_10_trip_dispatch_planning
npm.cmd run prisma:seed
npm.cmd run typecheck
npm.cmd run build
```

## Sample curl commands

```bash
curl -X POST http://localhost:3000/api/v1/admin/trip-templates \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <org_id>" \
  -d "{\"organizationId\":\"<org_id>\",\"name\":\"Morning Route A\",\"code\":\"MORNING_ROUTE_A\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/planned-trips \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <org_id>" \
  -d "{\"organizationId\":\"<org_id>\",\"title\":\"Shift Opening Run\",\"plannedStartAt\":\"2026-07-09T08:00:00.000Z\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/dispatch-queues \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <org_id>" \
  -d "{\"organizationId\":\"<org_id>\",\"name\":\"Primary Queue\",\"code\":\"PRIMARY_QUEUE\"}"
```

```bash
curl -X POST http://localhost:3000/api/v1/admin/dispatch/validate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "x-organization-id: <org_id>" \
  -d "{\"plannedTripId\":\"<planned_trip_id>\"}"
```

## Checklist

- Create trip template
- Add, update, delete, and reorder template stops
- Create planned trip
- Confirm auto-generated stops from linked template or route
- Assign and unassign driver/vehicle placeholders
- Update planned trip status through allowed transitions only
- Create dispatch queue and add planned trip item
- Reorder queue items
- Move queue items through allowed statuses
- Run pre-dispatch validation and review blockers/warnings
- Confirm audit logs exist for write operations
