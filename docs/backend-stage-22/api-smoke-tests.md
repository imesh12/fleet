# API Smoke Tests

Run when the API server is already running:

```powershell
npm.cmd run api:smoke
```

Optional environment variables:

- `API_BASE_URL`, defaults to `http://localhost:3000/api/v1`
- `SUPER_ADMIN_EMAIL`, defaults to `admin@trackigniter8.local`
- `SUPER_ADMIN_PASSWORD`, defaults to `ChangeMe123!`

Checks:

- health
- login
- auth/me
- navigation menu
- dashboard summary
- selected admin list endpoints

This is not a full test suite. It is a fast readiness probe for frontend integration.
