# Stage 35 Verification

Run:

```powershell
npm.cmd run typecheck
npm.cmd run build
```

Manual checks:
- Login as an admin user.
- Open `/admin/users`, create a user, then open detail.
- Assign/remove a role and confirm permission summary remains visible.
- Open `/admin/roles`, inspect a custom role, and assign/remove a permission.
- Open `/admin/settings` and confirm secret values are masked.
- Open `/admin/files`, create metadata records with a selected organization.
- Open `/admin/jobs`, inspect due jobs, and trigger a safe manual job.
- Open `/admin/notifications`, confirm provider config stays masked.

Protected files to leave untouched:
- `settings/websitesetting.html`
- `settings/smsconfig.html`
- `whatsapp_settings.html`
