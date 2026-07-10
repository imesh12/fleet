# Run Local Full Stack

Start the backend API:

```powershell
npm.cmd run dev:api
```

Start the frontend:

```powershell
npm.cmd run dev:web
```

Or start both together:

```powershell
npm.cmd run dev:all
```

Default ports:

- API: `http://localhost:3000/api/v1`
- Web: `http://localhost:3001`

Before running the frontend, create:

```text
apps/web/.env.local
```

With:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```
