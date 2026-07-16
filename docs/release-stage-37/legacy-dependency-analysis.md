# Legacy Dependency Analysis

Active code search scope:
- `apps/api`
- `apps/web`
- `packages`
- `scripts`
- Docker files
- package/tsconfig files
- Prisma schema and seed
- documentation

Findings:
- No active runtime imports or filesystem reads were found for root legacy HTML exports.
- No active backend or frontend source depends on `settings/websitesetting.html`, `settings/smsconfig.html`, or `whatsapp_settings.html`.
- Active frontend routes use rebuilt paths such as `/fleet/vehicles`, `/tracking/live`, and `/reports`, not legacy root HTML files.
- Active backend route references are API endpoints, not legacy static files.
- Documentation references protected legacy paths only as safety notes.

Classification:
- Legacy root/module HTML exports: `KEEP_FOR_REFERENCE` until a manager approves archive/removal.
- Known sensitive legacy files: `SENSITIVE_DO_NOT_TRACK`.
- Active `apps`, `packages`, and `scripts`: `ACTIVE_DEPENDENCY`.

No legacy path was moved or removed in this stage.
