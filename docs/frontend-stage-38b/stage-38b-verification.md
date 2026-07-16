# Stage 38B Verification

Required commands:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run web:routes
npm.cmd run repo:hygiene
```

Manual checks recommended:

- Login with demo account.
- Select `DEMO-TOKYO`.
- Open dashboard.
- Open vehicle list, detail, new, and edit pages.
- Open driver list, detail, new, and edit pages.
- Confirm metadata managers still list/create/edit/archive where backend permits.
- Confirm skipped modules remain Coming Soon only.

No Prisma migration is required.
