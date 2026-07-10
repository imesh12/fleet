# Navigation Menu

The sidebar fetches:

```http
GET /api/v1/navigation/menu
```

Behavior:

- `ACTIVE` menu items link to their backend-provided path.
- `COMING_SOON` menu items link to `/coming-soon/[slug]` with a badge.
- `HIDDEN` and `DISABLED` menu items are not rendered.

The backend remains the source of truth for RBAC-filtered navigation.
