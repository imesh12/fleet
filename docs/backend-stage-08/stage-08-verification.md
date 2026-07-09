# Stage 08 Verification

## Commands
- `npx.cmd prisma generate --schema packages/db/prisma/schema.prisma`
- `npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_08_driver_foundation`
- `npm.cmd run prisma:seed`
- `npm.cmd run typecheck`
- `npm.cmd run build`

## Smoke Checks
1. Create a driver group and driver skill.
2. Create a driver within an organization.
3. Assign a skill to the driver.
4. Add a license and document.
5. Create a driver vehicle assignment against an existing vehicle.
6. Verify expiring license and document endpoints.
7. Verify audit log entries for Stage 08 mutations.
