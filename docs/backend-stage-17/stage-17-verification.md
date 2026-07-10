# Stage 17 Verification

Commands:

```bash
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_17_maintenance_foundation
npm.cmd run prisma:seed
npm.cmd run typecheck
npm.cmd run build
```

Sample curls:

```bash
curl http://localhost:3000/api/v1/admin/maintenance-categories \
  -H "authorization: Bearer TOKEN" \
  -H "x-organization-id: ORG_ID"

curl http://localhost:3000/api/v1/admin/maintenance/due?organizationId=ORG_ID \
  -H "authorization: Bearer TOKEN"

curl -X POST http://localhost:3000/api/v1/admin/background-jobs/{jobDefinitionId}/trigger-now \
  -H "authorization: Bearer TOKEN" \
  -H "content-type: application/json" \
  -d "{\"payload\":{\"organizationId\":\"ORG_ID\"}}"
```

Expected:
- Prisma migration applies.
- Seed adds maintenance permissions.
- Typecheck and build pass.
- No legacy HTML files are touched.

