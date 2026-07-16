# Stage 37 Release Checklist

Before release candidate rehearsal:
- Confirm `npm.cmd run repo:hygiene` passes.
- Confirm protected sensitive legacy paths are untracked.
- Confirm `.env` and `.env.production` are untracked.
- Confirm `npm.cmd audit` reports no vulnerabilities.
- Confirm `npm.cmd run typecheck` passes.
- Confirm `npm.cmd run build` passes.
- Confirm API route/permission/response checks pass.
- Confirm Prisma validate/generate/migrate status pass.
- Rotate any credentials previously exposed by legacy exports.
- Decide whether to perform Git history cleanup in a separate approved task.
