# Storage Providers + Buckets

Provider APIs:
- `GET /api/v1/admin/storage/providers`
- `POST /api/v1/admin/storage/providers`
- `GET /api/v1/admin/storage/providers/:id`
- `PATCH /api/v1/admin/storage/providers/:id`
- `POST /api/v1/admin/storage/providers/:id/activate`
- `POST /api/v1/admin/storage/providers/:id/deactivate`

Bucket APIs:
- `GET /api/v1/admin/storage/buckets`
- `POST /api/v1/admin/storage/buckets`
- `GET /api/v1/admin/storage/buckets/:id`
- `PATCH /api/v1/admin/storage/buckets/:id`
- `POST /api/v1/admin/storage/buckets/:id/activate`
- `POST /api/v1/admin/storage/buckets/:id/deactivate`

Provider types:
- `LOCAL`
- `S3_PLACEHOLDER`
- `GCS_PLACEHOLDER`
- `AZURE_PLACEHOLDER`

No real cloud upload is performed in Stage 21.

