# Stage 25 Verification

Commands:

```powershell
npm.cmd run typecheck
npm.cmd run build
```

Optional local runtime verification:

```powershell
npm.cmd run dev:all
```

Manual checklist:

- Visit `http://localhost:3001/login`.
- Login with local super admin credentials.
- Confirm redirect to `/dashboard`.
- Confirm organization selector loads.
- Change organization and confirm sidebar/dashboard refresh.
- Confirm coming-soon menu entries route to `/coming-soon/[slug]`.
- Confirm logout returns to `/login`.

Protected legacy secret files must remain unchanged:

```powershell
git status --short -- settings/websitesetting.html settings/smsconfig.html whatsapp_settings.html
```
