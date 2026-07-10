# Export Jobs

APIs:
- `GET /api/v1/admin/report-export-jobs`
- `POST /api/v1/admin/report-export-jobs`

Formats:
- `CSV`
- `EXCEL_PLACEHOLDER`
- `PDF_PLACEHOLDER`
- `JSON`

Background job type:

```text
REPORT_EXPORT_PLACEHOLDER
```

Stage 19 does not generate files. Export jobs are queued placeholders for a future export worker.

