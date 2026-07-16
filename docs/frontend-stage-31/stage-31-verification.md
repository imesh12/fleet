# Stage 31 Verification

Run:
- `npm.cmd run typecheck`
- `npm.cmd run build`

Manual checks:
- Open `/maintenance`.
- Create/edit/toggle maintenance categories, service tasks, and inspection checklists.
- Create/edit/cancel maintenance requests.
- Create/edit/cancel work orders.
- Open a maintenance request detail route.
- Open a maintenance work order detail route and manage work-order task metadata.
- Open `/fuel`.
- Create/edit/toggle fuel types, vendor profiles, tanks, and policies.
- Create/edit/archive fuel cards and entries.
- Create/edit/cancel fuel requests.
- Open fuel request and fuel entry detail routes.

Protected legacy files must remain untouched:
- `settings/websitesetting.html`
- `settings/smsconfig.html`
- `whatsapp_settings.html`
