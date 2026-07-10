# Route Inventory

Run:

```powershell
npm.cmd run api:routes
```

Outputs:

- `docs/api/route-inventory.md`
- `docs/api/route-inventory.json`

The generator scans `apps/api/src/modules/**/routes.ts` for `fastify.get`, `fastify.post`, `fastify.patch`, `fastify.put`, and `fastify.delete` registrations.

Each route entry includes:

- method
- path
- module
- auth requirement
- detected permission
- status
- source file and line

This is intentionally static and dependency-light so it can run before the server starts.
