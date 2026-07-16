# Stage 37 - Legacy Cleanup, Repository Hygiene, And Secret Safety

Stage 37 separates the rebuilt Trackigniter8 application from the legacy exported HTML surface through inventory, dependency analysis, ignore rules, and safe verification.

This stage is intentionally conservative:
- No business modules were added.
- No frontend redesign was performed.
- No raw legacy HTML files were moved into a new tracked archive.
- Known sensitive legacy files were not read into docs or copied.
- Git history was not rewritten automatically.

Primary outcomes:
- Repository areas classified.
- Legacy HTML/export surfaces identified.
- Sensitive legacy paths reviewed without exposing values.
- `.gitignore` hardened.
- Repository hygiene script added.
- Dependency audit reviewed and a targeted JWT security update applied.
- Release documentation created.
