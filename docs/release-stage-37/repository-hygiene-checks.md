# Repository Hygiene Checks

Added script:

```powershell
npm.cmd run repo:hygiene
```

Checks:
- Tracked `.env` files.
- Tracked local database files.
- Tracked log/temp/build artifacts.
- Tracked known sensitive legacy paths.
- Secret-like values in example env files.
- Known Google/Twilio/private-key patterns in active tracked source.

Output policy:
- Reports affected paths only.
- Does not print secret values.
- Fails on error findings.

Limitations:
- Lightweight pattern checks are not a replacement for a dedicated secret scanner.
- Historical Git commits require separate scanning/cleanup.
- Binary files and ignored local files are not exhaustively scanned.
