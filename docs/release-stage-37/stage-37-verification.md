# Stage 37 Verification

Commands:

```powershell
npm.cmd install
npm.cmd audit
npm.cmd run typecheck
npm.cmd run build
npm.cmd run api:routes
npm.cmd run api:permissions
npm.cmd run api:verify-seed
npm.cmd run api:response-check
npm.cmd run web:routes
npm.cmd run repo:hygiene
npm.cmd run api:openapi-check
npm.cmd run api:smoke
npx.cmd prisma validate --schema packages/db/prisma/schema.prisma
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npx.cmd prisma migrate status --schema packages/db/prisma/schema.prisma
```

Protected files:
- `settings/websitesetting.html`
- `settings/smsconfig.html`
- `whatsapp_settings.html`
