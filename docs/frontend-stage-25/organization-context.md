# Organization Context

The frontend uses:

```text
apps/web/src/components/organization-provider.tsx
apps/web/src/components/organization-selector.tsx
```

Behavior:

- Fetches accessible organizations from `GET /api/v1/admin/organizations`.
- Stores selected organization id in `localStorage` for development.
- Sends the selected organization as `x-organization-id` through the API client.
- Refreshes navigation and dashboard data when the organization changes.

SUPER_ADMIN users can choose from all organizations returned by the backend.
Normal users see only organizations they are assigned to.
