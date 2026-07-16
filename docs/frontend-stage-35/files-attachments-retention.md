# Files, Attachments, And Retention

Frontend route:
- `/admin/files`

Integrated APIs:
- `GET/POST/PATCH /api/v1/admin/storage/providers`
- `GET/POST/PATCH /api/v1/admin/storage/buckets`
- `GET/POST/PATCH /api/v1/admin/files`
- `POST /api/v1/admin/files/:id/archive`
- `POST /api/v1/admin/files/:id/signed-download-url`
- `GET/POST /api/v1/admin/attachments`
- `POST /api/v1/admin/attachments/:id/archive`
- `GET/POST/PATCH /api/v1/admin/document-retention-policies`

Scope:
- Metadata-only file records.
- Placeholder signed URL actions.
- Attachment links across supported entity types.
- Retention policy metadata.

Binary uploads and real cloud provider uploads are intentionally not implemented in this stage.
