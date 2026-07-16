# Stage 34 Verification

Run:
- `npm.cmd run typecheck`
- `npm.cmd run build`

Manual checks:
- Select an organization.
- Open `/dashboard`.
- Refresh dashboard summary and toggle auto-refresh.
- Confirm enabled dashboard widgets render by sort order.
- Open `/reports`.
- Create/edit report categories.
- Create/edit report definitions.
- Create/edit saved filter presets.
- Create a report run placeholder.
- Create a report export placeholder.
- Open report definition, run, and export detail routes.

Protected legacy files must remain untouched:
- `settings/websitesetting.html`
- `settings/smsconfig.html`
- `whatsapp_settings.html`
