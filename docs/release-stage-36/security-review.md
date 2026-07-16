# Security Review

Reviewed and reinforced:
- Production JWT secret validation.
- Production CORS wildcard rejection.
- Default super-admin password rejection in production.
- Helmet secure headers are registered.
- Fastify rate limiting is registered globally and auth routes also define route-level limits.
- Request IDs are propagated with `x-request-id`.
- Secret settings and provider credentials are masked in frontend admin pages.
- Tracking credential secrets are stored as hashes with hints.
- `.env` remains ignored.

Remaining release checks:
- Run a dedicated secret scanner in CI.
- Confirm production logging does not include provider credential payloads.
- Confirm tenant isolation with non-super-admin QA accounts.
- Configure CORS for the exact production frontend origin.
