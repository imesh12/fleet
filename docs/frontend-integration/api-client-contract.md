# API Client Contract

The frontend should treat `/api/v1` as the stable API base path.

## Response Envelope

Successful responses use:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "request_id"
  }
}
```

Errors use:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  },
  "meta": {
    "requestId": "request_id"
  }
}
```

Raw exceptions:

- `GET /api/v1/openapi.json`
- `GET /api/v1/docs`

## Headers

- `Authorization: Bearer <accessToken>` for authenticated calls.
- `x-organization-id: <organizationId>` for organization-scoped data.
- `x-request-id` is echoed back by the API and can be supplied by the frontend for tracing.
