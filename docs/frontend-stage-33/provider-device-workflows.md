# Provider And Device Workflows

Pages:
- `/tracking/providers`
- `/tracking/providers/[providerId]`

Integrated APIs:
- `GET/POST/PATCH /admin/tracking-providers`
- `POST /admin/tracking-providers/:providerId/activate`
- `POST /admin/tracking-providers/:providerId/deactivate`
- `GET/POST/PATCH /admin/tracking-providers/:providerId/credentials`
- `POST /admin/tracking-providers/:providerId/credentials/:credentialId/deactivate`
- `GET /admin/tracking-providers/:providerId/health`
- `GET /admin/tracking-providers/:providerId/sync-runs`
- `POST /admin/tracking-providers/:providerId/sync-now`
- `POST /admin/tracking-providers/:providerId/traccar/pull`
- `GET /admin/tracking/external-devices`
- `GET/POST/PATCH /admin/tracking/device-mappings`
- `POST /admin/tracking/device-mappings/:mappingId/unmap`

Credential secret safety:
- Existing secrets are never displayed.
- Only `secretHint` is rendered.
- New/rotated secret input is write-only from the frontend perspective.
