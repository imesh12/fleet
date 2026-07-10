# Stage 27 Verification

Commands:

```powershell
npm.cmd run typecheck
npm.cmd run build
```

Manual checklist:

- Login as super admin.
- Open `/admin/organizations`.
- Search and filter organizations.
- Create an organization.
- Edit an organization.
- Activate/deactivate an organization with confirmation.
- Select an organization in the topbar.
- Open `/admin/customers` and create/edit/activate/deactivate a customer account.
- Open `/admin/vendors` and create/edit/activate/deactivate a vendor.
- Confirm backend errors show in the UI.
- Confirm skipped modules still route to coming soon pages only.
