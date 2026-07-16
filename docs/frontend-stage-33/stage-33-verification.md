# Stage 33 Verification

Run:
- `npm.cmd run typecheck`
- `npm.cmd run build`

Manual checks:
- Open `/tracking/live`, filter positions, refresh, and toggle auto-refresh.
- Open `/tracking/vehicles/[vehicleId]`.
- Open `/tracking/providers`, create/edit/toggle provider metadata.
- Open provider detail, create/deactivate credential metadata, run sync, view sync history, and manage device mappings.
- Open `/tracking/geofences`, create/edit/toggle geofence metadata, run evaluation, and view events.
- Open geofence detail and manage coordinate points.
- Open `/tracking/alerts`, create/edit/toggle rules, run tracking evaluation, and view events.
- Open alert event detail and run acknowledge, resolve, deliver, and escalate actions.

Protected legacy files must remain untouched:
- `settings/websitesetting.html`
- `settings/smsconfig.html`
- `whatsapp_settings.html`

Secret safety:
- Do not read, copy, expose, or reuse keys from legacy HTML.
- Do not render credential secret values.
