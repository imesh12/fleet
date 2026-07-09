# Security Hardening

## Implemented in Stage 03
- stricter auth-route rate limiting using env-driven limits
- password policy validation for admin-created and admin-reset passwords
- request id generation and `x-request-id` response propagation
- env-driven CORS allowlist support
- safer production error responses that suppress details unless explicitly enabled
- refresh token metadata capture for better session visibility
- session revocation on admin password reset
- protected handling around `SUPER_ADMIN` assignment and last-active-super-admin removal

## Environment Variables Added
- `CORS_ORIGINS`
- `CORS_CREDENTIALS`
- `AUTH_RATE_LIMIT_MAX`
- `AUTH_RATE_LIMIT_WINDOW`
- `PASSWORD_MIN_LENGTH`
- `PASSWORD_REQUIRE_UPPERCASE`
- `PASSWORD_REQUIRE_LOWERCASE`
- `PASSWORD_REQUIRE_NUMBER`
- `PASSWORD_REQUIRE_SPECIAL`
- `SHOW_ERROR_DETAILS`

## Operational Notes
- current auth APIs return JWTs in JSON responses, not cookies
- if secure cookies are introduced later, `Secure`, `HttpOnly`, `SameSite`, and proxy-aware TLS configuration should be mandatory
- Redis startup failure now logs a warning instead of crashing boot, so health checks can report degraded status during local development
- the first super admin still comes from bootstrap env values and the seed script; rotate those credentials immediately in shared environments
