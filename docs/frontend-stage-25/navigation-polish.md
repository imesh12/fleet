# Navigation Polish

Sidebar behavior:

- Fetches `GET /api/v1/navigation/menu`.
- Sends selected organization context automatically.
- Refreshes when organization changes.
- Hides `HIDDEN` and `DISABLED` menu entries.
- Shows a `Soon` badge for `COMING_SOON` entries.
- Uses icon fallback initials when the backend does not provide an icon.
- Highlights active routes and nested route prefixes.

Coming-soon modules remain metadata-only.
