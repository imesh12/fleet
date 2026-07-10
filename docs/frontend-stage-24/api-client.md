# API Client

The frontend API client lives at:

```text
apps/web/src/lib/api-client.ts
```

It supports:

- `NEXT_PUBLIC_API_BASE_URL`
- success/error envelope parsing
- bearer token header
- optional `x-organization-id`
- pagination metadata typing
- automatic local token clearing on `401`

Development token storage uses `localStorage` for speed. Production hardening should move refresh-token handling to a safer cookie/session approach.
