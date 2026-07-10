# Dashboard Polish

Dashboard route:

```text
/dashboard
```

Backend call:

```http
GET /api/v1/admin/dashboard/summary
```

Stage 25 adds:

- selected organization display.
- reload on organization context change.
- loading state.
- error state.
- empty state.
- backend raw summary preview for integration debugging.

No chart library is added yet.
