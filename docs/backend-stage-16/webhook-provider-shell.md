# Webhook Provider Shell

Webhook deliveries use `NotificationProvider.config`.

Supported config:
- `url`
- `method`
- `headers`
- `timeoutMs`

Example:

```json
{
  "url": "https://example.test/webhook",
  "method": "POST",
  "headers": {
    "x-source": "trackigniter8"
  },
  "timeoutMs": 10000
}
```

The response status and a bounded response body are stored in `providerResponse`.

