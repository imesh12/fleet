# Tracking Latest Vehicles

```http
GET /api/v1/admin/tracking/vehicles/latest?limit=50
Authorization: Bearer <accessToken>
x-organization-id: <organizationId>
```

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "vehicleId": "vehicle_id",
        "latitude": 35.681236,
        "longitude": 139.767125,
        "speed": 0,
        "providerTimestamp": "2026-07-10T05:00:00.000Z",
        "receivedAt": "2026-07-10T05:00:02.000Z"
      }
    ]
  },
  "meta": {
    "requestId": "request_id"
  }
}
```
