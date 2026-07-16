# Legacy Archive Strategy

Recommended future structure:

```text
legacy/
  README.md
  inventory/
  sanitized-reference/
```

Rules:
- Do not move raw sensitive files into `legacy/`.
- Do not rely on Git moves for secret cleanup.
- Sanitize any copied reference before tracking.
- Replace secret-like values with placeholders such as `[REDACTED_GOOGLE_API_KEY]`, `[REDACTED_TWILIO_ACCOUNT_SID]`, or `[REDACTED_SECRET]`.
- Prefer documenting large legacy exports over duplicating thousands of obsolete files.

Recommended approach:
- Keep current legacy files in place for now.
- Create a manager-approved archive/removal ticket.
- Sanitize only the few pages that have historical UI value.
- Do not archive the known sensitive files unless a sanitized copy is manually produced and reviewed.
