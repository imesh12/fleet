# Error Handling

The frontend API client should normalize errors from the error envelope.

Recommended handling:

- `400`: show validation or bad request message.
- `401`: clear session and redirect to login.
- `403`: show access denied.
- `404`: show not found state.
- `409`: show conflict message and invite retry.
- `429`: show rate-limit message.
- `500`: show generic error and log `requestId`.

Always surface `meta.requestId` in developer-facing diagnostics.
