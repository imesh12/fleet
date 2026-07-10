# Document Retention Policies

APIs:
- `GET /api/v1/admin/document-retention-policies`
- `POST /api/v1/admin/document-retention-policies`
- `GET /api/v1/admin/document-retention-policies/:id`
- `PATCH /api/v1/admin/document-retention-policies/:id`
- `POST /api/v1/admin/document-retention-policies/:id/activate`
- `POST /api/v1/admin/document-retention-policies/:id/deactivate`

Background job type:

```text
DOCUMENT_RETENTION_EVALUATION
```

The job logs archive/delete candidate counts only. It does not physically delete files or metadata.

