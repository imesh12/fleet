# RBAC Navigation

Use `GET /api/v1/navigation/menu` as the source of truth for sidebar and page availability.

The API filters menu items by:

- user roles
- permissions
- organization membership
- menu item status

Frontend behavior:

- `ACTIVE`: render as normal navigation.
- `COMING_SOON`: render disabled or as a coming-soon page.
- `HIDDEN` or `DISABLED`: do not render.

Do not hard-code skipped manager modules as real business pages yet.
