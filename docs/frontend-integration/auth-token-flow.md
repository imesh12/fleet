# Auth Token Flow

1. Login with `POST /api/v1/auth/login`.
2. Store the access token in memory for API calls.
3. Store refresh token according to the frontend security model.
4. Call `GET /api/v1/auth/me` after app boot to hydrate the session.
5. Use `POST /api/v1/auth/refresh` when the access token expires.
6. Use `POST /api/v1/auth/logout` to revoke a refresh token.

The frontend should redirect to login on `401` responses and show an access-denied state on `403` responses.
