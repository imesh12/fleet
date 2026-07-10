# Stage 29 Verification

Commands:

```powershell
npm.cmd run typecheck
npm.cmd run build
```

Manual checklist:

- Open `/fleet/vehicles/new`.
- Create a vehicle and confirm redirect to detail.
- Edit the vehicle and confirm redirect back to detail.
- Open `/fleet/drivers/new`.
- Create a driver and confirm redirect to detail.
- Edit the driver and confirm redirect back to detail.
- Confirm relation dropdowns load for selected organization.
- Confirm skipped modules remain coming-soon only.
