# Signed URL Placeholders

APIs:
- `POST /api/v1/admin/files/:fileId/signed-download-url`
- `POST /api/v1/admin/files/signed-upload-url`

Both return placeholder URLs:
- `placeholder://download/...`
- `placeholder://upload/...`

Download URL requests create a `FileAccessLog` record.

