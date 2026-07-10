# Navigation Menu

```http
GET /api/v1/navigation/menu
Authorization: Bearer <accessToken>
x-organization-id: <organizationId>
```

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "title": "Main",
        "slug": "main",
        "status": "ACTIVE",
        "items": [
          {
            "title": "Dashboard",
            "slug": "dashboard",
            "path": "/dashboard",
            "status": "ACTIVE",
            "requiredPermission": "dashboard:read"
          },
          {
            "title": "Payroll",
            "slug": "payroll",
            "path": "/coming-soon/payroll",
            "status": "COMING_SOON",
            "comingSoonMessage": "Payroll is planned and will be available in a future Trackigniter8 stage."
          }
        ]
      }
    ]
  },
  "meta": {
    "requestId": "request_id"
  }
}
```
