# Stage 28 Verification

Commands:

```powershell
npm.cmd run typecheck
npm.cmd run build
```

Manual checklist:

- Login.
- Select an organization.
- Open `/fleet/vehicles`.
- Search/filter vehicles and open a vehicle detail.
- Confirm documents/devices/compliance sections render empty or populated states.
- Open `/fleet/drivers`.
- Search/filter drivers and open a driver detail.
- Confirm skills/licenses/documents/compliance/assignments render empty or populated states.
- Confirm no create/edit mutations are available.
