# Frontend Environment

Create `apps/web/.env.local` for local development:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

The committed example lives at:

```text
apps/web/.env.example
```

Do not expose backend secrets, database URLs, Redis URLs, JWT secrets, or provider credentials to the frontend.
