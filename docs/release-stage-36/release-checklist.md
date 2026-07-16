# Release Checklist

Before release:
- Run `npm.cmd run typecheck`.
- Run `npm.cmd run build`.
- Run route, permission, seed, response, OpenAPI, and frontend route checks.
- Run API smoke tests against a live QA stack.
- Run Prisma validate, generate, and migration status.
- Review `.env.production` and rotate bootstrap credentials.
- Confirm `.env` and real secrets are not tracked.
- Confirm protected legacy secret files are untouched.
- Confirm CORS origins match production frontend URLs.
- Confirm Redis and PostgreSQL persistence.
- Confirm health checks pass.
