# Stage 19 Verification

Commands:

```bash
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_19_reports_dashboard_foundation
npm.cmd run prisma:seed
npm.cmd run typecheck
npm.cmd run build
```

Sample curls:

```bash
curl http://localhost:3000/api/v1/admin/report-definitions \
  -H "authorization: Bearer TOKEN" \
  -H "x-organization-id: ORG_ID"

curl http://localhost:3000/api/v1/admin/dashboard/summary?organizationId=ORG_ID \
  -H "authorization: Bearer TOKEN"

curl -X POST http://localhost:3000/api/v1/admin/report-export-jobs \
  -H "authorization: Bearer TOKEN" \
  -H "content-type: application/json" \
  -d "{\"organizationId\":\"ORG_ID\",\"format\":\"PDF_PLACEHOLDER\"}"
```

Expected:
- Prisma migration applies.
- Seed adds report/dashboard permissions.
- Typecheck and build pass.
- Legacy secret-sensitive files remain untouched.

