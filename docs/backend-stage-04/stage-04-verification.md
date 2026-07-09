# Stage 04 Verification

## Commands
```bash
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npm.cmd run typecheck
npm.cmd run build
```

## Non-Blocking Infra Checks
```bash
npx.cmd prisma db push --schema packages/db/prisma/schema.prisma
npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_04_tenant_customer_foundation
npm.cmd run prisma:seed
```

## Expected Results In Current Local Environment
- `prisma generate`: should succeed
- `typecheck`: should succeed
- `build`: should succeed
- `prisma db push`: may still fail with `Schema engine error`
- `prisma migrate dev`: may still fail with `Schema engine error`
- `prisma:seed`: may fail if schema has not been pushed yet

## Suggested Smoke Tests
1. Login as super admin and capture access token.
2. Create an organization.
3. Assign an existing user to that organization.
4. Create a customer account under the organization.
5. Add one contact and one location.
6. Confirm audit log entries exist for each mutation.
