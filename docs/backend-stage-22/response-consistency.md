# Response Consistency

Run:

```powershell
npm.cmd run api:response-check
```

Output:

- `docs/api/response-envelope-check.md`

The checker scans route handlers for `reply.success(...)` usage and flags routes that may need manual response-envelope review.

Allowed raw responses:

- `/api/v1/openapi.json`
- `/api/v1/docs`

These are intentionally raw so OpenAPI tooling and browser documentation can consume them directly.
