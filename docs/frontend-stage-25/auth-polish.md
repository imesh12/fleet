# Auth Polish

Stage 25 improves the practical auth experience:

- Login displays backend error messages.
- `/auth/me` hydrates the client session on app load.
- `401` clears the access token.
- Logout clears both token and selected organization context.
- Protected routes show loading and redirect states.

Development storage still uses `localStorage`.
Production hardening should move refresh-token handling to secure cookies.
