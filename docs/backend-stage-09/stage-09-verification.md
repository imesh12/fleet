# Stage 09 Verification

## Commands
- `npx.cmd prisma generate --schema packages/db/prisma/schema.prisma`
- `npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_09_fleet_operations_foundation`
- `npm.cmd run prisma:seed`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Smoke Checks
1. Create a fleet readiness profile.
2. Create vehicle and driver compliance types.
3. Add compliance records to an existing vehicle and driver.
4. Create an assignment policy and add ordered rules.
5. Run the readiness evaluation endpoint with vehicle and driver context.
6. Confirm audit logs for Stage 09 mutations.
