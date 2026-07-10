# Core List Endpoints

All list endpoints use the success envelope and generally support `page`, `pageSize`, and module-specific filters.

```http
GET /api/v1/admin/users?page=1&pageSize=20&search=admin
Authorization: Bearer <accessToken>
```

```http
GET /api/v1/admin/organizations?page=1&pageSize=20
Authorization: Bearer <accessToken>
```

```http
GET /api/v1/admin/vehicles?page=1&pageSize=20&status=ACTIVE
Authorization: Bearer <accessToken>
x-organization-id: <organizationId>
```

```http
GET /api/v1/admin/drivers?page=1&pageSize=20&status=ACTIVE
Authorization: Bearer <accessToken>
x-organization-id: <organizationId>
```

```http
GET /api/v1/admin/trips?page=1&pageSize=20&status=STARTED
Authorization: Bearer <accessToken>
x-organization-id: <organizationId>
```

```json
{
  "success": true,
  "data": {
    "items": []
  },
  "meta": {
    "requestId": "request_id",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```
