# Known Limitations

Known limitations at the end of Stage 36:
- Some frontend admin pages use generic metadata managers instead of bespoke UX.
- Binary file upload is intentionally metadata-only.
- Export jobs are placeholders; no PDF/Excel generation yet.
- Notification provider shells are not production SMTP/webhook integrations by default.
- Queue workers are manually triggered; no separate always-on worker service yet.
- Traccar sync and tracking ingestion are foundation-level, not full production sync operations.
- Manager-skipped modules remain coming soon only.
