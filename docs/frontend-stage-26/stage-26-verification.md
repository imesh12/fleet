# Stage 26 Verification

Commands:

```powershell
npm.cmd run typecheck
npm.cmd run build
```

Manual checks when running locally:

```powershell
npm.cmd run dev:all
```

Checklist:

- Login works.
- Sidebar renders active modules.
- Backend menu routes map to frontend shell routes.
- Organization selector changes refresh shell data.
- Active shell pages show loading/error/empty/table states.
- Skipped modules still route to `/coming-soon/[slug]`.
- No skipped business APIs are called.
