# API Auth

## Auth Model
- access token: short-lived JWT for API requests
- refresh token: longer-lived JWT backed by a persisted hashed token record
- refresh token rotation: every refresh issues a new token pair and revokes the previous refresh token

## Endpoints

### POST `/api/v1/auth/login`
Request:
```json
{
  "emailOrUsername": "superadmin",
  "password": "ChangeMe123!"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "refreshToken": "jwt",
    "user": {
      "id": "user_id",
      "email": "admin@trackigniter8.local",
      "username": "superadmin",
      "roles": ["SUPER_ADMIN"],
      "permissions": ["system:health:read"]
    }
  }
}
```

### POST `/api/v1/auth/refresh`
Request:
```json
{
  "refreshToken": "jwt"
}
```

Behavior:
- verifies refresh token signature
- checks persisted token record
- rejects expired or revoked tokens
- issues new access and refresh tokens
- revokes the previous refresh token

### POST `/api/v1/auth/logout`
Request:
```json
{
  "refreshToken": "jwt"
}
```

Behavior:
- verifies the refresh token
- revokes the stored token record

### GET `/api/v1/auth/me`
Headers:
- `Authorization: Bearer <access-token>`

Behavior:
- verifies JWT
- reloads roles and permissions from database
- returns current resolved user context

## Password Handling
- passwords are hashed with bcrypt using 12 rounds
- plaintext passwords are never persisted

## Future Extensions
- forgot-password flow
- email verification
- session listing/revocation UI
- MFA
