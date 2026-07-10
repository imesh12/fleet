# Navigation Menu API

Admin APIs:
- `GET /api/v1/admin/navigation/menu-groups`
- `POST /api/v1/admin/navigation/menu-groups`
- `GET /api/v1/admin/navigation/menu-groups/:id`
- `PATCH /api/v1/admin/navigation/menu-groups/:id`
- `GET /api/v1/admin/navigation/menu-items`
- `POST /api/v1/admin/navigation/menu-items`
- `GET /api/v1/admin/navigation/menu-items/:id`
- `PATCH /api/v1/admin/navigation/menu-items/:id`
- `PATCH /api/v1/admin/navigation/menu-items/reorder`
- `POST /api/v1/admin/navigation/menu-items/:id/activate`
- `POST /api/v1/admin/navigation/menu-items/:id/hide`
- `POST /api/v1/admin/navigation/menu-items/:id/disable`
- `POST /api/v1/admin/navigation/menu-items/:id/coming-soon`

User API:
- `GET /api/v1/navigation/menu`

The user endpoint returns active and coming-soon menu items filtered by current user permissions.

