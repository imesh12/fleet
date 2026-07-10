# Auth Me

```http
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "admin@trackigniter8.local",
      "roles": ["SUPER_ADMIN"],
      "permissions": ["navigation:read", "dashboard:read"]
    }
  },
  "meta": {
    "requestId": "request_id"
  }
}
```
