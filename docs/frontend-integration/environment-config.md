# Environment Config

Recommended frontend environment variables:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

Backend smoke test variables:

```text
API_BASE_URL=http://localhost:3000/api/v1
SUPER_ADMIN_EMAIL=admin@trackigniter8.local
SUPER_ADMIN_PASSWORD=ChangeMe123!
```

Do not expose refresh-token secrets, JWT secrets, database URLs, Redis URLs, SMTP credentials, or provider secrets in frontend environment variables.
