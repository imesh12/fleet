# Stage 05 Verification

## Commands
```bash
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_05_operational_master_data
npm.cmd run prisma:seed
npm.cmd run typecheck
npm.cmd run build
```

## Suggested Smoke Checks
1. Login as super admin.
2. Create an organization if one does not exist.
3. Create one department and one business unit.
4. Create one vendor and one vendor contact.
5. Create one service route and at least two stops, then reorder them.
6. Create one organization invitation and accept it with the matching user.
7. Verify audit logs for each mutation.

## Expected Tenant Safety
- requests with `x-organization-id` should be allowed only when the authenticated user belongs to that organization
- `SUPER_ADMIN` should be able to work across organizations
- non-super-admin users should not see or mutate data in other organizations
