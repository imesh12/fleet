# Auth Flow

Routes:

- `/login`
- `/logout`

Flow:

1. User submits `emailOrUsername` and `password`.
2. Frontend calls `POST /api/v1/auth/login`.
3. Access token is stored for development.
4. Frontend calls `GET /api/v1/auth/me` on app boot.
5. Authenticated users can access protected routes.
6. `401` clears the token and redirects to login.
