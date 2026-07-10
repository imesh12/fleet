# Stage 16 Verification

Commands:

```bash
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_16_queue_workers_provider_integrations
npm.cmd run prisma:seed
npm.cmd run typecheck
npm.cmd run build
```

Sample checks:

```bash
curl http://localhost:3000/api/v1/admin/background-jobs/due \
  -H "authorization: Bearer TOKEN"

curl -X POST http://localhost:3000/api/v1/admin/background-jobs/{jobDefinitionId}/trigger-now \
  -H "authorization: Bearer TOKEN" \
  -H "content-type: application/json" \
  -d "{\"payload\":{}}"

curl -X POST http://localhost:3000/api/v1/admin/notification-deliveries/retry-due \
  -H "authorization: Bearer TOKEN"
```

Expected:
- Prisma migration applies.
- Seed adds new permissions.
- Typecheck and build pass.
- Due-job endpoints return response envelopes.

