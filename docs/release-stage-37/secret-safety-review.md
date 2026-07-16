# Secret Safety Review

Known sensitive legacy paths:
- `settings/websitesetting.html`
- `settings/smsconfig.html`
- `whatsapp_settings.html`

Current tracking status:
- These paths are not currently tracked by `git ls-files`.
- These paths are listed in `.gitignore`.
- Local working-tree copies may still exist and should be treated as sensitive.

History status:
- `git log --all -- <path>` shows prior commits for these paths.
- Git history may therefore contain previously exposed secrets.

Recommendations:
- Rotate affected Google and Twilio credentials if not already rotated.
- Do not copy raw files into docs, fixtures, tests, examples, or archive directories.
- Consider a separate, deliberate Git history cleanup using tools such as `git filter-repo` or BFG after stakeholder approval.
- Coordinate history rewriting with all clone owners because it is disruptive.

No secret values were printed or copied during this review.
