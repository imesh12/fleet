# Login

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "emailOrUsername": "admin@trackigniter8.local",
  "password": "ChangeMe123!"
}
```

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "opaque-refresh-token",
    "user": {
      "id": "user_id",
      "email": "admin@trackigniter8.local",
      "roles": ["SUPER_ADMIN"],
      "permissions": ["dashboard:read"]
    }
  },
  "meta": {
    "requestId": "request_id"
  }
}
```
