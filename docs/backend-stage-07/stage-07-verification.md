# Stage 07 Verification

## Commands
- `npx.cmd prisma generate --schema packages/db/prisma/schema.prisma`
- `npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_07_vehicle_foundation`
- `npm.cmd run prisma:seed`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Smoke Checks
1. Create a vehicle type, group, make, and model within one organization.
2. Create a vehicle linked to those classifications.
3. Add a vehicle document and confirm it appears in the expiry endpoint when applicable.
4. Attach a vehicle device and then call the detach endpoint.
5. Verify audit logs contain `admin.vehicle_*` actions.

## Suggested API Sequence
```bash
curl -X POST http://localhost:3000/api/v1/admin/vehicle-types ...
curl -X POST http://localhost:3000/api/v1/admin/vehicle-groups ...
curl -X POST http://localhost:3000/api/v1/admin/vehicle-makes ...
curl -X POST http://localhost:3000/api/v1/admin/vehicle-models ...
curl -X POST http://localhost:3000/api/v1/admin/vehicles ...
curl -X POST http://localhost:3000/api/v1/admin/vehicles/<VEHICLE_ID>/documents ...
curl -X POST http://localhost:3000/api/v1/admin/vehicles/<VEHICLE_ID>/devices ...
```
