# Permission Coverage Checks

Run:

```powershell
npm.cmd run api:permissions
```

Output:

- `docs/api/permission-coverage.md`

The checker scans admin routes and reports whether each route has a `fastify.requirePermission(...)` guard.

## Statuses

- `covered`: admin route has a permission guard.
- `missing-permission`: admin route appears to need RBAC but no permission guard was detected.
- `authenticated-only`: non-admin route requires authentication.
- `public-allowed`: public platform route.

The checker is heuristic and intentionally conservative. It produces review documentation rather than rewriting route code.
