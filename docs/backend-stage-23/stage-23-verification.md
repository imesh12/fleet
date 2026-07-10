# Stage 23 Verification

Commands:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run api:routes
npm.cmd run api:permissions
npm.cmd run api:verify-seed
npm.cmd run api:response-check
npm.cmd run api:smoke
```

`api:smoke` requires the API server to be running. If it is not running, use:

```powershell
npm.cmd run dev
```

Then rerun:

```powershell
npm.cmd run api:smoke
```
