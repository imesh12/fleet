# Stage 18 Verification

Commands:

```bash
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_18_fuel_foundation
npm.cmd run prisma:seed
npm.cmd run typecheck
npm.cmd run build
```

Sample curls:

```bash
curl http://localhost:3000/api/v1/admin/fuel-types \
  -H "authorization: Bearer TOKEN" \
  -H "x-organization-id: ORG_ID"

curl http://localhost:3000/api/v1/admin/fuel/alerts?organizationId=ORG_ID \
  -H "authorization: Bearer TOKEN"

curl -X POST http://localhost:3000/api/v1/admin/fuel-entries \
  -H "authorization: Bearer TOKEN" \
  -H "content-type: application/json" \
  -d "{\"organizationId\":\"ORG_ID\",\"vehicleId\":\"VEHICLE_ID\",\"fuelTypeId\":\"FUEL_TYPE_ID\",\"quantity\":40,\"unit\":\"LITER\",\"filledAt\":\"2026-07-10T00:00:00.000Z\"}"
```

Expected:
- Prisma migration applies.
- Seed adds fuel permissions.
- Typecheck and build pass.
- Legacy HTML files remain untouched.

