# Database Migrations

Validation commands:

```powershell
npx.cmd prisma validate --schema packages/db/prisma/schema.prisma
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npx.cmd prisma migrate status --schema packages/db/prisma/schema.prisma
```

Production migration command:

```powershell
npx.cmd prisma migrate deploy --schema packages/db/prisma/schema.prisma
```

Seed guidance:
- Run seed only for controlled bootstrap or QA environments.
- Production seed should be explicit and reviewed.
- Rotate or replace bootstrap super-admin credentials immediately after first access.
