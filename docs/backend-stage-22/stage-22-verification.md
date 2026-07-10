# Stage 22 Verification

Recommended verification commands:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run api:routes
npm.cmd run api:permissions
npm.cmd run api:verify-seed
npm.cmd run api:response-check
npm.cmd run api:smoke
```

`api:smoke` requires the API server to be running and reachable at `API_BASE_URL`.

Before committing, confirm protected legacy secret files were not modified:

```powershell
git status --short -- settings/websitesetting.html settings/smsconfig.html whatsapp_settings.html
```
