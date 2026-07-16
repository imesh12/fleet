# Trackigniter8 Rebuild

Trackigniter8 is being rebuilt from a legacy exported HTML fleet-management project into a multi-tenant enterprise application.

## Architecture

- `apps/api` - Fastify, TypeScript, Prisma, PostgreSQL, Redis, JWT/RBAC backend.
- `apps/web` - Next.js, React, TypeScript frontend.
- `packages/*` - Shared workspace packages for config, auth, DB, RBAC, logger, validation, mailer, queue, and tracking providers.
- `docs/*` - Stage analysis, backend/frontend implementation notes, API inventory, and release readiness docs.
- `scripts/*` - QA, route inventory, seed verification, smoke tests, and repository hygiene checks.

## Local Development

```powershell
npm.cmd install
Copy-Item .env.example .env
npx.cmd prisma generate --schema packages/db/prisma/schema.prisma
npm.cmd run prisma:seed
npm.cmd run dev:api
npm.cmd run dev:web
```

Default local URLs:
- API: `http://localhost:3000/api/v1`
- Web: `http://localhost:3001`

## QA Commands

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run api:routes
npm.cmd run api:permissions
npm.cmd run api:verify-seed
npm.cmd run api:response-check
npm.cmd run web:routes
npm.cmd run repo:hygiene
```

With the API server running:

```powershell
npm.cmd run api:openapi-check
npm.cmd run api:smoke
```

## Docker

Use `.env.production.example` as a placeholder-only template. Do not commit real production secrets.

```powershell
Copy-Item .env.production.example .env.production
docker compose up --build
```

## Security Notes

- Real `.env` files are ignored.
- Known sensitive legacy exports are ignored:
  - `settings/websitesetting.html`
  - `settings/smsconfig.html`
  - `whatsapp_settings.html`
- Do not copy raw legacy secret-bearing files into docs, examples, fixtures, tests, or archive folders.
- If credentials were exposed in historical commits, rotate them and plan a separate approved history-cleanup task.

## Coming Soon Modules

These modules intentionally remain placeholders only:
- Inventory
- Tyres
- Consumables
- Attendance
- Payroll
- Import/Export
- Bulk Upload
- Accounting
- Billing

## Release Readiness

See:
- `docs/release-stage-36`
- `docs/release-stage-37`
