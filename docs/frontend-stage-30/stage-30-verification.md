# Stage 30 Verification

Required commands:
- `npm.cmd run typecheck`
- `npm.cmd run build`

Practical UI checks:
- Login as a user with vehicle/driver permissions.
- Select an organization context.
- Open `/fleet/vehicles`, then a vehicle detail page.
- Create/edit/archive vehicle document metadata.
- Create/edit/detach vehicle device metadata.
- Create/edit/archive vehicle compliance records.
- Open `/fleet/drivers`, then a driver detail page.
- Assign/remove driver skills.
- Create/edit/archive driver license metadata.
- Create/edit/archive driver document metadata.
- Create/edit/archive driver compliance records.
- Create/end/cancel an assignment from either vehicle or driver detail.

Protected legacy files must remain untouched:
- `settings/websitesetting.html`
- `settings/smsconfig.html`
- `whatsapp_settings.html`
