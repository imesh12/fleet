# Stage 20 Verification

Commands:

```bash
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npx.cmd prisma migrate dev --schema packages/db/prisma/schema.prisma --name stage_20_menu_page_placeholder_foundation
npm.cmd run prisma:seed
npm.cmd run typecheck
npm.cmd run build
```

Sample curls:

```bash
curl http://localhost:3000/api/v1/navigation/menu \
  -H "authorization: Bearer TOKEN"

curl http://localhost:3000/api/v1/admin/navigation/menu-items \
  -H "authorization: Bearer TOKEN"

curl http://localhost:3000/api/v1/admin/feature-flags \
  -H "authorization: Bearer TOKEN"
```

Expected:
- Migration applies.
- Seed creates active and coming-soon global menu/page records.
- Seed creates global feature flags.
- Typecheck and build pass.
- Protected legacy secret files remain untouched.

