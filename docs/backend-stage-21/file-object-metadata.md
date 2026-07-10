# File Object Metadata

APIs:
- `GET /api/v1/admin/files`
- `POST /api/v1/admin/files`
- `GET /api/v1/admin/files/:id`
- `PATCH /api/v1/admin/files/:id`
- `POST /api/v1/admin/files/:id/archive`
- `POST /api/v1/admin/files/:id/delete`
- `POST /api/v1/admin/files/:id/versions`
- `GET /api/v1/admin/files/:id/access-logs`

Stored metadata includes:
- original file name
- stored file name
- storage path
- MIME type
- size bytes
- checksum
- visibility
- metadata JSON

File bytes are not stored by the API in this stage.

