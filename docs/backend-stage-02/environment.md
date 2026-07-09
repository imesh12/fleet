# Environment

## Required Variables

### App
- `NODE_ENV`
- `APP_NAME`
- `APP_VERSION`
- `APP_HOST`
- `APP_PORT`
- `APP_LOG_LEVEL`
- `API_PREFIX`

### Database And Cache
- `DATABASE_URL`
- `REDIS_URL`

### JWT
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`

### Seeded Super Admin
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_USERNAME`
- `SUPER_ADMIN_PASSWORD`
- `SUPER_ADMIN_FIRST_NAME`
- `SUPER_ADMIN_LAST_NAME`

## Validation
- environment variables are validated at startup with Zod
- startup fails fast if required variables are missing or invalid

## Development Defaults
See `.env.example` for safe local development values.

## Security Notes
- replace both JWT secrets in every real environment
- never commit real `.env` files
- production should use a secret manager instead of plain environment files where possible
