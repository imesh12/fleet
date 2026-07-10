# Protected Layout

Protected routes use:

```text
apps/web/src/app/(app)/layout.tsx
```

The layout renders:

- sidebar
- topbar
- user info
- logout button
- main content area
- loading and redirect states

Unauthenticated users are redirected to `/login`.
