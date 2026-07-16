# Production Environment

Use `.env.production.example` as the template. Do not commit real `.env.production` values.

Required backend values:
- `DATABASE_URL`
- `REDIS_URL`
- `CORS_ORIGINS`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_USERNAME`
- `SUPER_ADMIN_PASSWORD`

Required frontend value:
- `NEXT_PUBLIC_API_BASE_URL`

Production guardrails:
- JWT access and refresh secrets must be different.
- JWT secrets must not use `change-me` placeholders.
- `CORS_ORIGINS=*` is rejected in production.
- Default development super-admin password is rejected in production.
- `SHOW_ERROR_DETAILS=false` is recommended.

SMTP, webhook, storage, and Traccar variables are placeholders until those integrations are configured with real provider credentials.
