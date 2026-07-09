# Stage 06 Verification

## Commands
```bash
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_06_operational_extensions
npm.cmd run prisma:seed
npm.cmd run typecheck
npm.cmd run build
```

## Suggested Smoke Checks
1. Create a vendor category and assign it to a vendor.
2. Create a vendor contract and move it through activate, expire, or cancel.
3. Create a service area and attach customer locations.
4. Create a service route group.
5. Create a service route template and reorder its stops.
6. Create an organization invitation, resend it, then expire another invitation.
7. Inspect audit logs for master-data mutations and notification send events.

## Expected Tenant Safety
- all new Stage 06 records are organization scoped
- `SUPER_ADMIN` can access all organizations
- non-super-admin users are limited to organizations they belong to
- `x-organization-id` should be honored where the route does not already carry organization context
